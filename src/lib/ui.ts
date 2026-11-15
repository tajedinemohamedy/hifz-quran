/* Navigation and reader state (not persisted). Every screen opens the reader through openReader. */
import { createStore } from "./store";
import { pageOfVerse, pageStartEnd, PAGES } from "./quran";
import { prefs, updatePrefs } from "./prefs";
import { stopListening } from "./recognition";
import { stop as stopAudio } from "./audio";

export type Tab = "today" | "mushaf" | "practice";
/** read: the mushaf · memorize: verses hidden, revealed a step at a time · recite: the microphone checks the page */
export type ReaderMode = "read" | "memorize" | "recite";
export type Overlay = null | "index" | "settings";
/** memorize reveal stage of a verse: 1 = its first word, 2 = all of it */
export type Reveal = 1 | 2;

export const ui = createStore({
  tab: "today" as Tab,
  page: 1,
  mode: "read" as ReaderMode,
  revealed: {} as Record<number, Reveal>,
  flash: null as number | null, // verse to point at after a jump
  chrome: true, // reader bars visible
  overlay: null as Overlay,
});

export function goTab(tab: Tab) {
  if (tab !== "mushaf") stopListening();
  ui.set({ tab, chrome: true });
}

export function setPage(p: number) {
  const page = Math.min(PAGES, Math.max(1, p));
  if (page === ui.get().page) return;
  ui.set({ page, revealed: {} });
  if (prefs.get().lastPage !== page) updatePrefs((S) => { S.lastPage = page; });
}

export function setMode(mode: ReaderMode) {
  stopListening();
  if (mode !== "read") stopAudio(); // listening and reciting from memory don't mix
  ui.set({ mode, revealed: {}, chrome: true });
}

export function openReader(target: { page?: number; verse?: number }, mode: ReaderMode = "read") {
  setPage(target.verse != null ? pageOfVerse(target.verse) : target.page ?? prefs.get().lastPage);
  setMode(mode);
  ui.set({ tab: "mushaf", flash: target.verse ?? null, overlay: null });
}

/** One more step for a verse: first word, then the whole verse. */
export const revealStep = (verse: number) =>
  ui.set((s) => ({ revealed: { ...s.revealed, [verse]: s.revealed[verse] ? 2 : 1 } }));

/** Fully reveals the next verse on the page that is not fully shown yet. */
export function revealNext() {
  const { page, revealed } = ui.get();
  const [a, b] = pageStartEnd(page);
  for (let i = a; i <= b; i++) if (revealed[i] !== 2) return ui.set({ revealed: { ...revealed, [i]: 2 } });
}
