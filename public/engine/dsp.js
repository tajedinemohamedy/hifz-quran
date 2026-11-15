/* Audio features for the model: Whisper's 80-bin log-mel (n_fft 400, hop 160, periodic Hann, Slaney mel),
   computed incrementally on a 16 kHz stream so each new 10 ms only costs one frame. */
(function (root) {
  "use strict";
  const SR = 16000, NFFT = 400, HOP = 160, NMEL = 80, NBIN = NFFT / 2 + 1;

  // Slaney mel scale (librosa htk=False), as in Whisper's mel_filters
  const hzToMel = f => { const fsp = 200 / 3, minLog = 1000, minLogMel = minLog / fsp, step = Math.log(6.4) / 27; return f < minLog ? f / fsp : minLogMel + Math.log(f / minLog) / step; };
  const melToHz = m => { const fsp = 200 / 3, minLog = 1000, minLogMel = minLog / fsp, step = Math.log(6.4) / 27; return m < minLogMel ? fsp * m : minLog * Math.exp(step * (m - minLogMel)); };
  function melFilters() {
    const fft = new Float64Array(NBIN); for (let k = 0; k < NBIN; k++) fft[k] = k * SR / NFFT;
    const mMin = hzToMel(0), mMax = hzToMel(SR / 2), mp = new Float64Array(NMEL + 2);
    for (let k = 0; k < NMEL + 2; k++) mp[k] = melToHz(mMin + (mMax - mMin) * k / (NMEL + 1));
    const W = [];
    for (let m = 0; m < NMEL; m++) {
      const lo = mp[m], c = mp[m + 1], hi = mp[m + 2], en = 2 / (hi - lo), row = new Float32Array(NBIN);
      let a = -1, b = -1;
      for (let k = 0; k < NBIN; k++) {
        const v = Math.max(0, Math.min((fft[k] - lo) / (c - lo), (hi - fft[k]) / (hi - c))) * en;
        row[k] = v; if (v > 0) { if (a < 0) a = k; b = k; }
      }
      W.push({ row, a: Math.max(0, a), b: Math.max(0, b) });
    }
    return W;
  }
  const FILT = melFilters();
  // DFT tables for a 400-point real transform (only 201 bins needed)
  const COS = new Float32Array(NBIN * NFFT), SIN = new Float32Array(NBIN * NFFT);
  for (let k = 0; k < NBIN; k++) for (let n = 0; n < NFFT; n++) { const ph = 2 * Math.PI * k * n / NFFT; COS[k * NFFT + n] = Math.cos(ph); SIN[k * NFFT + n] = Math.sin(ph); }
  const HANN = new Float32Array(NFFT); for (let n = 0; n < NFFT; n++) HANN[n] = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / NFFT); // periodic

  /* one frame centred at sample c of `x` (zeros outside) -> 80 log10 values */
  const buf = new Float32Array(NFFT), pw = new Float32Array(NBIN);
  function frame(x, len, c, out, off) {
    const s = c - NFFT / 2;
    for (let n = 0; n < NFFT; n++) { const i = s + n; buf[n] = i >= 0 && i < len ? x[i] * HANN[n] : 0; }
    for (let k = 0; k < NBIN; k++) {
      let re = 0, im = 0; const o = k * NFFT;
      for (let n = 0; n < NFFT; n++) { const v = buf[n]; re += v * COS[o + n]; im += v * SIN[o + n]; }
      pw[k] = re * re + im * im;
    }
    for (let m = 0; m < NMEL; m++) {
      const f = FILT[m]; let s2 = 0;
      for (let k = f.a; k <= f.b; k++) s2 += f.row[k] * pw[k];
      out[off + m] = Math.log10(Math.max(s2, 1e-10));
    }
  }

  /* growing 16 kHz stream with cached log-mel frames (frame f centred at sample f*160) */
  class Stream {
    constructor() { this.x = new Float32Array(SR * 60); this.len = 0; this.mel = new Float32Array(NMEL * 6000); this.nf = 0; }
    push(chunk) {
      if (this.len + chunk.length > this.x.length) { const y = new Float32Array(Math.max(this.x.length * 2, this.len + chunk.length)); y.set(this.x.subarray(0, this.len)); this.x = y; }
      this.x.set(chunk, this.len); this.len += chunk.length;
      // frames whose window is fully available
      const avail = Math.floor((this.len - NFFT / 2) / HOP) + 1;
      if (avail * NMEL > this.mel.length) { const y = new Float32Array(Math.max(this.mel.length * 2, avail * NMEL)); y.set(this.mel.subarray(0, this.nf * NMEL)); this.mel = y; }
      for (let f = this.nf; f < avail; f++) frame(this.x, this.len, f * HOP, this.mel, f * NMEL);
      if (avail > this.nf) this.nf = avail;
    }
    get seconds() { return this.len / SR; }
    /* model input for [t0, t1) seconds with `pad` seconds of silence on both sides: Float32 [80, T] (T even, <= 3000) */
    segment(t0, t1, pad = 0.4) {
      let f0 = Math.max(0, Math.round(t0 * 100)), f1 = Math.min(this.nf, Math.round(t1 * 100));
      const P = Math.round(pad * 100);
      if (f1 - f0 + 2 * P > 3000) f0 = f1 - (3000 - 2 * P);
      let T = f1 - f0 + 2 * P; if (T % 2) { T -= 1; }
      const out = new Float32Array(NMEL * T);
      let mx = -10;
      for (let f = f0; f < f1; f++) for (let m = 0; m < NMEL; m++) { const v = this.mel[f * NMEL + m]; if (v > mx) mx = v; }
      const floor = mx - 8;
      for (let t = 0; t < T; t++) {
        const f = f0 - P + t;
        for (let m = 0; m < NMEL; m++) {
          let v = f >= f0 && f < f1 ? this.mel[f * NMEL + m] : -10;
          if (v < floor) v = floor;
          out[m * T + t] = (v + 4) / 4;
        }
      }
      return { data: out, T, start: f0 / 100 - pad };   // start: time of model input frame 0
    }
  }

  /* streaming resampler to 16 kHz: two one-pole low-passes then linear interpolation */
  class Resampler {
    constructor(srIn) { this.r = srIn / SR; this.pos = 0; this.prev = 0; this.l1 = 0; this.l2 = 0; const fc = 7000 / srIn; this.k = 1 - Math.exp(-2 * Math.PI * fc); this.last = 0; }
    process(inp) {
      if (this.r === 1) return inp.slice();
      const f = new Float32Array(inp.length);
      for (let i = 0; i < inp.length; i++) { this.l1 += this.k * (inp[i] - this.l1); this.l2 += this.k * (this.l1 - this.l2); f[i] = this.l2; }
      const out = [];
      let p = this.pos;
      while (p < inp.length) {
        const i = Math.floor(p), fr = p - i;
        const a = i - 1 < 0 ? this.last : f[i - 1], b = f[i];
        out.push(a + (b - a) * fr);
        p += this.r;
      }
      this.pos = p - inp.length; this.last = f[inp.length - 1];
      return Float32Array.from(out);
    }
  }
  function resampleAll(x, srIn) { const r = new Resampler(srIn); return r.process(x); }

  const api = { Stream, Resampler, resampleAll, melFilters, frame, SR, NMEL, hzToMel, melToHz };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TasmeeDSP = api;
})(typeof self !== "undefined" ? self : this);
