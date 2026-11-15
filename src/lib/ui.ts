/* Navigation and reader state (not persisted). Every screen opens the reader through openReader. */
import { createStore } from "./store";
import { pageOfVerse, PAGES } from "./quran";
import { prefs, updatePrefs } from "./prefs";
import { stopListening } from "./recognition";

export type Tab = "today" | "mushaf" | "practice";
/** read: plain mushaf · hint: first word of each verse · hide: verses hidden until tapped · recite: microphone checks the page */
export type ReaderMode = "read" | "hint" | "hide" | "recite";
export type Overlay = null | "search" | "settings";

export const ui = createStore({
  tab: "today" as Tab,
  page: 1,
  mode: "read" as ReaderMode,
  revealed: [] as number[], // verses uncovered in hint/hide mode on the current page
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
  ui.set({ page, revealed: [] });
  if (prefs.get().lastPage !== page) updatePrefs((S) => { S.lastPage = page; });
}

export function openReader(target: { page?: number; verse?: number }, mode: ReaderMode = "read") {
  const page = target.verse != null ? pageOfVerse(target.verse) : target.page ?? prefs.get().lastPage;
  stopListening();
  setPage(page);
  ui.set({ tab: "mushaf", mode, revealed: [], flash: target.verse ?? null, overlay: null, chrome: true });
}

export const setMode = (mode: ReaderMode) => { stopListening(); ui.set({ mode, revealed: [] }); };
export const reveal = (verse: number) => ui.set((s) => ({ revealed: s.revealed.includes(verse) ? s.revealed : [...s.revealed, verse] }));
