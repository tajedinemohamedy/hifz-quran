"use client";
/* Everything about one verse in one place: listen, mark for review, copy, and its similar passages. */
import { Copy, Flag, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { juzOf, pageOfVerse, verseText } from "@/lib/quran";
import { prefs, toggleWeak } from "@/lib/prefs";
import { playVerse } from "@/lib/audio";
import { groupsOfVerse } from "@/lib/mut";
import { notify } from "@/lib/notify";
import { Sheet, VerseText, useLast } from "../kit";
import { GroupCard } from "../MutGroup";

function Action({ icon: Icon, label, on, onClick }: { icon: typeof Play; label: string; on?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 text-[12px] font-medium transition-colors active:scale-[0.98]",
      on ? "bg-accent text-accent-foreground" : "bg-card")}>
      <Icon className="size-5" fill={on ? "currentColor" : "none"} />
      {label}
    </button>
  );
}

export function VerseSheet({ verse: open, onClose }: { verse: number | null; onClose: () => void }) {
  const { t, where } = useT();
  const verse = useLast(open);
  const weak = prefs.use((s) => verse != null && !!s.weak[verse]);
  if (verse == null) return null;
  const groups = groupsOfVerse(verse);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${verseText(verse)}\n— ${where(verse)}`); notify.success("copied", undefined, "copy"); }
    catch { notify.error("copyFailed", { id: "copy" }); }
  };
  const mark = () => { notify.success(weak ? "weakRemoved" : "weakAdded", undefined, "weak"); toggleWeak(verse); };
  return (
    <Sheet open={open != null} onOpenChange={(o) => !o && onClose()} title={where(verse)} description={`${t("page", { n: pageOfVerse(verse) })} · ${t("juz", { n: juzOf(verse) })}`}>
      <VerseText className="rounded-2xl bg-card p-4 text-[24px] leading-[2]">{verseText(verse)}</VerseText>
      <div className="mt-3 flex gap-2">
        <Action icon={Play} label={t("listen")} onClick={() => { void playVerse(verse); onClose(); }} />
        <Action icon={Flag} label={weak ? t("unmarkWeak") : t("markWeak")} on={weak} onClick={mark} />
        <Action icon={Copy} label={t("copy")} onClick={copy} />
      </div>
      {groups.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 px-1 text-[13px] font-semibold text-muted-foreground">{t("similar", { n: groups.length })}</h3>
          <div className="flex flex-col gap-2">{groups.map((g) => <GroupCard key={g} group={g} />)}</div>
        </>
      )}
    </Sheet>
  );
}
