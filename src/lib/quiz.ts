/* Memorization quiz: every question is built from the mushaf text itself. */
import { base, hizbVerses, quran, range, sameSura, verseText, words, pageStartEnd } from "./quran";
import type { Prefs } from "./prefs";

export type Scope = { kind: "hizb"; h: number; k: number } | { kind: "pages"; a: number; b: number } | { kind: "weak" };
export type QuizMode = "full" | "mix";
export interface Option { text: string; ok: boolean }
export type Question =
  | { type: "mc"; ask: "next" | "prev" | "blank" | "thumn"; verse: number; reveal: number; opts: Option[]; blank?: number; h?: number; k?: number }
  | { type: "finish"; verse: number; cut: number };

export const shuffle = <T,>(a: T[]) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export function scopeVerses(sc: Scope, S: Prefs) {
  if (sc.kind === "hizb") {
    if (sc.k) { const t = quran().T.find((t) => t.h === sc.h && t.k === sc.k)!; return range(t.r[0], t.r[1]); }
    return range(...hizbVerses(sc.h));
  }
  if (sc.kind === "pages") return range(pageStartEnd(sc.a)[0], pageStartEnd(sc.b)[1]);
  return Object.keys(S.weak).map(Number).sort((x, y) => x - y);
}

/** Shortest distinct prefixes (4 words or more) so options differ visibly. */
function prefixes(list: string[][]) {
  let k = 4;
  while (k < 80 && new Set(list.map((w) => w.slice(0, k).join(" "))).size < list.length) k++;
  return list.map((w) => w.slice(0, k).join(" ") + (w.length > k ? " …" : ""));
}

function distract(pool: number[], c: number, excl: number[], n: number) {
  const fw = base(words(c)[0]), seen = new Set([verseText(c)]);
  const cand = shuffle(pool.filter((x) => x !== c && !excl.includes(x))).filter((x) => {
    const t = verseText(x);
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });
  const same = cand.filter((x) => base(words(x)[0]) === fw), other = cand.filter((x) => base(words(x)[0]) !== fw);
  return same.slice(0, 2).concat(other).slice(0, n);
}

function qMove(i: number, dir: 1 | -1, pool: number[], wide: number[]): Question | null {
  const c = i + dir;
  if (!sameSura(i, c)) return null;
  const src = wide.length >= 4 ? wide : pool;
  const twins = src.filter((j) => j !== i && verseText(j) === verseText(i)).map((m) => m + dir);
  const ds = distract(src, c, [i, ...twins], 3);
  if (!ds.length) return null;
  const ns = shuffle([c, ...ds]), labels = prefixes(ns.map(words));
  return { type: "mc", ask: dir > 0 ? "next" : "prev", verse: i, reveal: c, opts: ns.map((x, k) => ({ text: labels[k], ok: x === c })) };
}

function qFinish(i: number): Question {
  const n = words(i).length;
  return { type: "finish", verse: i, cut: n <= 3 ? 1 : Math.max(2, Math.round(n * 0.4)) };
}

function qBlank(i: number, pool: number[]): Question | null {
  const w = words(i), idx = w.map((_, k) => k).filter((k) => base(w[k]).length >= 3);
  if (!idx.length) return null;
  const bi = idx[Math.floor(Math.random() * idx.length)], correct = w[bi].replace(/ۖ/g, ""), cb = base(correct);
  const seen = new Set([cb]), cand: string[] = [];
  shuffle(pool).forEach((x) => words(x).forEach((t) => {
    const tb = base(t);
    if (tb.length >= 3 && !seen.has(tb) && Math.abs(tb.length - cb.length) <= 3) { seen.add(tb); cand.push(t.replace(/ۖ/g, "")); }
  }));
  if (cand.length < 2) return null;
  const opts = shuffle([correct, ...shuffle(cand).slice(0, 3)]);
  return { type: "mc", ask: "blank", verse: i, reveal: i, blank: bi, opts: opts.map((o) => ({ text: o, ok: o === correct })) };
}

function qThumn(h: number, k: number): Question | null {
  const all = quran().T.filter((t) => t.h === h), t = all.find((x) => x.k === k);
  if (!t || all.length < 2) return null;
  const pick = shuffle([t, ...shuffle(all.filter((x) => x !== t)).slice(0, 3)]);
  const labels = prefixes(pick.map((x) => words(x.v).slice(x.wi)));
  return { type: "mc", ask: "thumn", h, k, verse: t.v, reveal: t.v, opts: pick.map((x, j) => ({ text: labels[j], ok: x === t })) };
}

/** Lazily built questions (a maker may return null when a question is impossible there). */
export function buildQuiz(sc: Scope, mode: QuizMode, S: Prefs): (() => Question | null)[] {
  const pool = scopeVerses(sc, S);
  const wide = sc.kind === "weak" ? range(0, quran().V.length - 1) : pool;
  const ths = sc.kind === "hizb" ? quran().T.filter((t) => t.h === sc.h && (!sc.k || t.k === sc.k)) : [];
  if (mode === "full") {
    return [...pool.flatMap((i) => [() => qFinish(i), () => qMove(i, 1, pool, wide)]), ...ths.map((t) => () => qThumn(t.h, t.k))];
  }
  const bank = [
    ...pool.flatMap((i) => [() => qFinish(i), () => qMove(i, 1, pool, wide), () => qMove(i, -1, pool, wide), () => qBlank(i, wide)]),
    ...ths.map((t) => () => qThumn(t.h, t.k)),
  ];
  return shuffle(bank).slice(0, 20);
}
