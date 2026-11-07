// หน้าพิสูจน์สมมติฐาน (สำหรับครูและรายงาน) เข้าจากหน้าตั้งค่า
// ตรรกะอยู่ใน js/proof-logic.js กราฟ/บันทึกรูป/คัดลอกอยู่ใน js/proof-export.js
// ส่วนจับเวลา (สมมติฐานข้อ 2) อยู่ใน js/views/proof-timing.js

let proofCharts = []; // กราฟที่วาดอยู่ ต้องลบก่อนวาดใหม่ ไม่อย่างนั้น Chart.js จะเตือน
let proofState = null; // ข้อมูลที่ใช้ทั้งหน้า: crops, areas, climate, useClimate, rows
let proofButtonsWired = false; // <main id="app"> ใช้ร่วมทุกหน้า จึงผูกปุ่มครั้งเดียว ไม่อย่างนั้นกดแล้วทำงานซ้ำ

async function renderProof(container) {
  container.innerHTML = `<h2 tabindex="-1">กำลังคำนวณทุกกรณี</h2>`;
  const [crops, scenarios, points, climate] = await Promise.all([
    getCrops(), loadScenarios(), loadSurveyPoints(), getClimate(),
  ]);
  if (window.location.hash !== "#/proof") return; // ผู้ใช้ออกจากหน้านี้ระหว่างรอโหลด
  const areas = proofAreas(scenarios, points);
  proofState = { crops, areas, climate, useClimate: climate !== null, skippedPoints: points.length - areas.filter((a) => a.kind === "survey").length };
  container.innerHTML = proofShellHtml(climate !== null);
  container.querySelector("#proof-use-climate").addEventListener("change", (event) => {
    proofState.useClimate = event.target.checked;
    showProofBody(container);
  });
  if (!proofButtonsWired) wireProofButtons(container); // ปุ่มที่วาดใหม่ภายหลังก็ใช้ได้
  proofButtonsWired = true;
  container.querySelector("h2").focus({ preventScroll: true });
  showProofBody(container);
}

function proofShellHtml(hasClimate) {
  const climateNote = hasClimate
    ? "ติ๊กไว้ = ตรงกับตารางที่ 2 ใน tests.html / เอาติ๊กออก = ตรงกับตารางที่ 1 และข้อสอบเฉลย"
    : "เปิดไฟล์ข้อมูลอากาศไม่ได้ ทุกตารางจึงคิดโดยไม่ใช้อุณหภูมิและฝน";
  return `
    <div class="proof-page">
      <h2 tabindex="-1">ผลพิสูจน์สมมติฐาน</h2>
      <p>คำนวณทุกพื้นที่ด้วยสูตรเดียวกับหน้าผลการตรวจ ทุกพื้นที่คิดที่เดือนพฤษภาคม</p>
      <label class="proof-toggle">
        <input type="checkbox" id="proof-use-climate" ${hasClimate ? "checked" : "disabled"}>
        <span>คิดอุณหภูมิและฝนด้วย</span>
      </label>
      <p class="proof-note">${climateNote}</p>
      <div id="proof-body"></div>
    </div>`;
}

async function showProofBody(container) {
  const body = container.querySelector("#proof-body");
  const { areas, crops } = proofState;
  proofState.rows = runProof(areas, crops, activeClimate());
  body.innerHTML = hypothesisOneHtml() + hypothesisTwoHtml() + overviewHtml() + limitsHtml();
  await drawProofCharts(body);
}

function activeClimate() {
  return proofState.useClimate ? proofState.climate : null;
}

// ---------- ส่วนที่ 1 สมมติฐานข้อ 1 ----------

function proofCropName(cropId) {
  return proofState.crops.find((crop) => crop.id === cropId).nameTh;
}

function rankCell(result) {
  if (!result) return "-";
  return `${proofCropName(result.cropId)} ${result.score} (มั่นใจ${CONFIDENCE_LABELS[result.confidence]})`;
}

