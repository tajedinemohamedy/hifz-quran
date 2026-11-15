"use client";
/* A word during a recitation check: what was expected, what was heard, its tajweed, and where to continue. */
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { engine } from "@/lib/recognition";
import { hintWord, isMistake, jumpTo, recite, trackerApi } from "@/lib/recite";
import { Button } from "@/components/ui/button";
import { Sheet, VerseText, useLast } from "../kit";

export function WordSheet({ k: open, onClose }: { k: number | null; onClose: () => void }) {
  const { t, where, counts, maddName, tajweedText } = useT();
  const k = useLast(open);
  const r = recite.use((s) => s);
  const listening = engine.use((s) => s.mode === "recite" && s.mic === "on");
  if (k == null || !r.words[k]) return null;
  const w = r.words[k], x = r.st[k], shown = r.showText || x.shown || x.s > 0;
  const heard = x.info?.heard?.length ? trackerApi()?.keyText(x.info.heard.map((c) => ({ c }))) : t("tzNothing");
  const tj = r.tj[k];
  return (
    <Sheet open={open != null} onOpenChange={(o) => !o && onClose()} title={where(w.verse)}>
      <VerseText className="py-2 text-center text-[32px]">{shown ? w.text : "…"}</VerseText>
      {isMistake(x) && (
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 rounded-2xl bg-card p-4 text-[14px]">
          <span className="text-muted-foreground">{t("verdict")}</span><span className="font-semibold text-destructive">{x.s === 3 ? t("tzMissing") : t("tzDifferent")}</span>
          <span className="text-muted-foreground">{t("tzHeard")}</span><VerseText className="text-[20px]">{heard}</VerseText>
        </div>
      )}
      {x.info?.mut && (
        <p className="mt-3 border-s-2 border-warning ps-3 text-[13px] text-muted-foreground">
          {t("tzSimilar", { where: where(x.info.mut.v) })} <span className="quran text-[19px] text-foreground">«{x.info.mut.text}»</span>
        </p>
      )}
      {tj && (tj.notes.length > 0 || tj.madd.length > 0) && (
        <section className="mt-4">
          <h3 className="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">{t("tajweed")}</h3>
          <ul className="space-y-2">
            {tj.notes.map((note, i) => (
              <li key={i} className="rounded-2xl bg-card p-3 text-[14px]">
                <span className={cn("mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  note.severity === "jali" ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning")}>
                  {note.severity === "jali" ? t("tjSevJali") : t("tjSevKhafi")}
                </span>
                <p dir="auto">{tajweedText(note)}</p>
              </li>
            ))}
          </ul>
          {tj.madd.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tj.madd.map((m, i) => (
                <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-muted-foreground">{t("tjMaddHeard", { name: maddName(m.rule), heard: counts(m.heard) })}</span>
              ))}
            </div>
          )}
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">{t("tjLimits")}</p>
        </section>
      )}
      <div className="mt-4 flex gap-2">
        {listening && <Button className="flex-1" onClick={() => { jumpTo(k); onClose(); }}>{t("continueHere")}</Button>}
        {!shown && <Button variant="secondary" className="flex-1" onClick={() => { hintWord(k); onClose(); }}>{t("show")}</Button>}
      </div>
    </Sheet>
  );
}
