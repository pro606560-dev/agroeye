// service worker: เก็บไฟล์ของแอปไว้ในเครื่อง เพื่อให้เปิดแอปได้แม้ไม่มีเน็ต
// ทุกครั้งที่แก้ไฟล์ของแอป ต้องเปลี่ยน CACHE_VERSION ให้ตรงกับ APP_VERSION ใน js/config.js
// (tests.html ตรวจให้ว่าตรงกัน) เครื่องผู้ใช้จึงจะรู้ว่ามีเวอร์ชันใหม่

const CACHE_VERSION = "1.2";
const CACHE_NAME = `agroeye-v${CACHE_VERSION}`;

// ไฟล์ทั้งหมดที่แอปใช้ (tests.html ตรวจว่าทุกไฟล์ที่ index.html เรียกอยู่ในรายการนี้)
const APP_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "css/input.css",
  "css/result.css",
  "css/crop.css",
  "css/home.css",
  "css/plots.css",
  "css/calendar.css",
  "css/proof.css",
  "css/settings.css",
  "js/config.js",
  "js/validate.js",
  "js/data.js",
  "js/scoring.js",
  "js/weather.js",
  "js/reasons.js",
  "js/storage.js",
  "js/prefs.js",
  "js/plots-store.js",
  "js/plantings-store.js",
  "js/router.js",
  "js/wizard.js",
  "js/result-logic.js",
  "js/crop-logic.js",
  "js/soil-test.js",
  "js/calendar-logic.js",
  "js/pwa.js",
  "js/speech-text.js",
  "js/speech.js",
  "js/ai.js",
  "js/views/placeholder.js",
  "js/views/home.js",
  "js/views/soil-steps.js",
  "js/views/input-steps.js",
  "js/views/input.js",
  "js/views/result.js",
  "js/views/crop.js",
  "js/views/ai-box.js",
  "js/views/plots.js",
  "js/views/plantings.js",
  "js/views/calendar.js",
  "js/proof-logic.js",
  "js/proof-export.js",
  "js/result-export.js",
  "js/views/proof.js",
  "js/views/proof-timing.js",
  "js/views/settings.js",
  "js/views/settings-more.js",
  "lib/chartjs/chart.umd.min.js",
  "js/app.js",
  "data/crops.json",
  "data/survey-points.json",
  "data/SOURCES.md",
  "data/climate-maetha.json",
  "data/test-scenarios.json",
  "assets/light-shade.svg",
  "assets/light-sun.svg",
  "assets/soil-heavy.svg",
  "assets/soil-light.svg",
  "assets/soil-medium.svg",
  "assets/unknown.svg",
  "assets/water-good.svg",
  "assets/water-poor.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
];

// ติดตั้ง: โหลดไฟล์ทั้งหมดเก็บไว้ก่อน (ยังไม่เริ่มใช้ จนกว่าผู้ใช้แตะ "อัปเดต")
// cache: "reload" = โหลดจากเซิร์ฟเวอร์จริง ไม่หยิบไฟล์เก่าที่เบราว์เซอร์จำไว้ (GitHub Pages ให้จำไว้ 10 นาที)
self.addEventListener("install", (event) => {
  const requests = APP_FILES.map((file) => new Request(file, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(requests)));
});

// เริ่มใช้เวอร์ชันนี้: ลบแคชของเวอร์ชันเก่าทิ้ง (ข้อมูลแปลงอยู่ใน localStorage ไม่ได้อยู่ในแคช จึงไม่หาย)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => names.filter((name) => name.startsWith("agroeye-") && name !== CACHE_NAME))
      .then((oldNames) => Promise.all(oldNames.map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// หน้าแอปส่งข้อความนี้มาเมื่อผู้ใช้แตะแถบ "มีเวอร์ชันใหม่"
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

// หน้าทดสอบต้องเห็นโค้ดล่าสุดเสมอ จึงไม่ใช้แคชกับ tests.html และไฟล์ที่มันเรียก
async function isFromTestPage(event) {
  if (event.request.url.includes("tests.html")) return true;
  const client = event.clientId ? await self.clients.get(event.clientId) : null;
  return Boolean(client && client.url.includes("tests.html"));
}

// cache-first: มีในเครื่องใช้ของในเครื่อง ไม่มีค่อยโหลดจากเน็ต
async function cacheFirst(event) {
  if (await isFromTestPage(event)) return fetch(event.request);
  const cached = await caches.match(event.request, { ignoreSearch: true });
  return cached || fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // network-only: Open-Meteo, Gemini และเว็บอื่นทั้งหมด ไม่ยุ่ง ปล่อยให้เบราว์เซอร์โหลดเอง
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(cacheFirst(event));
});
