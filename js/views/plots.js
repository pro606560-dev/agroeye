// หน้าแปลงของฉัน: #/plots = รายการแปลง, #/plots/<รหัส> = ผลเดิมของแปลงเดียว
// การอ่าน/เขียนข้อมูลอยู่ใน js/plots-store.js

const NO_STORAGE_HTML = `
  <div class="alert alert-warn">
    <strong class="alert-title">เครื่องนี้เก็บแปลงไม่ได้ในตอนนี้</strong>
    <p>ยังตรวจแปลงและดูผลได้ตามปกติ แต่บันทึกไว้ดูทีหลังไม่ได้
    ลองปิดโหมดไม่ระบุตัวตน หรือลบรูปและแอปที่ไม่ใช้ แล้วเปิดหน้านี้อีกครั้ง</p>
  </div>`;

// task 20 ช่วงที่ 2: ภาพหน้าว่าง (แปลงดิน ต้นกล้า ดวงอาทิตย์) วาดเอง ฝังในโค้ด ใช้ออฟไลน์ได้
// ใช้ทั้งหน้ารายการแปลงตอนยังไม่มีแปลง และส่วนรอบปลูกตอนยังไม่มีรอบ (plantings.js) เป็นภาพประกอบเฉย ๆ จึงซ่อนจากโปรแกรมอ่านจอ
const EMPTY_PICTURE = `<svg class="empty-picture" viewBox="0 0 160 120" aria-hidden="true" focusable="false">
  <circle cx="80" cy="60" r="56" fill="#E3E8F3"/>
  <circle cx="117" cy="33" r="11" fill="#F2B233"/>
  <ellipse cx="80" cy="94" rx="54" ry="15" fill="#8A6236"/>
  <path d="M42 92q38-9 76 0M50 100q30-6 60 0" fill="none" stroke="#5C4326" stroke-width="3" stroke-linecap="round"/>
  <path d="M80 90V60" stroke="#2A6134" stroke-width="4" stroke-linecap="round"/>
  <path d="M80 74c-14 0-21-6-21-19 14 0 21 6 21 19z" fill="#2A6134"/>
  <path d="M80 67c0-13 7-19 21-19 0 13-7 19-21 19z" fill="#3E8A4C"/>
</svg>`;

async function renderPlots(container, plotId) {
  container.innerHTML = `<h2 tabindex="-1">กำลังโหลด</h2>`;
  const crops = await getCrops();
  if (!window.location.hash.startsWith("#/plots")) return; // ผู้ใช้ออกจากหน้านี้ระหว่างรอโหลด
  if (plotId) renderOnePlot(container, plotId, crops);
  else renderPlotList(container, crops);
  container.querySelector("h2").focus({ preventScroll: true });
}

function cropName(crops, id) {
  return cropById(crops, id)?.nameTh ?? id;
}

// ---------- รายการแปลง ----------

