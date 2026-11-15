"use client";
/* A quiz session: missed questions return three questions later until answered right. */
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { buildQuiz, type Question, type QuizMode, type Scope } from "@/lib/quiz";
import { prefs, updatePrefs, todayISO } from "@/lib/prefs";
import { dayPlan, markToday } from "@/lib/plan";
import { verseText, words, quran } from "@/lib/quran";
import { endPractice, startPractice } from "@/lib/practice";
import { goTab } from "@/lib/ui";
import { Button, Feedback, Option, Session } from "../ui";

interface Item { make: () => Question | null; first: boolean }
interface Run { queue: Item[]; cur: { item: Item; q: Question } | null; total: number; done: number; ok1: number; missed: number[]; finished: boolean }

/** Moves to the next question that can be built (impossible ones count as done). */
function advance(r: Run): Run {
  let { queue, done } = r;
  while (queue.length) {
    const [item, ...rest] = queue;
    queue = rest;
    const q = item.make();
    if (q) return { ...r, queue, done, cur: { item, q } };
    if (item.first) done++;
  }
  return { ...r, queue, done, cur: null, finished: true };
}

const VerseCard = ({ verse }: { verse: number }) => {
  const { where } = useT();
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="text-[12px] text-muted">{where(verse, true)}</div>
      <div className="quran text-[22px] leading-[1.95]" dir="rtl">{verseText(verse)}</div>
    </div>
  );
};