function valueText(value, words) {
  if (value === null || value === undefined) return "ยังไม่ได้วัด";
  return words ? words[value] : String(value);
}

// แถวของตารางพื้นที่ × พืช 3 อันดับ (แถวแรกคือหัวตาราง) ใช้ทั้งแสดง คัดลอก และบันทึกรูป
function areaTableRows() {
  const head = ["พื้นที่", "ที่มา", "ประเภทดิน", "pH", "น้ำขัง", "อันดับ 1", "อันดับ 2", "อันดับ 3"];
  const body = proofState.rows.map(({ area, ranked }) => [
    area.name,
    AREA_KINDS[area.kind],
    valueText(area.texture, TEXTURE_NAMES),
    valueText(area.ph),
    valueText(area.drainage, DRAINAGE_WORDS),
    rankCell(ranked.top[0]), rankCell(ranked.top[1]), rankCell(ranked.top[2]),
  ]);
  return [head, ...body];
}

function hypothesisOneSummary() {
  const { areaCount, distinctTopCount } = summarizeTopCrops(proofState.rows);
  const verdict = distinctTopCount > 1
    ? "สภาพดินต่างกันแล้วพืชที่แนะนำเปลี่ยนไป ผลนี้สนับสนุนสมมติฐานข้อ 1"
    : "ทุกพื้นที่ได้พืชอันดับ 1 ชนิดเดียวกัน ผลนี้ยังไม่สนับสนุนสมมติฐานข้อ 1";
  return { headline: `${areaCount} พื้นที่ ได้พืชอันดับ 1 ต่างกัน ${distinctTopCount} ชนิด`, verdict };
}

function hypothesisOneHtml() {
  const { headline, verdict } = hypothesisOneSummary();
  return `
    <section class="proof-section" aria-labelledby="h1-title">
      <h3 id="h1-title">สมมติฐานข้อ 1: สภาพแวดล้อมต่างกัน แอปจะแนะนำพืชต่างกัน</h3>
      <div class="alert alert-ok proof-summary">
        <strong class="alert-title">${headline}</strong>
        <p>${verdict}</p>
      </div>
      ${tableHtml(areaTableRows(), "ตารางที่ 1 พืช 3 อันดับของแต่ละพื้นที่ (คะแนนเต็ม 100)")}
      ${tableButtonsHtml("area")}
      <h4 class="proof-subtitle">กราฟคะแนนพืช 3 อันดับของแต่ละพื้นที่</h4>
      <div class="proof-charts" data-chart-group="areas"></div>
      ${chartButtonHtml("areas")}
    </section>`;
}

// ---------- ส่วนที่ 3 ภาพรวม ----------

function overviewHtml() {
  return `
    <section class="proof-section" aria-labelledby="overview-title">
      <h3 id="overview-title">ภาพรวม: พืชแต่ละชนิดติด 3 อันดับแรกกี่พื้นที่</h3>
      <p class="proof-note">นับจาก ${proofState.rows.length} พื้นที่ในตารางที่ 1</p>
      <div class="proof-charts" data-chart-group="overview"></div>
      ${chartButtonHtml("overview")}
    </section>`;
}

// ---------- ส่วนที่ 4 ข้อจำกัด ----------

function areaNamesOfKind(kind) {
  // ชื่อกรณีสมมติขึ้นต้นด้วย "กรณีสมมติ:" อยู่แล้ว ตัดออกไม่ให้ซ้ำกับหัวข้อ
  const names = proofState.areas.filter((area) => area.kind === kind)
    .map((area) => area.name.replace(/^กรณีสมมติ:\s*/, ""));
  return names.length > 0 ? names.join(", ") : "ไม่มี";
}

function missingDataItems() {
  return dataCoverageReport(proofState.crops)
    .filter((item) => item.missing.length > 0)
    .map((item) => `<li>${item.nameTh}: ยังไม่มีข้อมูล ${item.missing.join(", ")}</li>`)
    .join("");
}

