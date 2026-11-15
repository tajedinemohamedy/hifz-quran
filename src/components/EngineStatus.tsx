"use client";
/* The live pipeline of the speech engine, shared by the recitation check and recite-to-find:
   engine → microphone → listening, the current state in words, a voice meter, and the activity log. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, FileUp, Loader2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type Key } from "@/lib/i18n";
import { engine, loadModelFile, micLevel, preload, type LogEntry } from "@/lib/recognition";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type StepState = "wait" | "busy" | "done" | "fail";

function Step({ state, label }: { state: StepState; label: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-300",
      state === "done" && "text-primary", state === "fail" && "text-destructive", state === "busy" && "text-foreground", state === "wait" && "text-muted-foreground")}>
      <span className={cn("grid size-4 place-items-center rounded-full transition-colors duration-300",
        state === "done" && "bg-primary text-primary-foreground", state === "fail" && "bg-destructive text-white", state !== "done" && state !== "fail" && "bg-muted")}>
        {state === "done" ? <Check className="size-2.5" strokeWidth={3} /> : state === "fail" ? <X className="size-2.5" strokeWidth={3} /> : state === "busy" ? <Loader2 className="size-3 animate-spin" /> : null}
      </span>
      {label}
    </span>
  );
}

/** Live microphone level, drawn without React re-renders. */
export function VoiceMeter({ className }: { className?: string }) {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => { if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, micLevel() * 9)})`; raf = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-muted", className)}>
      <span ref={bar} className="block h-full rounded-full bg-primary transition-transform duration-75 ltr:origin-left rtl:origin-right" />
    </span>
  );
}

/** What the pipeline is doing right now, as a title and a detail line. */
export function useEngineHeadline(): { title: Key; detail?: ReactNode; progress?: number; tone: "busy" | "ok" | "fail" | "idle" } {
  const { t, n } = useT();
  const e = engine.use((s) => s);
  if (e.phase === "error") return { title: e.failure === "download" ? "failDownload" : e.failure === "runtime" ? "failRuntime" : e.failure === "worker" ? "failWorker" : "failCompile", detail: t("failHint"), tone: "fail" };
  if (e.phase === "runtime") return { title: "engRuntime", tone: "busy" };
  if (e.phase === "download") return { title: "engDownload", detail: t("mbOf", { a: n((e.got / 1e6).toFixed(1)), b: n(Math.round(e.total / 1e6)) }), progress: e.got / Math.max(1, e.total), tone: "busy" };
  if (e.phase === "compile") return { title: "engCompile", tone: "busy" };
  if (e.mic === "asking") return { title: "micAsking", detail: t("micAskingHint"), tone: "busy" };
  if (e.mic === "denied") return { title: "micDenied", detail: t("micDeniedHint"), tone: "fail" };
  if (e.mic === "missing" || e.mic === "error") return { title: e.mic === "missing" ? "micMissing" : "micError", detail: t("micMissingHint"), tone: "fail" };
  if (e.mic === "insecure") return { title: "micInsecure", detail: t("micInsecureHint"), tone: "fail" };
  if (e.mode && e.mic === "on") {
    if (e.silent) return { title: "micSilent", detail: t("micSilentHint"), tone: "fail" };
    return { title: e.voice ? "hearing" : "waitingVoice", tone: "ok" };
  }
  if (e.mode) return { title: "engPreparing", tone: "busy" };
  return { title: e.phase === "ready" ? "engReady" : "engIdle", tone: "idle" };
}

export function PipelineSteps() {
  const { t } = useT();
  const e = engine.use((s) => s);
  const engineStep: StepState = e.phase === "ready" ? "done" : e.phase === "error" ? "fail" : e.phase === "idle" ? "wait" : "busy";
  const micStep: StepState = e.mic === "on" ? "done" : e.mic === "asking" ? "busy" : e.mic === "off" ? "wait" : "fail";
  const listenStep: StepState = e.mode && e.mic === "on" ? (e.silent ? "fail" : "busy") : "wait";
  return (
    <div className="flex items-center justify-between gap-2">
      <Step state={engineStep} label={t("stepEngine")} />
      <span className="h-px flex-1 bg-border" />
      <Step state={micStep} label={t("stepMic")} />
      <span className="h-px flex-1 bg-border" />
      <Step state={listenStep} label={t("stepListen")} />
    </div>
  );
}

/** Inline recovery: the actions that fix the current failure, where it happened. */
export function EngineRecovery() {
  const { t } = useT();
  const phase = engine.use((s) => s.phase);
  const file = useRef<HTMLInputElement>(null);
  if (phase !== "error") return null;
  return (
    <div className="flex gap-2 duration-200 animate-in fade-in">
      <Button size="sm" onClick={() => void preload()}><RotateCcw />{t("retry")}</Button>
      <Button size="sm" variant="secondary" onClick={() => file.current?.click()}><FileUp />{t("chooseModel")}</Button>
      <input ref={file} type="file" accept=".onnx" hidden onChange={(ev) => { const f = ev.target.files?.[0]; if (f) void loadModelFile(f); }} />
    </div>
  );
}

const TONE: Record<LogEntry["tone"], string> = { info: "bg-muted-foreground/40", ok: "bg-primary", warn: "bg-warning", error: "bg-destructive" };

/** Everything the engine did, newest first. */
export function ActivityLog() {
  const { t, n } = useT();
  const log = engine.use((s) => s.log);
  const [open, setOpen] = useState(false);
  const start = log[0]?.at ?? 0;
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
        {t("activity")} · {n(log.length)}
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <ol className="max-h-40 min-h-0 overflow-y-auto overflow-x-hidden">
          {[...log].reverse().map((l) => (
            <li key={l.id} className="flex items-start gap-2 py-1 text-[12px] duration-200 animate-in fade-in slide-in-from-top-1">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", TONE[l.tone])} />
              <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{n(((l.at - start) / 1000).toFixed(1))}s</span>
              <span className="min-w-0 break-words">{t(l.key, l.vars)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Headline + progress/meter + recovery: the compact status block used by both features. */
export function EngineHeadline() {
  const { t } = useT();
  const h = useEngineHeadline();
  const listening = engine.use((s) => !!s.mode && s.mic === "on");
  return (
    <div className="space-y-2">
      <div key={h.title} className="duration-300 animate-in fade-in">
        <p className={cn("text-[15px] font-semibold", h.tone === "fail" && "text-destructive")}>{t(h.title)}</p>
        {h.detail && <p className="text-[12px] text-muted-foreground">{h.detail}</p>}
      </div>
      {h.progress != null && <Progress value={h.progress * 100} />}
      {listening && <VoiceMeter />}
      <EngineRecovery />
    </div>
  );
}
