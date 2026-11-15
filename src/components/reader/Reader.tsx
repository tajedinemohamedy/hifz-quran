"use client";
/* The mushaf: 604 pages in a native swipe pager (right-to-left like a printed mushaf), with the dock and sheets on top. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PAGES, pageOfVerse } from "@/lib/quran";
import { setPage, ui, reveal } from "@/lib/ui";
import { player } from "@/lib/audio";
import { prepareRecite, recite } from "@/lib/recite";
import { MushafPage } from "./MushafPage";
import { ReaderDock } from "./ReaderDock";
import { VerseSheet } from "./VerseSheet";
import { WordSheet } from "./WordSheet";

const slotsAround = (p: number) => [p - 1, p, p + 1].filter((x) => x >= 1 && x <= PAGES);
/** Shows the current page: it is the second slot unless it is page 1. */
const centre = (el: HTMLDivElement | null) => { if (el) el.scrollLeft = -(ui.get().page > 1 ? 1 : 0) * el.clientWidth; };

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
    if (mode === "recite" && k) return setWord(+k.dataset.k!);
    if (v && mode !== "recite") {
      const i = +v.dataset.v!;
      if ((mode === "hide" || mode === "hint") && !ui.get().revealed.includes(i)) return reveal(i);
      return setVerse(i);
    }
    ui.set((s) => ({ chrome: !s.chrome }));
  };

  return (
    <div className="relative h-full">
      <div ref={scroller} dir="rtl" onClick={onTap} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain">
        {slots.map((p) => (
          <div key={p} className={`h-full w-full shrink-0 snap-center snap-always px-3 pt-2 ${chrome ? "pb-[7.5rem]" : "pb-[max(0.5rem,env(safe-area-inset-bottom))]"}`} dir="ltr">
            <div className="mx-auto h-full max-w-[34rem]"><MushafPage p={p} /></div>
          </div>
        ))}
      </div>
      <ReaderDock />
      <VerseSheet verse={verse} onClose={() => setVerse(null)} />
      <WordSheet k={word} onClose={() => setWord(null)} />
    </div>
  );
}
