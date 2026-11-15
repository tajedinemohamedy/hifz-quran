/* On-device recitation recognition: one worker and one microphone pipeline shared by tasmee3 (check a recitation
   word by word) and find (locate a verse by reciting it). Every stage is published live in `engine`, logged, and any
   failure is announced with a way to recover: nothing fails silently. */
import { createStore } from "./store";
import { notify } from "./notify";
import type { Key } from "./i18n";

export type EngineMode = "recite" | "find";
export type EnginePhase = "idle" | "runtime" | "download" | "compile" | "ready" | "error";
export type EngineFailure = "runtime" | "download" | "compile" | "worker";
export type MicState = "off" | "asking" | "on" | "denied" | "missing" | "insecure" | "error";
type Vars = Record<string, string | number>;
export interface LogEntry { id: number; at: number; tone: "info" | "ok" | "warn" | "error"; key: Key; vars?: Vars }

export const engine = createStore({
  phase: "idle" as EnginePhase,
  got: 0,
  total: 0,
  failure: null as EngineFailure | null,
  mode: null as EngineMode | null, // what the microphone is feeding right now
  mic: "off" as MicState,
  seconds: 0, // audio heard in this session
  voice: false, // the reciter is speaking right now
  inferMs: 0, // time of the last recognition step
  silent: false, // the microphone gives no sound
  slow: false, // steps are slower than speech
  log: [] as LogEntry[],
});

let seq = 0;
export function log(tone: LogEntry["tone"], key: Key, vars?: Vars) {
  engine.set((s) => ({ log: [...s.log.slice(-39), { id: ++seq, at: Date.now(), tone, key, vars }] }));
}

export interface WordKey { c: number; w: number }
export interface SessionWord { text: string; verse: number; wi: number; key: WordKey[]; alts: { v: number; text: string }[] | null }
export interface TrackerApi {
  sessionWords(V: unknown[], v0: number, v1: number, G: unknown[]): SessionWord[];
  keyText(key: { c: number }[]): string;
}
export interface WordInfo { heard?: number[]; mut?: { v: number; wi: number; text: string } | null }
export type EngineEvent =
  | { type: "update"; commits: { k: number; st: number; info: WordInfo }[]; tentative: number[]; current: number; lost: boolean; done: boolean; final: boolean }
  | { type: "finding" }
  | { type: "found"; results: { verse: number; score: number }[]; tooShort: boolean };

const FAILURE_TEXT: Record<EngineFailure, Key> = { runtime: "failRuntime", download: "failDownload", compile: "failCompile", worker: "failWorker" };
const SLOW_MS = 1200;

let worker: Worker | null = null;
const listeners = new Set<(e: EngineEvent) => void>();
let waiting: ((ok: boolean) => void)[] = [];

export function onEngine(fn: (e: EngineEvent) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function settle(ok: boolean) { waiting.forEach((f) => f(ok)); waiting = []; }

function fail(failure: EngineFailure, msg: string) {
  engine.set({ phase: "error", failure });
  log("error", FAILURE_TEXT[failure], { msg });
  notify.error(FAILURE_TEXT[failure], { id: "engine", detail: "failHint", retry: () => void preload() });
  if (failure === "worker") { worker?.terminate(); worker = null; }
  stopMic();
  settle(false);
}

function handle(d: { type: string; [k: string]: unknown }) {
  switch (d.type) {
    case "model":
      if (d.phase === "runtime") { engine.set({ phase: "runtime" }); log("info", "logRuntime"); }
      else if (d.phase === "cached") log("ok", "logCached");
      else if (d.phase === "download") {
        if (!d.got) log("info", "logDownload", { mb: Math.round((d.total as number) / 1e6) });
        engine.set({ phase: "download", got: d.got as number, total: d.total as number });
      }
      else if (d.phase === "compile") { engine.set({ phase: "compile" }); log("info", "logCompile"); }
      else if (d.phase === "ready") {
        engine.set({ phase: "ready", failure: null });
        log("ok", "logReady", { ms: d.ms as number });
        notify.dismiss("engine");
        if (!d.cached) notify.success("engineReady", undefined, "engine");
        settle(true);
      }
      return;
    case "started":
      log("ok", "logStarted");
      return;
    case "tick":
    case "update": {
      const inferMs = (d.inferMs as number) ?? engine.get().inferMs;
      engine.set({ seconds: d.seconds as number, voice: !!d.voice, inferMs });
      if (inferMs > SLOW_MS && !engine.get().slow) { engine.set({ slow: true }); log("warn", "slowDevice"); notify.warning("slowDevice", undefined, "slow"); }
      if (d.type === "update") listeners.forEach((f) => f(d as unknown as EngineEvent));
      return;
    }
    case "finding":
    case "found":
      listeners.forEach((f) => f(d as unknown as EngineEvent));
      return;
    case "error": {
      const where = d.where as string;
      if (where === "runtime" || where === "download" || where === "compile") return fail(where, String(d.msg));
      if (where === "start" || where === "loadModel") return fail("compile", String(d.msg));
      log("error", "failStep", { msg: String(d.msg) });
      notify.error("failStep", { id: "step" });
    }
  }
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker("/engine/worker.js");
  worker.onmessage = ({ data }) => handle(data);
  worker.onerror = (e) => { e.preventDefault(); fail("worker", e.message || "worker"); };
  return worker;
}

export const send = (msg: object) => worker?.postMessage(msg);

/** Loads the speech engine (or reuses it). Resolves false when it failed (already announced). */
export function preload(bytes?: ArrayBuffer): Promise<boolean> {
  const ph = engine.get().phase;
  if (ph === "ready" && !bytes) return Promise.resolve(true);
  const p = new Promise<boolean>((res) => waiting.push(res));
  if (ph === "idle" || ph === "error" || bytes) {
    engine.set({ phase: "runtime", got: 0, total: 0, failure: null });
    if (bytes) getWorker().postMessage({ type: "loadModel", bytes }, [bytes]);
    else getWorker().postMessage({ type: "loadModel" });
  }
  return p;
}

/** For when the automatic model download is blocked: the user picks onnx/model-int8.onnx. */
export async function loadModelFile(file: File) {
  log("info", "logModelFile", { name: file.name });
  return preload(await file.arrayBuffer());
}

/* ---------- microphone ---------- */
let ctx: AudioContext | null = null, mic: MediaStream | null = null, node: AudioWorkletNode | null = null;
let level = 0, peak = 0, watchdog = 0;
export const micLevel = () => level;
const CAPTURE = `class Cap extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('cap',Cap);`;
const MIC_TEXT: Record<Exclude<MicState, "off" | "asking" | "on">, [Key, Key]> = {
  denied: ["micDenied", "micDeniedHint"], missing: ["micMissing", "micMissingHint"], insecure: ["micInsecure", "micInsecureHint"], error: ["micError", "micMissingHint"],
};

async function startMic() {
  mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  ctx = new AudioContext();
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([CAPTURE], { type: "text/javascript" })));
  const src = ctx.createMediaStreamSource(mic);
  node = new AudioWorkletNode(ctx, "cap");
  const mute = ctx.createGain();
  mute.gain.value = 0;
  src.connect(node); node.connect(mute); mute.connect(ctx.destination);
  let batch: Float32Array[] = [], len = 0;
  node.port.onmessage = ({ data: x }: MessageEvent<Float32Array>) => {
    let e = 0;
    for (let i = 0; i < x.length; i++) e += x[i] * x[i];
    level = 0.85 * level + 0.15 * Math.sqrt(e / x.length);
    peak = Math.max(peak, level);
    batch.push(x); len += x.length;
    if (len >= 2048) {
      const out = new Float32Array(len);
      let o = 0;
      for (const b of batch) { out.set(b, o); o += b.length; }
      batch = []; len = 0;
      worker?.postMessage({ type: "audio", chunk: out }, [out.buffer]);
    }
  };
  return ctx.sampleRate;
}

