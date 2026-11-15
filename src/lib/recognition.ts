/* On-device recitation recognition: one worker and one microphone pipeline shared by
   tasmee3 (check a recitation word by word) and find (locate a verse by reciting it). Free, offline after first use. */
import { createStore } from "./store";

export type ModelPhase = "none" | "starting" | "download" | "loading" | "ready" | "error";
export type EngineMode = "recite" | "find";

export const engine = createStore({
  phase: "none" as ModelPhase,
  progress: 0,
  mode: null as EngineMode | null, // what the microphone is feeding right now
  micError: false,
});

export interface WordKey { c: number; w: number }
export interface SessionWord { text: string; verse: number; wi: number; key: WordKey[]; alts: { v: number; text: string }[] | null }
export interface TrackerApi {
  sessionWords(V: unknown[], v0: number, v1: number, G: unknown[]): SessionWord[];
  keyText(key: { c: number }[]): string;
}
export interface WordInfo { heard?: number[]; mut?: { v: number; wi: number; text: string } | null }
export type EngineEvent =
  | { type: "update"; commits: { k: number; st: number; info: WordInfo }[]; tentative: number[]; current: number; lost: boolean; done: boolean; final: boolean }
  | { type: "found"; results: { verse: number; score: number }[] }
  | { type: "error"; where: string; msg: string };

let worker: Worker | null = null;
const listeners = new Set<(e: EngineEvent) => void>();
let pendingReady: (() => void)[] = [];

export function onEngine(fn: (e: EngineEvent) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker("/engine/worker.js");
  worker.onmessage = ({ data: d }) => {
    if (d.type === "model") {
      if (d.phase === "download") engine.set({ phase: "download", progress: d.got / d.total });
      else if (d.phase === "ready") { engine.set({ phase: "ready" }); pendingReady.forEach((f) => f()); pendingReady = []; }
      else engine.set({ phase: "loading" });
      return;
    }
    if (d.type === "error" && d.where === "loadModel") { engine.set({ phase: "error" }); pendingReady = []; stopMic(); }
    listeners.forEach((f) => f(d as EngineEvent));
  };
  return worker;
}

export const send = (msg: object) => worker?.postMessage(msg);

function whenReady(): Promise<void> {
  if (engine.get().phase === "ready") return Promise.resolve();
  const p = new Promise<void>((res) => pendingReady.push(res));
  const ph = engine.get().phase;
  if (ph === "none" || ph === "error") { engine.set({ phase: "starting", progress: 0 }); getWorker().postMessage({ type: "loadModel" }); }
  return p;
}

/** For when the automatic model download is blocked: the user picks onnx/model-int8.onnx. */
export async function loadModelFile(file: File) {
  const buf = await file.arrayBuffer();
  engine.set({ phase: "starting" });
  getWorker().postMessage({ type: "loadModel", bytes: buf }, [buf]);
}

/* ---------- microphone ---------- */
let ctx: AudioContext | null = null, mic: MediaStream | null = null, node: AudioWorkletNode | null = null;
let level = 0;
export const micLevel = () => level;
const CAPTURE = `class Cap extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('cap',Cap);`;

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
  try { node?.disconnect(); } catch {}
  mic?.getTracks().forEach((t) => t.stop());
  void ctx?.close();
  ctx = null; mic = null; node = null; level = 0;
  engine.set({ mode: null });
}

/** Loads the model if needed, opens the microphone and starts a session. */
export async function listen(mode: EngineMode, session: { words?: SessionWord[]; opts?: object } = {}) {
  if (engine.get().mode) stopListening();
  engine.set({ mode, micError: false });
  await whenReady();
  if (engine.get().mode !== mode) return; // cancelled while the model was loading
  try {
    const sampleRate = await startMic();
    getWorker().postMessage({ type: "start", find: mode === "find", sampleRate, ...session });
  } catch {
    stopMic();
    engine.set({ micError: true });
  }
}

export function stopListening() {
  if (!engine.get().mode) return;
  stopMic();
  worker?.postMessage({ type: "stop" });
}

/* ---------- the tracker's pure helpers, shared with the worker (one copy in /engine) ---------- */
let tracker: Promise<TrackerApi> | null = null;
export function loadTracker(): Promise<TrackerApi> {
  return (tracker ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "/engine/tracker.js";
    s.onload = () => res((window as unknown as { TasmeeTracker: TrackerApi }).TasmeeTracker);
    s.onerror = rej;
    document.head.appendChild(s);
  }));
}