function limitsHtml() {
  const climateLine = proofState.useClimate
    ? "อุณหภูมิรายเดือนเป็นค่าเฉลี่ยของแม่ทะ ปี 2559–2568 จาก Open-Meteo ส่วนฝนทั้งปี อุณหภูมิทั้งปี และอุณหภูมิต่ำสุดหน้าหนาว ใช้สถานีอุตุนิยมวิทยาลำปาง (ปี 2534–2563) เพราะแม่ทะไม่มีสถานีวัด ไม่ได้วัดในแปลง ทุกพื้นที่จึงได้ค่าอากาศเท่ากัน"
    : "ตารางนี้ไม่ได้คิดอุณหภูมิและฝน";
  const skipped = proofState.skippedPoints > 0
    ? `<li>จุดสำรวจที่ยังวัดได้ไม่ถึง 2 ค่า ไม่ได้นำมาแสดง (${proofState.skippedPoints} จุด)</li>` : "";
  return `
    <section class="proof-section" aria-labelledby="limits-title">
      <h3 id="limits-title">ข้อจำกัดของผลนี้</h3>
      <ul class="proof-limits">
        <li><strong>${AREA_KINDS.survey}:</strong> ${areaNamesOfKind("survey")} ค่าที่ยังไม่ได้วัดถูกตัดออกจากการคิดคะแนน</li>
        <li><strong>${AREA_KINDS.soilSeries}:</strong> ${areaNamesOfKind("soilSeries")} ใช้ค่ากลางของช่วง pH ในเอกสารชุดดิน ต.หัวเสือ ของกรมพัฒนาที่ดิน ไม่ได้วัดเอง</li>
        <li><strong>${AREA_KINDS.assumed}:</strong> ${areaNamesOfKind("assumed")} ตั้งขึ้นเพื่อทดสอบดินที่แย่มาก ไม่ใช่แปลงจริง</li>
        <li>ทุกพื้นที่คิดที่เดือนพฤษภาคม ถ้าปลูกเดือนอื่น อันดับอาจเปลี่ยน</li>
        <li>${climateLine}</li>
        ${skipped}
      </ul>
      <h4 class="proof-subtitle">ข้อมูลพืชที่ยังขาด (ปัจจัยนี้จึงไม่ถูกนับในคะแนนของพืชนั้น)</h4>
      <ul class="proof-limits">${missingDataItems() || "<li>พืชทุกชนิดมีข้อมูลครบ</li>"}</ul>
    </section>`;
}

// ---------- ตารางและปุ่ม ----------

function tableHtml(rows, caption) {
  const [head, ...body] = rows;
  const cells = (row, tag) => row.map((cell) => `<${tag}>${escapeHtml(String(cell))}</${tag}>`).join("");
  return `
    <div class="table-wrap" tabindex="0" role="region" aria-label="${caption}">
      <table class="proof-table">
        <caption>${caption}</caption>
        <thead><tr>${cells(head, "th")}</tr></thead>
        <tbody>${body.map((row) => `<tr>${cells(row, "td")}</tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function tableButtonsHtml(tableId) {
  return `
    <div class="proof-actions">
      <button class="btn btn-secondary" type="button" data-copy-table="${tableId}">คัดลอกตาราง</button>
      <button class="btn btn-secondary" type="button" data-save-table="${tableId}">บันทึกตารางเป็นรูป</button>
      <p class="proof-status" role="status" data-status-for="${tableId}"></p>
    </div>`;
}

function chartButtonHtml(group) {
  return `
    <div class="proof-actions">
      <button class="btn btn-secondary" type="button" data-save-chart="${group}">บันทึกกราฟเป็นรูป</button>
    </div>`;
}

// ตารางที่คัดลอกและบันทึกได้ (ตารางเวลาเพิ่มเข้ามาตอนกดจับเวลา)
const PROOF_TABLES = {
  area: { rows: () => areaTableRows(), file: "agroeye-table1-areas.png" },
  timing: { rows: () => timingTableRows(), file: "agroeye-table2-timing.png" },
};

function setStatus(root, tableId, text) {
  const box = root.querySelector(`[data-status-for="${tableId}"]`);
  if (box) box.textContent = text;
}

function wireProofButtons(root) {
  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const { copyTable: copyId, saveTable, saveChart } = button.dataset;
    if (copyId) {
      const ok = await copyTable(PROOF_TABLES[copyId].rows());
      setStatus(root, copyId, ok ? "คัดลอกแล้ว วางใน Word หรือ Excel ได้เลย" : "คัดลอกไม่ได้ ลองลากเลือกตารางแล้วคัดลอกเอง");
    }
    if (saveTable) {
      downloadCanvas(tableToCanvas(PROOF_TABLES[saveTable].rows()), PROOF_TABLES[saveTable].file);
      setStatus(root, saveTable, "บันทึกรูปแล้ว ดูได้ในโฟลเดอร์ดาวน์โหลด");
    }
    if (saveChart) saveChartGroup(root, saveChart);
    if (button.dataset.runTiming !== undefined) showTiming(root);
  });
}

