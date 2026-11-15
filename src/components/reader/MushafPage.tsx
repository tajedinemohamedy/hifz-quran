"use client";
/* One mushaf page: flowing Warsh text fitted to the screen, with every reader state drawn on the same markup. */
import { memo, useLayoutEffect, useRef, type ReactNode } from "react";
import { BASMALA, hizbOf, juzOf, pageStartEnd, quran, range } from "@/lib/quran";
import { useT } from "@/lib/i18n";
import { prefs } from "@/lib/prefs";
import { ui } from "@/lib/ui";
import { player } from "@/lib/audio";
import { recite, WORD_CLASS } from "@/lib/recite";

/** Largest font size (px) at which the text fits its box. Returns the [box, text] refs to attach. */
function useFitText(key: unknown) {
  const box = useRef<HTMLDivElement>(null), text = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const b = box.current, t = text.current;
    if (!b || !t) return;
    const fit = () => {
      let lo = 14, hi = 36;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        t.style.fontSize = mid + "px";
        if (t.scrollHeight <= b.clientHeight && t.scrollWidth <= b.clientWidth + 1) lo = mid; else hi = mid;
      }
      t.style.fontSize = lo + "px";
    };
    fit();
    void document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [key]);
  return [box, text] as const;
}

const VerseNumber = ({ n }: { n: string }) => (
  <span className="mx-[0.15em] inline-grid h-[1.45em] min-w-[1.45em] place-items-center rounded-full border border-accent/50 px-[0.2em] align-middle font-sans text-[0.5em] leading-none text-accent">{n}</span>
);

function SurahBanner({ s }: { s: number }) {
  const { n } = useT();
  return (
    <div className="my-[0.25em] flex items-center justify-center gap-[0.5em] rounded-[0.4em] border border-accent/30 bg-accent-soft/60 py-[0.12em] text-[0.8em] text-accent">
      <span className="font-sans text-[0.55em] opacity-70">{n(s)}</span>
      <span>سُورَةُ {quran().names[s - 1]}</span>
    </div>
  );
}

export const MushafPage = memo(function MushafPage({ p }: { p: number }) {
  const { t, n } = useT();
  const [box, text] = useFitText(p);

  const mode = ui.use((s) => s.mode);
  const revealed = ui.use((s) => s.revealed);
  const flash = ui.use((s) => s.flash);
  const weak = prefs.use((s) => s.weak);
  const pv = player.use((s) => s.verse), pw = player.use((s) => s.word);
  const r = recite.use((s) => s);
  const reciting = mode === "recite" && r.page === p;

  const { V } = quran();
  const [a, b] = pageStartEnd(p);
  const body: ReactNode[] = [];
  let k = 0; // word counter across the page (recitation words)
  for (const i of range(a, b)) {
    const [s, aya, , w, marks] = V[i];
    if (aya === 1) {
      body.push(<SurahBanner key={"s" + s} s={s} />);
      if (s !== 1 && s !== 9) body.push(<div key={"b" + s} className="text-center">{BASMALA.join(" ")}</div>);
    }
    const hidden = (mode === "hide" || mode === "hint") && !revealed.includes(i);
    const cls = ["vs", weak[i] ? "weak" : "", pv === i ? "playing" : "", hidden ? mode === "hide" ? "hid" : "hint" : "", flash === i ? "anim-flash" : ""].join(" ");
    body.push(
      <span key={i} data-v={i} className={cls}>
        {w.map((word, wi) => {
          const thumn = marks.includes(wi) ? <span className="text-gold">۞ </span> : null;
          if (reciting) {
            const x = r.st[k], kk = k++;
            const c = x ? (x.s ? WORD_CLASS[x.s] : x.shown || r.showText ? "" : "hid") + (kk === r.cur ? " cur" : "") + (x.hint && x.s < 2 ? " hinted" : "") : "";
            return <span key={wi}>{thumn}<span data-k={kk} className={"tw " + c}>{word}</span> </span>;
          }
          return <span key={wi}>{thumn}<span className={"w" + (pv === i && pw === wi ? " on" : "")}>{word}</span> </span>;
        })}
        <VerseNumber n={n(aya)} />{" "}
      </span>,
    );
  }

  const first = V[a];
  return (
    <article className="paper flex h-full flex-col rounded-[22px] px-4 pb-2 pt-3 shadow-[0_1px_3px_rgb(0_0_0/0.06),0_8px_24px_rgb(0_0_0/0.05)] ring-1 ring-line">
      <header className="flex justify-between text-[12px] text-muted">
        <span>{quran().names[first[0] - 1]}</span>
        <span>{t("hizb", { n: hizbOf(a) })} · {t("juz", { n: juzOf(a) })}</span>
      </header>
      <div ref={box} className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-1">
        <div ref={text} dir="rtl" className="quran text-justify leading-[2.05] [text-align-last:center]">{body}</div>
      </div>
      <footer className="text-center text-[12px] tabular-nums text-muted">{n(p)}</footer>
    </article>
  );
});
