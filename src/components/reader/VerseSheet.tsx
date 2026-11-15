"use client";
/* Everything about one verse in one place: listen, mark weak, bookmark, copy, its similar passages. */
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { juzOf, pageOfVerse, verseText } from "@/lib/quran";
import { prefs, toggleBookmark, toggleWeak } from "@/lib/prefs";
import { playVerse } from "@/lib/audio";
import { groupsOfVerse } from "@/lib/mut";
import { Icon, type IconName } from "../icons";
import { Sheet } from "../ui";
import { GroupCard } from "../MutGroup";

function Action({ icon, label, on, onClick }: { icon: IconName; label: string; on?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 text-[12px] ${on ? "bg-accent-soft text-accent" : "bg-surface text-ink"} active:opacity-70`}>
      <Icon name={icon} fill={on && icon !== "play"} />
      {label}
    </button>
  );
}

export function VerseSheet({ verse, onClose }: { verse: number | null; onClose: () => void }) {
  const { t, where } = useT();
  const weak = prefs.use((s) => verse != null && !!s.weak[verse]);
  const marked = prefs.use((s) => verse != null && s.bookmarks.includes(pageOfVerse(verse)));
  const [copied, setCopied] = useState(false);
  if (verse == null) return null;
  const groups = groupsOfVerse(verse), page = pageOfVerse(verse);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${verseText(verse)}\n— ${where(verse)}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <Sheet open onClose={onClose} title={where(verse)}>
      <div className="text-[13px] text-muted">{t("page", { n: page })} · {t("juz", { n: juzOf(verse) })}</div>
      <div className="quran my-3 rounded-2xl bg-surface p-4 text-[24px] leading-[2]" dir="rtl">{verseText(verse)}</div>
      <div className="flex gap-2">
        <Action icon="play" label={t("playFrom")} onClick={() => { void playVerse(verse); onClose(); }} />
        <Action icon="flag" label={weak ? t("unmarkWeak") : t("markWeak")} on={weak} onClick={() => toggleWeak(verse)} />
        <Action icon="bookmark" label={marked ? t("unbookmark") : t("bookmark")} on={marked} onClick={() => toggleBookmark(page)} />
        <Action icon="copy" label={copied ? t("copied") : t("copy")} onClick={copy} />
      </div>
      {groups.length > 0 && (
        <>
          <h3 className="mb-2 mt-5 text-[13px] font-semibold text-muted">{t("similar", { n: groups.length })}</h3>
          <div className="flex flex-col gap-2">{groups.map((g) => <GroupCard key={g} group={g} />)}</div>
        </>
      )}
    </Sheet>
  );
}
