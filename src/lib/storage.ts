/* Local persistence of progress: one key, writes batched off the interaction path and flushed when the page hides,
   kept in sync across open tabs, protected from eviction, and never lost or failing silently. */
import { prefs, parsePrefs, STORAGE_KEY, type Prefs } from "./prefs";
import { notify } from "./notify";

const PREVIOUS_KEY = STORAGE_KEY + "_previous"; // progress as it was before the last restore (undo)
const DAMAGED_KEY = STORAGE_KEY + "_damaged"; // unreadable saved data is set aside, never overwritten
const WRITE_DELAY = 400; // ms: a burst of changes (page swipes, counters) becomes one write

let written = ""; // what the storage holds now, so unchanged state is never rewritten
let dirty = false; // only a real change in this tab may write (an idle tab never overwrites another tab's progress)
let timer = 0;
let failing = false;
let persistAsked = false;

const read = (json: string | null): Prefs | null => {
  if (!json) return null;
  try { return parsePrefs(JSON.parse(json)); } catch { return null; }
};

/** Writes pending changes now (no-op when nothing changed); a failure is announced until a write succeeds. */
export function flush() {
  clearTimeout(timer);
  timer = 0;
  if (!dirty) return;
  const json = JSON.stringify(prefs.get());
  if (json === written) { dirty = false; return; }
  try {
    localStorage.setItem(STORAGE_KEY, json);
    written = json;
    dirty = false;
    if (failing) { failing = false; notify.dismiss("storage"); }
  } catch {
    if (!failing) { failing = true; notify.error("saveFailed", { id: "storage", detail: "saveFailedHint", retry: flush }); }
  }
}

function schedule() {
  dirty = true;
  if (!timer) timer = window.setTimeout(flush, WRITE_DELAY);
  // once there is real progress, ask the browser not to evict it under storage pressure
  if (!persistAsked && prefs.get().confirmed) { persistAsked = true; void navigator.storage?.persist?.(); }
}

/** Loads saved progress into `prefs`, then keeps storage and other tabs in step with it. Call once at startup. */
export function startStorage() {
  let json: string | null = null;
  try { json = localStorage.getItem(STORAGE_KEY); } catch { notify.error("storageBlocked", { id: "storage" }); }
  const saved = read(json);
  if (saved) { prefs.set(saved); written = json!; }
  else if (json) {
    try { localStorage.setItem(DAMAGED_KEY, json); } catch {}
    written = json; // not overwritten until the user changes something
    notify.error("progressDamaged", { id: "storage", detail: "progressDamagedHint" });
  }

  prefs.subscribe(schedule); // subscribed after loading, so loading itself is not a change
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });

  // another tab saved newer progress: adopt it (strictly newer, so two tabs never echo each other)
  addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const other = read(e.newValue);
    if (!other || other.t <= prefs.get().t) return;
    written = JSON.stringify(other);
    prefs.set(other);
    clearTimeout(timer);
    timer = 0;
    dirty = false; // adopted, not changed: nothing to write back
  });
}

/* ---------- backup codes ---------- */
export const backupCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(prefs.get()))));

/** Replaces progress with a backup code's; the replaced progress is kept for undo. Throws on an invalid code. */
export function restoreBackup(code: string) {
  const restored = parsePrefs(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));
  if (!restored) throw new Error("invalid");
  try { localStorage.setItem(PREVIOUS_KEY, JSON.stringify(prefs.get())); } catch {}
  prefs.set({ ...restored, t: Date.now() });
  flush(); // saved at once: a restore should never wait
}

export function undoRestore() {
  let previous: Prefs | null = null;
  try { previous = read(localStorage.getItem(PREVIOUS_KEY)); } catch {}
  if (!previous) return notify.error("undoFailed", { id: "backup" });
  prefs.set({ ...previous, t: Date.now() });
  flush();
  notify.success("restoreUndone", undefined, "undo"); // own id: the "restored" toast is being dismissed by this click
}
