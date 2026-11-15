/* Offline: the app shell and data are cached as they are fetched (stale-while-revalidate);
   recitation timings are cached once played (the audio streams from the network). */
const CACHE = "hifz-v1";
const AUDIO = "hifz-audio-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("hifz-") && k !== CACHE && k !== AUDIO).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || req.headers.has("range")) return; // audio seeking uses ranges: leave it to the network
  const mine = u.origin === location.origin;
  const recitation = u.hostname === "raw.githubusercontent.com" && u.pathname.includes("/khatmah-recitations/") && u.pathname.endsWith(".json");
  const cdn = u.hostname === "cdn.jsdelivr.net" || u.hostname.endsWith("fonts.gstatic.com");
  if (!mine && !recitation && !cdn) return;
  e.respondWith(caches.open(recitation ? AUDIO : CACHE).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
