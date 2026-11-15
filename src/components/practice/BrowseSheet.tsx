"use client";
/* All similar phrases, searchable, with your starred ones a tap away. */
import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n";
import { prefs } from "@/lib/prefs";
import { base, quran } from "@/lib/quran";
import { occurrenceCount, occurrences } from "@/lib/mut";
import { shuffle } from "@/lib/quiz";
import { startPractice } from "@/lib/practice";
import { Button } from "@/components/ui/button";
import { Segmented, Sheet } from "../kit";
import { GroupCard } from "../MutGroup";

const PAGE = 40;

export function BrowseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useT();
  const stars = prefs.use((s) => s.stars);
  const [view, setView] = useState<"all" | "stars">("all");
  const [q, setQ] = useState(""), [shown, setShown] = useState(PAGE);
  const dq = useDeferredValue(q);
  const G = quran().G;
  const list = useMemo(() => {
    const k = base(dq.trim());
    return G.map((_, gi) => gi).filter((gi) => (view === "all" || stars.includes(gi)) && (!k || G[gi].p.includes(k)));
  }, [G, view, stars, dq]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("mutTab")} description={t("mutIntro", { g: G.length, o: occurrenceCount() })} tall>
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-background px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder={t("mutSearch")} aria-label={t("search")}
            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground" />
        </div>
        <Segmented value={view} onChange={(v) => { setView(v); setShown(PAGE); }} options={[["all", t("phrases", { n: G.length })], ["stars", t("starred", { n: stars.length })]]} />
      </div>
      {view === "stars" && stars.length > 0 && (
        <Button className="mb-3 w-full rounded-xl" onClick={() => { onOpenChange(false); startPractice({ mut: shuffle(occurrences((_, gi) => stars.includes(gi))) }); }}>{t("practiceStarred")}</Button>
      )}
      <div className="flex flex-col gap-2">{list.slice(0, shown).map((gi) => <GroupCard key={gi} group={gi} />)}</div>
      {!list.length && <p className="py-12 text-center text-[14px] text-muted-foreground">{view === "stars" ? t("noStars") : t("noResults")}</p>}
      {list.length > shown && <Button variant="secondary" className="mt-3 w-full rounded-xl" onClick={() => setShown(shown + PAGE)}>{t("showMore")}</Button>}
    </Sheet>
  );
}
