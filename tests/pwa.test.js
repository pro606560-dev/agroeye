// เทสต์ใช้ออฟไลน์ได้ (task 13): รายชื่อไฟล์ที่ service worker เก็บไว้ต้องครบ และเวอร์ชันต้องตรงกัน

// อ่านรายชื่อไฟล์ APP_FILES จาก sw.js แบบข้อความ (หน้าทดสอบรัน sw.js ตรง ๆ ไม่ได้)
async function cachedFileList() {
  const text = await fetchText("sw.js");
  const block = text.match(/const APP_FILES = \[([\s\S]*?)\];/)[1];
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

test("ออฟไลน์: เลขเวอร์ชันแคชใน sw.js ตรงกับ APP_VERSION", async () => {
  const text = await fetchText("sw.js");
  const version = text.match(/const CACHE_VERSION = "([^"]+)"/)[1];
  assertEqual(version, APP_VERSION);
});

test("ออฟไลน์: ทุกไฟล์ที่ index.html เรียก อยู่ในรายชื่อแคช", async () => {
  const html = await fetchText("index.html");
  const used = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((match) => match[1]);
  const list = await cachedFileList();
  const missing = used.filter((file) => !list.includes(file));
  assertEqual(missing, []);
});

test("ออฟไลน์: ไฟล์ข้อมูลที่แอปอ่าน อยู่ในรายชื่อแคช", async () => {
  const list = await cachedFileList();
  for (const url of [CROPS_URL, SURVEY_POINTS_URL, SOURCES_URL, CLIMATE_URL]) {
    assertTrue(list.includes(url), `${url} ไม่อยู่ในรายชื่อแคช`);
  }
});

test("ออฟไลน์: ทุกไฟล์ในรายชื่อแคชเปิดได้จริง (ถ้ามีไฟล์เดียวหาย จะติดตั้งไม่สำเร็จ)", async () => {
  const list = await cachedFileList();
  const broken = [];
  for (const file of list) {
    const response = await fetch(file, { cache: "no-store" });
    if (!response.ok) broken.push(file);
  }
  assertEqual(broken, []);
});

test("ออฟไลน์: ไม่เก็บ Open-Meteo หรือ Gemini ไว้ในแคช", async () => {
  const list = await cachedFileList();
  assertEqual(list.filter((file) => file.startsWith("http")), []);
});

test("ติดตั้งแอป: manifest มีไอคอน 192 และ 512 และใช้ที่อยู่แบบ relative", async () => {
  const manifest = await fetchJson("manifest.webmanifest");
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assertEqual(sizes, ["192x192", "512x512"]);
  assertEqual([manifest.start_url, manifest.scope], ["./", "./"]);
  assertEqual(manifest.short_name, "AgroEye");
});