export function QuizRun({ scope, mode }: { scope: Scope; mode: QuizMode }) {
  const { t, n, thumnNo } = useT();
  const [run, setRun] = useState<Run>(() => {
    const queue = buildQuiz(scope, mode, prefs.get()).map((make) => ({ make, first: true }));
    return advance({ queue, cur: null, total: queue.length, done: 0, ok1: 0, missed: [], finished: false });
  });
  const [answer, setAnswer] = useState<number | "revealed" | null>(null);

  const label = scope.kind === "hizb" ? t("hizb", { n: scope.h }) + (scope.k ? " · " + t("thumn", { n: thumnNo(scope.h, scope.k) }) : "")
    : scope.kind === "pages" ? (scope.a === scope.b ? t("pageOne", { a: scope.a }) : t("pagesRange", { a: scope.a, b: scope.b })) : t("myMistakes");

  const result = (ok: boolean) => {
    const { item, q } = run.cur!;
    setRun((r) => ({
      ...r,
      done: r.done + (item.first ? 1 : 0),
      ok1: r.ok1 + (item.first && ok ? 1 : 0),
      missed: ok || r.missed.includes(q.verse) ? r.missed : [...r.missed, q.verse],
      queue: ok ? r.queue : [...r.queue.slice(0, 3), { make: item.make, first: false }, ...r.queue.slice(3)],
    }));
    updatePrefs((S) => {
      if (!ok) S.weak[q.verse] = 1;
      else if (scope.kind === "weak" && S.weak[q.verse]) { S.weak[q.verse]++; if (S.weak[q.verse] > 2) delete S.weak[q.verse]; }
    });
  };
  const next = () => { setAnswer(null); setRun(advance); };

  if (run.finished || !run.cur) return <QuizEnd run={run} label={label} scope={scope} mode={mode} />;
  const { q, item } = run.cur;
  const head = `${label} · ${t("ofTotal", { a: run.done, b: run.total })}${item.first ? "" : " · " + t("repeated")}`;

  return (
    <Session onEnd={() => setRun((r) => ({ ...r, finished: true }))} endLabel={t("end")} label={head} progress={run.done / Math.max(1, run.total)}>
      <div className="flex flex-col gap-3">
        {q.type === "mc" ? (
          <>
            <div className="text-[17px] font-semibold">
              {q.ask === "next" ? t("askNext") : q.ask === "prev" ? t("askPrev") : q.ask === "blank" ? t("askBlank") : t("askThumn", { h: q.h!, k: thumnNo(q.h!, q.k!) })}
            </div>
            {q.ask !== "thumn" && (
              <div className="quran rounded-2xl bg-surface p-4 text-[23px] leading-[2]" dir="rtl">
                {words(q.verse).map((w, k) => (k === q.blank ? <span key={k} className="mx-1 inline-block w-16 border-b-2 border-dashed border-accent">&nbsp;</span> : <span key={k}>{w} </span>))}
                <span className="font-sans text-[13px] text-accent">({n(quran().V[q.verse][1])})</span>
              </div>
            )}
            {q.opts.map((o, k) => (
              <Option key={k} disabled={answer != null} onClick={() => { setAnswer(k); result(o.ok); }}
                state={answer == null ? undefined : o.ok ? "ok" : answer === k ? "no" : undefined}>{o.text}</Option>
            ))}
            {typeof answer === "number" && (
              <>
                <Feedback ok={q.opts[answer].ok}>{q.opts[answer].ok ? t("correct") : t("wrongBack")}</Feedback>
                <VerseCard verse={q.reveal} />
                <Button tone="primary" onClick={next} autoFocus>{t("next")}</Button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="text-[17px] font-semibold">{t("askFinish")}</div>
            <div className="quran rounded-2xl bg-surface p-4 text-[23px] leading-[2]" dir="rtl">
              {words(q.verse).slice(0, q.cut).join(" ")}{" "}
              <span className={answer === "revealed" ? "text-accent" : "text-muted"}>{answer === "revealed" ? words(q.verse).slice(q.cut).join(" ") : "…"}</span>
            </div>
            {answer == null ? (
              <Button tone="primary" onClick={() => setAnswer("revealed")}>{t("reveal")}</Button>
            ) : (
              <>
                <p className="text-[13px] text-muted">{t("honest")}</p>
                <div className="flex gap-2">
                  <Button tone="primary" className="flex-1" onClick={() => { result(true); next(); }}>{t("gotIt")}</Button>
                  <Button className="flex-1" onClick={() => { result(false); next(); }}>{t("missedIt")}</Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Session>
  );
}

function QuizEnd({ run, label, scope, mode }: { run: Run; label: string; scope: Scope; mode: QuizMode }) {
  const { t } = useT();
  const pct = run.done ? Math.round((100 * run.ok1) / run.done) : 0;
  const complete = run.done === run.total && run.total > 0;
  useEffect(() => {
    if (!complete) return;
    if (scope.kind === "hizb" && !scope.k && mode === "full") updatePrefs((S) => { S.best["h" + scope.h] = Math.max(S.best["h" + scope.h] || 0, pct); });
    if (scope.kind === "pages" && scope.b === dayPlan().known && !prefs.get().log[todayISO()]?.quiz) markToday("quiz");
  }, [complete, scope, mode, pct]);
  return (
    <Session onEnd={endPractice} endLabel={t("close")} label={label} progress={1}>
      <div className="rounded-3xl bg-surface p-6 text-center">
        <div className="text-6xl font-bold tabular-nums">{t("percent", { n: pct })}</div>
        <div className="mt-1 text-[13px] text-muted">{t("firstTry", { a: run.ok1, b: run.done })}</div>
        <p className="mt-3">{pct >= 90 ? t("scoreGreat") : pct >= 80 ? t("scoreGood") : t("scoreLow")}</p>
      </div>
      {run.missed.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 text-[13px] font-semibold text-muted">{t("toReview", { n: run.missed.length })}</h3>
          <div className="flex flex-col gap-2">{[...run.missed].sort((a, b) => a - b).map((v) => <VerseCard key={v} verse={v} />)}</div>
        </>
      )}
      <div className="mt-5 flex gap-2">
        <Button tone="primary" onClick={() => startPractice({ quiz: scope, mode })}>{t("again")}</Button>
        <Button onClick={() => { endPractice(); goTab("today"); }}>{t("home")}</Button>
      </div>
    </Session>
  );
}
