"use client";
/* One mushaf page: flowing Warsh text fitted to the screen, with every reader state drawn on the same markup. */
import { memo, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { BASMALA, hizbOf, pageStartEnd, quran, range } from "@/lib/quran";
import { useT } from "@/lib/i18n";
import { prefs } from "@/lib/prefs";
import { ui } from "@/lib/ui";
import { player } from "@/lib/audio";
import { recite, tajweedLevel, WORD_CLASS } from "@/lib/recite";

const LINES = 15; // a printed mushaf page
const LINE_HEIGHT = 2.05; // matches leading-[2.05] on the text
const MIN_PX = 16, MAX_PX = 40; // below 16px Quran text with marks stops being readable

/** Sizes the text like a printed mushaf: the screen's standard size fits 15 lines, every page uses it, a denser page
    shrinks only as much as it needs, and below the readable minimum the page scrolls inside its frame instead of
    clipping. Returns the [box, text] refs to attach. */
function useMushafFit(key: unknown) {
  const box = useRef<HTMLDivElement>(null), text = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const b = box.current, t = text.current;
    if (!b || !t) return;
    const fits = (px: number) => {
      t.style.fontSize = px + "px";
      return t.scrollHeight <= b.clientHeight && t.scrollWidth <= b.clientWidth + 1;
    };
    const fit = () => {
      let size = Math.min(MAX_PX, Math.max(MIN_PX, b.clientHeight / (LINES * LINE_HEIGHT)));
      if (!fits(size) && fits(MIN_PX)) {
        let lo = MIN_PX, hi = size;
        while (hi - lo > 0.5) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
        size = lo;
      } else if (!fits(size)) size = MIN_PX;
      t.style.fontSize = size + "px";
      b.dataset.overflow = String(t.scrollHeight > b.clientHeight + 1);
    };
    fit();
    void document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [key]);
  return [box, text] as const;
}

/** Keeps `selector` (the word being recited or played) in view when the page scrolls inside its frame. */
function useFollow(box: React.RefObject<HTMLDivElement | null>, selector: string | null) {
  useEffect(() => {
    const b = box.current, el = selector ? b?.querySelector(selector) : null;
    if (!b || !el || b.dataset.overflow !== "true") return;
    const e = el.getBoundingClientRect(), r = b.getBoundingClientRect();
    if (e.top < r.top + 8 || e.bottom > r.bottom - 8) b.scrollBy({ top: e.top - r.top - r.height / 3, behavior: "smooth" });
  }, [box, selector]);
}
const VerseNumber = ({ n }: { n: string }) => (
  <span className="mx-[0.15em] inline-grid h-[1.45em] min-w-[1.45em] place-items-center rounded-full border border-primary/50 px-[0.2em] align-middle font-sans text-[0.5em] leading-none text-primary">{n}</span>
);

function SurahBanner({ s }: { s: number }) {
  const { n } = useT();
  return (
    <div className="my-[0.25em] flex items-center justify-center gap-[0.5em] rounded-[0.4em] border border-primary/25 bg-accent/70 py-[0.12em] text-[0.8em] text-accent-foreground">
      <span className="font-sans text-[0.55em] opacity-70">{n(s)}</span>
      <span>سُورَةُ {quran().names[s - 1]}</span>
    </div>
  );
}

export const MushafPage = memo(function MushafPage({ p }: { p: number }) {
  const { t, n } = useT();
  const [box, text] = useMushafFit(p);

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
    const cover = mode === "memorize" ? (revealed[i] === 2 ? "" : revealed[i] === 1 ? "hint" : "hid") : "";
    const cls = ["vs", weak[i] ? "weak" : "", pv === i ? "playing" : "", cover, flash === i ? "anim-flash" : ""].join(" ");
    body.push(
      <span key={i} data-v={i} className={cls}>
        {w.map((word, wi) => {
          const thumn = marks.includes(wi) ? <span className="text-warning">۞ </span> : null;
          if (reciting) {
            const x = r.st[k], kk = k++;
            const tj = tajweedLevel(r.tj[kk]);
            const c = x ? (x.s ? WORD_CLASS[x.s] : x.shown || r.showText ? "" : "hid") + (kk === r.cur ? " cur" : "") + (x.hint && x.s < 2 ? " hinted" : "") + (tj ? " tj-" + tj : "") : "";
            return <span key={wi}>{thumn}<span data-k={kk} className={"tw " + c}>{word}</span> </span>;
          }
          return <span key={wi}>{thumn}<span className={"w" + (pv === i && pw === wi ? " on" : "")}>{word}</span> </span>;
        })}
        <VerseNumber n={n(aya)} />{" "}
      </span>,
    );
  }

  useFollow(box, reciting ? `[data-k="${r.cur}"]` : pv != null && pv >= a && pv <= b ? `[data-v="${pv}"]` : null);

  const first = V[a];
  return (
    <article className="paper flex h-full flex-col rounded-[22px] px-4 pb-2 pt-3 shadow-[0_1px_3px_rgb(0_0_0/0.06),0_8px_24px_rgb(0_0_0/0.05)] ring-1 ring-border">
      <header className="flex justify-between text-[12px] text-muted-foreground">
        <span>{quran().names[first[0] - 1]}</span>
        <span>{t("hizb", { n: hizbOf(a) })}</span>
      </header>
      <div ref={box} className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-1 data-[overflow=true]:pb-8 data-[overflow=true]:[mask-image:linear-gradient(to_bottom,black_88%,transparent)]">
        <div ref={text} dir="rtl" className="quran my-auto text-justify leading-[2.05] [text-align-last:center]">{body}</div>
      </div>
      <footer className="text-center text-[12px] tabular-nums text-muted-foreground">{n(p)}</footer>
    </article>
  );
});
