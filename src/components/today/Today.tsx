"use client";
/* Today: how far you are, and the day's few tasks, each with one action. */
import { useState, type ReactNode } from "react";
import { Check, ChevronRight, Flame, Minus, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type Key } from "@/lib/i18n";
import { prefs, todayISO, type TaskId } from "@/lib/prefs";
import { bumpCounter, dayPlan, streak, toggleTask } from "@/lib/plan";
import { PAGES, pageOfVerse, pageParts, range } from "@/lib/quran";
import { openReader, ui, type ReaderMode } from "@/lib/ui";
import { startPractice } from "@/lib/practice";
import { occurrences } from "@/lib/mut";
import { shuffle } from "@/lib/quiz";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, PageTitle, Section } from "../kit";
import { ProgressSheet } from "./ProgressSheet";

function Task({ id, title, meta, action, onAction, children }: { id: TaskId; title: string; meta: ReactNode; action: string; onAction: () => void; children?: ReactNode }) {
  const done = prefs.use((s) => !!s.log[todayISO()]?.[id]);
  const toggle = () => { if (!done) notify.success("taskDone", { task: title }, "task"); toggleTask(id); };
  return (
    <Card className={cn("flex gap-3 transition-opacity duration-300", done && "opacity-55")}>
      <button onClick={toggle} aria-pressed={done} aria-label={title}
        className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-all duration-300", done ? "scale-100 border-primary bg-primary text-primary-foreground" : "border-input")}>
        <Check className={cn("size-4 transition-transform duration-300", done ? "scale-100" : "scale-0")} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold">{title}</div>
        <div className="text-[13px] text-muted-foreground">{meta}</div>
        {children}
      </div>
      <Button variant="secondary" size="sm" className="self-center rounded-full" onClick={onAction}>
        {action}<ChevronRight className="rtl:-scale-x-100" />
      </Button>
    </Card>
  );
}

function Counter({ k, label }: { k: "reads" | "recites"; label: Key }) {
  const { t, n } = useT();
  const v = prefs.use((s) => s.log[todayISO()]?.[k] || 0);
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pe-0.5 ps-3 text-[12px]">
      <span className="text-muted-foreground">{t(label)}</span>
      <b className="min-w-4 text-center tabular-nums">{n(v)}</b>
      <button aria-label="−" onClick={() => bumpCounter(k, -1)} className="grid size-6 place-items-center rounded-full bg-background active:scale-90"><Minus className="size-3" /></button>
      <button aria-label="+" onClick={() => bumpCounter(k, 1)} className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground active:scale-90"><Plus className="size-3" /></button>
    </div>
  );
}

export function Today() {
  const { t, n, sura, pages, lang } = useT();
  const S = prefs.use((s) => s);
  const [progressOpen, setProgressOpen] = useState(false);
  const P = dayPlan(S);
  const date = new Date().toLocaleDateString(lang === "ar" ? "ar-MA" : lang, { weekday: "long", day: "numeric", month: "long" });
  const days = streak(S);
  const open = (page: number, mode: ReaderMode = "read") => () => openReader({ page }, mode);
  const weekFrom = Math.max(1, P.known - 5);

  return (
    <div className="mx-auto max-w-xl px-4 pb-8">
      <PageTitle subtitle={date} title={t("tabToday")}
        end={<Button variant="ghost" size="icon" className="rounded-full" aria-label={t("settings")} onClick={() => ui.set({ overlay: "settings" })}><Settings className="size-5" /></Button>} />

      <button onClick={() => setProgressOpen(true)} className="block w-full text-start transition-transform active:scale-[0.99]">
        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <b className="text-[34px] font-bold leading-none tabular-nums">{n(P.known)}</b>
              <span className="ms-1.5 text-[13px] text-muted-foreground">{t("pagesOf", { n: PAGES })}</span>
            </div>
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", days ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}>
              <Flame className="size-3.5" />{days ? t("streak", { n: days }) : t("streakStart")}
            </span>
          </div>
          <Progress className="mt-3" value={(100 * P.known) / PAGES} />
          <div className="mt-2 flex justify-between text-[12px] text-muted-foreground">
            <span>{t("juzApprox", { j: n((P.known / 20).toFixed(1).replace(".0", "")) })}</span>
            <span className="flex items-center gap-0.5">{t("seeProgress")}<ChevronRight className="size-3.5 rtl:-scale-x-100" /></span>
          </div>
        </Card>
      </button>

      <Section title={P.restDay ? t("restDay") : t("tasksToday")}>
        <div className="flex flex-col gap-2.5">
          {P.restDay ? (
            <Task id="week" title={t("taskWeek")} meta={pages(range(weekFrom, P.known))} action={t("open")} onAction={open(weekFrom, "memorize")} />
          ) : (
            <Task id="new" title={t("taskNew", { n: P.newPage })} meta={pageParts(P.newPage).map((x) => `${sura(x.s)} ${n(x.from)}–${n(x.to)}`).join(" · ")} action={t("open")} onAction={open(P.newPage)}>
              <div className="mt-2.5 flex flex-wrap gap-2"><Counter k="reads" label="reads" /><Counter k="recites" label="recites" /></div>
            </Task>
          )}
          {P.known >= 1 && <Task id="recent" title={t("taskRecent")} meta={pages(range(P.recent[0], P.recent[1]))} action={t("open")} onAction={open(P.recent[0], "memorize")} />}
          {P.old && <Task id="old" title={t("taskOld")} meta={pages(P.old)} action={t("open")} onAction={open(P.old[0], "memorize")} />}
          {P.known >= 1 && (
            <Task id="quiz" title={t("taskQuiz")} meta={P.restDay ? t("taskQuizRest") : t("taskQuizMeta", { n: P.known })} action={t("start")}
              onAction={() => startPractice(P.restDay ? { mut: shuffle(occurrences((v) => pageOfVerse(v) <= P.known)).slice(0, 15) } : { quiz: { kind: "pages", a: P.known, b: P.known }, mode: "mix" })} />
          )}
        </div>
      </Section>

      <ProgressSheet open={progressOpen} onOpenChange={setProgressOpen} />
    </div>
  );
}
