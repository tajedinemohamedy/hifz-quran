/* Offline search: surah names (Arabic or Latin), page / surah / verse numbers, and verse text without diacritics. */
import { base, PAGES, quran, verseIndex, ayaCount } from "./quran";
import { SURA_LATIN } from "./surahNames";

export interface SearchResult { page: number | null; verse: number | null; suras: number[]; verses: number[]; total: number }

let plain: string[] | null = null;
const plainVerses = () => (plain ||= quran().V.map((v) => base(v[3].join(" "))));
const latin = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
const digits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));

const MAX_VERSES = 60;

export function search(raw: string): SearchResult {
  const q = digits(raw.trim());
  const out: SearchResult = { page: null, verse: null, suras: [], verses: [], total: 0 };
  if (!q) return out;
  const ref = q.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);           // 2:255
  if (ref) {
    const s = +ref[1], a = +ref[2];
    if (s >= 1 && s <= 114 && a >= 1 && a <= ayaCount(s)) out.verse = verseIndex(s, a);
    return out;
  }
  const num = q.match(/^(?:p|page|ص|صفحة)?\s*(\d{1,3})$/i);
  if (num) {
    const n = +num[1];
    if (n >= 1 && n <= PAGES) out.page = n;
    if (n >= 1 && n <= 114) out.suras.push(n);
    return out;
  }
  const qa = base(q), ql = latin(q);
  quran().names.forEach((name, k) => {
    if ((qa && base(name).includes(qa)) || (ql.length > 1 && latin(SURA_LATIN[k]).includes(ql))) out.suras.push(k + 1);
  });
  if (qa.length >= 2) {
    const pv = plainVerses();
    for (let i = 0; i < pv.length; i++) if (pv[i].includes(qa)) { out.total++; if (out.verses.length < MAX_VERSES) out.verses.push(i); }
  }
  return out;
}
