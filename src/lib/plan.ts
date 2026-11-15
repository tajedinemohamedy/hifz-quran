/* Daily memorization plan: one new page, the last 7 pages every day, and a rotating slice of older pages. */
import { PAGES, range } from "./quran";
import { prefs, todayISO, updatePrefs, type Prefs, type TaskId } from "./prefs";

const isSunday = (iso: string) => new Date(iso + "T12:00:00").getDay() === 0;

export interface DayPlan {
  iso: string;
  restDay: boolean;
  newPage: number;
  known: number;
  recent: [number, number];
  old: number[] | null;
}

export function dayPlan(S: Prefs = prefs.get()): DayPlan {
  const iso = todayISO(), L = S.log[iso] || {};
  const newPage = L.page || S.next;
  const known = newPage - 1;
  const recent: [number, number] = [Math.max(1, known - 6), known];
  const poolEnd = recent[0] - 1;
  let old: number[] | null = null;
  if (poolEnd >= 1) {
    let from = L.oldFrom || S.cursor;
    if (from > poolEnd || from < 1) from = 1;
    old = range(0, Math.min(S.oldPerDay, poolEnd) - 1).map((k) => ((from - 1 + k) % poolEnd) + 1);
  }
  return { iso, restDay: S.sundayOff && isSunday(iso), newPage, known, recent, old };
}

export function toggleTask(id: TaskId) {
  const P = dayPlan();
  updatePrefs((S) => {
    const L = (S.log[P.iso] ||= {});
    const on = !L[id];
    if (id === "new") {
      if (on) { L.page = P.newPage; S.next = P.newPage + 1; S.confirmed = true; }
      else S.next = L.page || P.newPage;
    }
    if (id === "old" && P.old) {
      if (on) { L.oldFrom = P.old[0]; S.cursor = (P.old[P.old.length - 1] % (P.recent[0] - 1)) + 1; }
      else S.cursor = L.oldFrom || S.cursor;
    }
    L[id] = on;
  });
}

export function markToday(id: TaskId) {
  updatePrefs((S) => { (S.log[todayISO()] ||= {})[id] = true; });
}

export function bumpCounter(key: "reads" | "recites", d: number) {
  updatePrefs((S) => {
    const L = (S.log[todayISO()] ||= {});
    L[key] = Math.max(0, (L[key] || 0) + d);
  });
}

export function setNextPage(p: number) {
  updatePrefs((S) => {
    S.next = Math.min(PAGES, Math.max(2, p));
    const L = S.log[todayISO()];
    if (L && L.page && !L.new) delete L.page;
    S.confirmed = true;
  });
}

export function dayDone(S: Prefs, iso: string) {
  const L = S.log[iso];
  if (!L) return false;
  return S.sundayOff && isSunday(iso) ? !!(L.recent || L.week) : !!L.new;
}

export function streak(S: Prefs) {
  let n = 0;
  const d = new Date();
  if (!dayDone(S, todayISO(d))) d.setDate(d.getDate() - 1);
  for (let k = 0; k < 400 && dayDone(S, todayISO(d)); k++) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** [[a,b], ...] runs of consecutive pages */
export function pageRuns(pages: number[]) {
  const r: [number, number][] = [];
  pages.forEach((p) => { const last = r[r.length - 1]; if (last && p === last[1] + 1) last[1] = p; else r.push([p, p]); });
  return r;
}
