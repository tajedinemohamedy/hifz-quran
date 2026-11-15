"use client";
/* The reader's single control surface. It shows one thing at a time and morphs in place:
   three actions → the player, the memorize bar, or the recitation check. */
import { EyeOff, Loader2, Mic, Pause, Play, Square, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { pageStartEnd } from "@/lib/quran";
import { ui, setMode, revealNext } from "@/lib/ui";
import { player, stop, toggle } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { TrackerPanel } from "./TrackerPanel";

function Action({ icon: Icon, label, onClick }: { icon: typeof Play; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[12px] font-medium transition-colors active:bg-muted">
      <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" /></span>
      {label}
    </button>
  );
}

function Actions() {
  const { t } = useT();
  return (
    <div className="flex p-1.5">
      <Action icon={Play} label={t("listen")} onClick={() => toggle(pageStartEnd(ui.get().page)[0])} />
      <Action icon={EyeOff} label={t("memorize")} onClick={() => setMode("memorize")} />
      <Action icon={Mic} label={t("recite")} onClick={() => setMode("recite")} />
    </div>
  );
}

function PlayerBar() {
  const { t, where } = useT();
  const s = player.use((x) => x);
  return (
    <div className="flex items-center gap-2 p-2">
      <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("stop")} onClick={stop}><Square className="size-4" fill="currentColor" /></Button>
      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-[13px] font-semibold">{s.verse != null ? where(s.verse) : ""}</p>
        <p className="text-[11px] text-muted-foreground">{s.loading ? t("loadingAudio") : s.playing ? t("nowPlaying") : t("paused")}</p>
      </div>
      <Button size="icon" className="size-11 rounded-full" aria-label={s.playing ? t("pause") : t("listen")} onClick={() => toggle(pageStartEnd(ui.get().page)[0])}>
        {s.loading ? <Loader2 className="animate-spin" /> : s.playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
      </Button>
    </div>
  );
}

function MemorizeBar() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2 p-2">
      <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("exit")} onClick={() => setMode("read")}><X /></Button>
      <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">{t("memorizeHint")}</p>
      <Button className="rounded-full" onClick={revealNext}>{t("revealNext")}</Button>
    </div>
  );
}

export function ReaderDock() {
  const mode = ui.use((s) => s.mode);
  const audio = player.use((s) => s.verse != null || s.loading);
  const view = mode === "recite" ? "recite" : mode === "memorize" ? "memorize" : audio ? "player" : "actions";
  return (
    <div className="shrink-0 px-3 pb-3 pt-1">
      <div className="mx-auto max-w-[34rem] overflow-hidden rounded-[24px] bg-card shadow-[0_4px_24px_rgb(0_0_0/0.08)] ring-1 ring-border">
        <div key={view} className="duration-300 animate-in fade-in slide-in-from-bottom-2">
          {view === "recite" ? <TrackerPanel /> : view === "memorize" ? <MemorizeBar /> : view === "player" ? <PlayerBar /> : <Actions />}
        </div>
      </div>
    </div>
  );
}
