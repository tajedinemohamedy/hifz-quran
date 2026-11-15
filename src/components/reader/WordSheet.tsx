"use client";
/* A word during a recitation check: what was expected, what was heard, and where to continue. */
import { useT } from "@/lib/i18n";
import { engine } from "@/lib/recognition";
import { hintWord, isMistake, jumpTo, recite, trackerApi } from "@/lib/recite";
import { Button } from "@/components/ui/button";
import { Sheet, VerseText, useLast } from "../kit";

export function WordSheet({ k: open, onClose }: { k: number | null; onClose: () => void }) {
  const { t, where } = useT();
  const k = useLast(open);
  const r = recite.use((s) => s);
  const listening = engine.use((s) => s.mode === "recite" && s.mic === "on");
  if (k == null || !r.words[k]) return null;
  const w = r.words[k], x = r.st[k], shown = r.showText || x.shown || x.s > 0;
  const heard = x.info?.heard?.length ? trackerApi()?.keyText(x.info.heard.map((c) => ({ c }))) : t("tzNothing");
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
      <div className="mt-4 flex gap-2">
        {listening && <Button className="flex-1" onClick={() => { jumpTo(k); onClose(); }}>{t("continueHere")}</Button>}
        {!shown && <Button variant="secondary" className="flex-1" onClick={() => { hintWord(k); onClose(); }}>{t("show")}</Button>}
      </div>
    </Sheet>
  );
}
