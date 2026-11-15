/* Recitation player: Sheikh Mohamed Laghdaf (Warsh), one opus file per surah with ayah and word timings,
   the same source and segment rules as the khatmah app. */
import { createStore } from "./store";
import { ayaCount, quran, verseIndex } from "./quran";

export const RECITER = {
  id: "mohamed-laghdaf",
  name: "الشيخ محمد لغظف ولد محمد سيدي",
  base: "https://raw.githubusercontent.com/LhacenMed/khatmah-recitations/main/warsh/mohamed-laghdaf",
};

interface Segment { start: number; end: number; words?: { start: number; end: number }[] }
interface Timeline { sura: number; segs: Segment[] } // segs[k] is aya k + 1

export interface PlayerState {
  verse: number | null; // verse index being recited
  word: number | null; // word index inside that verse
  playing: boolean;
  loading: boolean;
  error: boolean;
}
export const player = createStore<PlayerState>({ verse: null, word: null, playing: false, loading: false, error: false });

const timelines = new Map<number, Promise<Timeline>>();
function timeline(sura: number) {
  if (!timelines.has(sura)) {
    timelines.set(sura, fetch(`${RECITER.base}/transcript/${sura}.json`).then((r) => {
      if (!r.ok) throw new Error("transcript");
      return r.json();
    }).then((segs: Segment[]) => {
      const basmala = sura !== 1 && sura !== 9 && segs.length > ayaCount(sura);
      return { sura, segs: basmala ? segs.slice(1) : segs };
    }));
    timelines.get(sura)!.catch(() => timelines.delete(sura));
  }
  return timelines.get(sura)!;
}

let audio: HTMLAudioElement | null = null;
let current: Timeline | null = null;
let raf = 0;

function el() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("playing", () => player.set({ playing: true, loading: false }));
  audio.addEventListener("pause", () => player.set({ playing: false }));
  audio.addEventListener("waiting", () => player.set({ loading: true }));
  audio.addEventListener("error", () => player.set({ playing: false, loading: false, error: true }));
  audio.addEventListener("ended", () => {
    if (current && current.sura < 114) void playVerse(verseIndex(current.sura + 1, 1));
    else stop();
  });
  return audio;
}

/** Highlight follows the audio clock every frame (ayah from segment starts, word from word starts). */
function follow() {
  cancelAnimationFrame(raf);
  const tick = () => {
    if (!audio || !current) return;
    const t = audio.currentTime, segs = current.segs;
    let k = 0;
    while (k + 1 < segs.length && t >= segs[k + 1].start) k++;
    const verse = verseIndex(current.sura, k + 1);
    let word: number | null = null;
    const ws = segs[k].words, n = quran().V[verse]?.[3].length ?? 0;
    if (ws && ws.length >= n) {
      let w = -1;
      for (let j = 0; j < ws.length && t >= ws[j].start; j++) w = j;
      const own = w - (ws.length - n); // extra leading words (basmala inside al-Fatiha's first segment)
      word = own >= 0 ? own : null;
    }
    const s = player.get();
    if (s.verse !== verse || s.word !== word) player.set({ verse, word });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

export async function playVerse(i: number) {
  const [sura, aya] = quran().V[i];
  const a = el();
  player.set({ verse: i, word: null, loading: true, error: false });
  try {
    const tl = await timeline(sura);
    const src = `${RECITER.base}/audio/${sura}.opus`;
    if (a.src !== src) a.src = src;
    current = tl;
    const seg = tl.segs[aya - 1];
    const seek = aya === 1 ? 0 : seg ? seg.start : 0;
    if (a.readyState < 1) await new Promise((res) => a.addEventListener("loadedmetadata", res, { once: true }));
    a.currentTime = seek;
    await a.play();
    follow();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: quran().names[sura - 1], artist: RECITER.name });
      navigator.mediaSession.setActionHandler("play", () => void a.play());
      navigator.mediaSession.setActionHandler("pause", () => a.pause());
    }
  } catch {
    player.set({ loading: false, playing: false, error: true });
  }
}

export function toggle(fromVerse: number) {
  const s = player.get();
  if (s.playing) return audio?.pause();
  if (audio && current && s.verse != null) { void audio.play(); return follow(); }
  void playVerse(fromVerse);
}

export function stop() {
  cancelAnimationFrame(raf);
  audio?.pause();
  current = null;
  player.set({ verse: null, word: null, playing: false, loading: false });
}
