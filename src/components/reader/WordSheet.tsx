"use client";
/* A word during a recitation check: what was expected, what was heard, and where to continue. */
import { useT } from "@/lib/i18n";
import { engine } from "@/lib/recognition";
import { hintWord, isMistake, jumpTo, recite, trackerApi } from "@/lib/recite";
import { Button, Sheet } from "../ui";

export function WordSheet({ k, onClose }: { k: number | null; onClose: () => void }) {
  const { t, where } = useT();
  const r = recite.use((s) => s);
  const listening = engine.use((s) => s.mode === "recite");
  if (k == null || !r.words[k]) return null;
  const w = r.words[k], x = r.st[k], shown = r.showText || x.shown || x.s > 0;
  const heard = x.info?.heard?.length ? trackerApi()?.keyText(x.info.heard.map((c) => ({ c }))) : t("tzNothing");
  return (
    <Sheet open onClose={onClose} title={where(w.verse)}>
      <div className="quran my-2 text-center text-[30px]" dir="rtl">{shown ? w.text : "…"}</div>
      {isMistake(x) && (
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl bg-surface p-3 text-[14px]">
          <span className="text-muted">●</span><span>{x.s === 3 ? t("tzMissing") : t("tzDifferent")}</span>
          <span className="text-muted">{t("tzHeard")}</span><span className="quran text-[20px]" dir="rtl">{heard}</span>
        </div>
      )}
      {x.info?.mut && (
        <p className="mt-3 border-s-2 border-gold ps-3 text-[13px] text-muted">
          {t("tzSimilar", { where: where(x.info.mut.v) })} <span className="quran text-[19px] text-ink">«{x.info.mut.text}»</span>
        </p>
      )}
      <div className="mt-4 flex gap-2">
        {listening && <Button tone="primary" onClick={() => { jumpTo(k); onClose(); }}>{t("continueHere")}</Button>}
        {!shown && <Button onClick={() => { hintWord(k); onClose(); }}>{t("show")}</Button>}
        <Button tone="ghost" onClick={onClose}>{t("close")}</Button>
      </div>
    </Sheet>
  );
}