function stopMic() {
  clearInterval(watchdog);
  try { node?.disconnect(); } catch {}
  mic?.getTracks().forEach((t) => t.stop());
  void ctx?.close();
  ctx = null; mic = null; node = null; level = 0;
  if (engine.get().mic === "on" || engine.get().mic === "asking") engine.set({ mic: "off" });
  engine.set({ mode: null, voice: false });
}

/** A microphone that delivers only silence is reported, not ignored. */
function watchSilence() {
  const since = Date.now();
  peak = 0;
  watchdog = window.setInterval(() => {
    const quiet = Date.now() - since > 4000 && peak < 0.003;
    if (quiet !== engine.get().silent) {
      engine.set({ silent: quiet });
      if (quiet) { log("warn", "micSilent"); notify.warning("micSilent", undefined, "mic-silent"); }
      else notify.dismiss("mic-silent");
    }
  }, 500);
}

/** Loads the engine if needed, opens the microphone and starts a session; each step is reported. */
export async function listen(mode: EngineMode, session: { words?: SessionWord[]; opts?: object } = {}) {
  if (engine.get().mode) stopListening();
  engine.set({ mode, mic: "off", seconds: 0, voice: false, silent: false });
  log("info", mode === "recite" ? "logSessionRecite" : "logSessionFind");
  if (!(await preload())) return engine.set({ mode: null });
  if (engine.get().mode !== mode) return; // cancelled while the engine was loading
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return micFailed("insecure");
  engine.set({ mic: "asking" });
  log("info", "logMicAsk");
  let sampleRate: number;
  try {
    sampleRate = await startMic();
  } catch (e) {
    const name = (e as DOMException).name;
    return micFailed(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" ? "missing" : "error");
  }
  if (engine.get().mode !== mode) return stopMic();
  engine.set({ mic: "on" });
  notify.dismiss("mic");
  log("ok", "logMicOn", { rate: Math.round(sampleRate / 1000) });
  watchSilence();
  getWorker().postMessage({ type: "start", find: mode === "find", sampleRate, ...session });
}

function micFailed(state: keyof typeof MIC_TEXT) {
  stopMic();
  engine.set({ mic: state });
  const [title, hint] = MIC_TEXT[state];
  log("error", title);
  notify.error(title, { id: "mic", detail: hint });
}

export function stopListening() {
  if (!engine.get().mode) return;
  const wasOn = engine.get().mic === "on";
  stopMic();
  if (wasOn) { worker?.postMessage({ type: "stop" }); log("info", "logStopped"); }
}

/* ---------- the tracker's pure helpers, shared with the worker (one copy in /engine) ---------- */
let tracker: Promise<TrackerApi> | null = null;
export function loadTracker(): Promise<TrackerApi> {
  return (tracker ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "/engine/tracker.js";
    s.onload = () => res((window as unknown as { TasmeeTracker: TrackerApi }).TasmeeTracker);
    s.onerror = () => { tracker = null; rej(new Error("tracker")); };
    document.head.appendChild(s);
  }));
}
