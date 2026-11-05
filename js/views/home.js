// หน้าแรก: ปุ่มหลัก 2 ปุ่ม และลิงก์ไปหน้าอื่น
// weather-slot แสดงอากาศวันนี้ ถ้าไม่มีเน็ตจะว่างไว้ (ซ่อนด้วย .slot:empty)

function renderHome(container) {
  container.innerHTML = `
    <h2 tabindex="-1">วันนี้จะดูแปลงไหน</h2>
    <p>บอกสภาพดินของแปลง แล้วแอปจะแนะนำพืชที่เหมาะ 3 อย่าง</p>
    <div id="weather-slot" class="slot"></div>
    <a class="btn btn-primary" href="#/input">ตรวจแปลงใหม่</a>
    <a class="btn btn-secondary" href="#/plots">แปลงของฉัน</a>
    <nav aria-label="หน้าอื่น ๆ" class="home-links">
      <a class="link-big" href="#/calendar">ปฏิทินปลูก</a>
      <a class="link-big" href="#/settings">ตั้งค่า</a>
    </nav>
  `;
  showTodayWeather(container.querySelector("#weather-slot"));
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
