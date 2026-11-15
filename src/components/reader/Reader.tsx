"use client";
/* The mushaf: 604 pages in a native swipe pager (right-to-left like a printed mushaf), a slim top bar and the dock. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { PAGES, juzOf, pageOfVerse, pageStartEnd, quran } from "@/lib/quran";
import { prefs, toggleBookmark } from "@/lib/prefs";
import { notify } from "@/lib/notify";
import { setPage, ui, revealStep } from "@/lib/ui";
import { player } from "@/lib/audio";
import { prepareRecite, recite } from "@/lib/recite";
import { Button } from "@/components/ui/button";
import { MushafPage } from "./MushafPage";
import { ReaderDock } from "./ReaderDock";
import { VerseSheet } from "./VerseSheet";
import { WordSheet } from "./WordSheet";

const slotsAround = (p: number) => [p - 1, p, p + 1].filter((x) => x >= 1 && x <= PAGES);
/** Shows the current page: it is the second slot unless it is page 1. */
const centre = (el: HTMLDivElement | null) => { if (el) el.scrollLeft = -(ui.get().page > 1 ? 1 : 0) * el.clientWidth; };

function TopBar() {
  const { t, sura } = useT();
  const page = ui.use((s) => s.page);
  const marked = prefs.use((s) => s.bookmarks.includes(page));
  const first = pageStartEnd(page)[0];
  const bookmark = () => { notify.success(marked ? "bookmarkRemoved" : "bookmarkAdded", { n: page }, "bookmark"); toggleBookmark(page); };
  return (
    <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <button onClick={() => ui.set({ overlay: "index" })} className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-2 py-1 text-start transition-colors active:bg-muted">
        <span className="min-w-0">
          <b className="block truncate text-[17px] leading-tight">{sura(quran().V[first][0])}</b>
          <span className="text-[12px] text-muted-foreground">{t("page", { n: page })} · {t("juz", { n: juzOf(first) })}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <Button variant="ghost" size="icon" className={cn("rounded-full", marked && "text-warning")} aria-label={t("bookmark")} onClick={bookmark}>
        <Bookmark className="size-5" fill={marked ? "currentColor" : "none"} />
      </Button>
    </div>
  );
}

export function Reader() {
  const scroller = useRef<HTMLDivElement>(null);
  const page = ui.use((s) => s.page);
  const mode = ui.use((s) => s.mode);
  const chrome = ui.use((s) => s.chrome);
  const playingVerse = player.use((s) => s.verse);
  const [verse, setVerse] = useState<number | null>(null);
  const [word, setWord] = useState<number | null>(null);

  // Recycling pager: only the previous, current and next pages exist. After a swipe settles on a neighbour,
  // that neighbour becomes the page and the strip re-centres before paint (RTL: scrollLeft runs negative).
  const slots = slotsAround(page);
  useLayoutEffect(() => centre(scroller.current), [page]);
  useEffect(() => {
    const el = scroller.current!;
    let timer = 0;
    const settle = () => {
      clearTimeout(timer);
      const p = slotsAround(ui.get().page)[Math.round(Math.abs(el.scrollLeft) / el.clientWidth)];
      if (p && p !== ui.get().page) setPage(p);
    };
    const onScroll = () => { clearTimeout(timer); timer = window.setTimeout(settle, 90); };
    const ro = new ResizeObserver(() => centre(el));
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", settle);
    ro.observe(el);
    return () => { clearTimeout(timer); el.removeEventListener("scroll", onScroll); el.removeEventListener("scrollend", settle); ro.disconnect(); };
  }, []);
  // keyboard paging (desktop)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || ui.get().overlay) return;
      if (e.key === "ArrowLeft") setPage(ui.get().page + 1);
      if (e.key === "ArrowRight") setPage(ui.get().page - 1);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);

  // the page follows the recitation
  useEffect(() => {
    if (playingVerse != null && player.get().playing) setPage(pageOfVerse(playingVerse));
  }, [playingVerse]);

  // a recitation check is always about the page on screen
  useEffect(() => {
    if (mode === "recite" && recite.get().page !== page) void prepareRecite(page);
  }, [mode, page]);

  const onTap = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    const k = el.closest<HTMLElement>("[data-k]"), v = el.closest<HTMLElement>("[data-v]");
    if (mode === "recite") return k && setWord(+k.dataset.k!);
    if (v) {
      const i = +v.dataset.v!;
      if (mode === "memorize" && ui.get().revealed[i] !== 2) return revealStep(i);
      return setVerse(i);
    }
    if (mode === "read") ui.set((s) => ({ chrome: !s.chrome }));
  };

  return (
    <div className="flex h-full flex-col">
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", chrome ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden"><TopBar /></div>
      </div>
      <div ref={scroller} dir="rtl" onClick={onTap} className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain">
        {slots.map((p) => (
          <div key={p} className="h-full w-full shrink-0 snap-center snap-always px-3 py-2" dir="ltr">
            <div className="mx-auto h-full max-w-[34rem]"><MushafPage p={p} /></div>
          </div>
        ))}
      </div>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", chrome ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden"><ReaderDock /></div>
      </div>
      <VerseSheet verse={verse} onClose={() => setVerse(null)} />
      <WordSheet k={word} onClose={() => setWord(null)} />
    </div>
  );
}
