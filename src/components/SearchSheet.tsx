"use client";
/* One place to find anything: surah index, juz, bookmarks, page / verse numbers, words, or a recited verse. */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { ayaCount, base, pageOfSura, pageOfVerse, quran, range, verseText } from "@/lib/quran";
import { search } from "@/lib/search";
import { prefs } from "@/lib/prefs";
import { openReader, ui } from "@/lib/ui";
import { engine, listen, onEngine, stopListening } from "@/lib/recognition";
import { Icon } from "./icons";
import { Segmented, Sheet } from "./ui";

type Browse = "surahs" | "juzs" | "bookmarks";
type Found = { verse: number; score: number }[] | "searching" | null;

const Row = ({ onClick, start, title, sub, end }: { onClick: () => void; start?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; end?: React.ReactNode }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-line px-1 py-3 text-start last:border-0 active:bg-surface-2">
    {start != null && <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold tabular-nums text-muted">{start}</span>}
    <span className="min-w-0 flex-1"><span className="block truncate text-[15px]">{title}</span>{sub && <span className="block truncate text-[12px] text-muted">{sub}</span>}</span>
    {end}
  </button>
);

/** Verse text with the matched letters highlighted (match runs on letters only, so map back by letter count). */
function Highlight({ verse, q }: { verse: number; q: string }) {
  const text = verseText(verse), qb = base(q);
  const map: number[] = [];
  let plain = "";
  [...text].forEach((ch, idx) => { const b = base(ch); for (const c of b) { plain += c; map.push(idx); } });
  const at = qb ? plain.indexOf(qb) : -1, chars = [...text];
  if (at < 0) return <>{text}</>;
  const s = map[at], e = map[at + qb.length - 1] + 1;
  let end = e; while (end < chars.length && base(chars[end]) === "" && chars[end] !== " ") end++;
  return <>{chars.slice(0, s).join("")}<mark className="rounded bg-gold-soft text-inherit">{chars.slice(s, end).join("")}</mark>{chars.slice(end).join("")}</>;
}

export function SearchSheet() {
  const { t, n, sura, where } = useT();
  const open = ui.use((s) => s.overlay === "search");
  const bookmarks = prefs.use((s) => s.bookmarks);
  const [q, setQ] = useState("");
  const [browse, setBrowse] = useState<Browse>("surahs");
  const [found, setFound] = useState<Found>(null);
  const finding = engine.use((s) => s.mode === "find");
  const phase = engine.use((s) => s.phase), progress = engine.use((s) => s.progress);
  const dq = useDeferredValue(q);
  const res = useMemo(() => (open ? search(dq) : null), [dq, open]);

  useEffect(() => onEngine((e) => { if (e.type === "found") setFound(e.results); }), []);
  const close = () => { if (finding) stopListening(); setFound(null); ui.set({ overlay: null }); };
  const go = (target: { page?: number; verse?: number }) => { setFound(null); openReader(target); };
  const toggleFind = () => {
    if (finding) { stopListening(); setFound("searching"); }
    else { setQ(""); setFound(null); void listen("find"); }
  };

  const verseRow = (v: number, sub?: React.ReactNode) => (
    <Row key={v} onClick={() => go({ verse: v })} title={<span className="quran text-[19px]" dir="rtl">{q ? <Highlight verse={v} q={q} /> : verseText(v)}</span>} sub={sub ?? where(v, true)} />
  );

  return (
    <Sheet open={open} onClose={close} tall title={t("search")}>
      <div className="sticky top-0 z-10 bg-bg pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3">
          <Icon name="search" className="size-4 text-muted" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setFound(null); }} placeholder={t("searchHint")} aria-label={t("search")}
            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted" />
          <button onClick={toggleFind} aria-label={t("findRecite")} className={`grid size-8 place-items-center rounded-full ${finding ? "bg-danger text-white" : "text-accent"}`}>
            <Icon name={finding ? "stop" : "mic"} className="size-4" fill={finding} />
          </button>
        </div>
      </div>

      {finding || found ? (
        <div>
          <div className="mb-2 rounded-2xl bg-surface p-4 text-center text-[14px] text-muted">
            {finding
              ? phase === "ready" ? t("findListening") : phase === "download" ? `${t("tzDownloading")} · ${t("percent", { n: Math.round(progress * 100) })}` : phase === "error" ? t("tzModelError") : t("tzPreparing")
              : found === "searching" ? t("findSearching") : found!.length ? t("verses") : t("findNone")}
          </div>
          {Array.isArray(found) && found.map((f) => verseRow(f.verse, `${where(f.verse, true)} · ${t("percent", { n: f.score })}`))}
        </div>
      ) : q.trim() && res ? (
        <div>
          {res.page && <Row onClick={() => go({ page: res.page! })} start={<Icon name="book" className="size-4" />} title={t("goPage", { n: res.page })} />}
          {res.verse != null && verseRow(res.verse)}
          {res.suras.map((s) => <Row key={s} onClick={() => go({ page: pageOfSura(s) })} start={n(s)} title={sura(s)} sub={t("ayahs", { n: ayaCount(s) })} />)}
          {res.verses.length > 0 && <h3 className="mb-1 mt-4 text-[13px] font-semibold text-muted">{res.total > res.verses.length ? t("moreResults", { n: res.total, m: res.verses.length }) : `${t("verses")} · ${n(res.total)}`}</h3>}
          {res.verses.map((v) => verseRow(v))}
          {!res.page && res.verse == null && !res.suras.length && !res.verses.length && <p className="py-10 text-center text-muted">{t("noResults")}</p>}
        </div>
      ) : (
        <div>
          <Segmented<Browse> value={browse} onChange={setBrowse} className="mb-2" options={[["surahs", t("surahs")], ["juzs", t("juzs")], ["bookmarks", t("bookmarks")]]} />
          {browse === "surahs" && range(1, 114).map((s) => (
            <Row key={s} onClick={() => go({ page: pageOfSura(s) })} start={n(s)} title={sura(s)}
              sub={`${t("ayahs", { n: ayaCount(s) })} · ${t("page", { n: pageOfSura(s) })}`} end={<span className="quran text-[20px] text-muted">{quran().names[s - 1]}</span>} />
          ))}
          {browse === "juzs" && (
            <div className="grid grid-cols-5 gap-2 py-2">
              {quran().juzStart.map((v, j) => (
                <button key={j} onClick={() => go({ page: pageOfVerse(v) })} className="rounded-xl bg-surface py-3 text-center active:bg-surface-2">
                  <b className="block text-[17px] tabular-nums">{n(j + 1)}</b><span className="text-[11px] text-muted">{t("pageOne", { a: pageOfVerse(v) })}</span>
                </button>
              ))}
            </div>
          )}
          {browse === "bookmarks" && (bookmarks.length
            ? [...bookmarks].sort((a, b) => a - b).map((p) => {
              const v = quran().pageStart[p];
              return <Row key={p} onClick={() => go({ page: p })} start={<Icon name="bookmark" className="size-4" fill />} title={t("page", { n: p })} sub={where(v)} />;
            })
            : <p className="py-10 text-center text-muted">{t("noBookmarks")}</p>)}
        </div>
      )}
    </Sheet>
  );
}