// ---------- กราฟ ----------

function destroyProofCharts() {
  proofCharts.forEach((chart) => chart.destroy());
  proofCharts = [];
}

function addChartCanvas(box, height, label) {
  const holder = document.createElement("div");
  holder.className = "proof-chart";
  holder.style.height = `${height}px`;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  holder.append(canvas);
  box.append(holder);
  return canvas;
}

function drawAreaCharts(box) {
  for (const { area, ranked } of proofState.rows) {
    const top = ranked.top;
    const label = `${area.name}: ` + top.map((r) => `${proofCropName(r.cropId)} ${r.score}`).join(", ");
    const canvas = addChartCanvas(box, 70 + top.length * 34, label);
    proofCharts.push(drawBarChart(canvas, {
      title: area.name,
      labels: top.map((r) => `${top.indexOf(r) + 1}. ${proofCropName(r.cropId)}`),
      values: top.map((r) => r.score),
      colors: CHART_COLORS.slice(0, top.length),
      max: 100,
    }));
  }
}

function drawOverviewChart(box) {
  const counts = countTopAppearances(proofState.rows, proofState.crops);
  const label = counts.map((c) => `${c.nameTh} ${c.count}`).join(", ");
  const canvas = addChartCanvas(box, 70 + counts.length * 32, `จำนวนพื้นที่ที่พืชติด 3 อันดับแรก: ${label}`);
  proofCharts.push(drawBarChart(canvas, {
    title: `จำนวนพื้นที่ (จาก ${proofState.rows.length}) ที่พืชติด 3 อันดับแรก`,
    labels: counts.map((c) => c.nameTh),
    values: counts.map((c) => c.count),
    colors: CHART_COLORS[0],
    max: proofState.rows.length,
  }));
}

async function drawProofCharts(root) {
  destroyProofCharts();
  const ready = await loadChartLib();
  const boxes = root.querySelectorAll(".proof-charts");
  if (!ready) {
    boxes.forEach((box) => { box.innerHTML = `<p class="proof-note">เปิดกราฟไม่ได้ ตัวเลขทั้งหมดยังอยู่ในตารางด้านบน</p>`; });
    root.querySelectorAll("[data-save-chart]").forEach((button) => { button.hidden = true; });
    return;
  }
  drawAreaCharts(root.querySelector('[data-chart-group="areas"]'));
  drawOverviewChart(root.querySelector('[data-chart-group="overview"]'));
}

function saveChartGroup(root, group) {
  const canvases = [...root.querySelectorAll(`[data-chart-group="${group}"] canvas`)];
  if (canvases.length === 0) return;
  downloadCanvas(stackCanvases(canvases), `agroeye-chart-${group}.png`);
}