function renderPlotList(container, crops) {
  const plots = loadSavedPlots();
  const notice = canUseStorage() ? "" : NO_STORAGE_HTML;
  if (plots.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        ${EMPTY_PICTURE}
        <h2 tabindex="-1">ยังไม่มีแปลงที่บันทึกไว้</h2>
      </div>
      ${notice}
      <p>ตรวจแปลงแล้วกด "บันทึกแปลงนี้" ในหน้าผล แปลงจะมาอยู่ที่นี่ กลับมาดูผลหรือตรวจซ้ำได้</p>
      <a class="btn btn-primary" href="#/input">ตรวจแปลงใหม่</a>`;
    return;
  }
  const rows = plots.map((record) => plotRowHtml(record, crops)).join("");
  container.innerHTML = `
    <h2 tabindex="-1">แปลงที่บันทึกไว้ (${plots.length} แปลง)</h2>
    ${notice}
    <ul class="plot-list">${rows}</ul>
    <a class="btn btn-secondary" href="#/input">ตรวจแปลงใหม่</a>`;
}

function plotRowHtml(record, crops) {
  const first = record.top3[0];
  const firstText = first ? `อันดับ 1: ${cropName(crops, first.id)}` : "ยังไม่มีพืชที่แนะนำ";
  return `
    <li>
      <a class="card plot-row" href="#/plots/${encodeURIComponent(record.id)}">
        <strong class="plot-row-name">${record.name ? escapeHtml(record.name) : UNNAMED_PLOT}</strong>
        <span>ตรวจเมื่อ ${thaiDate(record.date)}</span>
        <span>${firstText}</span>
      </a>
    </li>`;
}

// ---------- แปลงเดียว ----------

function renderOnePlot(container, plotId, crops) {
  const record = findSavedPlot(plotId);
  if (!record) {
    container.innerHTML = `
      <h2 tabindex="-1">ไม่พบแปลงนี้</h2>
      <p>แปลงนี้อาจถูกลบไปแล้ว กลับไปดูรายการแปลงที่บันทึกไว้</p>
      <a class="btn btn-primary" href="#/plots">แปลงของฉัน</a>`;
    return;
  }
  container.innerHTML = onePlotHtml(record, crops);
  container.querySelector("#recheck").addEventListener("click", () => startFromSaved(record, "recheck"));
  container.querySelector("#edit").addEventListener("click", () => startFromSaved(record, "edit"));
  setupDeleteDialog(container, record);
  // task 19: ตรวจก่อนเรียก เผื่อเบราว์เซอร์ยังจำ index.html เก่าที่ไม่มีไฟล์ plantings.js หน้านี้จะได้ไม่พัง
  if (typeof renderPlantings === "function") {
    renderPlantings(container.querySelector("#plantings-slot"), record.id, crops);
  }
}

function onePlotHtml(record, crops) {
  const rounds = record.earlier.length + 1;
  const list = record.top3.map((item) =>
    `<li><strong>${cropName(crops, item.id)}</strong> ${item.score} คะแนน</li>`).join("");
  return `
    <h2 tabindex="-1">${record.name ? escapeHtml(record.name) : UNNAMED_PLOT}</h2>
    ${plotFactsHtml(record.plot, false)}
    <p class="muted">ตรวจล่าสุด ${thaiDate(record.date)} · ตรวจแล้ว ${rounds} ครั้ง</p>
    ${npkSummaryText(record.plot) ? `<p>ค่าปุ๋ยในดินที่กรอกไว้: ${npkSummaryText(record.plot)} (ยังไม่ใช้คิดคะแนน)</p>` : ""}
    ${sensorLineHtml(record.plot)}
    <div class="card">
      <h3>พืชที่แนะนำครั้งล่าสุด</h3>
      ${list ? `<ol class="saved-top">${list}</ol>` : "<p>ครั้งนั้นยังแนะนำพืชให้แปลงนี้ไม่ได้</p>"}
    </div>
    ${record.earlier.length > 0 ? compareHtml(record.earlier[0], record.top3, crops) : ""}
    <div id="plantings-slot"></div>
    <div class="result-actions">
      <button id="recheck" class="btn btn-primary" type="button">ตรวจใหม่ด้วยข้อมูลเดิม</button>
      <button id="edit" class="btn btn-secondary" type="button">แก้ข้อมูล</button>
      <button id="delete" class="btn btn-danger" type="button">ลบแปลงนี้</button>
      <div id="delete-notice" role="status"></div>
    </div>
    ${deleteDialogHtml(record)}`;
}

// ตารางเทียบพืชทีละอันดับ ใช้ทั้งหน้านี้และหน้าผล
function compareHtml(beforeRound, nowTop3, crops) {
  const cell = (item) => item ? `${cropName(crops, item.id)} (${item.score})` : "-";
  const rows = compareTop3(beforeRound.top3, nowTop3).map((row) => `
    <tr>
      <th scope="row">${row.rank}</th>
      <td>${cell(row.before)}</td>
      <td>${cell(row.after)}</td>
      <td>${row.same ? "เหมือนเดิม" : "<strong>เปลี่ยน</strong>"}</td>
    </tr>`).join("");
  return `
    <div class="card compare">
      <h3>เทียบกับครั้งก่อน (${thaiDate(beforeRound.date)})</h3>
      <table class="compare-table">
        <thead><tr><th scope="col">อันดับ</th><th scope="col">ครั้งก่อน</th><th scope="col">ครั้งนี้</th><th scope="col"></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ---------- หน้าต่างยืนยันการลบ (ทำเองในแอป ไม่ใช้ confirm()) ----------

function deleteDialogHtml(record) {
  const name = record.name ? escapeHtml(record.name) : UNNAMED_PLOT;
  return `
    <dialog id="delete-dialog" class="dialog" aria-labelledby="delete-title">
      <h2 id="delete-title">ลบแปลง "${name}" ไหม</h2>
      <p>ผลการตรวจทุกครั้งของแปลงนี้จะหายไป เอากลับมาไม่ได้</p>
      <button id="delete-yes" class="btn btn-danger" type="button">ลบแปลงนี้</button>
      <button id="delete-no" class="btn btn-secondary" type="button">ไม่ลบ เก็บไว้</button>
    </dialog>`;
}

function setupDeleteDialog(container, record) {
  const dialog = container.querySelector("#delete-dialog");
  container.querySelector("#delete").addEventListener("click", () => {
    dialog.showModal();
    container.querySelector("#delete-no").focus();
  });
  container.querySelector("#delete-no").addEventListener("click", () => dialog.close());
  container.querySelector("#delete-yes").addEventListener("click", () => {
    dialog.close();
    if (deleteSavedPlot(record.id)) {
      window.location.replace("#/plots");
      return;
    }
    container.querySelector("#delete-notice").innerHTML = `
      <div class="alert alert-warn">ลบไม่ได้ เพราะเครื่องนี้เขียนข้อมูลไม่ได้ในตอนนี้ ลองปิดแอปแล้วเปิดใหม่</div>`;
  });
}

// task 18: ค่าจากเซนเซอร์ ESP32 ที่เก็บไว้ ตรวจก่อนเรียกเผื่อเบราว์เซอร์ยังจำ index.html เก่าที่ไม่มี sensor.js
function sensorLineHtml(plot) {
  if (typeof sensorSummaryText !== "function") return "";
  const text = sensorSummaryText(plot);
  return text ? `<p>ค่าจากเซนเซอร์ตอนตรวจ: ${text} (ยังไม่ใช้คิดคะแนน)</p>` : "";
}
