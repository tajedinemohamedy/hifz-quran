/* Tasmee3 session for one mushaf page: words hidden, revealed and judged as the reciter goes. */
import { createStore } from "./store";
import { pageStartEnd, quran } from "./quran";
import { addWeak, prefs } from "./prefs";
import { engine, listen, loadTracker, onEngine, send, stopListening, type SessionWord, type TrackerApi, type WordInfo } from "./recognition";

/** 0 unseen · 1 ok · 2 wrong · 3 missed · 4 fixed (wrong, then right) */
export interface WordState { s: number; shown: boolean; hint?: boolean; info?: WordInfo }
export const WORD_CLASS = ["", "ok", "wrong", "missed", "fixed"];
export const isMistake = (w: WordState) => w.s === 2 || w.s === 3;

export interface ReciteSummary { judged: number; ok: number; mistakes: number[]; hints: number }

export const recite = createStore({
  page: 0,
  words: [] as SessionWord[],
  st: [] as WordState[],
  cur: 0,
  lost: false,
  showText: false,
  hints: 0,
  summary: null as ReciteSummary | null,
});

let api: TrackerApi | null = null;
export const trackerApi = () => api;

export async function prepareRecite(page: number) {
  api = await loadTracker();
  const [v0, v1] = pageStartEnd(page);
  const words = api.sessionWords(quran().V, v0, v1, quran().G);
  recite.set({ page, words, st: words.map(() => ({ s: 0, shown: false })), cur: 0, lost: false, hints: 0, summary: null });
}

export async function startRecite() {
  const { page, st } = recite.get();
  if (st.some((x) => x.s)) await prepareRecite(page); // a new attempt starts clean
  const { tz } = prefs.get();
  await listen("recite", { words: recite.get().words, opts: { strict: tz.strict, stopOnMistake: tz.stop } });
}

export const stopRecite = stopListening;

export function hintWord(k: number) {
  recite.set((r) => ({ st: r.st.map((x, i) => (i === k ? { ...x, shown: true, hint: true } : x)), hints: r.hints + 1 }));
}

export function jumpTo(k: number) {
  send({ type: "jump", k });
  recite.set({ cur: k, lost: false });
}

let lastVibe = 0;
function summarize() {
  const { st, words, hints } = recite.get();
  const ok = st.filter((x) => x.s === 1 || x.s === 4).length;
  const mistakes = st.map((x, k) => (isMistake(x) ? k : -1)).filter((k) => k >= 0);
  if (!ok && !mistakes.length) return;
  addWeak([...new Set(mistakes.map((k) => words[k].verse))]); // mistakes join the quiz list
  recite.set({ summary: { judged: ok + mistakes.length, ok, mistakes, hints } });
}

if (typeof window !== "undefined") {
  onEngine((e) => {
    if (e.type !== "update") return;
    const st = recite.get().st.slice();
    let bad = false;
    for (const c of e.commits) {
      if (!st[c.k]) continue;
      st[c.k] = { ...st[c.k], s: c.st, shown: true, info: c.info };
      bad ||= c.st === 2 || c.st === 3;
    }
    for (const k of e.tentative) if (st[k] && !st[k].shown) st[k] = { ...st[k], shown: true };
    if (bad && prefs.get().tz.vibrate && navigator.vibrate && Date.now() - lastVibe > 400) { navigator.vibrate(120); lastVibe = Date.now(); }
    recite.set({ st, cur: e.current, lost: e.lost });
    if (e.done && engine.get().mode === "recite") stopListening();
    if (e.final) summarize();
  });
}
