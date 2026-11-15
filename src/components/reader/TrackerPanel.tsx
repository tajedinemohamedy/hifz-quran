"use client";
/* The recitation check, live: pipeline, what is happening now, progress through the page, mistakes, and the log. */
import { Eye, EyeOff, Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { engine } from "@/lib/recognition";
import { hintWord, isMistake, isRight, recite, startRecite, stopRecite } from "@/lib/recite";
import { setMode } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityLog, EngineHeadline, PipelineSteps } from "../EngineStatus";

function MicButton() {
  const { t } = useT();
  const on = engine.use((s) => s.mode === "recite");
  const busy = engine.use((s) => s.mode === "recite" && s.mic !== "on");
  return (
    <button onClick={() => (on ? stopRecite() : void startRecite())} aria-label={on ? t("stop") : t("startReciting")}
      className={cn("relative grid size-16 place-items-center rounded-full text-white shadow-lg transition-all duration-300 active:scale-95",
        on ? "bg-destructive" : "bg-primary text-primary-foreground")}>
      {on && !busy && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30 [animation-duration:1.8s]" />}
      {on ? <Square className="relative size-6" fill="currentColor" /> : <Mic className="relative size-7" />}
    </button>
  );
}

function Summary() {
  const { t, n } = useT();
  const s = recite.use((x) => x.summary)!;
  return (
    <div className="flex items-center gap-4 duration-300 animate-in fade-in zoom-in-95">
      <div className={cn("text-4xl font-bold tabular-nums", s.score >= 90 ? "text-primary" : s.score >= 75 ? "text-warning" : "text-destructive")}>{t("percent", { n: s.score })}</div>
      <div className="min-w-0 text-[13px]">
        <p className="font-semibold">{s.score >= 97 ? t("tzGreat") : s.score >= 90 ? t("tzGood") : t("tzLow")}</p>
        <p className="text-muted-foreground">{t("summaryLine", { judged: n(s.judged), bad: n(s.mistakes.length) })}</p>
      </div>
    </div>
  );
}

export function TrackerPanel() {
  const { t, n } = useT();
  const r = recite.use((s) => s);
  const listening = engine.use((s) => s.mode === "recite" && s.mic === "on");
  const inferMs = engine.use((s) => s.inferMs), seconds = engine.use((s) => s.seconds);
  const ok = r.st.filter(isRight).length, bad = r.st.filter(isMistake).length, total = r.words.length;
  const done = r.st.filter((x) => x.s).length;

  return (
    <div className="space-y-3 p-3">
      <PipelineSteps />
      {r.summary && !listening ? <Summary /> : <EngineHeadline />}

      {r.lost && listening && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-warning-soft px-3 py-2 text-[13px] duration-300 animate-in fade-in slide-in-from-bottom-1">
          <span><b className="block">{t("tzLost")}</b><span className="text-muted-foreground">{t("tzLostHint")}</span></span>
          <Button size="sm" variant="secondary" onClick={() => hintWord(r.cur)}>{t("showWord")}</Button>
        </div>
      )}

      <div className="space-y-1">
        <Progress value={(100 * done) / Math.max(1, total)} />
        <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>{t("tzWords", { a: done, b: total })}</span>
          <span className="flex gap-2">
            <span className="text-primary">✓ {n(ok)}</span>
            <span className={bad ? "text-destructive" : ""}>✗ {n(bad)}</span>
            {listening && <span>{n(seconds.toFixed(0))}s · {t("ms", { n: inferMs })}</span>}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Button variant="ghost" size="sm" className="justify-self-start text-muted-foreground" onClick={() => setMode("read")}><X />{t("exit")}</Button>
        <MicButton />
        <Button variant="ghost" size="sm" className="justify-self-end text-muted-foreground" aria-pressed={r.showText}
          onClick={() => recite.set((s) => ({ showText: !s.showText }))}>
          {r.showText ? <EyeOff /> : <Eye />}{r.showText ? t("hideText") : t("showText")}
        </Button>
      </div>
      <ActivityLog />
    </div>
  );
}
