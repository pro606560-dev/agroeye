// หน้าผลลัพธ์: พืช 3 อันดับ เหตุผล ความมั่นใจ และพืชอื่น ๆ
// ตรรกะอยู่ใน js/result-logic.js สูตรคะแนนอยู่ใน js/scoring.js

const UNNAMED_PLOT = "แปลงไม่มีชื่อ";
const DISCLAIMER = "คำแนะนำนี้คำนวณจากข้อมูลทั่วไป ควรปรึกษาเกษตรอำเภอก่อนลงทุน";

let loadedCrops = null; // เก็บไว้ ไม่ต้องโหลดใหม่ทุกครั้งที่กลับมาหน้านี้

async function getCrops() {
  if (!loadedCrops || loadedCrops.length === 0) loadedCrops = await loadCrops();
  return loadedCrops;
}

async function renderResult(container) {
  if (!currentPlot) {
    showResultMessage(container, "ยังไม่มีข้อมูลแปลง",
      "ผลการตรวจจะหายเมื่อปิดหรือรีเฟรชหน้านี้ กรุณากรอกข้อมูลแปลงอีกครั้ง");
    return;
  }
  container.innerHTML = `<h2 tabindex="-1">กำลังคิดผล</h2>`;
  const crops = await getCrops();
  if (window.location.hash !== "#/result") return; // ผู้ใช้ออกจากหน้านี้ระหว่างรอโหลด
  if (crops.length === 0) {
    showResultMessage(container, "โหลดข้อมูลพืชไม่ได้",
      "แอปจึงยังแนะนำพืชไม่ได้ ลองรีเฟรชหน้านี้ แล้วกรอกข้อมูลอีกครั้ง");
    return;
  }
  // ยังไม่มีข้อมูลอากาศ จึงส่ง null ปัจจัยอุณหภูมิและฝนจะถูกตัดออก (task 10 จะส่งค่าจริง)
  const ranking = rankCrops(currentPlot, crops, null);
  container.innerHTML = resultPageHtml(currentPlot, ranking, crops);
  container.querySelector("#save-plot").addEventListener("click", () => showSaveNotice(container));
  container.querySelector("h2").focus({ preventScroll: true });
}

function showResultMessage(container, title, message) {
  container.innerHTML = `
    <h2 tabindex="-1">${title}</h2>
    <p>${message}</p>
    <a class="btn btn-primary" href="#/input">ตรวจแปลงใหม่</a>`;
  container.querySelector("h2").focus({ preventScroll: true });
}

// แยกการเก็บแปลงจริงไว้ task 11 ตอนนี้บอกตรง ๆ ว่ายังไม่ได้บันทึก
function showSaveNotice(container) {
  container.querySelector("#save-notice").innerHTML = `
    <div class="alert">ปุ่มบันทึกกำลังสร้าง ผลนี้จึงยังไม่ถูกเก็บไว้ในเครื่อง</div>`;
}

function cropById(crops, id) {
  return crops.find((crop) => crop.id === id);
}

function resultPageHtml(plot, ranking, crops) {
  const { recommended, others } = splitRecommendations(ranking);
  return `
    <h2 tabindex="-1">${recommended.length > 0 ? "พืชที่แนะนำสำหรับแปลงนี้" : "ยังแนะนำพืชให้แปลงนี้ไม่ได้"}</h2>
    <p class="plot-summary">${plotSummaryHtml(plot)}</p>
    ${recommended.length > 0 ? recommendedHtml(recommended, plot, crops) : noResultHtml(ranking)}
    ${hintsHtml(plot)}
    ${othersHtml(others, crops)}
    ${notEnoughHtml(ranking.notEnoughData, crops)}
    <div class="result-actions">
      <button id="save-plot" class="btn btn-primary" type="button">บันทึกแปลงนี้</button>
      <div id="save-notice" role="status"></div>
      <a class="btn btn-secondary" href="#/input">ตรวจใหม่</a>
    </div>
    <p class="disclaimer">${DISCLAIMER}</p>`;
}

function plotSummaryHtml(plot) {
  const parts = [plot.name ? escapeHtml(plot.name) : UNNAMED_PLOT];
  if (plot.texture) parts.push(TEXTURE_NAMES[plot.texture]);
  if (plot.ph !== null) parts.push(`${phWord(plot.ph)} (pH ${plot.ph})`);
  if (plot.month !== null) parts.push(`ปลูกเดือน ${MONTH_NAMES[plot.month - 1]}`);
  return parts.join(" · ");
}

