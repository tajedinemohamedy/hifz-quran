/* The user's progress and settings: one persisted object, same shape (v:1) as the hifz-app backup code. */
import { createStore } from "./store";

export type Lang = "ar" | "fr" | "en";
export type Theme = "" | "light" | "dark";
export type Strictness = "relaxed" | "normal" | "strict";
export type TaskId = "new" | "recent" | "old" | "quiz" | "week";

export interface DayLog extends Partial<Record<TaskId, boolean>> {
  page?: number;
  oldFrom?: number;
  reads?: number;
  recites?: number;
}

export interface Prefs {
  v: 1;
  t: number;
  next: number;
  confirmed: boolean;
  cursor: number;
  oldPerDay: number;
  sundayOff: boolean;
  log: Record<string, DayLog>;
  best: Record<string, number>;
  weak: Record<number, number>;
  stars: number[];
  mutBest: number | null;
  theme: Theme;
  lang: Lang;
  lastPage: number;
  bookmarks: number[];
  tz: { strict: Strictness; stop: boolean; vibrate: boolean };
}

export const STORAGE_KEY = "hifz_app_v1";

const fresh = (): Prefs => ({
  v: 1, t: 0, next: 2, confirmed: false, cursor: 2, oldPerDay: 10, sundayOff: true, log: {}, best: {}, weak: {}, stars: [],
  mutBest: null, theme: "", lang: "ar", lastPage: 1, bookmarks: [], tz: { strict: "normal", stop: false, vibrate: true },
});

export const prefs = createStore<Prefs>(fresh());

/** Merges a stored or imported object over the defaults; null when it is not a v1 state. */
function parse(raw: unknown): Prefs | null {
  const s = raw as Partial<Prefs> | null;
  if (!s || s.v !== 1) return null;
  const f = fresh();
  return { ...f, ...s, tz: { ...f.tz, ...s.tz } };
}

export function hydratePrefs() {
  try {
    const s = parse(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
    if (s) prefs.set(s);
  } catch {}
  prefs.subscribe(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs.get())); } catch {}
  });
}

/** Every progress change goes through here: edit a draft copy, then publish it. */
export function updatePrefs(edit: (draft: Prefs) => void) {
  const draft = structuredClone(prefs.get());
  edit(draft);
  draft.t = Date.now();
  prefs.set(draft);
}

const toggleIn = (list: number[], x: number) => { const k = list.indexOf(x); if (k >= 0) list.splice(k, 1); else list.push(x); };
export const toggleStar = (group: number) => updatePrefs((S) => toggleIn(S.stars, group));
export const toggleBookmark = (page: number) => updatePrefs((S) => toggleIn(S.bookmarks, page));
export const toggleWeak = (verse: number) => updatePrefs((S) => { if (S.weak[verse]) delete S.weak[verse]; else S.weak[verse] = 1; });
export const addWeak = (verses: number[]) => updatePrefs((S) => verses.forEach((v) => (S.weak[v] = 1)));

export const backupCode =() => btoa(unescape(encodeURIComponent(JSON.stringify(prefs.get()))));
export function restoreBackup(code: string) {
  const s = parse(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));
  if (!s) throw new Error("invalid");
  prefs.set(s);
}

export const todayISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
