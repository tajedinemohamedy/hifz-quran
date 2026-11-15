"use client";
/* The detail behind the progress card: the 60 hizbs, the last four weeks, and full-mastery scores. */
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { prefs, todayISO } from "@/lib/prefs";
import { dayDone, dayPlan, streak } from "@/lib/plan";
import { HIZBS, PAGES, hizbPages, range } from "@/lib/quran";
import { openReader } from "@/lib/ui";
import { Card, Section, Sheet } from "../kit";

export function ProgressSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, n } = useT();
  const S = prefs.use((s) => s);
  const known = dayPlan(S).known;
  const d = new Date(); d.setDate(d.getDate() - 27);
  const days = range(0, 27).map(() => { const iso = todayISO(d), day = d.getDate(); d.setDate(d.getDate() + 1); return { iso, day }; });
  const hizbState = (h: number) => { const [a, b] = hizbPages(h); return b <= known ? "bg-primary text-primary-foreground" : a <= known + 1 ? "bg-warning-soft text-warning ring-1 ring-warning" : "bg-muted text-muted-foreground"; };
  const scores = range(1, HIZBS).filter((h) => S.best["h" + h] != null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("progress")} tall>
      <Card className="grid grid-cols-3 text-center">
        {[[n(known), t("pagesKnown")], [t("percent", { n: Math.round((100 * known) / PAGES) }), t("ofMushaf")], [n(streak(S)), t("dayStreak")]].map(([v, l]) => (
          <div key={l}><b className="block text-[22px] tabular-nums">{v}</b><span className="text-[12px] text-muted-foreground">{l}</span></div>
        ))}
      </Card>

      <Section title={t("hizbMap")}>
        <Card>
          <div className="grid grid-cols-10 gap-1">
            {range(1, HIZBS).map((h) => (
              <button key={h} onClick={() => { onOpenChange(false); openReader({ page: hizbPages(h)[0] }); }}
                className={cn("grid aspect-square place-items-center rounded-md text-[10.5px] tabular-nums transition-transform active:scale-90", hizbState(h))}>{n(h)}</button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">{t("hizbLegend")}</p>
        </Card>
      </Section>

      <Section title={t("last4Weeks")}>
        <Card className="grid grid-cols-7 gap-1.5">
          {days.map(({ iso, day }) => {
            const L = S.log[iso] || {}, some = (["new", "recent", "old", "quiz", "week"] as const).some((x) => L[x]);
            return (
              <div key={iso} title={iso} className={cn("grid aspect-square place-items-center rounded-lg text-[11px] tabular-nums",
                dayDone(S, iso) ? "bg-primary text-primary-foreground" : some ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground", iso === todayISO() && "ring-2 ring-warning")}>
                {n(day)}
              </div>
            );
          })}
        </Card>
      </Section>

      {scores.length > 0 && (
        <Section title={t("masteryScores")}>
          <Card className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
            {scores.map((h) => (
              <div key={h} className="rounded-xl bg-muted py-2 text-center text-[12px]">{t("hizb", { n: h })}<b className="block tabular-nums">{t("percent", { n: S.best["h" + h] })}</b></div>
            ))}
          </Card>
        </Section>
      )}
    </Sheet>
  );
}
