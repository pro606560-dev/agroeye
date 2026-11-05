// หน้าปฏิทินปลูก: 12 เดือน แต่ละเดือนบอกพืชที่เริ่มปลูกได้ (จาก crops.json)
// ตรรกะอยู่ใน js/calendar-logic.js ข้อมูลอากาศอ่านจาก data/climate-maetha.json

let loadedClimateFile; // undefined = ยังไม่โหลด, null = โหลดไม่ได้ (ยังแสดงปฏิทินได้)

async function getClimateFile() {
  if (loadedClimateFile === undefined) loadedClimateFile = await fetchJson(CLIMATE_URL);
  return loadedClimateFile;
}

async function renderCalendar(container) {
  container.innerHTML = `<h2 tabindex="-1">กำลังเปิดปฏิทิน</h2>`;
  const [crops, climateFile] = await Promise.all([getCrops(), getClimateFile()]);
  if (window.location.hash !== "#/calendar") return; // ผู้ใช้ออกจากหน้านี้ระหว่างรอโหลด
  const thisMonth = new Date().getMonth() + 1;
  container.innerHTML = calendarPageHtml(crops, climateFile, thisMonth);
  container.querySelector("h2").focus({ preventScroll: true });
  container.querySelector(".month-now")?.scrollIntoView({ block: "start" });
}

function calendarPageHtml(crops, climateFile, thisMonth) {
  const rainMax = maxMonthlyRain(climateFile);
  const months = cropsByMonth(crops)
    .map((entry) => monthHtml(entry, monthClimate(climateFile, entry.month), rainMax, thisMonth))
    .join("");
  const note = climateFile
    ? `<p class="calendar-note">อุณหภูมิและฝนเป็นค่าเฉลี่ยของแม่ทะ ปี 2559–2568 จาก Open-Meteo</p>`
    : `<p class="calendar-note">ยังไม่มีข้อมูลอุณหภูมิและฝน (เปิดไฟล์ข้อมูลอากาศไม่ได้)</p>`;
  return `
    <h2 tabindex="-1">เดือนไหนเริ่มปลูกอะไรได้</h2>
    <p>กดชื่อพืชเพื่อดูวิธีปลูก</p>
    ${note}
    <ol class="month-list">${months}</ol>
    ${noMonthsHtml(cropsWithoutMonths(crops))}`;
}

function monthHtml({ month, crops }, climate, rainMax, thisMonth) {
  const isNow = month === thisMonth;
  const cropList = crops.length > 0
    ? `<ul class="month-crops">${crops.map(cropLinkHtml).join("")}</ul>`
    : `<p class="month-empty">ยังไม่มีพืชที่เริ่มปลูกเดือนนี้</p>`;
  return `
    <li class="month${isNow ? " month-now" : ""}"${isNow ? ` aria-current="date"` : ""}>
      <h3 class="month-name">${MONTH_FULL_NAMES[month - 1]}${isNow ? ` <span class="month-tag">เดือนนี้</span>` : ""}</h3>
      ${climateHtml(climate, rainMax)}
      ${cropList}
    </li>`;
}

// อุณหภูมิกับฝนตัวเล็ก พร้อมแถบฝน (ยาวตามปริมาณฝนเทียบกับเดือนที่ฝนมากสุด)
function climateHtml({ tempC, rainMm }, rainMax) {
  if (tempC === null && rainMm === null) return "";
  const parts = [];
  if (tempC !== null) parts.push(`${tempC.toFixed(1)} องศา`);
  if (rainMm !== null) parts.push(`ฝน ${rainMm} มม.`);
  const width = rainMm !== null && rainMax ? Math.round((rainMm / rainMax) * 100) : 0;
  return `
    <p class="month-climate">
      <span>${parts.join(" / ")}</span>
      <span class="rain-bar" aria-hidden="true"><span style="width: ${width}%"></span></span>
    </p>`;
}

function cropLinkHtml(crop) {
  return `<li><a class="crop-chip" href="#/crop/${encodeURIComponent(crop.id)}">${crop.nameTh}</a></li>`;
}

function noMonthsHtml(list) {
  if (list.length === 0) return "";
  const names = list.map(cropLinkHtml).join("");
  return `
    <section class="card no-months">
      <h3>พืชที่ยังไม่มีข้อมูลเดือนปลูก</h3>
      <p>แอปยังไม่มีแหล่งข้อมูลว่าพืชเหล่านี้ควรเริ่มปลูกเดือนไหน
      ควรถามเกษตรอำเภอแม่ทะก่อนปลูก</p>
      <ul class="month-crops">${names}</ul>
    </section>`;
}
