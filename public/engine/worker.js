/* Recognition worker: audio in, judged words out (tasmee3), or the verses that best match what was recited (find).
   Runs the Warsh-capable phoneme model (HisnLabs tajweed-v2, int8 ONNX, Apache-2.0) with onnxruntime-web, on device. */
importScripts("dsp.js", "tracker.js");

const ORT_VER = "1.24.2";
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`;
const MODEL_URL = "https://huggingface.co/HisnLabs/tajweed-v2/resolve/main/onnx/model-int8.onnx";
const MODEL_CACHE = "tasmee-model-v2";
const { Stream, Resampler } = self.TasmeeDSP;
const { Tracker, canonHeard, MODEL_MAP, wordKeyAt, SUB, NSYM } = self.TasmeeTracker;

let session = null, stream = null, tracker = null, resampler = null;
let running = false, busy = false, finalPending = false, findMode = false;
let voiceEnd = 0, talking = false, noise = 0.003, lastRunAt = -1;

const post = (type, data = {}) => self.postMessage(Object.assign({ type }, data));

/* ---------- model ---------- */
async function loadOrt() {
  if (self.ort) return;
  for (const f of ["ort.wasm.min.js", "ort.min.js"]) {
    try { importScripts(ORT_BASE + f); if (self.ort) break; } catch (e) { /* try the next build */ }
  }
  if (!self.ort) throw new Error("ort");
  ort.env.wasm.wasmPaths = ORT_BASE;
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
  ort.env.wasm.simd = true;
}
async function fetchModel(url) {
  let cache = null;
  try { cache = await caches.open(MODEL_CACHE); const hit = await cache.match(url); if (hit) { post("model", { phase: "cached" }); return await hit.arrayBuffer(); } } catch (e) { cache = null; }
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("http " + res.status);
  const total = +res.headers.get("content-length") || 23e6;
  const reader = res.body.getReader(); const parts = []; let got = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    parts.push(value); got += value.length; post("model", { phase: "download", got, total });
  }
  const buf = new Uint8Array(got); let o = 0; for (const p of parts) { buf.set(p, o); o += p.length; }
  if (cache) { try { await cache.put(url, new Response(buf, { headers: { "content-type": "application/octet-stream" } })); } catch (e) { } }
  return buf.buffer;
}
async function initModel(bytes) {
  post("model", { phase: "loading" });
  await loadOrt();
  const data = bytes || await fetchModel(MODEL_URL);
  session = await ort.InferenceSession.create(new Uint8Array(data), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  const st = new Stream(); st.push(new Float32Array(32000));
  await infer(st, 0, 2);                                   // warm-up
  post("model", { phase: "ready" });
}
async function infer(st, t0, t1) {
  const seg = st.segment(t0, t1, 0.4);
  if (seg.T < 20) return [];
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
    const a = Math.max(0, tracker.anchor - 0.6, now - 14);
    if (!final && voiceEnd < tracker.anchor) { busy = false; return; }   // nothing said since the last judged word
    const heard = canonHeard((await infer(stream, a, now)).filter(s => s.t > tracker.anchor));
    const r = final ? tracker.finish(heard, now) : tracker.update(heard, now, talking ? now : voiceEnd);
    lastRunAt = now;
    post("update", { commits: r.commits.map(c => ({ k: c.k, st: tracker.status[c.k], info: tracker.info[c.k] })), tentative: r.tentative,
      current: tracker.cursor, lost: !!r.lost, done: tracker.cursor >= tracker.words.length, final });
  } catch (e) { post("error", { where: "step", msg: String(e && e.message || e) }); }
  busy = false;
  if (finalPending && !final) { finalPending = false; await step(true); }
}

/* ---------- find: which verses sound like what was recited ---------- */
let index = null;                         // { codes: Uint8Array of consonants, verseAt: Int32Array }
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
    for (let i = 1; i <= n; i++) {
      const sub = col[i - 1] + SUB[heard[i - 1] * NSYM + e];
      nxt[i] = Math.min(sub, col[i] + 1, nxt[i - 1] + 1);
    }
    const c = nxt[n] / n, v = verseAt[j];
    if (c < (best.get(v) ?? 9)) best.set(v, c);
    [col, nxt] = [nxt, col];
  }
  return [...best].filter(([, c]) => c < 0.5).sort((a, b) => a[1] - b[1]).slice(0, 5).map(([verse, cost]) => ({ verse, score: Math.round(100 * (1 - cost)) }));
}
async function find() {
  const now = stream.seconds;
  const heard = canonHeard(await infer(stream, Math.max(0, now - 29), now)).map(h => h.c).filter(c => c <= 28);
  if (heard.length < 5) return post("found", { results: [] });
  post("found", { results: match(heard, await buildIndex()) });
}

self.onmessage = async ({ data: m }) => {
  try {
    if (m.type === "loadModel") await initModel(m.bytes || null);
    else if (m.type === "start") {
      if (!session) throw new Error("model not ready");
      findMode = !!m.find;
      stream = new Stream(); resampler = new Resampler(m.sampleRate || 16000);
      tracker = findMode ? null : new Tracker(m.words, m.opts || {});
      running = true; voiceEnd = 0; talking = false; noise = 0.003; lastRunAt = -1;
      if (findMode) buildIndex();                          // warm the index while the user recites
    }
    else if (m.type === "audio" && running) {
      const x = resampler.process(m.chunk);
      stream.push(x); vad(x, stream.seconds);
      if (!findMode && (stream.seconds - lastRunAt >= 0.22 || lastRunAt < 0)) step();
    }
    else if (m.type === "jump" && tracker) { tracker.cursor = m.k; tracker.anchor = stream ? stream.seconds : 0; }
    else if (m.type === "opts" && tracker) Object.assign(tracker.opts, m.opts);
    else if (m.type === "stop" && running) {
      running = false;
      if (findMode) await find();
      else if (busy) finalPending = true; else await step(true);
    }
  } catch (e) { post("error", { where: m.type, msg: String(e && e.message || e) }); }
};
