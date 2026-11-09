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
  return `<section class="weather-card" aria-label="อากาศวันนี้ที่แม่ทะ">
    <h3>อากาศวันนี้ที่แม่ทะ</h3>
    <div class="weather-row">${items.join("")}</div>
  </section>`;
}

async function showTodayWeather(slot) {
  const today = await getToday();
  if (!today || !slot.isConnected) return; // ไม่มีเน็ต หรือผู้ใช้ออกจากหน้าแรกไปแล้ว
  slot.innerHTML = todayWeatherHtml(today);
}
