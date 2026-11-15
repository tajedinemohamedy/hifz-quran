/* Tasmee3 session for one mushaf page: words hidden, revealed and judged live as the reciter goes. */
import { createStore } from "./store";
import { pageStartEnd, quran } from "./quran";
import { addWeak, prefs } from "./prefs";
import { bumpCounter, dayPlan } from "./plan";
import { notify } from "./notify";
import { engine, listen, loadTracker, log, onEngine, preload, send, stopListening, type SessionWord, type TrackerApi, type WordInfo } from "./recognition";

/** 0 unseen · 1 ok · 2 wrong · 3 missed · 4 fixed (wrong, then right) */
export interface WordState { s: number; shown: boolean; hint?: boolean; info?: WordInfo }
export const WORD_CLASS = ["", "ok", "wrong", "missed", "fixed"];
export const isMistake = (w: WordState) => w.s === 2 || w.s === 3;
export const isRight = (w: WordState) => w.s === 1 || w.s === 4;

export interface ReciteSummary { judged: number; ok: number; mistakes: number[]; hints: number; score: number }

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

/** Builds the page's words and warms the speech engine, so the microphone starts instantly. */
export async function prepareRecite(page: number) {
  void preload();
  try {
    api = await loadTracker();
  } catch {
    log("error", "failTracker");
    notify.error("failTracker", { id: "tracker", retry: () => void prepareRecite(page) });
    return;
  }
  const [v0, v1] = pageStartEnd(page);
  const words = api.sessionWords(quran().V, v0, v1, quran().G);
  recite.set({ page, words, st: words.map(() => ({ s: 0, shown: false })), cur: 0, lost: false, hints: 0, summary: null });
}

export async function startRecite() {
  const { page, st, summary } = recite.get();
  if (summary || st.some((x) => x.s)) await prepareRecite(page); // a new attempt starts clean
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
  log("info", "logJump", { word: recite.get().words[k].text });
}

let lastVibe = 0;
function summarize() {
  const { st, words, hints, page } = recite.get();
  const ok = st.filter(isRight).length;
  const mistakes = st.map((x, k) => (isMistake(x) ? k : -1)).filter((k) => k >= 0);
  const judged = ok + mistakes.length;
  if (!judged) { log("warn", "logNothingJudged"); notify.warning("nothingJudged", undefined, "recite"); return; }
  const score = Math.round((100 * ok) / judged);
  addWeak([...new Set(mistakes.map((k) => words[k].verse))]); // mistakes join the review list
  recite.set({ summary: { judged, ok, mistakes, hints, score } });
  log(score >= 90 ? "ok" : "warn", "logDone", { pct: score });
  notify.success("reciteDone", { pct: score }, "recite");
  if (page === dayPlan().newPage && score >= 90) { bumpCounter("recites", 1); notify.info("recitationCounted", undefined, "counted"); }
}

if (typeof window !== "undefined") {
  onEngine((e) => {
    if (e.type !== "update") return;
    const { st: prev, words, lost } = recite.get();
    const st = prev.slice();
    let bad = false;
    for (const c of e.commits) {
      if (!st[c.k]) continue;
      st[c.k] = { ...st[c.k], s: c.st, shown: true, info: c.info };
      if (c.st === 2 || c.st === 3) {
        bad = true;
        log("error", c.info?.mut ? "logSimilar" : c.st === 3 ? "logMissed" : "logDifferent", { word: words[c.k].text });
      }
    }
    for (const k of e.tentative) if (st[k] && !st[k].shown) st[k] = { ...st[k], shown: true };
    if (bad && prefs.get().tz.vibrate && navigator.vibrate && Date.now() - lastVibe > 400) { navigator.vibrate(120); lastVibe = Date.now(); }
    if (e.lost && !lost) log("warn", "logLost", { word: words[e.current]?.text ?? "" });
    recite.set({ st, cur: e.current, lost: e.lost });
    if (e.done && engine.get().mode === "recite") stopListening();
    if (e.final) summarize();
  });
}
