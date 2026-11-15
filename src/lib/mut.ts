/* Mutashabihat: similar phrases across the whole mushaf. A round shows a verse up to the shared phrase
   and asks what follows it in this exact place. */
import { hizbOf, quran, words } from "./quran";
import { shuffle } from "./quiz";

export const CONTINUE_WORDS = 3;
export type Occurrence = [group: number, index: number];

export const occurrenceCount = () => quran().G.reduce((n, g) => n + g.o.length, 0);

export function occurrences(keep: (verse: number, group: number) => boolean): Occurrence[] {
  const out: Occurrence[] = [];
  quran().G.forEach((g, gi) => g.o.forEach((o, oi) => { if (keep(o[0], gi)) out.push([gi, oi]); }));
  return out;
}
export const inHizbs = (sel: Set<number>) => (v: number) => sel.has(hizbOf(v));

export interface MutRound { group: number; occ: number; verse: number; at: number; len: number; opts: { text: string; ok: boolean }[] }

export function buildRound([gi, oi]: Occurrence): MutRound {
  const g = quran().G[gi], [k, i, L, c1] = g.o[oi], w = words(k);
  const correct = { text: w.slice(i + L, i + L + CONTINUE_WORDS).join(" "), ok: true };
  const seen = new Set([c1]), ds: { text: string; ok: boolean }[] = [];
  shuffle(g.o).forEach((x) => {
    if (seen.has(x[3])) return;
    seen.add(x[3]);
    ds.push({ text: words(x[0]).slice(x[1] + x[2], x[1] + x[2] + CONTINUE_WORDS).join(" "), ok: false });
  });
  return { group: gi, occ: oi, verse: k, at: i, len: L, opts: shuffle([correct, ...ds.slice(0, 3)]) };
}

export const groupsOfVerse = (v: number) => quran().G.map((_, gi) => gi).filter((gi) => quran().G[gi].o.some((o) => o[0] === v));
