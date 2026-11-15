/* Tasmee3 tracker: Warsh text -> expected sounds, and live alignment of what the model heard against the page.
   Pure logic, no DOM. Loaded by the worker (importScripts), the page (<script>) and Node tests (require). */
(function (root) {
  "use strict";

  /* ---------- sound alphabet (a reduced form of the model's Quran phonetic script) ---------- */
  const CONS = "ءبتثجحخدذرزسشصضطظعغفقكلمنهوي";           // codes 1..28
  const A_ = 29, U_ = 30, I_ = 31, AA = 32, UU = 33, II = 34; // short a u i, long a u i
  const NSYM = 35;
  const code = {}; for (let k = 0; k < CONS.length; k++) code[CONS[k]] = k + 1;
  const isVowel = c => c >= 29;
  const longOf = c => c === A_ ? AA : c === U_ ? UU : c === I_ ? II : c;
  const shortOf = c => c === AA ? A_ : c === UU ? U_ : c === II ? I_ : c;

  // model vocabulary (HisnLabs tajweed-v2 config.json, index 1..42) -> our codes (0 = ignore)
  const MODEL_PHONEMES = ["ء","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي","ا","ۦ","ۥ","َ","ُ","ِ","۪","ـ","ٲ","ڇ","ں","۾","ۜ","ؙ"];
  const MODEL_MAP = [0].concat(MODEL_PHONEMES.map(p => {
    if (code[p]) return code[p];
    return ({ "ا": AA, "ۦ": II, "ۥ": UU, "َ": A_, "ُ": U_, "ِ": I_, "ٲ": code["ء"], "ں": code["ن"], "۾": code["م"] })[p] || 0;
  }));

  /* substitution cost between two codes */
  const SIM = [["س", "ص", "ث"], ["ت", "ط"], ["د", "ض"], ["ذ", "ظ", "ز"], ["ه", "ح"], ["ء", "ع"], ["ك", "ق"], ["غ", "خ"], ["ق", "غ"]];
  const SUB = new Float32Array(NSYM * NSYM);
  for (let x = 1; x < NSYM; x++) for (let y = 1; y < NSYM; y++) {
    let c;
    if (x === y) c = 0;
    else if (isVowel(x) && isVowel(y)) c = shortOf(x) === shortOf(y) ? 0.15 : 0.45;
    else if (isVowel(x) !== isVowel(y)) c = 1;
    else c = 1;
    SUB[x * NSYM + y] = c;
  }
  for (const g of SIM) for (const p of g) for (const q of g) if (p !== q) SUB[code[p] * NSYM + code[q]] = 0.55;
  const INS = c => isVowel(c) ? 0.3 : 0.8;          // heard but not expected
  const DEL_STRONG = c => isVowel(c) ? (c >= AA ? 0.5 : 0.4) : 1; // expected but not heard

  /* ---------- Warsh (KFGQPC) word -> expected sounds ---------- */
  const HARAKA = { "َ": A_, "ُ": U_, "ِ": I_ };
  const TANWEEN = { "ً": A_, "ٌ": U_, "ٍ": I_, "ٗ": A_, "ٞ": U_, "ٖ": I_ }; // closed + open (KFGQPC Warsh)
  const SHADDA = "ّ", SUKUN = "ْ", DAGGER = "ٰ", MADDA = "ٓ";
  const WASL_MARKS = "۪۬۟";             // ۬ ۟ ۪ on an alif = hamzat wasl
  const SILENT = "۟";
  const IGNORE = new Set(["ۖ", "۩", "‏", "۞", MADDA, "۪", "۬", "ـ"]);
  const HAMZA_LETTERS = "ءأإؤئ";
  const isLetter = ch => /[ء-يےۥۦٰۧۨـ]/.test(ch);

  // split a word into clusters: a base letter with its marks
  function clusters(w) {
    const out = [];
    for (const ch of w) {
      const base = /[ء-يےـۥۦۧۨ]/.test(ch);
      if (base || !out.length) out.push({ b: ch, m: "" });
      else out[out.length - 1].m += ch;
    }
    return out;
  }

  const LETTER_NAMES = { "ا": "ءَلِف", "ل": "لام", "م": "مۦم", "ص": "صاد", "ر": "را", "ك": "كاف", "ه": "ها", "ي": "يا", "ع": "عَين",
    "ط": "طا", "س": "سۦن", "ح": "حا", "ق": "قاف", "ن": "نۥن" };
  const plain = w => w.replace(/[^ء-يے]/g, "").replace(/[أإآ]/g, "ا").replace(/[ىے]/g, "ي");
  function lettersKey(word) {             // separate letters at a surah's start (الٓمٓ = alif lam mim)
    const seq = [];
    for (const ch of plain(word)) for (const x of LETTER_NAMES[ch] || "") seq.push(x);
    return canon(seq.map(x => code[x] ? { c: code[x], w: 1 } : { c: ({ "َ": A_, "ُ": U_, "ِ": I_, "ا": AA, "ۥ": UU, "ۦ": II })[x], w: 0.45 }));
  }
  const MUQ = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68]);
  /* the key of word `wi` of verse (sura, aya) */
  function wordKeyAt(word, sura, aya, wi) {
    if ((wi === 0 || (wi === 1 && sura === 42)) && aya === 1 && MUQ.has(sura) && word.includes("ٓ")) {
      const p = plain(word);
      if (p.length && [...p].every(ch => LETTER_NAMES[ch]) && p.length <= 5) return lettersKey(word);
    }
    return wordKey(word, wi === 0);
  }

  /* returns [{c, w}] : code and deletion weight; w<1 marks weak/optional sounds */
  function wordKey(word, verseStart) {
    const cl = clusters(word);
    const seq = [];
    const push = (c, w) => seq.push({ c, w: w == null ? DEL_STRONG(c) : w });
    let prefix = true;                                    // still inside و ف ب ك ل prefixes?
    for (let k = 0; k < cl.length; k++) {
      let { b, m } = cl[k];
      const next = cl[k + 1];
      const har = [...m].map(x => HARAKA[x]).find(Boolean);
      const tan = [...m].map(x => TANWEEN[x]).find(Boolean);
      const sh = m.includes(SHADDA), sk = m.includes(SUKUN), dag = m.includes(DAGGER);
      const bare = !har && !tan && !sh && !sk && !dag;
      // hamza carried by a tatweel / ے / ي / ى with a hamza mark
      if ((b === "ـ" || b === "ے" || b === "ي" || b === "ى") && /[ٕٔ]/.test(m)) b = "ء";
      if (b === "ـ") { if (dag) push(AA); if (har) push(har); continue; }
      if (b === "ۨ") { push(code["ن"], 0.25); continue; }  // small high noon: a hidden noon sound
      if (b === "ۧ") b = "ي";
      if (b === "ے" || b === "ى") b = "ي_";                   // final-form yaa / alif maqsura
      if (b === "ة") b = "ت";
      if (HAMZA_LETTERS.includes(b) || b === "آ") {
        push(code["ء"]); if (har) push(har); if (tan) { push(tan); push(code["ن"], 0.25); }
        if (b === "آ") push(AA);
        prefix = false; continue;
      }
      if (b === "ا") {
        const isWasl = [...WASL_MARKS].some(x => m.includes(x)) && (k === 0 || prefix);
        if (isWasl) {                                     // hamzat wasl: said only at the start of a breath
          const v = har || (m.includes("۪") ? I_ : A_);
          push(code["ء"], verseStart ? 0.3 : 0.05); push(v, verseStart ? 0.15 : 0.05);
          prefix = false; continue;
        }
        if (m.includes(SILENT) || sk) continue;           // silent alif (كَفَرُواْ)
        if (tan) { push(tan); push(code["ن"], 0.25); continue; } // tanween written on the alif seat
        if (har) { push(har); prefix = false; continue; } // naql: the hamza gave its vowel away (اَلِيمٞ)
        if (dag) { push(AA); continue; }
        push(AA); continue;                                // a long alif
      }
      if (b === "و" || b === "ي_" || b === "ي") {
        const isY = b !== "و";
        const prevV = seq.length ? seq[seq.length - 1].c : 0;
        if (b === "ي_" && tan && !har) { replaceLastVowel(seq, tan); push(code["ن"], 0.25); continue; }
        if (!isY && sk && (prevV === U_ || prevV === UU)) continue;   // the silent و of أُوْلَٰٓئِكَ
        if (bare && !dag) {
          if (isY && b === "ي_" && (prevV === A_ || prevV === AA)) { replaceLastVowel(seq, AA); continue; } // عَلَىٰ / مُوس۪ىٰ
          if (!isY && (prevV === U_ || prevV === UU)) { replaceLastVowel(seq, UU); continue; }
          if (isY && (prevV === I_ || prevV === II)) { replaceLastVowel(seq, II); continue; }
          if (m.includes(SILENT)) continue;
          if (isY && b === "ي_") { push(AA, 0.4); continue; }    // final ى after a consonant: an alif sound
          push(isY ? code["ي"] : code["و"], 0.4); continue;      // unmarked consonant (diphthong edge)
        }
        if (b === "ي_" && dag) { replaceLastVowel(seq, AA); continue; }
        const cc = isY ? code["ي"] : code["و"];
        push(cc); if (sh) push(cc); if (har) push(har); if (tan) { push(tan); push(code["ن"], 0.25); }
        if (dag) push(AA);
        prefix = prefix && !isY && har === A_ && k === 0;    // وَ as a prefix
        continue;
      }
      if (b === "ۥ") { pushLong(seq, UU); continue; }  // small waw: silat (عَلَيْهِمُۥٓ)
      if (b === "ۦ") { pushLong(seq, II); continue; }  // small yaa (بِهِۦ)
      const cc = code[b];
      if (!cc) continue;
      if (m.includes(SILENT)) continue;
      if (b === "ل" && bare && next && next.m.includes(SHADDA)) { push(cc, 0.15); continue; } // ال before a sun letter
      push(cc, bare ? 0.25 : undefined);
      if (sh) push(cc);
      if (har) push(har);
      if (tan) { push(tan); push(m.includes("ۢ") ? code["م"] : code["ن"], 0.25); }
      else if (m.includes("ۢ")) seq[seq.length - 1] = { c: code["م"], w: 0.25 }; // iqlab on a bare noon
      if (dag) pushLong(seq, AA);
      // prefixes: وَ فَ بِ كَ لِ لَ at the start, then the word proper
      prefix = prefix && k <= 1 && "وفبكل".includes(b) && !!har && !sh;
    }
    // the name Allah (اللَّهُ, لِلهِ, اللَّهُمَّ): a long ā before the hāʾ
    if (/لله(م)?$/.test(plain(word))) {
      const h = seq.map(x => x.c).lastIndexOf(code["ه"]);
      if (h > 0 && seq[h - 1].c !== AA) { if (isVowel(seq[h - 1].c)) seq[h - 1] = { c: AA, w: 0.5 }; else seq.splice(h, 0, { c: AA, w: 0.5 }); }
    }
    return canon(seq);
  }
  function replaceLastVowel(seq, L) {
    const t = seq[seq.length - 1];
    if (t && isVowel(t.c)) seq[seq.length - 1] = { c: L, w: DEL_STRONG(L) }; else seq.push({ c: L, w: DEL_STRONG(L) });
  }
  function pushLong(seq, L) { replaceLastVowel(seq, L); }
  /* canonical form: no repeated codes, a short vowel next to its own long vowel merges into the long one */
  function canon(seq) {
    const out = [];
    for (const s of seq) {
      const t = out[out.length - 1];
      if (t && t.c === s.c) { t.w = Math.max(t.w, s.w); continue; }
      if (t && isVowel(t.c) && isVowel(s.c) && shortOf(t.c) === shortOf(s.c)) { t.c = longOf(s.c) === s.c && s.c >= AA ? s.c : Math.max(t.c, s.c); t.w = Math.max(t.w, s.w); continue; }
      out.push({ c: s.c, w: s.w });
    }
    return out;
  }
  /* heard model ids (with times, probs) -> canonical codes */
  function canonHeard(syms) {
    const out = [];
    for (const s of syms) {
      const c = s.c;
      if (!c) continue;
      const t = out[out.length - 1];
      if (t && t.c === c) { t.t1 = s.t; continue; }
      if (t && isVowel(t.c) && isVowel(c) && shortOf(t.c) === shortOf(c)) { t.c = Math.max(t.c, c); t.t1 = s.t; continue; }
      out.push({ c, t: s.t, t1: s.t, p: s.p });
    }
    return out;
  }

  /* weighted edit distance between heard codes and an expected key (same costs as the tracker) */
  function keyDist(h, key) {
    const n = h.length, m = key.length;
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1);
    for (let j = 1; j <= m; j++) prev[j] = prev[j - 1] + key[j - 1].w;
    for (let i = 1; i <= n; i++) {
      cur[0] = prev[0] + INS(h[i - 1]);
      for (let j = 1; j <= m; j++) {
        const e = key[j - 1].c;
        cur[j] = Math.min(prev[j - 1] + SUB[h[i - 1] * NSYM + e] * (isVowel(e) ? 0.5 : 1), prev[j] + INS(h[i - 1]), cur[j - 1] + key[j - 1].w);
      }
      [prev, cur] = [cur, prev];
    }
    return prev[m];
  }
  /* words of verses [v0, v1] of V ([sura, aya, page, words, marks]) with keys; G (mutashabihat groups) adds, for the
     word where similar passages part ways, the words the other passages continue with */
  let altIndex = null;
  function buildAltIndex(V, G) {
    altIndex = new Map();
    G.forEach((g, gi) => g.o.forEach(o => {
      const at = o[0] + ":" + (o[1] + o[2]);
      for (const x of g.o) {
        if (x[3] === o[3]) continue;
        const v = V[x[0]], w = v[3][x[1] + x[2]];
        if (!w) continue;
        const list = altIndex.get(at) || []; 
        if (!list.some(a => a.text === w)) list.push({ text: w, v: x[0], wi: x[1] + x[2], g: gi });
        altIndex.set(at, list);
      }
    }));
  }
  function sessionWords(V, v0, v1, G) {
    if (G && !altIndex) buildAltIndex(V, G);
    const out = [];
    for (let vi = v0; vi <= v1; vi++) {
      const [s, a, , w] = V[vi];
      w.forEach((t, k) => {
        const alts = altIndex && altIndex.get(vi + ":" + k);
        out.push({ text: t, verse: vi, wi: k, s, a, key: wordKeyAt(t, s, a, k), stop: t.includes("ۖ") || k === w.length - 1,
          alts: alts ? alts.map(x => ({ ...x, key: wordKeyAt(x.text, V[x.v][0], V[x.v][1], x.wi) })) : null });
      });
    }
    return out;
  }

  /* ---------- the follow-along tracker ---------- */
  const STRICT = {
    relaxed: { ok: 0.45, bad: 0.8, cons: 3, consR: 0.5 },
    normal: { ok: 0.34, bad: 0.6, cons: 2, consR: 0.44 },
    strict: { ok: 0.24, bad: 0.45, cons: 2, consR: 0.25 },
  };
  const SKIP = 1.7;          // cost to jump over a whole expected word
  const REPEAT = 0.35;       // cost per word to start again a little before the cursor
  const AHEAD = 30;          // words looked at after the cursor
  const BACK = 4;            // words before the cursor a reciter may restart from

  class Tracker {
    /* words: [{text, verse, wi, key:[{c,w}]}] for the whole session range */
    constructor(words, opts = {}) {
      this.words = words;
      this.opts = Object.assign({ strict: "normal", stopOnMistake: false, pause: 0.65 }, opts);
      this.cursor = 0;
      this.status = new Array(words.length).fill(0);   // 0 unseen, 1 ok, 2 wrong, 3 missed, 4 fixed (wrong then right)
      this.shown = new Array(words.length).fill(false);
      this.info = new Array(words.length).fill(null);
      this.anchor = 0;                                   // seconds: heard symbols before this are consumed
      this.events = [];
      this.badSince = null;
      this.lastCommitAt = 0;
      this.wordW = words.map(w => w.key.reduce((s, x) => s + x.w, 0));
    }
    get thr() { return STRICT[this.opts.strict] || STRICT.normal; }

    /* heard: canonical heard symbols (absolute times), now: audio time, voiceEnd: time the voice last stopped (or now if talking) */
    update(heardAll, now, voiceEnd, final = false) {
      const heard = heardAll.filter(h => h.t > this.anchor);
      const out = { commits: [], tentative: [], current: this.cursor, lost: false, extra: 0 };
      if (this.cursor >= this.words.length) { out.done = true; return out; }
      if (!heard.length) return out;
      let r = this.align(heard, this.cursor, false);
      // lost? (most of what was heard matches nothing near the cursor): look across the whole range
      const cons = heard.filter(h => !isVowel(h.c)).length;
      if (cons >= 8 && r.avg > 0.55) {
        const g = this.align(heard, this.cursor, true);
        if (g.avg < 0.4 && g.startWord !== this.cursor) r = g, out.relocated = g.startWord;
        else if (now - (this.lastCommitAt || 0) > 6) { out.lost = true; }
      }
      const pausing = final || (now - voiceEnd >= this.opts.pause);
      const { ws, path } = r;
      // decide what can be committed
      let lastCommit = -1;
      for (let q = 0; q < ws.length; q++) {
        const s = ws[q];
        if (s.k < this.cursor && !s.relocate) continue;     // a repeat of words already judged
        if (!s.full) break;
        const settled = s.after >= 3 || (pausing && q === lastFull(ws)) || (pausing && s.after >= 1);
        if (!settled && !final) break;
        lastCommit = q;
      }
      let endT = null;
      for (let q = 0; q <= lastCommit; q++) {
        const s = ws[q];
        if (s.k < this.cursor) continue;
        const st = this.judge(s);
        // jumped forward (relocation): words between cursor and the new start are missed
        for (let k = this.cursor; k < s.k; k++) { this.setStatus(k, 3, { heard: "" }); out.commits.push({ k, st: 3 }); }
        this.setStatus(s.k, st, s);
        out.commits.push({ k: s.k, st, r: s.r });
        this.cursor = s.k + 1;
        endT = s.t1;
        if (this.opts.stopOnMistake && (st === 2 || st === 3)) { this.cursor = s.k; break; }
      }
      // a repeat with no new word: consume it once the voice pauses
      if (lastCommit < 0 && pausing && ws.length && ws.every(s => s.k < this.cursor && s.full)) endT = ws[ws.length - 1].t1;
      if (endT != null) { this.anchor = endT + 0.01; this.lastCommitAt = now; }
      else if (final) this.anchor = now;
      // words matched so far but not settled: show them right away (no red until settled)
      for (const s of ws) if (s.k >= this.cursor && (s.full || s.part >= 0.6) && s.r <= this.thr.ok) { out.tentative.push(s.k); this.shown[s.k] = true; }
      out.current = this.cursor;
      out.avg = r.avg;
      return out;
    }
    setStatus(k, st, s) {
      const prev = this.status[k];
      this.status[k] = (prev === 2 || prev === 3) && st === 1 ? 4 : st;
      this.shown[k] = true;
      this.info[k] = { r: s.r, heard: s.heard, t0: s.t0, t1: s.t1, mut: s.mut || null };
    }
    judge(s) {
      if (s.skipped) return s.extraCons >= 2 ? 2 : 3;
      const wd = this.words[s.k];
      if (wd.alts && s.heard && s.heard.length) {       // a similar passage: which continuation was said?
        const own = keyDist(s.heard, wd.key);
        for (const a of wd.alts) {
          const d = keyDist(s.heard, a.key);
          if (d + 0.6 < own) { s.mut = { v: a.v, wi: a.wi, text: a.text }; return 2; }
        }
      }
      if (s.r >= this.thr.bad) return 2;
      if (s.cons >= this.thr.cons && s.r >= this.thr.consR) return 2; // clearly another word: two consonants or more differ
      if (s.r <= this.thr.ok) return 1;
      return 1;                                            // in between: not flagged (few false alarms)                                            // in between: not flagged (few false alarms)
    }

    /* semi-global alignment of heard symbols against the expected words from `cur` on */
    align(heard, cur, global) {
      const W = this.words, N = W.length;
      const s0 = global ? 0 : Math.max(0, cur - BACK);
      const s1 = global ? N : Math.min(N, cur + AHEAD);
      const E = [], wOf = [], bStart = [], bEnd = [];
      for (let k = s0; k < s1; k++) {
        bStart.push(E.length);
        for (const x of W[k].key) { E.push(x); wOf.push(k); }
        bEnd.push(E.length);
      }
      const m = E.length, n = heard.length, M1 = m + 1;
      const INF = 1e9;
      const D = new Float32Array((n + 1) * M1).fill(INF);
      const op = new Uint8Array((n + 1) * M1);
      // start cells: the boundary of the cursor word (free), earlier boundaries (repeat), or anywhere (relocate)
      const isStart = new Float32Array(M1).fill(INF);
      for (let q = 0; q < bStart.length; q++) {
        const k = s0 + q, j = bStart[q];
        let c = INF;
        if (k === cur) c = 0;
        else if (k < cur) c = REPEAT * (cur - k);
        if (global) c = Math.min(c, k === cur ? 0 : 1.2 + 0.02 * Math.abs(k - cur));
        isStart[j] = c;
      }
      // word end -> start lookup for skips (only words at/after the cursor can be missed)
      const skipFrom = new Int32Array(M1).fill(-1);
      for (let q = 0; q < bStart.length; q++) if (s0 + q >= cur && !global) skipFrom[bEnd[q]] = bStart[q];
      for (let i = 0; i <= n; i++) {
        const row = i * M1, prow = (i - 1) * M1;
        const h = i ? heard[i - 1].c : 0;
        for (let j = 0; j <= m; j++) {
          let best = i === 0 ? isStart[j] : INF, o = 5;
          if (i > 0) {
            const ins = D[prow + j] + INS(h);
            if (ins < best) { best = ins; o = 2; }
            if (j > 0) {
              const e = E[j - 1];
              const dg = D[prow + j - 1] + SUB[h * NSYM + e.c];
              if (dg < best) { best = dg; o = 1; }
            }
          }
          if (j > 0) {
            const dl = D[row + j - 1] + E[j - 1].w;
            if (dl < best) { best = dl; o = 3; }
            const f = skipFrom[j];
            if (f >= 0) { const sk = D[row + f] + SKIP; if (sk < best) { best = sk; o = 4; } }
          }
          D[row + j] = best; op[row + j] = o;
        }
      }
      // free end: best cell in the last row; prefer the furthest point when costs tie
      let jEnd = 0, bestEnd = INF;
      for (let j = 0; j <= m; j++) { const c = D[n * M1 + j]; if (c <= bestEnd + 1e-6) { bestEnd = c; jEnd = j; } }
      // backtrace
      const steps = [];
      let i = n, j = jEnd;
      while (true) {
        const o = op[i * M1 + j];
        if (o === 5 || (i === 0 && isStart[j] < INF && o !== 3 && o !== 4)) break;
        steps.push([o, i, j]);
        if (o === 1) { i--; j--; } else if (o === 2) i--; else if (o === 3) j--; else if (o === 4) { j = skipFrom[j]; } else break;
        if (i < 0 || j < 0) break;
      }
      const jStart = j;
      steps.reverse();
      // per word stats
      const stats = new Map();
      const get = k => { if (!stats.has(k)) stats.set(k, { k, err: 0, cons: 0, n: 0, t0: null, t1: null, heardIdx: [], skipped: false, extraCons: 0, matchedAfter: 0, reached: 0 }); return stats.get(k); };
      let lastWord = null, gapCons = 0, lastSkip = null, gapIdx = [];
      for (const [o, ii, jj] of steps) {
        if (o === 4) {
          const from = skipFrom[jj];
          const s = get(wOf[from]); s.skipped = true; s.reached = W[wOf[from]].key.length; s.err = this.wordW[wOf[from]];
          const tt = heard[Math.max(0, ii - 1)]; s.t0 = s.t1 = tt ? tt.t1 : null; s.extraCons += gapCons; s.heardIdx.push(...gapIdx); gapCons = 0; gapIdx = [];
          lastWord = wOf[from]; lastSkip = s; continue;
        }
        const k = o === 2 ? (jj > 0 && jj < m && wOf[jj] === wOf[jj - 1] ? wOf[jj - 1] : null) : wOf[jj - 1];
        if (o === 2) {
          const hc = heard[ii - 1];
          if (k == null) {                               // between words: extra speech (or what replaced a skipped word)
            if (lastSkip) { lastSkip.heardIdx.push(ii - 1); if (!isVowel(hc.c)) lastSkip.extraCons++; }
            else { gapIdx.push(ii - 1); if (!isVowel(hc.c)) gapCons++; }
            continue;
          }
          const s = get(k); s.err += INS(hc.c); if (!isVowel(hc.c)) s.cons++; s.heardIdx.push(ii - 1); s.t1 = hc.t1; if (s.t0 == null) s.t0 = hc.t; continue;
        }
        const s = get(k);
        if (o === 1) lastSkip = null;
        if (k !== lastWord) { if (lastWord != null && gapCons >= 2) get(lastWord).extraAfter = gapCons; gapCons = 0; gapIdx = []; lastWord = k; }
        s.reached = jj - bStart[k - s0];
        if (o === 1) {
          const hc = heard[ii - 1];
          const sc = SUB[hc.c * NSYM + E[jj - 1].c];
          s.err += sc * (isVowel(E[jj - 1].c) ? 0.5 : 1);
          if (sc >= 0.8 && !(isVowel(E[jj - 1].c) && isVowel(hc.c))) s.cons++;
          s.heardIdx.push(ii - 1); s.t1 = hc.t1; if (s.t0 == null) s.t0 = hc.t;
        } else if (o === 3) { s.err += E[jj - 1].w; if (E[jj - 1].w >= 1) s.cons++; }
      }
      const ws = [...stats.values()].sort((a, b) => a.k - b.k);
      for (const s of ws) {
        const len = W[s.k].key.length;
        s.full = s.skipped || s.reached >= len;
        s.part = s.reached / Math.max(1, len);
        s.r = s.skipped ? 1 : s.err / Math.max(0.8, this.wordW[s.k]);
        s.heard = s.heardIdx.map(x => heard[x].c);
      }
      // consonants matched after each word (how settled it is)
      let acc = 0;
      const after = new Map();
      for (let q = steps.length - 1; q >= 0; q--) {
        const [o, ii, jj] = steps[q];
        if (o === 1 && !isVowel(E[jj - 1].c) && SUB[heard[ii - 1].c * NSYM + E[jj - 1].c] <= 0.55) acc++;
        const k = o === 4 ? wOf[skipFrom[jj]] : (o === 2 ? null : wOf[jj - 1]);
        if (k != null && !after.has(k)) after.set(k, acc - (o === 1 && !isVowel(E[jj - 1].c) ? 1 : 0));
      }
      for (const s of ws) {
        let a = 0;
        for (const t of ws) if (t.k > s.k) a += t.heardIdx.filter(x => !isVowel(heard[x].c)).length;
        s.after = a;
        if (global) s.relocate = true;
      }
      const startWord = jStart < m ? wOf[jStart] : s1;
      const consH = heard.filter(h => !isVowel(h.c)).length || 1;
      return { ws, path: steps, avg: bestEnd / Math.max(1, consH + 0.3 * (n - consH)), startWord, cost: bestEnd };
    }
    finish(heardAll, now) {
      const r = this.update(heardAll, now, -1e9, true);
      return r;
    }
  }
  function lastFull(ws) { let q = -1; for (let i = 0; i < ws.length; i++) if (ws[i].full) q = i; return q; }

  const api = { wordKey, wordKeyAt, keyDist, sessionWords, canonHeard, Tracker, MODEL_MAP, MODEL_PHONEMES, CONS, codes: { A_, U_, I_, AA, UU, II }, isVowel, SUB, NSYM, STRICT,
    keyText: key => key.map(x => x.c <= 28 ? CONS[x.c - 1] : ["َ", "ُ", "ِ", "ا", "ۥ", "ۦ"][x.c - 29]).join("") };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TasmeeTracker = api;
})(typeof self !== "undefined" ? self : this);
