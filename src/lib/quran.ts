/* Quran data (KFGQPC Warsh v10) and every derived lookup. Loaded once before the app renders. */

export type Verse = [sura: number, aya: number, page: number, words: string[], thumnMarks: number[]];
export interface Thumn { h: number; k: number; v: number; wi: number; r: [number, number]; inf: boolean }
/** Mutashabihat group: shared phrase `p`, occurrences [verse, wordIndex, length, nextWordBase]. */
export interface Group { p: string; o: [number, number, number, string][] }

export const PAGES = 604;
export const HIZBS = 60;
export const BASMALA = ["بِسْمِ", "اِ۬للَّهِ", "اِ۬لرَّحْمَٰنِ", "اِ۬لرَّحِيمِ"];

export interface Quran {
  V: Verse[];
  names: string[];
  T: Thumn[];
  G: Group[];
  pageStart: Int32Array;
  pageEnd: Int32Array;
  suraStart: Int32Array;
  thumnOf: Int16Array;
  juzStart: number[];
  merged: [number, number, number][];
}

let Q: Quran | null = null;
let loading: Promise<Quran> | null = null;

export function quran(): Quran {
  if (!Q) throw new Error("Quran data not loaded");
  return Q;
}

export function loadQuran(): Promise<Quran> {
  if (loading) return loading;
  const json = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); });
  loading = Promise.all([json("/data/quran.json"), json("/data/mut.json")]).then(
    ([d, G]: [{ names: string[]; J: number[]; M: [number, number, number][]; T: number[][]; V: Verse[] }, Group[]]) => {
      const V = d.V;
      const T: Thumn[] = d.T.map(([h, k, v, wi, a, b, inf]) => ({ h, k, v, wi, r: [a, b], inf: !!inf }));
      const pageStart = new Int32Array(PAGES + 2).fill(-1), pageEnd = new Int32Array(PAGES + 2).fill(-1);
      const suraStart = new Int32Array(116).fill(-1);
      V.forEach(([s, , p], i) => {
        if (pageStart[p] < 0) pageStart[p] = i;
        pageEnd[p] = i;
        if (suraStart[s] < 0) suraStart[s] = i;
      });
      suraStart[115] = V.length;
      const thumnOf = new Int16Array(V.length);
      T.forEach((t, ti) => { for (let i = t.r[0]; i <= t.r[1]; i++) thumnOf[i] = ti; });
      Q = { V, names: d.names, T, G, pageStart, pageEnd, suraStart, thumnOf, juzStart: d.J, merged: d.M };
      return Q;
    },
  ).catch((e) => { loading = null; throw e; }); // a failed load can be retried
  return loading;
}

/* ---------- lookups ---------- */
export const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k);
export const words = (i: number) => quran().V[i][3];
export const verseText = (i: number) => quran().V[i][3].join(" ");
export const ayaCount = (s: number) => quran().suraStart[s + 1] - quran().suraStart[s];
export const pageOfSura = (s: number) => quran().V[quran().suraStart[s]][2];
export const pageStartEnd = (p: number): [number, number] => [quran().pageStart[p], quran().pageEnd[p]];
export const pageOfVerse = (i: number) => quran().V[i][2];
export const verseIndex = (s: number, a: number) => quran().suraStart[s] + a - 1;
export const sameSura = (i: number, j: number) => j >= 0 && j < quran().V.length && quran().V[i][0] === quran().V[j][0];
export function juzOf(i: number) {
  const J = quran().juzStart;
  let j = 0;
  while (j + 1 < J.length && J[j + 1] <= i) j++;
  return j + 1;
}
export const thumnOfVerse = (i: number) => quran().T[quran().thumnOf[i]];
export const hizbOf = (i: number) => thumnOfVerse(i).h;
export const thumnsOfHizb = (h: number) => quran().T.filter((t) => t.h === h);
export function hizbVerses(h: number): [number, number] {
  const T = thumnsOfHizb(h);
  return [T[0].r[0], T[T.length - 1].r[1]];
}
export const hizbPages = (h: number): [number, number] => hizbVerses(h).map(pageOfVerse) as [number, number];
/** Thumn number, or "a–b" when the data merges two thumns into one. */
export function thumnNumber(h: number, k: number): [number] | [number, number] {
  const m = quran().merged.find((x) => x[0] === h && x[1] === k);
  return m ? [k, m[2]] : [k];
}
/** Surah ranges on a page: [{s, from, to}] */
export function pageParts(p: number) {
  const { V, pageStart, pageEnd } = quran();
  const parts: { s: number; from: number; to: number }[] = [];
  for (let i = pageStart[p]; i <= pageEnd[p]; i++) {
    const [s, a] = V[i];
    const last = parts[parts.length - 1];
    if (last && last.s === s) last.to = a;
    else parts.push({ s, from: a, to: a });
  }
  return parts;
}

/** Letters only: drops vowels, marks and letter variants so search ignores diacritics. */
export const base = (s: string) =>
  s.replace(/[\p{M}\p{Cf}ـۥۦ]/gu, "").replace(/[أإآٱ]/g, "ا").replace(/ؤ/g, "و").replace(/[ئىے]/g, "ي"); // same rule the mutashabihat phrases were built with
