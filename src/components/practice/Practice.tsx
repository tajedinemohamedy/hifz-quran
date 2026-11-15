"use client";
/* Practice: three ready-to-go sessions. Custom ranges and phrase browsing wait in their own sheets. */
import { useState, type ReactNode } from "react";
import { ChevronRight, Layers, ListChecks, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { prefs } from "@/lib/prefs";
import { dayPlan } from "@/lib/plan";
import { pageOfVerse, range as rangeOf } from "@/lib/quran";
import { occurrences } from "@/lib/mut";
import { shuffle } from "@/lib/quiz";
import { startPractice } from "@/lib/practice";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "../kit";
import { RangeSheet } from "./RangeSheet";
import { BrowseSheet } from "./BrowseSheet";

function Pick({ icon: Icon, title, meta, start, disabled, more }: { icon: typeof Layers; title: string; meta: ReactNode; start: () => void; disabled?: boolean; more?: ReactNode }) {
  const { t } = useT();
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <b className="block text-[16px]">{title}</b>
          <span className="text-[13px] text-muted-foreground">{meta}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button className="flex-1 rounded-xl" disabled={disabled} onClick={start}>{t("start")}</Button>
        {more}
      </div>
    </Card>
  );
}

export function Practice() {
  const { t, pages } = useT();
  const S = prefs.use((s) => s);
  const [range, setRange] = useState(false);
  const [browse, setBrowse] = useState(false);
  const known = dayPlan(S).known;
  const from = Math.max(1, known - 6), nWeak = Object.keys(S.weak).length;
  const knownPlaces = () => occurrences((v) => pageOfVerse(v) <= Math.max(known, 1));

  return (
    <div className="mx-auto max-w-xl px-4 pb-8">
      <PageTitle title={t("tabPractice")} subtitle={t("practiceHint")} />
      <div className="flex flex-col gap-3">
        <Pick icon={ListChecks} title={t("recentQuiz")} meta={known ? t("recentQuizMeta", { pages: pages(rangeOf(from, known)) }) : t("recentQuizEmpty")}
          disabled={!known} start={() => startPractice({ quiz: { kind: "pages", a: from, b: Math.max(known, 1) }, mode: "mix" })}
          more={<Button variant="secondary" className="rounded-xl" onClick={() => setRange(true)}>{t("chooseRange")}</Button>} />
        <Pick icon={RotateCcw} title={t("myMistakes")} meta={nWeak ? t("weakCount", { n: nWeak }) : t("weakEmpty")}
          disabled={!nWeak} start={() => startPractice({ quiz: { kind: "weak" }, mode: "mix" })} />
        <Pick icon={Layers} title={t("mutTab")} meta={t("mutMeta")} start={() => startPractice({ mut: shuffle(knownPlaces()).slice(0, 15) })}
          more={<Button variant="secondary" className="rounded-xl" onClick={() => setBrowse(true)}>{t("browse")}<ChevronRight className="rtl:-scale-x-100" /></Button>} />
      </div>
      <RangeSheet open={range} onOpenChange={setRange} />
      <BrowseSheet open={browse} onOpenChange={setBrowse} />
    </div>
  );
}
