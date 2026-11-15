"use client";
/* Today: the plan for the day and the progress behind it, in one scroll. */
import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { prefs, todayISO, type TaskId } from "@/lib/prefs";
import { bumpCounter, dayDone, dayPlan, setNextPage, streak, toggleTask } from "@/lib/plan";
import { HIZBS, PAGES, hizbPages, pageOfVerse, pageParts, range } from "@/lib/quran";
import { openReader } from "@/lib/ui";
import { startPractice } from "@/lib/practice";
import { occurrences } from "@/lib/mut";
import { shuffle } from "@/lib/quiz";
import { Icon } from "../icons";
import { Bar, Button, Card, SectionTitle } from "../ui";

function Task({ id, title, meta, children }: { id: TaskId; title: ReactNode; meta: ReactNode; children?: ReactNode }) {
  const done = prefs.use((s) => !!s.log[todayISO()]?.[id]);
  return (
    <Card className={`flex gap-3 transition-opacity ${done ? "opacity-60" : ""}`}>
      <button onClick={() => toggleTask(id)} aria-pressed={done} aria-label={String(title)}
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${done ? "border-accent bg-accent text-on-accent" : "border-line"}`}>
        {done && <Icon name="check" className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold">{title}</div>
        <div className="text-[13px] text-muted">{meta}</div>
        {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
      </div>
    </Card>
  );
}

function Counter({ k, label }: { k: "reads" | "recites"; label: string }) {
  const { n } = useT();
  const v = prefs.use((s) => s.log[todayISO()]?.[k] || 0);
  return (
    <div>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <Button small onClick={() => bumpCounter(k, -1)} aria-label="−"><Icon name="minus" className="size-4" /></Button>
        <span className="min-w-8 text-center text-[24px] font-bold tabular-nums">{n(v)}</span>
        <Button small tone="primary" onClick={() => bumpCounter(k, 1)} aria-label="+"><Icon name="plus" className="size-4" /></Button>
      </div>
    </div>
  );
}

function ConfirmPage({ page }: { page: number }) {
  const { t, n, sura } = useT();
  const [p, setP] = useState(page);
  return (
    <Card className="mt-3 ring-2 ring-accent/30">
      <div className="font-semibold">{t("confirmAsk")}</div>
      <p className="text-[13px] text-muted">{t("confirmHint")}</p>
      <div className="mt-3 flex items-center gap-2">
        <input type="number" min={2} max={PAGES} value={p} onChange={(e) => setP(+e.target.value || 2)} aria-label={t("nextPage")}
          className="h-11 w-24 rounded-xl bg-surface-2 px-3 text-center text-[17px] font-semibold tabular-nums outline-none" />
        <Button tone="primary" onClick={() => setNextPage(p)}>{t("confirm")}</Button>
      </div>
      <p className="mt-2 text-[12px] text-muted">{pageParts(Math.min(PAGES, Math.max(1, p))).map((x) => `${sura(x.s)} ${n(x.from)}–${n(x.to)}`).join(" · ")}</p>
    </Card>
  );
}

function Calendar() {
  const { n } = useT();
  const S = prefs.use((s) => s);
  const d = new Date(); d.setDate(d.getDate() - 27);
  const days = range(0, 27).map(() => { const iso = todayISO(d), day = d.getDate(); d.setDate(d.getDate() + 1); return { iso, day }; });
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map(({ iso, day }) => {
        const L = S.log[iso] || {}, some = (["new", "recent", "old", "quiz", "week"] as const).some((x) => L[x]);
        return (
          <div key={iso} title={iso} className={`grid aspect-square place-items-center rounded-lg text-[11px] tabular-nums ${dayDone(S, iso) ? "bg-accent text-on-accent" : some ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"} ${iso === todayISO() ? "ring-2 ring-gold" : ""}`}>
            {n(day)}
          </div>
        );
      })}
    </div>
  );
}

