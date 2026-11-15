"use client";
/* Mutashabihat display shared by the reader, browsing and quiz results. */
import { useState } from "react";
import { quran, words } from "@/lib/quran";
import { useT } from "@/lib/i18n";
import { prefs, toggleStar } from "@/lib/prefs";
import { CONTINUE_WORDS } from "@/lib/mut";
import { openReader } from "@/lib/ui";
import { endPractice } from "@/lib/practice";
import { Icon } from "./icons";

/** One place: the shared phrase marked, the words that follow it highlighted. */
export function Occurrence({ o, current }: { o: [number, number, number, string]; current?: boolean }) {
  const { where } = useT();
  const [k, i, L] = o, w = words(k), end = Math.min(i + L + CONTINUE_WORDS, w.length);
  return (
    <button onClick={() => { endPractice(); openReader({ verse: k }); }}className={`block w-full rounded-2xl bg-surface p-3 text-start ${current ? "ring-2 ring-accent" : ""}`}>
      <div className="text-[12px] text-muted">{where(k)}</div>
      <div className="quran text-[21px] leading-[1.95]" dir="rtl">
        {w.map((t, n) => (
          <span key={n} className={n >= i && n < i + L ? "rounded bg-gold-soft text-gold" : n >= i + L && n < end ? "rounded bg-accent-soft text-accent" : ""}>{t} </span>
        ))}
      </div>
    </button>
  );
}

export function StarButton({ group }: { group: number }) {
  const on = prefs.use((s) => s.stars.includes(group));
  return (
    <button onClick={() => toggleStar(group)} aria-pressed={on} aria-label="★" className={`grid size-9 place-items-center rounded-full ${on ? "text-gold" : "text-muted"}`}>
      <Icon name="star" fill={on} />
    </button>
  );
}

export function GroupCard({ group, open: initial = false }: { group: number; open?: boolean }) {
  const { n, sura } = useT();
  const [open, setOpen] = useState(initial);
  const g = quran().G[group], [v, i, L] = g.o[0];
  return (
    <div className="rounded-2xl bg-surface p-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="quran min-w-0 flex-1 text-start text-[20px] leading-relaxed text-accent" dir="rtl">
          {words(v).slice(i, i + L).join(" ")}
        </button>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[12px] tabular-nums text-muted">{n(g.o.length)}</span>
        <StarButton group={group} />
      </div>
      {open ? (
        <div className="mt-2 flex flex-col gap-2">{g.o.map((o, k) => <div key={k} className="rounded-2xl bg-bg"><Occurrence o={o} /></div>)}</div>
      ) : (
        <div className="text-[12px] text-muted">{g.o.map((o) => `${sura(quran().V[o[0]][0])} ${n(quran().V[o[0]][1])}`).join(" · ")}</div>
      )}
    </div>
  );
}
