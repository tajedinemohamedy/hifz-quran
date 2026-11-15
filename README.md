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

- **Today**: daily plan (new page, recent review of the last 7 pages, rotating old review, daily quiz),
  reading/recitation counters, the 60-hizb map and a 4-week calendar.
- **Mushaf**: 604 pages swiped right-to-left. Listen (Sheikh Mohamed Laghdaf, with ayah and word highlighting
  and auto page-follow). Read / Hint / Hide modes. **Recite** checks a recitation word by word with the
  on-device model. Tap a verse to listen, mark it weak, bookmark it, copy it, or see its mutashabihat.
- **Practice**: memorization quiz (hizb, thumn, pages, or your mistakes) and mutashabihat rounds/browser.

Search (header) covers surahs, juz, bookmarks, `page`, `surah:aya` (Warsh numbering), words without
diacritics, and **recite to find**, which locates a verse from a few seconds of recitation.

## Structure

```
public/data      quran.json (KFGQPC Warsh v10 verses, thumns, juz), mut.json (mutashabihat)
public/fonts     warsh10.woff2
public/engine    dsp.js + tracker.js (shared by page and worker), worker.js (ONNX model, tasmee3 + find)
src/lib          one module per domain: quran, prefs, plan, audio, recognition, recite, quiz, mut, search, ui, i18n
src/components   App shell, reader/, today/, practice/, shared ui
scripts/extract-data.mjs   re-imports data, font and engine from the original single-file hifz app
```

Progress is stored in the browser under `hifz_app_v1`, in the same format as the original app's backup
code, so old backup codes restore here.
