/* Recognition worker: audio in, judged words out (tasmee3), or the verses that best match what was recited (find).
   Runs the Warsh-capable phoneme model (HisnLabs tajweed-v2, int8 ONNX, Apache-2.0) with onnxruntime-web, on device.
   Every stage reports itself (model, runtime, steps, errors) so the page can show the whole pipeline live. */
importScripts("dsp.js", "tracker.js");

const ORT_VER = "1.24.2";
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`;
const MODEL_URL = "https://huggingface.co/HisnLabs/tajweed-v2/resolve/main/onnx/model-int8.onnx";
const MODEL_CACHE = "tasmee-model-v2";
const MODEL_SIZE = 23e6;
const STEP_EVERY = 0.22;   // seconds of new audio between two judgments
const WINDOW_MAX = 12;     // seconds of audio the model looks at, at most
const { Stream, Resampler } = self.TasmeeDSP;
const { Tracker, canonHeard, MODEL_MAP, wordKeyAt, SUB, NSYM } = self.TasmeeTracker;

let session = null, stream = null, tracker = null, resampler = null;
let running = false, busy = false, finalPending = false, findMode = false;
let voiceEnd = 0, talking = false, noise = 0.003, lastRunAt = -1, inferMs = 0;

const post = (type, data = {}) => self.postMessage(Object.assign({ type }, data));
/** an error that knows which stage failed */
const stageError = (where, e) => Object.assign(new Error(String((e && e.message) || e)), { where });

/* ---------- model ---------- */
function loadRuntime() {
  if (self.ort) return;
  post("model", { phase: "runtime" });
  for (const f of ["ort.wasm.min.js", "ort.min.js"]) {
    try { importScripts(ORT_BASE + f); if (self.ort) break; } catch (e) { /* try the next build */ }
  }
  if (!self.ort) throw stageError("runtime", "onnxruntime-web could not be loaded");
  ort.env.wasm.wasmPaths = ORT_BASE;
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
  ort.env.wasm.simd = true;
}
async function fetchModel() {
  let cache = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(MODEL_URL);
    if (hit) { post("model", { phase: "cached" }); return { bytes: await hit.arrayBuffer(), cached: true }; }
  } catch (e) { cache = null; }
  let res;
  try { res = await fetch(MODEL_URL, { mode: "cors" }); } catch (e) { throw stageError("download", e); }
  if (!res.ok) throw stageError("download", "http " + res.status);
  const total = +res.headers.get("content-length") || MODEL_SIZE;
  const reader = res.body.getReader(); const parts = []; let got = 0, shown = 0;
  post("model", { phase: "download", got: 0, total });
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      parts.push(value); got += value.length;
      if (got - shown > 200e3) { shown = got; post("model", { phase: "download", got, total }); }
    }
  } catch (e) { throw stageError("download", e); }
  const buf = new Uint8Array(got); let o = 0; for (const p of parts) { buf.set(p, o); o += p.length; }
  if (cache) { try { await cache.put(MODEL_URL, new Response(buf, { headers: { "content-type": "application/octet-stream" } })); } catch (e) { } }
  return { bytes: buf.buffer, cached: false };
}
async function initModel(given) {
  const t0 = performance.now();
  const model = given ? Promise.resolve({ bytes: given, cached: true }) : fetchModel(); // the download runs while the runtime loads
  model.catch(() => {});
  loadRuntime();
  const { bytes, cached } = await model;
  post("model", { phase: "compile" });
  try {
    session = await ort.InferenceSession.create(new Uint8Array(bytes), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    const st = new Stream(); st.push(new Float32Array(32000));
    await infer(st, 0, 2);                                   // warm-up
  } catch (e) { throw stageError("compile", e); }
  post("model", { phase: "ready", cached, ms: Math.round(performance.now() - t0), threads: ort.env.wasm.numThreads });
}
async function infer(st, t0, t1) {
  const seg = st.segment(t0, t1, 0.4);
  if (seg.T < 20) return [];
  const started = performance.now();
  const feeds = { mel: new ort.Tensor("float32", seg.data, [1, 80, seg.T]), riwaya: new ort.Tensor("int64", BigInt64Array.from([1n]), [1]) };
  const out = await session.run(feeds);
  const lp = out[session.outputNames[0]];
  const [, F, V] = lp.dims, d = lp.data;
  const syms = [];
  let prev = 0;
  for (let t = 0; t < F; t++) {
    let bi = 0, bv = -1e9; const o = t * V;
    for (let v = 0; v < V; v++) if (d[o + v] > bv) { bv = d[o + v]; bi = v; }
    if (bi !== prev && bi !== 0) {
      const p = Math.exp(bv);
      if (p >= 0.25) syms.push({ c: MODEL_MAP[bi] || 0, t: seg.start + (2 * t + 1) * 0.01, p, id: bi });
    }
    prev = bi;
  }
  inferMs = Math.round(performance.now() - started);
  return syms;
}

/* ---------- voice activity: adaptive energy gate on 20 ms blocks ---------- */
function vad(x, tEnd) {
  const B = 320;
  for (let i = 0; i + B <= x.length; i += B) {
    let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k];
    const rms = Math.sqrt(e / B);
    noise = rms < noise ? 0.9 * noise + 0.1 * rms : 0.999 * noise + 0.001 * rms;
    const on = rms > Math.max(0.006, noise * 3.2);
    const t = tEnd - (x.length - i - B) / 16000;
    if (on) { talking = true; voiceEnd = t; } else if (t - voiceEnd > 0.12) talking = false;
  }
}

/* ---------- tasmee3 loop ---------- */
async function step(final = false) {
  if (busy || !tracker) return;
  busy = true;
  try {
    const now = stream.seconds;
    if (!final && voiceEnd < tracker.anchor) { lastRunAt = now; busy = false; post("tick", { seconds: now, voice: talking }); return; } // nothing new was said
    const a = Math.max(0, tracker.anchor - 0.6, now - WINDOW_MAX);
    const heard = canonHeard((await infer(stream, a, now)).filter(s => s.t > tracker.anchor));
    const r = final ? tracker.finish(heard, now) : tracker.update(heard, now, talking ? now : voiceEnd);
    lastRunAt = now;
    post("update", { commits: r.commits.map(c => ({ k: c.k, st: tracker.status[c.k], info: tracker.info[c.k] })), tentative: r.tentative,
      current: tracker.cursor, lost: !!r.lost, done: tracker.cursor >= tracker.words.length, final, seconds: now, voice: talking, inferMs });
  } catch (e) { post("error", { where: "step", msg: String(e && e.message || e) }); }
  busy = false;
  if (finalPending && !final) { finalPending = false; await step(true); }
}

/* ---------- find: which verses sound like what was recited ---------- */
let index = null;                         // { codes: consonants of the whole text, verseAt: verse of each code }
async function buildIndex() {
  if (index) return index;
  const { V } = await (await fetch("../data/quran.json")).json();
  const codes = [], verseAt = [];
  V.forEach(([s, a, , w], vi) => w.forEach((t, k) => {
    for (const x of wordKeyAt(t, s, a, k)) if (x.c <= 28 && x.w >= 0.5) { codes.push(x.c); verseAt.push(vi); }
  }));
  return (index = { codes: Uint8Array.from(codes), verseAt: Int32Array.from(verseAt) });
}
/* semi-global edit distance of the heard consonants against the whole text; best end per verse */
function match(heard, { codes, verseAt }) {
  const n = heard.length, m = codes.length;
  let col = new Float32Array(n + 1), nxt = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) col[i] = i;
  const best = new Map();
  for (let j = 0; j < m; j++) {
    const e = codes[j]; nxt[0] = 0;
    for (let i = 1; i <= n; i++) nxt[i] = Math.min(col[i - 1] + SUB[heard[i - 1] * NSYM + e], col[i] + 1, nxt[i - 1] + 1);
    const c = nxt[n] / n, v = verseAt[j];
    if (c < (best.get(v) ?? 9)) best.set(v, c);
    [col, nxt] = [nxt, col];
  }
  return [...best].filter(([, c]) => c < 0.5).sort((a, b) => a[1] - b[1]).slice(0, 5).map(([verse, cost]) => ({ verse, score: Math.round(100 * (1 - cost)) }));
}
async function find() {
  const now = stream.seconds;
  post("finding", { seconds: now });
  const heard = canonHeard(await infer(stream, Math.max(0, now - 29), now)).map(h => h.c).filter(c => c <= 28);
  if (heard.length < 5) return post("found", { results: [], tooShort: true });
  post("found", { results: match(heard, await buildIndex()), tooShort: false });
}

self.onmessage = async ({ data: m }) => {
  try {
    if (m.type === "loadModel") await initModel(m.bytes || null);
    else if (m.type === "start") {
      if (!session) throw stageError("start", "model not ready");
      findMode = !!m.find;
      stream = new Stream(); resampler = new Resampler(m.sampleRate || 16000);
      tracker = findMode ? null : new Tracker(m.words, m.opts || {});
      running = true; voiceEnd = 0; talking = false; noise = 0.003; lastRunAt = -1;
      if (findMode) buildIndex();                          // warm the index while the user recites
      post("started", {});
    }
    else if (m.type === "audio" && running) {
      const x = resampler.process(m.chunk);
      stream.push(x); vad(x, stream.seconds);
      if (stream.seconds - lastRunAt < STEP_EVERY && lastRunAt >= 0) return;
      if (findMode) { lastRunAt = stream.seconds; post("tick", { seconds: stream.seconds, voice: talking }); }
      else step();
    }
    else if (m.type === "jump" && tracker) { tracker.cursor = m.k; tracker.anchor = stream ? stream.seconds : 0; }
    else if (m.type === "opts" && tracker) Object.assign(tracker.opts, m.opts);
    else if (m.type === "stop" && running) {
      running = false;
      if (findMode) await find();
      else if (busy) finalPending = true; else await step(true);
    }
  } catch (e) { post("error", { where: e.where || m.type, msg: String(e && e.message || e) }); }
};