function recommendedHtml(results, plot, crops) {
  const cards = results.map((result, index) =>
    cropCardHtml(result, index + 1, cropById(crops, result.cropId), plot)).join("");
  return `
    <ol class="crop-list">${cards}</ol>
    <p class="muted">ความมั่นใจบอกว่าแอปมีข้อมูลมากแค่ไหน ยิ่งข้อมูลครบ ยิ่งเชื่อผลนี้ได้มาก</p>`;
}

function cropCardHtml(result, rank, crop, plot) {
  const reasons = pickReasons(result, crop).map((reason) => `
    <li class="${reason.good ? "reason-good" : "reason-warn"}">
      <span class="reason-mark" aria-hidden="true">${reason.good ? "✓" : "!"}</span>${reason.text}
    </li>`).join("");
  const risks = matchingRisks(plot, crop).map(riskHtml).join("");
  const missing = missingDataText(result);
  return `
    <li class="card crop-card">
      <p class="crop-rank">อันดับ ${rank}</p>
      <h3 class="crop-name">${crop.nameTh}</h3>
      <p class="crop-score">${starsHtml(result.score)} <strong>${result.score}</strong> คะแนน จาก 100</p>
      <ul class="reason-list">${reasons}</ul>
      ${risks}
      <p class="confidence confidence-${result.confidence}">ความมั่นใจ: <strong>${CONFIDENCE_LABELS[result.confidence]}</strong></p>
      ${missing ? `<p class="muted">${missing}</p>` : ""}
      <a class="btn btn-secondary" href="#/crop/${encodeURIComponent(crop.id)}">ดูวิธีปลูก<span class="visually-hidden">${crop.nameTh}</span></a>
    </li>`;
}

// ดาวซ่อนจากโปรแกรมอ่านหน้าจอ เพราะมีตัวเลขคะแนนอยู่ข้าง ๆ
function starsHtml(score) {
  const count = starCount(score);
  const full = Math.floor(count);
  const half = count > full;
  const empty = 5 - full - (half ? 1 : 0);
  return `<span class="stars" aria-hidden="true"><span class="stars-on">${"★".repeat(full)}</span>${half ? `<span class="star-half">★</span>` : ""}${"★".repeat(empty)}</span>`;
}

function riskHtml({ risk, fix }) {
  return `
    <div class="alert alert-warn">
      <strong class="alert-title">ต้องระวัง: ${risk}</strong>
      ${fix ? `<p>${fix}</p>` : ""}
    </div>`;
}

function noResultHtml(ranking) {
  const reason = ranking.top.length === 0
    ? "ข้อมูลแปลงยังน้อยเกินไป แอปจึงเทียบกับพืชไม่ได้"
    : "พืชที่แอปรู้จักไม่เข้ากับสภาพแปลงนี้เลย";
  return `
    <div class="alert alert-warn">
      <strong class="alert-title">${reason}</strong>
      <p>ลองตรวจใหม่และตอบคำถามให้ครบขึ้น หรือปรึกษาเกษตรอำเภอแม่ทะ</p>
    </div>`;
}

function hintsHtml(plot) {
  const hints = moreDataHints(plot);
  if (hints.length === 0) return "";
  const items = hints.map((hint) => `<li>${hint}</li>`).join("");
  return `
    <div class="alert">
      <strong class="alert-title">อยากให้ผลแม่นขึ้น</strong>
      <ul class="hint-list">${items}</ul>
    </div>`;
}

function othersHtml(results, crops) {
  if (results.length === 0) return "";
  const rows = results.map((result) => {
    const crop = cropById(crops, result.cropId);
    return `
      <li class="other-row">
        <a href="#/crop/${encodeURIComponent(crop.id)}">${crop.nameTh}</a>
        <span>${result.score} คะแนน · ความมั่นใจ${CONFIDENCE_LABELS[result.confidence]}</span>
      </li>`;
  }).join("");
  return foldHtml(`พืชอื่น ๆ (${results.length} ชนิด)`, `<ul class="other-list">${rows}</ul>`);
}

function notEnoughHtml(results, crops) {
  if (results.length === 0) return "";
  const rows = results.map((result) => `
    <li class="other-row">
      <strong>${cropById(crops, result.cropId).nameTh}</strong>
      <span>${missingDataText(result)}</span>
    </li>`).join("");
  return foldHtml(`ข้อมูลไม่พอจะแนะนำ (${results.length} ชนิด)`, `<ul class="other-list">${rows}</ul>`);
}

function foldHtml(title, body) {
  return `<details class="fold"><summary>${title}</summary>${body}</details>`;
}
