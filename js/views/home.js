// หน้าแรก: ปุ่มหลัก 2 ปุ่ม และลิงก์ไปหน้าอื่น
// weather-slot แสดงอากาศวันนี้ ถ้าไม่มีเน็ตจะว่างไว้ (ซ่อนด้วย .slot:empty)

function renderHome(container) {
  container.innerHTML = `
    <h2 tabindex="-1">วันนี้จะดูแปลงไหน</h2>
    <p>บอกสภาพดินของแปลง แล้วแอปจะแนะนำพืชที่เหมาะ 3 อย่าง</p>
    <div id="weather-slot" class="slot"></div>
    <a class="btn btn-primary" href="#/input">ตรวจแปลงใหม่</a>
    <a class="btn btn-secondary" href="#/plots">แปลงของฉัน</a>
    <nav aria-label="หน้าอื่น ๆ" class="menu-list">
      ${menuRowHtml("#/calendar", ICON_CALENDAR, "ปฏิทินปลูก", "ดูว่าเดือนไหนควรปลูกพืชอะไร")}
      ${menuRowHtml("#/settings", ICON_SETTINGS, "ตั้งค่า", "ขนาดตัวอักษร เสียงอ่าน และอื่น ๆ")}
    </nav>
  `;
  showTodayWeather(container.querySelector("#weather-slot"));
}

// ไอคอนเส้น ฝังในโค้ดเลยจึงใช้ออฟไลน์ได้โดยไม่ต้องเพิ่มไฟล์ที่ต้องแคช (task 20)
const ICON_CALENDAR = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/>
  <path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 18h2"/></svg>`;
const ICON_SETTINGS = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/>
  <circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>`;

// การ์ดเมนูแถวยาว: ไอคอน + ชื่อ + คำอธิบาย + ลูกศร กดได้ทั้งแถว (แบบหน้าเมนูของ Dragonfly)
function menuRowHtml(href, icon, title, hint) {
  return `<a class="menu-row" href="${href}">
    <span class="menu-icon" aria-hidden="true">${icon}</span>
    <span class="menu-text"><span class="menu-title">${title}</span><span class="menu-hint">${hint}</span></span>
    <span class="menu-arrow" aria-hidden="true">›</span>
  </a>`;
}

// ไอคอนอากาศ 3 แบบ (task 20 ช่วงที่ 3 แบบการ์ดอากาศของ Dragonfly) วาดเอง ฝังในโค้ด ใช้ออฟไลน์ได้
// ดวงอาทิตย์ใช้สีขมิ้นมีขอบดินดำ เมฆสีขาวขอบดินดำ ฝนสีม่อฮ่อม (เป็นภาพประกอบ มีคำกำกับเสมอ)
const SUN_SVG = `<circle cx="22" cy="22" r="9" fill="var(--color-accent)" stroke="var(--color-ink)" stroke-width="2"/>
  <path d="M22 5v5M22 34v5M5 22h5M34 22h5M10 10l3.5 3.5M30.5 30.5L34 34M10 34l3.5-3.5M30.5 13.5L34 10"
  stroke="var(--color-ink)" stroke-width="2.5" stroke-linecap="round"/>`;
const CLOUD_SVG = `<path d="M16 46h28a9 9 0 0 0 0-18 13 13 0 0 0-25-2 10 10 0 0 0-3 20z"
  fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="2.5" stroke-linejoin="round"/>`;
const RAIN_SVG = `<path d="M22 50l-3 7M32 50l-3 7M42 50l-3 7" stroke="var(--color-primary)" stroke-width="3"
  stroke-linecap="round"/>`;

const WEATHER_LOOKS = {
  low: { word: "ฝนไม่น่าตก", picture: SUN_SVG },
  maybe: { word: "อาจมีฝน", picture: `<g transform="translate(-4 -6)">${SUN_SVG}</g>${CLOUD_SVG}` },
  likely: { word: "ฝนน่าจะตก", picture: `<g transform="translate(0 -6)">${CLOUD_SVG}</g>${RAIN_SVG}` },
};

function weatherIconHtml(level) {
  return `<svg class="weather-icon" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
    ${WEATHER_LOOKS[level].picture}</svg>`;
}

// แถวบนของการ์ด: ไอคอน + คำสั้น ๆ + ช่วงอุณหภูมิวันนี้ (ค่าไหนไม่มีก็ไม่แสดงส่วนนั้น)
function weatherHeadlineHtml(today) {
  const level = rainLevel(today.rainChance);
  const hasRange = Number.isFinite(today.minC) && Number.isFinite(today.maxC); // ไม่มีค่า = ไม่แสดง
  if (!level && !hasRange) return "";
  const range = hasRange
    ? `<p class="weather-range">วันนี้ ${Math.round(today.minC)}–${Math.round(today.maxC)} องศา</p>` : "";
  return `<div class="weather-headline">
    ${level ? weatherIconHtml(level) : ""}
    <div>${level ? `<p class="weather-word">${WEATHER_LOOKS[level].word}</p>` : ""}${range}</div>
  </div>`;
}

// ค่าที่ได้จาก Open-Meteo มีทศนิยม แสดงเป็นจำนวนเต็มให้อ่านง่าย
function todayWeatherHtml(today) {
  const items = [];
  if (today.tempC !== null) {
    items.push(`<div class="weather-item"><span class="weather-label">อุณหภูมิตอนนี้</span>
      <span class="weather-value">${Math.round(today.tempC)}°</span></div>`);
  }
  if (today.rainChance !== null) {
    items.push(`<div class="weather-item"><span class="weather-label">โอกาสฝนวันนี้</span>
      <span class="weather-value">${Math.round(today.rainChance)}%</span></div>`);
  }
  const time = today.updatedAt ? ` เวลา ${today.updatedAt} น.` : "";
  return `<section class="weather-card" aria-label="อากาศวันนี้ที่แม่ทะ">
    <h3>อากาศวันนี้ที่แม่ทะ</h3>
    ${weatherHeadlineHtml(today)}
    <div class="weather-row">${items.join("")}</div>
    <p class="source-line">ที่มา: พยากรณ์อากาศจาก Open-Meteo${time}</p>
  </section>`;
}

async function showTodayWeather(slot) {
  const today = await getToday();
  if (!today || !slot.isConnected) return; // ไม่มีเน็ต หรือผู้ใช้ออกจากหน้าแรกไปแล้ว
  slot.innerHTML = todayWeatherHtml(today);
}