export function Today() {
  const { t, n, sura, pages, lang } = useT();
  const S = prefs.use((s) => s);
  const P = dayPlan(S);
  const pct = Math.round((100 * P.known) / PAGES);
  const date = new Date().toLocaleDateString(lang === "ar" ? "ar-MA" : lang, { weekday: "long", day: "numeric", month: "long" });
  const newLabel = pageParts(P.newPage).map((x) => `${sura(x.s)} ${n(x.from)}–${n(x.to)}`).join(" · ");
  const weekFrom = Math.max(1, P.known - 5);
  const nWeak = Object.keys(S.weak).length;
  const hz = (h: number) => { const [a, b] = hizbPages(h); return b <= P.known ? "bg-accent text-on-accent" : a <= P.known + 1 ? "bg-gold-soft text-gold ring-1 ring-gold" : "bg-surface-2 text-muted"; };

  return (
    <div className="mx-auto max-w-xl px-4 pb-28">
      <h1 className="pt-2 text-[28px] font-bold leading-tight">{date}</h1>
      <p className="text-[14px] text-muted">{t("memorizedRange", { n: P.known, j: n((P.known / 20).toFixed(1).replace(".0", "")) })}</p>

      <Card className="mt-4">
        <div className="grid grid-cols-3 text-center">
          {[[n(P.known), t("pagesKnown")], [t("percent", { n: pct }), t("ofMushaf")], [n(streak(S)), t("dayStreak")]].map(([v, l]) => (
            <div key={l}><b className="block text-[22px] tabular-nums">{v}</b><span className="text-[12px] text-muted">{l}</span></div>
          ))}
        </div>
        <div className="mt-3"><Bar value={P.known / PAGES} /></div>
      </Card>

      {!S.confirmed && <ConfirmPage page={P.newPage} />}

      <SectionTitle>{P.restDay ? t("restDay") : t("tasksToday")}</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {P.restDay ? (
          <Task id="week" title={t("taskWeek")} meta={t("taskWeekMeta", { pages: pages(range(weekFrom, P.known)) })}>
            <Button small onClick={() => openReader({ page: weekFrom }, "hide")}>{t("reciteHidden")}</Button>
            <Button small onClick={() => openReader({ page: weekFrom }, "recite")}><Icon name="mic" className="size-4" />{t("reciteMic")}</Button>
            <Button small onClick={() => startPractice({ quiz: { kind: "pages", a: weekFrom, b: P.known }, mode: "full" })}>{t("modeFull")}</Button>
          </Task>
        ) : (
          <Task id="new" title={t("taskNew", { n: P.newPage })} meta={newLabel}>
            <div className="flex w-full gap-6"><Counter k="reads" label={t("reads")} /><Counter k="recites" label={t("recites")} /></div>
            <Button small onClick={() => openReader({ page: P.newPage })}><Icon name="book" className="size-4" />{t("read")}</Button>
            <Button small onClick={() => openReader({ page: P.newPage }, "hide")}><Icon name="eye" className="size-4" />{t("reciteHidden")}</Button>
            <Button small onClick={() => openReader({ page: P.newPage }, "recite")}><Icon name="mic" className="size-4" />{t("reciteMic")}</Button>
          </Task>
        )}
        {P.known >= 1 && (
          <Task id="recent" title={t("taskRecent")} meta={t("taskRecentMeta", { pages: pages(range(P.recent[0], P.recent[1])) })}>
            <Button small onClick={() => openReader({ page: P.recent[0] }, "hide")}>{t("reciteHidden")}</Button>
          </Task>
        )}
        {P.old && (
          <Task id="old" title={t("taskOld")} meta={t("taskOldMeta", { pages: pages(P.old) })}>
            <Button small onClick={() => openReader({ page: P.old![0] }, "hide")}>{t("reciteHidden")}</Button>
          </Task>
        )}
        {P.known >= 1 && (
          <Task id="quiz" title={t("taskQuiz")} meta={P.restDay ? t("taskQuizRest") : t("taskQuizMeta", { n: P.known })}>
            <Button small tone="primary" onClick={() => startPractice(P.restDay ? { mut: shuffle(occurrences((v) => pageOfVerse(v) <= P.known)).slice(0, 15) } : { quiz: { kind: "pages", a: P.known, b: P.known }, mode: "mix" })}>{t("start")}</Button>
          </Task>
        )}
      </div>

      {nWeak > 0 && (
        <Card className="mt-3 flex items-center justify-between gap-3">
          <div><div className="font-semibold">{t("weakTitle", { n: nWeak })}</div><div className="text-[13px] text-muted">{t("weakMeta")}</div></div>
          <Button small tone="primary" onClick={() => startPractice({ quiz: { kind: "weak" }, mode: "mix" })}>{t("test")}</Button>
        </Card>
      )}
      <p className="mt-4 border-s-2 border-gold ps-3 text-[13px] text-muted">{t("tip")}</p>

      <SectionTitle>{t("hizbMap")}</SectionTitle>
      <Card>
        <div className="grid grid-cols-10 gap-1">
          {range(1, HIZBS).map((h) => (
            <button key={h} onClick={() => openReader({ page: hizbPages(h)[0] })} className={`grid aspect-square place-items-center rounded-md text-[10.5px] tabular-nums ${hz(h)}`}>{n(h)}</button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted">{t("hizbLegend")}</p>
      </Card>

      <SectionTitle>{t("last4Weeks")}</SectionTitle>
      <Card><Calendar /></Card>
    </div>
  );
}
