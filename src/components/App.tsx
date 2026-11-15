"use client";
/* App shell: loads the mushaf once, then three tabs (Today · Mushaf · Practice) with search and settings as sheets. */
import { useEffect, useState } from "react";
import { loadQuran, pageStartEnd, quran } from "@/lib/quran";
import { hydratePrefs, prefs, toggleBookmark } from "@/lib/prefs";
import { dirOf, useT } from "@/lib/i18n";
import { goTab, ui, type Tab } from "@/lib/ui";
import { practice } from "@/lib/practice";
import { Icon, type IconName } from "./icons";
import { Today } from "./today/Today";
import { Reader } from "./reader/Reader";
import { Practice } from "./practice/Practice";
import { QuizRun } from "./practice/QuizRun";
import { MutRun } from "./practice/MutRun";
import { SearchSheet } from "./SearchSheet";
import { SettingsSheet } from "./SettingsSheet";

/** Keeps <html> lang, dir and theme in sync with the settings (and the system theme when on auto). */
function useDocumentSettings() {
  const lang = prefs.use((s) => s.lang), theme = prefs.use((s) => s.theme);
  useEffect(() => {
    const d = document.documentElement;
    d.lang = lang;
    d.dir = dirOf(lang);
  }, [lang]);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => (document.documentElement.dataset.theme = theme || (mq.matches ? "dark" : "light"));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

const HeaderButton = ({ icon, label, onClick, on }: { icon: IconName; label: string; onClick: () => void; on?: boolean }) => (
  <button onClick={onClick} aria-label={label} className={`grid size-9 place-items-center rounded-full active:bg-surface-2 ${on ? "text-gold" : "text-accent"}`}>
    <Icon name={icon} fill={on} />
  </button>
);

function Header() {
  const { t, sura } = useT();
  const tab = ui.use((s) => s.tab), page = ui.use((s) => s.page);
  const marked = prefs.use((s) => s.bookmarks.includes(page));
  const first = quran().V[pageStartEnd(page)[0]];
  return (
    <header className="z-20 flex h-12 shrink-0 items-center gap-1 bg-glass px-2 backdrop-blur-xl pt-[env(safe-area-inset-top)] box-content">
      {tab === "mushaf" ? (
        <button onClick={() => ui.set({ overlay: "search" })} className="min-w-0 flex-1 px-2 text-start">
          <b className="block truncate text-[15px] leading-tight">{sura(first[0])}</b>
          <span className="text-[12px] text-muted">{t("page", { n: page })}</span>
        </button>
      ) : (
        <div className="min-w-0 flex-1 px-2">
          <b className="block text-[15px] leading-tight">{t("appName")}</b>
          <span className="text-[12px] text-muted">{t("riwaya")}</span>
        </div>
      )}
      {tab === "mushaf" && <HeaderButton icon="bookmark" label={t("bookmark")} on={marked} onClick={() => toggleBookmark(page)} />}
      <HeaderButton icon="search" label={t("search")} onClick={() => ui.set({ overlay: "search" })} />
      <HeaderButton icon="settings" label={t("settings")} onClick={() => ui.set({ overlay: "settings" })} />
    </header>
  );
}

const TABS: [Tab, IconName, "tabToday" | "tabMushaf" | "tabPractice"][] = [
  ["today", "today", "tabToday"],
  ["mushaf", "book", "tabMushaf"],
  ["practice", "practice", "tabPractice"],
];

function TabBar() {
  const { t } = useT();
  const tab = ui.use((s) => s.tab);
  return (
    <nav className="z-20 grid shrink-0 grid-cols-3 border-t border-line bg-glass pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      {TABS.map(([id, icon, label]) => (
        <button key={id} onClick={() => goTab(id)} aria-current={tab === id ? "page" : undefined}
          className="flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] text-muted aria-[current=page]:font-semibold aria-[current=page]:text-accent">
          <Icon name={icon} className="size-6" />
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
  useDocumentSettings();
  const tab = ui.use((s) => s.tab);
  const chrome = ui.use((s) => s.chrome || s.tab !== "mushaf");
  return (
    <div className="flex h-dvh flex-col">
      {chrome && <Header />}
      <main className={`relative min-h-0 flex-1 ${tab === "mushaf" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {tab === "today" && <Today />}
        {tab === "mushaf" && <Reader />}
        {tab === "practice" && <Practice />}
      </main>
      {chrome && <TabBar />}
      <SearchSheet />
      <SettingsSheet />
      <PracticeRun />
    </div>
  );
}

export function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydratePrefs();
    ui.set({ page: prefs.get().lastPage });
    void loadQuran().then(() => setReady(true));
    if ("serviceWorker" in navigator && location.hostname !== "localhost") void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center">
        <div className="size-10 animate-spin rounded-full border-[3px] border-accent border-t-transparent" />
      </div>
    );
  }
  return <Shell />;
}
