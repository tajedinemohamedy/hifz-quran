// One-off import of the hifz-app single file into this project's static assets.
// Usage: node scripts/extract-data.mjs <path-to-hifz-app/index.html>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("pass the path to hifz-app/index.html");
const html = readFileSync(src, "utf8");
const pub = join(import.meta.dirname, "..", "public");
mkdirSync(join(pub, "data"), { recursive: true });
mkdirSync(join(pub, "fonts"), { recursive: true });
mkdirSync(join(pub, "engine"), { recursive: true });

// Quran data (verses, surah names, juz starts, thumn table, mutashabihat)
const line = html.split("\n").find((l) => l.startsWith("const D = {"));
const D = JSON.parse(line.slice("const D = ".length).replace(/;\s*$/, ""));
writeFileSync(join(pub, "data", "quran.json"), JSON.stringify({ names: D.names, J: D.J, M: D.M, T: D.T.filter((t) => t.r).map(({ h, k, v, wi, r, inf }) => [h, k, v, wi, r[0], r[1], inf ? 1 : 0]), V: D.V }));
writeFileSync(join(pub, "data", "mut.json"), JSON.stringify(D.G));

// Warsh font
const font = html.match(/font-family:"warsh10"; src:url\(data:font\/woff2;base64,([^)]+)\)/);
writeFileSync(join(pub, "fonts", "warsh10.woff2"), Buffer.from(font[1], "base64"));

// recognition engine (DSP + tracker are pure, shared by worker and page)
for (const [id, file] of [["js-dsp", "dsp.js"], ["js-tracker", "tracker.js"]]) {
  const m = html.match(new RegExp(`<script[^>]*id="${id}">([\\s\\S]*?)</script>`));
  writeFileSync(join(pub, "engine", file), m[1].trim() + "\n");
}
console.log("verses", D.V.length, "groups", D.G.length, "thumns", D.T.length);
