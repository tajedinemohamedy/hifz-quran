"use client";
/* App shell: loads the mushaf once (or says why it can't), welcomes a first-time user, then three tabs. */
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, RotateCcw, Sun, WifiOff } from "lucide-react";
import { Direction } from "radix-ui";
import { cn } from "@/lib/utils";
import { loadQuran } from "@/lib/quran";
import { hydratePrefs, prefs } from "@/lib/prefs";
import { dirOf, useT, type Key } from "@/lib/i18n";
import { goTab, ui, type Tab } from "@/lib/ui";
import { practice } from "@/lib/practice";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Today } from "./today/Today";
import { Reader } from "./reader/Reader";
import { Practice } from "./practice/Practice";
import { QuizRun } from "./practice/QuizRun";
import { MutRun } from "./practice/MutRun";
import { IndexSheet } from "./IndexSheet";
import { SettingsSheet } from "./SettingsSheet";
import { Onboarding } from "./Onboarding";

/** Keeps <html> lang, dir and theme in sync with the settings (and the system theme when on auto). */
function useDocumentSettings() {
  const lang = prefs.use((s) => s.lang), theme = prefs.use((s) => s.theme);
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  useEffect(() => {
    const d = document.documentElement;
    d.lang = lang;
    d.dir = dirOf(lang);
  }, [lang]);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const r = theme || (mq.matches ? "dark" : "light");
      document.documentElement.dataset.theme = r;
      setResolved(r);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  return { dir: dirOf(lang), theme: resolved };
}

const TABS: [Tab, typeof Sun, Key][] = [
  ["today", Sun, "tabToday"],
  ["mushaf", BookOpen, "tabMushaf"],
  ["practice", GraduationCap, "tabPractice"],
];

function TabBar() {
  const { t } = useT();
  const tab = ui.use((s) => s.tab);
  return (
    <nav className="grid shrink-0 grid-cols-3 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      {TABS.map(([id, Icon, label]) => (
        <button key={id} onClick={() => goTab(id)} aria-current={tab === id ? "page" : undefined}
          className={cn("flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] transition-colors duration-200", tab === id ? "font-semibold text-primary" : "text-muted-foreground")}>
          <Icon className="size-6" strokeWidth={tab === id ? 2.2 : 1.8} />
          {t(label)}
        </button>
      ))}
    </nav>
  );
}

function PracticeRun() {
  const run = practice.use((s) => s.run), id = practice.use((s) => s.id);
  if (!run) return null;
  return "mut" in run ? <MutRun key={id} list={run.mut} /> : <QuizRun key={id} scope={run.quiz} mode={run.mode} />;
}

function Shell() {
  const tab = ui.use((s) => s.tab);
  const bars = ui.use((s) => s.chrome || s.tab !== "mushaf");
  return (
    <div className="flex h-dvh flex-col">
      <main className="relative min-h-0 flex-1">
        <div key={tab} className={cn("h-full duration-200 animate-in fade-in", tab === "mushaf" ? "overflow-hidden" : "overflow-y-auto")}>
          {tab === "today" && <Today />}
          {tab === "mushaf" && <Reader />}
          {tab === "practice" && <Practice />}
        </div>
      </main>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", bars ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden"><TabBar /></div>
      </div>
      <IndexSheet />
      <SettingsSheet />
      <PracticeRun />
    </div>
  );
}

function Ready() {
  const confirmed = prefs.use((s) => s.confirmed);
  const { dir, theme } = useDocumentSettings();
  return (
    <Direction.Provider dir={dir}>
      {confirmed ? <Shell /> : <Onboarding />}
      <Toaster dir={dir} theme={theme} />
    </Direction.Provider>
  );
}

/** Loading, or the reason loading failed with a way to retry: never an endless spinner. */
function Boot({ failed, retry }: { failed: boolean; retry: () => void }) {
  return (
    <div className="grid h-dvh place-items-center px-8 text-center">
      {failed ? (
        <div className="space-y-3 duration-300 animate-in fade-in">
          <WifiOff className="mx-auto size-8 text-muted-foreground" />
          <p className="text-[15px] font-semibold">تعذّر تحميل المصحف · Couldn&apos;t load the mushaf</p>
          <Button onClick={retry}><RotateCcw />إعادة · Retry</Button>
        </div>
      ) : (
        <div className="size-9 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      )}
    </div>
  );
}

export function App() {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const load = () => void loadQuran().then(() => setState("ready"), () => setState("failed"));
  const retry = () => { setState("loading"); load(); };
  useEffect(() => {
    hydratePrefs();
    ui.set({ page: prefs.get().lastPage });
    load();
    if ("serviceWorker" in navigator && location.hostname !== "localhost") void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return state === "ready" ? <Ready /> : <Boot failed={state === "failed"} retry={retry} />;
}
