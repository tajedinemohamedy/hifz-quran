"use client";
/* One place to go anywhere: surah and juz index, bookmarks, page / verse numbers, words, or a recited verse. */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Bookmark, Mic, Search, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ayaCount, base, pageOfSura, pageOfVerse, quran, range, verseText } from "@/lib/quran";
import { search } from "@/lib/search";
import { prefs } from "@/lib/prefs";
import { openReader, ui } from "@/lib/ui";
import { engine, listen, log, onEngine, stopListening } from "@/lib/recognition";
import { Row, Segmented, Sheet, VerseText } from "./kit";
import { ActivityLog, EngineHeadline, PipelineSteps } from "./EngineStatus";

type Browse = "surahs" | "juzs" | "bookmarks";
type Found = { verse: number; score: number }[] | "searching" | "short" | null;

/** Verse text with the matched letters highlighted (matching ignores marks, so map back by letter). */
function Highlight({ verse, q }: { verse: number; q: string }) {
  const chars = [...verseText(verse)], qb = base(q);
  const map: number[] = [];
  let plain = "";
  chars.forEach((ch, idx) => { for (const c of base(ch)) { plain += c; map.push(idx); } });
  const at = qb ? plain.indexOf(qb) : -1;
  if (at < 0) return <>{chars.join("")}</>;
  const s = map[at];
  let e = map[at + qb.length - 1] + 1;
  while (e < chars.length && base(chars[e]) === "" && chars[e] !== " ") e++;
  return <>{chars.slice(0, s).join("")}<mark className="rounded bg-warning-soft text-inherit">{chars.slice(s, e).join("")}</mark>{chars.slice(e).join("")}</>;
}

function FindPanel({ found }: { found: Found }) {
  const { t } = useT();
  const finding = engine.use((s) => s.mode === "find");
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 duration-300 animate-in fade-in slide-in-from-top-2">
      <PipelineSteps />
      {finding ? <EngineHeadline /> : (
        <p key={String(found)} className="text-[15px] font-semibold duration-300 animate-in fade-in">
          {found === "searching" ? t("findSearching") : found === "short" ? t("findShort") : Array.isArray(found) && found.length ? t("findResults", { n: found.length }) : t("findNone")}
        </p>
      )}
      <ActivityLog />
    </div>
  );
}

export function IndexSheet() {
  const { t, n, sura, where } = useT();
  const open = ui.use((s) => s.overlay === "index");
  const bookmarks = prefs.use((s) => s.bookmarks);
  const finding = engine.use((s) => s.mode === "find");
  const [q, setQ] = useState("");
  const [browse, setBrowse] = useState<Browse>("surahs");
  const [found, setFound] = useState<Found>(null);
  const dq = useDeferredValue(q);
  const res = useMemo(() => (open && dq.trim() ? search(dq) : null), [dq, open]);

  useEffect(() => onEngine((e) => {
    if (e.type === "finding") setFound("searching");
    if (e.type === "found") { setFound(e.tooShort ? "short" : e.results); log(e.results.length ? "ok" : "warn", "logFound", { n: e.results.length }); }
  }), []);

  const close = () => { if (finding) stopListening(); ui.set({ overlay: null }); };
  const go = (target: { page?: number; verse?: number }) => { setFound(null); setQ(""); openReader(target); };
  const toggleFind = () => {
    if (finding) { const heard = engine.get().mic === "on"; stopListening(); setFound(heard ? "searching" : null); }
    else { setQ(""); setFound(null); void listen("find"); }
  };

  const verseRow = (v: number, sub?: string) => (
    <Row key={v} onClick={() => go({ verse: v })} title={<VerseText className="truncate text-[19px]">{q ? <Highlight verse={v} q={q} /> : verseText(v)}</VerseText>} sub={sub ?? where(v, true)} />
  );
  const showFind = finding || found != null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} tall title={t("goTo")}>
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setFound(null); }} placeholder={t("searchHint")} aria-label={t("search")}
            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground" />
          <button onClick={toggleFind} aria-label={t("findRecite")}
            className={cn("flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors", finding ? "bg-destructive text-white" : "bg-primary text-primary-foreground")}>
            {finding ? <Square className="size-3.5" fill="currentColor" /> : <Mic className="size-3.5" />}
            {finding ? t("stop") : t("recite")}
          </button>
        </div>
      </div>

      {showFind ? (
        <div className="space-y-1">
          <FindPanel found={found} />
          {Array.isArray(found) && found.map((f) => verseRow(f.verse, `${where(f.verse, true)} · ${t("percent", { n: f.score })}`))}
        </div>
      ) : res ? (
        <div className="divide-y divide-border">
          {res.page && <Row onClick={() => go({ page: res.page! })} lead={n(res.page)} title={t("goPage", { n: res.page })} />}
          {res.verse != null && verseRow(res.verse)}
          {res.suras.map((s) => <Row key={s} onClick={() => go({ page: pageOfSura(s) })} lead={n(s)} title={sura(s)} sub={t("ayahs", { n: ayaCount(s) })} />)}
          {res.verses.length > 0 && <p className="px-1 pb-1 pt-4 text-[13px] font-semibold text-muted-foreground">{res.total > res.verses.length ? t("moreResults", { n: res.total, m: res.verses.length }) : t("versesCount", { n: res.total })}</p>}
          {res.verses.map((v) => verseRow(v))}
          {!res.page && res.verse == null && !res.suras.length && !res.verses.length && <p className="py-12 text-center text-muted-foreground">{t("noResults")}</p>}
        </div>
      ) : (
        <div>
          <Segmented<Browse> value={browse} onChange={setBrowse} className="mb-1" options={[["surahs", t("surahs")], ["juzs", t("juzs")], ["bookmarks", t("bookmarks")]]} />
          {browse === "surahs" && (
            <div className="divide-y divide-border">
              {range(1, 114).map((s) => (
                <Row key={s} onClick={() => go({ page: pageOfSura(s) })} lead={n(s)} title={sura(s)}
                  sub={`${t("ayahs", { n: ayaCount(s) })} · ${t("page", { n: pageOfSura(s) })}`} end={<VerseText className="text-[19px] text-muted-foreground">{quran().names[s - 1]}</VerseText>} />
              ))}
            </div>
          )}
          {browse === "juzs" && (
            <div className="grid grid-cols-5 gap-2 py-2">
              {quran().juzStart.map((v, j) => (
                <button key={j} onClick={() => go({ page: pageOfVerse(v) })} className="rounded-xl bg-card py-3 text-center transition-transform active:scale-95">
                  <b className="block text-[17px] tabular-nums">{n(j + 1)}</b><span className="text-[11px] text-muted-foreground">{t("pageOne", { a: pageOfVerse(v) })}</span>
                </button>
              ))}
            </div>
          )}
          {browse === "bookmarks" && (bookmarks.length ? (
            <div className="divide-y divide-border">
              {[...bookmarks].sort((a, b) => a - b).map((p) => (
                <Row key={p} onClick={() => go({ page: p })} lead={<Bookmark className="size-4 text-warning" fill="currentColor" />} title={t("page", { n: p })} sub={where(quran().pageStart[p])} />
              ))}
            </div>
          ) : <p className="py-12 text-center text-[14px] text-muted-foreground">{t("noBookmarks")}</p>)}
        </div>
      )}
    </Sheet>
  );
}
