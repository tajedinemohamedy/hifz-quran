"use client";
/* First launch: one screen, two questions — the language, and where you are in your memorization. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { prefs, updatePrefs, type Lang } from "@/lib/prefs";
import { setNextPage } from "@/lib/plan";
import { PAGES, pageParts } from "@/lib/quran";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "./kit";

export function Onboarding() {
  const { t, n, sura } = useT();
  const lang = prefs.use((s) => s.lang);
  const [started, setStarted] = useState<"new" | "some">("new");
  const [last, setLast] = useState(10);
  const lastPage = Math.min(PAGES - 1, Math.max(1, last));

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+2.5rem)] duration-500 animate-in fade-in">
      <div className="grid size-16 place-items-center rounded-[20px] bg-primary text-primary-foreground shadow-lg"><BookOpen className="size-8" /></div>
      <h1 className="mt-6 text-[30px] font-bold leading-tight">{t("welcome")}</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">{t("welcomeHint")}</p>

      <div className="mt-8 space-y-6">
        <Segmented<Lang> value={lang} onChange={(l) => updatePrefs((d) => { d.lang = l; })} options={[["ar", "العربية"], ["fr", "Français"], ["en", "English"]]} />

        <div>
          <p className="mb-2 text-[15px] font-semibold">{t("whereAreYou")}</p>
          <div className="space-y-2">
            {(["new", "some"] as const).map((v) => (
              <button key={v} onClick={() => setStarted(v)} aria-pressed={started === v}
                className={cn("w-full rounded-2xl bg-card p-4 text-start ring-2 transition-all duration-200", started === v ? "ring-primary" : "ring-transparent")}>
                <b className="block text-[15px]">{v === "new" ? t("startFresh") : t("startSome")}</b>
                <span className="text-[13px] text-muted-foreground">{v === "new" ? t("startFreshHint") : t("startSomeHint")}</span>
              </button>
            ))}
          </div>
          <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", started === "some" ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="min-h-0 overflow-hidden">
              <div className="flex items-center gap-3 pt-3">
                <Input type="number" inputMode="numeric" min={1} max={PAGES - 1} value={last} onChange={(e) => setLast(+e.target.value)} aria-label={t("lastPage")}
                  className="h-12 w-24 rounded-xl bg-card text-center text-[18px] font-semibold tabular-nums" />
                <p className="min-w-0 text-[13px] text-muted-foreground">
                  {t("lastPage")}<br />{pageParts(lastPage).map((x) => `${sura(x.s)} ${n(x.to)}`).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button size="lg" className="mt-auto h-12 rounded-2xl text-[16px]" onClick={() => setNextPage(started === "new" ? 2 : lastPage + 1)}>{t("begin")}</Button>
    </div>
  );
}
