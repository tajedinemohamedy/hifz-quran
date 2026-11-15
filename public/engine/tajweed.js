/* Tajweed judge: what the model heard for one breath against the expected Warsh tajweed of those words.
   A JavaScript port of `listen` from the HisnLabs tajweed-v2 rule engine (imam.py, Apache-2.0), with Warsh's lengths,
   over references built offline by scripts/build-tajweed.py (data/tajweed.json). Pure logic, no DOM: loaded by the
   worker (importScripts). Remarks are data ({kind, severity, vars}); the page words them in the user's language. */
(function (root) {
  "use strict";

  const LONG = new Set(["ا", "ۥ", "ۦ"]);
  const HARAKAT = new Set(["َ", "ُ", "ِ"]);
  const ONSET = 3;                 // first sounds of a breath: often clipped by the recording, not judged
  const TIME_SIX = 8.3, TIME_FIVE = 7.0;
  const WARSH_GOLDEN = { MonfaselMaddRule: 6, MottaselMaddRule: 6, MottaselMaddPauseRule: 6 };
  const MIN_PROB = 0.3, MIN_PROB_JALI = 0.7; // below these the model is not sure enough to correct anyone

  let D = null;
  const load = (data) => { D = data; };
  const ready = () => !!D;

  /* ---------- references ---------- */
  function unitsIn(flat, lo, hi, shift) {
    const out = [];
    for (let i = 0; i < flat.length; i += 6) {
      const s = flat[i];
      if (s < lo || s >= hi) continue;
      const allowed = new Set();
      for (let n = 0; n <= 8; n++) if (flat[i + 4] & (1 << n)) allowed.add(n);
      out.push({ s: s - lo + shift, e: flat[i + 1] - lo + shift, kind: D.kinds[flat[i + 2]], golden: flat[i + 3], allowed, rule: D.rules[flat[i + 5]] });
    }
    return out;
  }

  /** The expected script of words a..b of verse v as recited in one breath, or null when the verse has no data.
      The first word takes its form after a stop mark, the last its pausal form; a breath that starts or ends where
      there is no stop mark leaves that word unjudged (its form is uncertain) and the stop is a waqf remark. */
  function reference(v, a, b) {
    const vd = D && D.verses[v];
    if (!vd) return null;
    const [ph, starts, flat, cuts] = vd, last = starts.length - 1;
    const cutAt = (k) => cuts.find((c) => c[0] === k);
    let phonemes = "";
    const spans = [], units = [], unsure = new Set();
    let waqf = null;
    for (let k = a; k <= b; k++) {
      const lo = starts[k], hi = k < last ? starts[k + 1] : ph.length;
      let word = [ph.slice(lo, hi), null];          // [sounds, units relative to the word] (null: from the verse)
      const startsBreath = k === a && a > 0, endsBreath = k === b && b < last;
      if (startsBreath) {
        const c = cutAt(a - 1);
        if (c && c[2]) word = c[2]; else unsure.add(k - a);
      }
      if (endsBreath) {
        const c = cutAt(b);
        if (!c || !c[1]) { unsure.add(k - a); waqf = k - a; }
        else if (startsBreath) unsure.add(k - a);    // one word between two stops: no form covers both ends
        else word = c[1];
      }
      const at = phonemes.length;
      phonemes += word[0];
      const us = word[1] ? unitsIn(word[1], 0, Infinity, at) : unitsIn(flat, lo, hi, at);
      for (const u of us) units.push({ ...u, word: k - a });
      spans.push([at, phonemes.length]);
    }
    units.sort((x, y) => x.s - y.s);
    return { phonemes, spans, units, unsure, waqf, words: b - a + 1 };
  }

  /* ---------- alignment (Levenshtein opcodes, as python-Levenshtein) ---------- */
  function opcodes(a, b) {
    const n = a.length, m = b.length, W = m + 1;
    const d = new Uint16Array((n + 1) * W);
    for (let i = 0; i <= n; i++) d[i * W] = i;
    for (let j = 0; j <= m; j++) d[j] = j;
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= m; j++)
        d[i * W + j] = Math.min(d[(i - 1) * W + j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), d[(i - 1) * W + j] + 1, d[i * W + j - 1] + 1);
    const ops = [];
    let i = n, j = m;
    // walking back from the end, a gap is taken as soon as it is as cheap: among equal alignments, deletions and
    // insertions land as late as possible (as python-Levenshtein places them)
    while (i > 0 || j > 0) {
      const here = d[i * W + j];
      if (i > 0 && here === d[(i - 1) * W + j] + 1) { ops.push(["delete", i - 1, j]); i--; }
      else if (j > 0 && here === d[i * W + j - 1] + 1) { ops.push(["insert", i, j - 1]); j--; }
      else { ops.push([a[i - 1] === b[j - 1] ? "equal" : "replace", i - 1, j - 1]); i--; j--; }
    }
    ops.reverse();
    const out = [];
    for (const [tag, x, y] of ops) {
      const p = out[out.length - 1];
      const i1 = x, j1 = y;
      const i2 = tag === "insert" ? x : x + 1, j2 = tag === "delete" ? y : y + 1;
      if (p && p[0] === tag && p[2] === i1 && p[4] === j1) { p[2] = i2; p[4] = j2; }
      else out.push([tag, i1, i2, j1, j2]);
    }
    return out;
  }

  /** b[i] = position in the heard script that corresponds to position i of the expected one */
  function boundaries(ref, heard) {
    const b = new Array(ref.length + 1).fill(0);
    for (const [, i1, i2, j1, j2] of opcodes(ref, heard))
      for (let k = i1; k <= i2; k++) b[k] = j1 + (i2 > i1 ? Math.round(((k - i1) * (j2 - j1)) / (i2 - i1)) : 0);
    b[ref.length] = heard.length;
    return b;
  }

  /** the run of c in heard[a:b], grown over its neighbours: [length, start, end] */
  function run(heard, a, b, c) {
    let k = -1;
    for (let x = a; x < b; x++) if (heard[x] === c) { k = x; break; }
    if (k < 0) return [0, a, a];
    let s = k, e = k;
    while (s > 0 && heard[s - 1] === c) s--;
    while (e < heard.length && heard[e] === c) e++;
    return [e - s, s, e];
  }

  function dur(heard, times, s, e) {
    const a = s && HARAKAT.has(heard[s - 1]) ? times[s - 1] : times[s];
    return Math.max(0, times[Math.min(e, times.length - 1)] - a);
  }

  /** seconds per count: half the median natural madd of this breath (or of the session when it has too few) */
  function pace(ref, heard, b, times, tempo) {
    if (!times || times.length !== heard.length + 1) return null;
    const nat = [];
    for (const u of ref.units) {
      if (u.kind !== "madd" || u.rule !== "NormalMaddRule" || u.word === ref.words - 1) continue;
      const [n, s, e] = run(heard, Math.max(0, b[u.s] - 1), Math.min(heard.length, b[u.e] + 1), ref.phonemes[u.s]);
      if (n >= 1 && n <= 3) nat.push(dur(heard, times, s, e));
    }
    const ok = nat.filter((d) => d > 0.08 && d < 2.0);
    tempo.push(...ok); tempo.splice(0, Math.max(0, tempo.length - 40));
    const src = ok.length >= 2 ? ok : tempo.length >= 3 ? tempo : [];
    if (!src.length) return null;
    const srt = [...src].sort((x, y) => x - y);
    return srt[srt.length >> 1] / 2;
  }

  /** a sound without its length: runs collapsed, the length marks of madd / ghunnah removed */
  function stripLen(s) {
    let out = "";
    for (const c of s) if (out[out.length - 1] !== c) out += c;
    return [...out].filter((c) => !LONG.has(c) && !"ںڇ۾".includes(c)).join("");
  }

  /* ---------- the judgment ---------- */
  /** heard: the phonetic script the model wrote; probs: its confidence per symbol; times: the time of each symbol plus
      the end of the last one; tempo: natural madds heard so far in the session (kept by the caller).
      → per word of the reference: { notes: [{ kind, severity, rule, vars }], madd: [{ rule, heard }] } */
  function listen(ref, heard, probs, times, tempo) {
    const E = ref.phonemes;
    const b = boundaries(E, heard);
    const notes = Array.from({ length: ref.words }, () => []);
    const covered = new Array(E.length).fill(false);
    let span = [0, 0];

    const unsure = (hs, he, thr = MIN_PROB) => {
      const seg = probs.slice(Math.max(0, hs - 1), Math.min(probs.length, he + 1));
      return seg.length > 0 && Math.min(...seg) < thr;
    };
    const add = (w, kind, severity, rule, vars = {}) => { if (!unsure(span[0], span[1])) notes[w].push({ kind, severity, rule, vars }); };
    const moreNun = (u, hs, he) => (heard.slice(Math.max(0, hs - 2), he).match(/ن/g) || []).length > (E.slice(Math.max(0, u.s - 2), u.e).match(/ن/g) || []).length;

    const maddSeen = {}, maddHeard = Array.from({ length: ref.words }, () => []);
    const unit = pace(ref, heard, b, times, tempo);
    for (const u of ref.units) {
      for (let x = u.s; x < u.e; x++) covered[x] = true;
      const hs = b[u.s], he = b[u.e];
      span = [hs, he];
      const c = E[u.s];
      if (u.kind === "madd") {
        let [n, rs, re] = run(heard, Math.max(0, hs - 1), Math.min(heard.length, he + 1), c);
        if (u.rule.startsWith("Leen") && n > 0) n++;
        const sym = n;
        let allowed = u.allowed, shown = n ? (n <= 3 ? 2 : n <= 5 ? 4 : 6) : 0;
        if (unit && (n === 4 || n === 5)) {   // the symbols stop at 4: the clock says 4, 5 or 6
          const tc = dur(heard, times, rs, re) / unit;
          n = tc >= TIME_SIX ? 6 : tc >= TIME_FIVE ? 5 : 4;
          if (WARSH_GOLDEN[u.rule]) { allowed = new Set([6]); shown = tc >= TIME_FIVE ? 6 : 4; }
          else shown = tc >= TIME_SIX ? 6 : 4;
        }
        const near = [...allowed].reduce((p, a) => (Math.abs(a - n) < Math.abs(p - n) ? a : p), [...allowed][0]);
        (maddSeen[u.rule] ||= []).push([u.word, sym]);
        if (shown && u.rule !== "NormalMaddRule") maddHeard[u.word].push({ rule: u.rule, heard: shown });
        if (n === 0 && !u.rule.startsWith("Leen")) add(u.word, "madd_missing", "jali", u.rule, { rule: u.rule });
        else if (Math.abs(n - near) > 1 && !unsure(hs, he))
          notes[u.word].push({ kind: n > near ? "madd_long" : "madd_short", severity: "khafi", rule: u.rule,
            vars: { rule: u.rule, heard: n, want: allowed.has(u.golden) ? u.golden : near } });
      } else if (u.kind === "qalqalah") {
        if (!heard.slice(Math.max(0, hs - 1), he + 1).includes("ڇ")) add(u.word, "qalqalah_missing", "khafi", "qalqalah", { letter: u.s ? E[u.s - 1] : "" });
      } else if (u.kind === "ikhfa") {
        const [n] = run(heard, hs, Math.max(he, hs + 1), "ں");
        if (n === 0 && heard.slice(hs, he + 1).includes("ن")) add(u.word, "ikhfa_izhar", "khafi", "ikhfa");
        else if (n && n < u.golden - 1) add(u.word, "ikhfa_short", "khafi", "ikhfa");
      } else if (u.kind === "iqlab") {
        if (!heard.slice(Math.max(0, hs - 1), he + 1).includes("۾")) add(u.word, "iqlab_missed", "khafi", "iqlab");
      } else if (u.kind === "ghunnah" || u.kind === "idgham_ghunnah") {
        const [n] = run(heard, Math.max(0, hs - 1), Math.min(heard.length, he + 1), c);
        if (u.kind === "idgham_ghunnah" && c !== "ن" && moreNun(u, hs, he)) add(u.word, "idgham_missed", "khafi", "idgham", { letter: c });
        else if (n < u.golden) add(u.word, u.kind === "ghunnah" ? "ghunnah_short" : "idgham_ghunnah_short", "khafi", u.kind);
      } else if (u.kind === "shadda" || u.kind === "idgham") {
        const [n] = run(heard, Math.max(0, hs - 1), Math.min(heard.length, he + 1), c);
        if (u.kind === "idgham" && moreNun(u, hs, he)) add(u.word, "idgham_missed", "khafi", "idgham", { letter: c });
        else if (n === 1) add(u.word, "shadda_missing", "jali", "shadda", { letter: c });
      }
    }

    // whatever the rules did not explain: other letters, other vowels, dropped or added sounds (clear mistakes)
    const wordAt = (i) => { const k = ref.spans.findIndex(([a, z]) => a <= i && i < z); return k < 0 ? ref.words - 1 : k; };
    const LENGTHY = new Set([...LONG, "ڇ", "ں", "۾", "ن", "م"]);
    for (const [tag, i1, i2, j1, j2] of opcodes(E, heard)) {
      if (tag === "equal") continue;
      const exp = E.slice(i1, i2), got = heard.slice(j1, j2);
      const expSet = new Set(exp);
      if (i2 > i1 && covered.slice(i1, i2).every(Boolean) && (!got || [...got].every((c) => expSet.has(c) || LENGTHY.has(c)))) continue;
      if (tag === "insert" && ref.units.some((u) => u.kind === "madd" && u.s <= i1 && i1 <= u.e && [...got].every((c) => c === E[u.s]))) continue;
      const gotCore = stripLen(got);
      if ((tag === "insert" || tag === "replace") && got.includes("ء") && [...gotCore].every((c) => c === "ء" || HARAKAT.has(c))) continue; // a hamza Warsh drops (naql, ibdal), heard anyway
      const w = wordAt(i1);
      span = [j1, j2];
      if (i1 < ONSET) continue;
      const eCore = stripLen(exp);
      if (eCore === gotCore) continue;
      if (unsure(j1, j2, MIN_PROB_JALI)) continue;
      if (tag === "replace" && eCore.length === 1 && gotCore.length === 1 && HARAKAT.has(eCore) && HARAKAT.has(gotCore))
        notes[w].push({ kind: "vowel", severity: "jali", rule: "vowel", vars: { want: eCore, heard: gotCore } });
      else if (tag === "replace") add(w, "letter", "jali", "letter", { want: exp, heard: got });
      else if (tag === "delete") { if (!(exp.length === 1 && (LONG.has(exp) || HARAKAT.has(exp)))) add(w, "dropped", "jali", "dropped", { want: exp }); }
      else if (tag === "insert") {
        if (i1 === 0 || i1 === E.length) continue;
        if ([...got].every((c) => LONG.has(c))) { if (got.length >= 2) add(w, "madd_added", "khafi", "madd_added"); continue; }
        if (got.length === 1 && HARAKAT.has(got)) continue;
        add(w, "added", "jali", "added", { heard: got });
      }
    }

    // a word whose sounds are (almost) all missing was skipped
    ref.spans.forEach(([a, z], k) => {
      if (z > a && b[z] - b[a] <= Math.max(0, Math.floor((z - a) / 4))) notes[k] = [{ kind: "word_missing", severity: "jali", rule: "word", vars: {} }];
    });

    // the same kind of madd keeps the same length through the recitation
    for (const [rule, seen] of Object.entries(maddSeen)) {
      if (!["MonfaselMaddRule", "MottaselMaddRule", "AaredMaddRule", "BadalMadd"].includes(rule) || seen.length < 2) continue;
      const lens = seen.map(([, n]) => n).filter(Boolean);
      if (lens.length && Math.max(...lens) - Math.min(...lens) >= 2) {
        const mean = Math.round(lens.reduce((x, y) => x + y, 0) / lens.length);
        const [w] = seen.reduce((p, x) => (Math.abs(x[1] - mean) > Math.abs(p[1] - mean) ? x : p));
        notes[w].push({ kind: "madd_uneven", severity: "khafi", rule: rule + ":uneven", vars: { rule, lens: lens.join(" / ") } });
      }
    }

    // words at an uncertain boundary are not judged; a stop where there is no stop mark is a waqf remark
    for (const k of ref.unsure) notes[k] = [];
    if (ref.waqf != null) notes[ref.waqf].push({ kind: "waqf", severity: "khafi", rule: "waqf", vars: {} });
    return notes.map((n, k) => ({ notes: n, madd: maddHeard[k] }));
  }

  const api = { load, ready, reference, listen, opcodes };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Tajweed = api;
})(typeof self !== "undefined" ? self : this);
