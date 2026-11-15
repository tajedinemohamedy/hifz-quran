# مصحف الحفظ · Hifz Mushaf (Warsh)

A mobile-first Quran app for reading, listening, memorizing, reciting and reviewing in Warsh 'an Nafi'.
Arabic, French and English, RTL/LTR, light/dark. It's a static Next.js SPA with no server: data, audio
timings and the speech model all run on the device.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out (deploy anywhere; https is needed for the microphone)
```

## Three tabs

- **Today**: progress at a glance, then the day's tasks (new page, recent review, long review, quiz),
  each with one action. Tap the progress card for the 60-hizb map, the calendar and mastery scores.
- **Mushaf**: 604 pages swiped right-to-left. The dock shows three actions and turns into the active one:
  **Listen** (Sheikh Mohamed Laghdaf, ayah + word highlighting, the page follows), **Memorize** (tap a
  verse: first word, then all of it), **Recite** (the on-device model checks the page word by word, live).
  Tap the surah title to search or jump; tap a verse to listen, mark it for review, copy it or see similar passages.
- **Practice**: recent-pages quiz, your mistakes, and similar phrases. Other ranges and browsing open in sheets.

## Design system

- shadcn/ui (Radix, RTL) + one token set in `src/app/globals.css` (shadcn names plus `paper` and `warning`).
- `src/components/kit.tsx`: the app's composites (Sheet on Vaul, Segmented, Row, Card, Session, Choice…).
- `src/lib/notify.ts`: every success and failure goes through Sonner (top, swipeable in all directions).
- The recognition pipeline (`src/lib/recognition.ts` + `public/engine/worker.js`) publishes each stage
  (engine download/compile, microphone, voice, step time) and an activity log; `EngineStatus.tsx` shows it.

## Structure

```
public/data      quran.json (KFGQPC Warsh v10 verses, thumns, juz), mut.json (mutashabihat)
public/fonts     warsh10.woff2
public/engine    dsp.js + tracker.js (shared by page and worker), worker.js (ONNX model, tasmee3 + find)
src/lib          one module per domain: quran, prefs, plan, audio, recognition, recite, quiz, mut, search, ui, i18n, notify
src/components   App shell, kit, reader/, today/, practice/, ui/ (shadcn)
scripts/extract-data.mjs   re-imports data, font and engine from the original single-file hifz app
```

Progress is stored in the browser under `hifz_app_v1`, in the same format as the original app's backup
code, so old backup codes restore here.
