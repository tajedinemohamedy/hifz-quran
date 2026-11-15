"use client";
/* A mutashabihat round: the verse up to the shared phrase, choose what follows here. */
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { buildRound, type MutRound, type Occurrence } from "@/lib/mut";
import { sameSura, quran, words } from "@/lib/quran";
import { updatePrefs } from "@/lib/prefs";
import { dayPlan, markToday } from "@/lib/plan";
import { endPractice, startPractice } from "@/lib/practice";
import { goTab } from "@/lib/ui";
import { shuffle } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { Choice, Session, Verdict } from "../kit";
import { GroupCard, Occurrence as Place, StarButton } from "../MutGroup";

interface Item { occ: Occurrence; first: boolean }
interface Run { queue: Item[]; cur: { item: Item; round: MutRound } | null; total: number; done: number; ok1: number; streak: number; missed: number[] }

const advance = (r: Run): Run => {
  const [item, ...queue] = r.queue;
  return { ...r, queue, cur: item ? { item, round: buildRound(item.occ) } : null };
};

export function MutRun({ list }: { list: Occurrence[] }) {
  const { t, where } = useT();
  const [run, setRun] = useState<Run>(() => advance({ queue: list.map((occ) => ({ occ, first: true })), cur: null, total: list.length, done: 0, ok1: 0, streak: 0, missed: [] }));
  const [answer, setAnswer] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);

  if (ended || !run.cur) return <MutEnd run={run} list={list} />;
  const { item, round: x } = run.cur;
  const w = words(x.verse), prev = x.verse > 0 && sameSura(x.verse, x.verse - 1) ? words(x.verse - 1) : null;
  const g = quran().G[x.group];

  const choose = (k: number) => {
    const ok = x.opts[k].ok;
    setAnswer(k);
    setRun((r) => ({
      ...r,
      done: r.done + (item.first ? 1 : 0),
      ok1: r.ok1 + (item.first && ok ? 1 : 0),
      streak: ok ? r.streak + 1 : 0,
      missed: ok || r.missed.includes(x.group) ? r.missed : [...r.missed, x.group],
      queue: ok ? r.queue : [...r.queue.slice(0, 3), { occ: item.occ, first: false }, ...r.queue.slice(3)],
    }));
  };

  return (
    <Session onClose={() => setEnded(true)} progress={run.done / run.total}
      label={`${t("ofTotal", { a: run.done, b: run.total })} · ${t("run", { n: run.streak })}${item.first ? "" : " · " + t("repeated")}`}>
      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-muted-foreground">{where(x.verse)}</div>
        <div className="quran rounded-2xl bg-card p-4 text-[23px] leading-[2]" dir="rtl">
          {prev && <div className="text-[19px] text-muted-foreground">{prev.length > 6 ? "… " : ""}{prev.slice(-6).join(" ")}</div>}
          {w.slice(0, x.at).join(" ")} <mark className="rounded bg-warning-soft px-1 text-inherit">{w.slice(x.at, x.at + x.len).join(" ")}</mark> …
        </div>
        <div className="text-[17px] font-semibold">{t("whatFollows")}</div>
        {x.opts.map((o, k) => (
          <Choice key={k} disabled={answer != null} onClick={() => choose(k)} state={answer == null ? undefined : o.ok ? "right" : answer === k ? "wrong" : undefined}>{o.text} …</Choice>
        ))}
        {answer != null && (
          <>
            <Verdict right={x.opts[answer].ok}>{x.opts[answer].ok ? t("correct") : t("wrongBack")}</Verdict>
            <div className="flex items-center justify-between"><span className="text-[13px] text-muted-foreground">{t("allPlaces", { n: g.o.length })}</span><StarButton group={x.group} /></div>
            {g.o.map((o, k) => <Place key={k} o={o} current={k === x.occ} />)}
            <Button size="lg" className="h-12 rounded-xl" onClick={() => { setAnswer(null); setRun(advance); }}>{t("next")}</Button>
          </>
        )}
      </div>
    </Session>
  );
}

function MutEnd({ run, list }: { run: Run; list: Occurrence[] }) {
  const { t } = useT();
  const pct = run.done ? Math.round((100 * run.ok1) / run.done) : 0;
  const complete = run.done === run.total;
  useEffect(() => {
    if (!complete) return;
    if (run.total >= 15) updatePrefs((S) => { S.mutBest = Math.max(S.mutBest || 0, pct); });
    if (dayPlan().restDay) markToday("quiz");
  }, [complete, run.total, pct]);
  return (
    <Session onClose={endPractice} label={t("mutTab")} progress={1}>
      <div className="rounded-3xl bg-card p-6 text-center">
        <div className="text-6xl font-bold tabular-nums">{t("percent", { n: pct })}</div>
        <div className="mt-1 text-[13px] text-muted-foreground">{t("firstTry", { a: run.ok1, b: run.done })}</div>
      </div>
      {run.missed.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 text-[13px] font-semibold text-muted-foreground">{t("missedPhrases")}</h3>
          <div className="flex flex-col gap-2">{run.missed.map((gi) => <GroupCard key={gi} group={gi} open />)}</div>
        </>
      )}
      <div className="mt-5 flex gap-2">
        <Button size="lg" className="h-12 flex-1 rounded-xl" onClick={() => startPractice({ mut: shuffle(list) })}>{t("newRound")}</Button>
        <Button size="lg" variant="secondary" className="h-12 flex-1 rounded-xl" onClick={() => { endPractice(); goTab("today"); }}>{t("home")}</Button>
      </div>
    </Session>
  );
}
