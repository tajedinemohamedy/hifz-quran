"use client";
/* The reader's single control surface: listen, the four reading modes, and the recitation check. */
import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";
import { pageStartEnd } from "@/lib/quran";
import { ui, setMode, reveal, type ReaderMode } from "@/lib/ui";
import { player, stop, toggle } from "@/lib/audio";
import { engine, micLevel } from "@/lib/recognition";
import { hintWord, isMistake, recite, startRecite, stopRecite } from "@/lib/recite";
import { Icon } from "../icons";
import { Button, Segmented, Sheet } from "../ui";

export function ReaderDock() {
  const { t } = useT();
  const chrome = ui.use((s) => s.chrome);
  const mode = ui.use((s) => s.mode);
  const listening = engine.use((s) => s.mode === "recite");
  if (!chrome && !listening) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
      <div className="pointer-events-auto mx-auto flex max-w-[34rem] flex-col gap-2">
        {mode === "recite" && <ReciteBar />}
        {(mode === "hint" || mode === "hide") && <RevealBar />}
        <NowPlaying />
        <div className="flex items-center gap-2 rounded-[20px] bg-glass p-1.5 shadow-lg ring-1 ring-line backdrop-blur-xl">
          <PlayButton />
          <Segmented<ReaderMode> className="flex-1" label={t("tabMushaf")} value={mode} onChange={setMode}
            options={[["read", t("modeRead")], ["hint", t("modeHint")], ["hide", t("modeHide")], ["recite", t("modeRecite")]]} />
        </div>
      </div>
    </div>
  );
}

function PlayButton() {
  const { t } = useT();
  const playing = player.use((s) => s.playing), loading = player.use((s) => s.loading);
  return (
    <button aria-label={playing ? t("pause") : t("listen")} onClick={() => toggle(pageStartEnd(ui.get().page)[0])}
      className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent active:opacity-80">
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon name={playing ? "pause" : "play"} fill={!playing} />}
    </button>
  );
}

function NowPlaying() {
  const { t, where } = useT();
  const verse = player.use((s) => s.verse), error = player.use((s) => s.error);
  if (verse == null && !error) return null;
  return (
    <div className="flex items-center gap-2 self-center rounded-full bg-glass py-1 pe-1 ps-3 text-[13px] shadow ring-1 ring-line backdrop-blur-xl">
      <span className={error ? "text-danger" : "text-muted"}>{error ? t("audioError") : where(verse!)}</span>
      <button onClick={stop} aria-label={t("stop")} className="grid size-7 place-items-center rounded-full bg-surface-2"><Icon name="close" className="size-3.5" /></button>
    </div>
  );
}

function RevealBar() {
  const { t } = useT();
  const next = () => {
    const { page, revealed } = ui.get();
    const [a, b] = pageStartEnd(page);
    for (let i = a; i <= b; i++) if (!revealed.includes(i)) return reveal(i);
  };
  return (
    <div className="flex items-center justify-between gap-2 self-stretch rounded-2xl bg-glass py-1.5 pe-1.5 ps-4 text-[13px] text-muted shadow ring-1 ring-line backdrop-blur-xl">
      <span>{t("tapReveal")}</span>
      <Button small tone="primary" onClick={next}>{t("revealNext")}</Button>
    </div>
  );
}

function MicButton() {
  const { t } = useT();
  const on = engine.use((s) => s.mode === "recite");
  const ring = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const tick = () => { if (ring.current) ring.current.style.transform = `scale(${1 + Math.min(0.4, micLevel() * 7)})`; raf = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return (
    <button onClick={() => (on ? stopRecite() : void startRecite())} aria-label={on ? t("stop") : t("modeRecite")}
      className={`relative grid size-14 shrink-0 place-items-center rounded-full text-white shadow-md transition-colors ${on ? "bg-danger" : "bg-accent"}`}>
      {on && <span ref={ring} className="absolute -inset-1.5 rounded-full border-[3px] border-danger/40 transition-transform duration-75" />}
      <Icon name={on ? "stop" : "mic"} className="size-6" fill={on} />
    </button>
  );
}

function ReciteBar() {
  const { t } = useT();
  const e = engine.use((s) => s);
  const r = recite.use((s) => s);
  const ok = r.st.filter((x) => x.s === 1 || x.s === 4).length, bad = r.st.filter(isMistake).length;
  const [title, sub] =
    e.phase === "starting" || e.phase === "download" ? [t("tzDownloading"), e.phase === "download" ? t("percent", { n: Math.round(e.progress * 100) }) : t("tzOnce")]
    : e.phase === "loading" && e.mode ? [t("tzPreparing"), ""]
    : e.phase === "error" ? [t("tzModelError"), t("tzModelErrorHint")]
    : e.micError ? [t("tzMicError"), t("tzMicHint")]
    : e.mode === "recite" ? [t("tzListening"), t("tzWords", { a: Math.min(r.cur, r.words.length), b: r.words.length })]
    : r.summary ? [t("tzDone"), ""] : [t("tzReady"), t("tzPress")];
  return (
    <div className="rounded-[20px] bg-glass p-3 shadow-lg ring-1 ring-line backdrop-blur-xl">
      {r.lost && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-gold-soft px-3 py-2 text-[13px]">
          <span><b className="block">{t("tzLost")}</b><span className="text-muted">{t("tzLostHint")}</span></span>
          <Button small onClick={() => hintWord(r.cur)}>{t("showWord")}</Button>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-[13px]"><b className="block truncate text-[14px]">{title}</b><span className="line-clamp-2 text-muted">{sub}</span></div>
        <MicButton />
        <div className="flex flex-col items-end gap-1 text-[12px]">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">{t("tzCorrect", { n: ok })}</span>
          {bad > 0 && <span className="rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-danger">{t("tzWrong", { n: bad })}</span>}
          <button onClick={() => recite.set((s) => ({ showText: !s.showText }))} aria-pressed={r.showText} className="text-muted underline-offset-2 aria-pressed:text-accent">{t("tzShowText")}</button>
        </div>
      </div>
      <ReciteSummary />
    </div>
  );
}

function ReciteSummary() {
  const { t, n, where } = useT();
  const s = recite.use((x) => x.summary), words = recite.use((x) => x.words), st = recite.use((x) => x.st);
  if (!s) return null;
  const acc = Math.round((100 * s.ok) / s.judged);
  const close = () => recite.set({ summary: null });
  return (
    <Sheet open onClose={close} title={t("tzDone")}>
      <div className="flex items-end justify-between gap-4">
        <div><div className="text-5xl font-bold tabular-nums">{t("percent", { n: acc })}</div>
          <div className="text-[13px] text-muted">{n(s.judged)} · {t("tzWrong", { n: s.mistakes.length })}{s.hints ? " · " + t("hints", { n: s.hints }) : ""}</div></div>
        <p className="max-w-[55%] text-[13px] text-muted">{acc >= 97 ? t("tzGreat") : acc >= 90 ? t("tzGood") : t("tzLow")} {s.mistakes.length ? t("tzAdded") : ""}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {s.mistakes.map((k) => (
          <div key={k} className="rounded-2xl bg-surface p-3">
            <div className="text-[12px] text-muted">{where(words[k].verse)} · {st[k].s === 3 ? t("tzMissing") : t("tzDifferent")}</div>
            <div className="quran text-[22px] leading-loose">{words[k].text}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button tone="primary" onClick={() => { close(); void startRecite(); }}>{t("again")}</Button>
        <Button tone="ghost" onClick={close}>{t("close")}</Button>
      </div>
    </Sheet>
  );
}
