"use client";
/* A quiz on any range: a hizb (optionally one thumn) or pages, then full mastery or 20 random questions. */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { prefs } from "@/lib/prefs";
import { dayPlan } from "@/lib/plan";
import { HIZBS, PAGES, hizbPages, pageParts, quran, range, thumnsOfHizb } from "@/lib/quran";
import type { QuizMode, Scope } from "@/lib/quiz";
import { startPractice } from "@/lib/practice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented, Sheet } from "../kit";

const Pick = ({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; sub?: React.ReactNode }) => (
  <button aria-pressed={on} onClick={onClick}
    className={cn("rounded-xl px-1 py-2 text-center text-[13px] transition-all duration-200", on ? "bg-accent font-semibold text-accent-foreground ring-1 ring-primary" : "bg-card")}>
    {children}{sub != null && <small className="block text-[10.5px] font-normal text-muted-foreground">{sub}</small>}
  </button>
);

export function RangeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, n, sura, thumnNo } = useT();
  const known = dayPlan(prefs.use((s) => s)).known;
  const best = prefs.use((s) => s.best);
  const [kind, setKind] = useState<"hizb" | "pages">("hizb");
  const [h, setH] = useState(1), [k, setK] = useState(0);
  const [a, setA] = useState(Math.max(1, known - 6)), [b, setB] = useState(Math.max(1, known));
  const clamp = (x: number) => Math.min(PAGES, Math.max(1, x || 1));
  const scope: Scope = kind === "hizb" ? { kind, h, k } : { kind, a, b: Math.max(a, b) };
  const go = (mode: QuizMode) => { onOpenChange(false); startPractice({ quiz: scope, mode }); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("chooseRange")} tall>
      <Segmented value={kind} onChange={setKind} options={[["hizb", t("byHizb")], ["pages", t("byPages")]]} />
      {kind === "hizb" ? (
        <>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
            {range(1, HIZBS).map((x) => {
              const [pa, pb] = hizbPages(x);
              return <Pick key={x} on={x === h} onClick={() => { setH(x); setK(0); }} sub={best["h" + x] != null ? t("percent", { n: best["h" + x] }) : t("pagesRange", { a: pa, b: pb })}>{n(x)}</Pick>;
            })}
          </div>
          <p className="mb-2 mt-5 px-1 text-[13px] font-semibold text-muted-foreground">{t("thumnOptional")}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
            <Pick on={!k} onClick={() => setK(0)}>{t("wholeHizb")}</Pick>
            {thumnsOfHizb(h).map((th) => (
              <Pick key={th.k} on={k === th.k} onClick={() => setK(th.k)} sub={`${sura(quran().V[th.r[0]][0])} ${n(quran().V[th.r[0]][1])}`}>{thumnNo(th.h, th.k)}{th.inf ? " ≈" : ""}</Pick>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-[14px]">
            <label htmlFor="qa">{t("fromPage")}</label>
            <Input id="qa" type="number" inputMode="numeric" value={a} onChange={(e) => setA(clamp(+e.target.value))} className="h-11 w-20 bg-card text-center tabular-nums" />
            <label htmlFor="qb">{t("toPage")}</label>
            <Input id="qb" type="number" inputMode="numeric" value={b} onChange={(e) => setB(clamp(+e.target.value))} className="h-11 w-20 bg-card text-center tabular-nums" />
          </div>
          <p className="text-[12px] text-muted-foreground">{[...pageParts(a), ...(b > a ? pageParts(b) : [])].map((x) => `${sura(x.s)} ${n(x.from)}`).join(" … ")}</p>
        </div>
      )}
      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-2 bg-background px-4 pt-2">
        <Button size="lg" className="h-12 rounded-xl" onClick={() => go("mix")}>{t("modeMix")}</Button>
        <Button size="lg" variant="secondary" className="h-12 rounded-xl" onClick={() => go("full")}>{t("modeFull")}</Button>
      </div>
    </Sheet>
  );
}
