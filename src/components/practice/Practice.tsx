"use client";
/* Practice: the memorization quiz and the mutashabihat, side by side under one segmented control. */
import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { prefs } from "@/lib/prefs";
import { dayPlan } from "@/lib/plan";
import { HIZBS, PAGES, base, hizbPages, pageParts, quran, range, thumnsOfHizb } from "@/lib/quran";
import { inHizbs, occurrenceCount, occurrences } from "@/lib/mut";
import { shuffle, type QuizMode, type Scope } from "@/lib/quiz";
import { startPractice } from "@/lib/practice";
import { Button, Card, SectionTitle, Segmented } from "../ui";
import { GroupCard } from "../MutGroup";

const Pick = ({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; sub?: React.ReactNode }) => (
  <button aria-pressed={on} onClick={onClick} className="rounded-xl bg-surface-2 px-1 py-2 text-center text-[13px] transition-colors aria-pressed:bg-accent-soft aria-pressed:font-semibold aria-pressed:text-accent aria-pressed:ring-1 aria-pressed:ring-accent">
    {children}{sub != null && <small className="block text-[10.5px] font-normal text-muted">{sub}</small>}
  </button>
);
const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid max-h-64 grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5 overflow-y-auto">{children}</div>;

function QuizSetup() {
  const { t, n, sura, thumnNo } = useT();
  const known = dayPlan(prefs.use((s) => s)).known;
  const best = prefs.use((s) => s.best), nWeak = prefs.use((s) => Object.keys(s.weak).length);
  const [kind, setKind] = useState<Scope["kind"]>("hizb");
  const [h, setH] = useState(1), [k, setK] = useState(0);
  const [a, setA] = useState(Math.max(1, known - 6)), [b, setB] = useState(Math.max(1, known));
  const clamp = (x: number) => Math.min(PAGES, Math.max(1, x || 1));
  const scope: Scope = kind === "hizb" ? { kind, h, k } : kind === "pages" ? { kind, a, b: Math.max(a, b) } : { kind };
  const go = (mode: QuizMode) => { if (kind !== "weak" || nWeak) startPractice({ quiz: scope, mode }); };

  return (
    <>
      <p className="text-[14px] text-muted">{t("quizIntro")}</p>
      <SectionTitle>{t("scope")}</SectionTitle>
      <Segmented<Scope["kind"]> value={kind} onChange={setKind} options={[["hizb", t("byHizb")], ["pages", t("byPages")], ["weak", t("myMistakes")]]} />
      <Card className="mt-2">
        {kind === "hizb" && (
          <>
            <Grid>
              {range(1, HIZBS).map((x) => {
                const [pa, pb] = hizbPages(x);
                return <Pick key={x} on={x === h} onClick={() => { setH(x); setK(0); }} sub={`${t("pagesRange", { a: pa, b: pb })}${best["h" + x] != null ? " · " + t("percent", { n: best["h" + x] }) : ""}`}>{n(x)}</Pick>;
              })}
            </Grid>
            <div className="mb-2 mt-4 text-[12px] text-muted">{t("thumnOptional")}</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
              <Pick on={!k} onClick={() => setK(0)}>{t("wholeHizb")}</Pick>
              {thumnsOfHizb(h).map((th) => (
                <Pick key={th.k} on={k === th.k} onClick={() => setK(th.k)} sub={`${sura(quran().V[th.r[0]][0])} ${n(quran().V[th.r[0]][1])}`}>{thumnNo(th.h, th.k)}{th.inf ? " ≈" : ""}</Pick>
              ))}
            </div>
          </>
        )}
        {kind === "pages" && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-[14px]">
              <label htmlFor="qa">{t("fromPage")}</label>
              <input id="qa" type="number" min={1} max={PAGES} value={a} onChange={(e) => setA(clamp(+e.target.value))} className="h-10 w-20 rounded-xl bg-surface-2 text-center tabular-nums outline-none" />
              <label htmlFor="qb">{t("toPage")}</label>
              <input id="qb" type="number" min={1} max={PAGES} value={b} onChange={(e) => setB(clamp(+e.target.value))} className="h-10 w-20 rounded-xl bg-surface-2 text-center tabular-nums outline-none" />
            </div>
            <p className="mt-2 text-[12px] text-muted">{[...pageParts(a), ...(b > a ? pageParts(Math.max(a, b)) : [])].map((x) => `${sura(x.s)} ${n(x.from)}`).join(" … ")}</p>
          </>
        )}
        {kind === "weak" && <p className="text-[14px]">{nWeak ? t("weakCount", { n: nWeak }) : <span className="text-muted">{t("weakEmpty")}</span>}</p>}
      </Card>
      <SectionTitle>{t("quizType")}</SectionTitle>
      <div className="flex flex-col gap-2">
        {(["full", "mix"] as const).map((m) => (
          <button key={m} onClick={() => go(m)} disabled={kind === "weak" && !nWeak} className="rounded-2xl bg-surface p-4 text-start active:bg-surface-2 disabled:opacity-40">
            <b className="text-[16px]">{m === "full" ? t("modeFull") : t("modeMix")}</b>
            <div className="text-[13px] text-muted">{m === "full" ? t("modeFullMeta") : t("modeMixMeta")}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function MutSetup() {
  const { t } = useT();
  const S = prefs.use((s) => s);
  const known = dayPlan(S).known;
  const knownHizbs = useMemo(() => range(1, HIZBS).filter((x) => hizbPages(x)[1] <= known), [known]);
  const [seg, setSeg] = useState<"play" | "browse" | "stars">("play");
  const [sel, setSel] = useState<number[] | null>(null);
  const [q, setQ] = useState(""), [more, setMore] = useState(false);
  const chosen = new Set(sel ?? knownHizbs);
  const count = useMemo(() => occurrences(inHizbs(chosen)).length, [sel, knownHizbs]); // eslint-disable-line react-hooks/exhaustive-deps
  const G = quran().G;
  const list = useMemo(() => {
    let l = G.map((_, gi) => gi);
    if (seg === "stars") l = l.filter((gi) => S.stars.includes(gi));
    const k = base(q.trim());
    if (k) l = l.filter((gi) => G[gi].p.includes(k));
    return l;
  }, [G, seg, S.stars, q]);

  return (
    <>
      <p className="text-[14px] text-muted">{t("mutIntro", { g: G.length, o: occurrenceCount() })}</p>
      <Segmented className="mt-3" value={seg} onChange={setSeg} options={[["play", t("play")], ["browse", t("browse")], ["stars", t("starred", { n: S.stars.length })]]} />
      {seg === "play" ? (
        <>
          <SectionTitle>{t("hizbs")}</SectionTitle>
          <div className="mb-2 flex gap-2">
            <Button small onClick={() => setSel(null)}>{t("known")}</Button>
            <Button small onClick={() => setSel(range(1, HIZBS))}>{t("all")}</Button>
            <Button small onClick={() => setSel([])}>{t("none")}</Button>
          </div>
          <Card>
            <Grid>
              {range(1, HIZBS).map((x) => (
                <Pick key={x} on={chosen.has(x)} onClick={() => setSel(chosen.has(x) ? [...chosen].filter((y) => y !== x) : [...chosen, x])}
                  sub={hizbPages(x)[1] > known ? t("notDone") : undefined}>{t("hizb", { n: x })}</Pick>
              ))}
            </Grid>
            <p className="mt-3 text-[12px] text-muted">{t("selected", { n: count })}</p>
          </Card>
          <div className="mt-3 flex flex-wrap gap-2">
            {[15, 30].map((size, i) => (
              <Button key={size} tone={i ? "plain" : "primary"} disabled={!count} onClick={() => startPractice({ mut: shuffle(occurrences(inHizbs(chosen))).slice(0, size) })}>{t("round", { n: size })}</Button>
            ))}
            {S.stars.length > 0 && <Button onClick={() => startPractice({ mut: shuffle(occurrences((_, gi) => S.stars.includes(gi))) })}>{t("starredOnly")}</Button>}
          </div>
          {S.mutBest != null && <p className="mt-2 text-[13px] text-muted">{t("best", { n: S.mutBest })}</p>}
        </>
      ) : (
        <>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("mutSearch")} aria-label={t("search")}
            className="mt-3 h-11 w-full rounded-xl bg-surface px-3 text-[16px] outline-none placeholder:text-muted" />
          <p className="mx-1 my-2 text-[12px] text-muted">{t("phrases", { n: list.length })}</p>
          <div className="flex flex-col gap-2">{list.slice(0, more ? 400 : 40).map((gi) => <GroupCard key={gi} group={gi} />)}</div>
          {list.length > 40 && !more && <Button className="mt-3" onClick={() => setMore(true)}>{t("showAll")}</Button>}
        </>
      )}
    </>
  );
}

export function Practice() {
  const { t } = useT();
  const [tab, setTab] = useState<"quiz" | "mut">("quiz");
  return (
    <div className="mx-auto max-w-xl px-4 pb-28">
      <h1 className="pt-2 text-[28px] font-bold">{t("tabPractice")}</h1>
      <Segmented className="my-3" value={tab} onChange={setTab} options={[["quiz", t("quiz")], ["mut", t("mutTab")]]} />
      {tab === "quiz" ? <QuizSetup /> : <MutSetup />}
    </div>
  );
}
