"use client";
/* Mutashabihat display shared by the reader, browsing and practice results. */
import { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { quran, words } from "@/lib/quran";
import { useT } from "@/lib/i18n";
import { prefs, toggleStar } from "@/lib/prefs";
import { CONTINUE_WORDS } from "@/lib/mut";
import { openReader } from "@/lib/ui";
import { endPractice } from "@/lib/practice";
import { VerseText } from "./kit";

/** One place: the shared phrase marked, the words that follow it highlighted. Tap to open it in the mushaf. */
export function Occurrence({ o, current }: { o: [number, number, number, string]; current?: boolean }) {
  const { where } = useT();
  const [k, i, L] = o, w = words(k), end = Math.min(i + L + CONTINUE_WORDS, w.length);
  return (
    <button onClick={() => { endPractice(); openReader({ verse: k }); }}
      className={cn("block w-full rounded-2xl bg-card p-3 text-start transition-transform active:scale-[0.99]", current && "ring-2 ring-primary")}>
      <div className="text-[12px] text-muted-foreground">{where(k)}</div>
      <VerseText className="text-[20px]">
        {w.map((t, n) => (
          <span key={n} className={n >= i && n < i + L ? "rounded bg-warning-soft text-warning" : n >= i + L && n < end ? "rounded bg-accent text-accent-foreground" : ""}>{t} </span>
        ))}
      </VerseText>
    </button>
  );
}

export function StarButton({ group }: { group: number }) {
  const on = prefs.use((s) => s.stars.includes(group));
  return (
    <button onClick={() => toggleStar(group)} aria-pressed={on} aria-label="★"
      className={cn("grid size-9 shrink-0 place-items-center rounded-full transition-colors", on ? "text-warning" : "text-muted-foreground")}>
      <Star className="size-5" fill={on ? "currentColor" : "none"} />
    </button>
  );
}

export function GroupCard({ group, open: initial = false }: { group: number; open?: boolean }) {
  const { n, sura } = useT();
  const [open, setOpen] = useState(initial);
  const g = quran().G[group], [v, i, L] = g.o[0];
  return (
    <div className="rounded-2xl bg-card p-3">
      <div className="flex items-center gap-1">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <VerseText className="min-w-0 flex-1 text-[20px] text-primary">{words(v).slice(i, i + L).join(" ")}</VerseText>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] tabular-nums text-muted-foreground">{n(g.o.length)}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>
        <StarButton group={group} />
      </div>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-2 pt-2">{g.o.map((o, k) => <div key={k} className="rounded-2xl bg-background"><Occurrence o={o} /></div>)}</div>
        </div>
      </div>
      {!open && <div className="truncate text-[12px] text-muted-foreground">{g.o.map((o) => `${sura(quran().V[o[0]][0])} ${n(quran().V[o[0]][1])}`).join(" · ")}</div>}
    </div>
  );
}
