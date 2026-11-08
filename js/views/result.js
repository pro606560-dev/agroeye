// หน้าผลลัพธ์: พืช 3 อันดับ เหตุผล ความมั่นใจ และพืชอื่น ๆ
// ตรรกะอยู่ใน js/result-logic.js สูตรคะแนนอยู่ใน js/scoring.js

const UNNAMED_PLOT = "แปลงไม่มีชื่อ";
const DISCLAIMER = "คำแนะนำนี้คำนวณจากข้อมูลทั่วไป ควรปรึกษาเกษตรอำเภอก่อนลงทุน";

let loadedCrops = null; // เก็บไว้ ไม่ต้องโหลดใหม่ทุกครั้งที่กลับมาหน้านี้

async function getCrops() {
  if (!loadedCrops || loadedCrops.length === 0) loadedCrops = await loadCrops();
  return loadedCrops;
}

const NO_CLIMATE_NOTE = "รอบนี้อ่านข้อมูลอากาศไม่ได้ จึงคิดคะแนนโดยไม่ใช้อุณหภูมิและฝน";
let loadedResultClimate = null; // ข้อมูลอากาศจาก js/weather.js ถ้าโหลดไม่ได้เป็น null

// ข้อมูลอากาศที่ใช้คิดคะแนน (หน้าพืชใช้ค่าเดียวกับหน้าผล)
function currentClimate() {
  return loadedResultClimate;
}

async function renderResult(container) {
  if (!currentPlot) {
    showResultMessage(container, "ยังไม่มีข้อมูลแปลง",
      "ผลการตรวจจะหายเมื่อปิดแอปหรือโหลดหน้านี้ใหม่ กด \"ตรวจแปลงใหม่\" เพื่อกรอกอีกครั้ง หรือดูแปลงที่บันทึกไว้ใน \"แปลงของฉัน\"",
      true);
    return;
  }
  container.innerHTML = `<h2 tabindex="-1">กำลังคิดผล</h2>`;
  const crops = await getCrops();
  loadedResultClimate = await getClimate();
  if (window.location.hash !== "#/result") return; // ผู้ใช้ออกจากหน้านี้ระหว่างรอโหลด
  if (crops.length === 0) {
    showResultMessage(container, "โหลดข้อมูลพืชไม่ได้",
      "แอปจึงยังแนะนำพืชไม่ได้ ลองปิดแอปแล้วเปิดใหม่ แล้วกรอกข้อมูลอีกครั้ง");
    return;
  }
  const ranking = rankCrops(currentPlot, crops, currentClimate());
  container.innerHTML = resultPageHtml(currentPlot, ranking, crops);
  setupSaveButton(container, ranking, crops);
  const { recommended } = splitRecommendations(ranking);
  setupSpeakButton(container.querySelector(".speak-btn"),
    () => resultSpeechSentences(recommended, crops, DISCLAIMER));
  setupImageButton(container, recommended, crops);
  container.querySelector("h2").focus({ preventScroll: true });
}

function showResultMessage(container, title, message, showPlotsLink = false) {
  container.innerHTML = `
    <h2 tabindex="-1">${title}</h2>
    <p>${message}</p>
    <a class="btn btn-primary" href="#/input">ตรวจแปลงใหม่</a>
    ${showPlotsLink ? `<a class="btn btn-secondary" href="#/plots">แปลงของฉัน</a>` : ""}`;
  container.querySelector("h2").focus({ preventScroll: true });
}

// ---------- บันทึกแปลง (task 11) ----------

const SAVE_FAILED_HTML = `
  <div class="alert alert-warn">
    <strong class="alert-title">บันทึกไม่ได้</strong>
    <p>เครื่องนี้เก็บข้อมูลไม่ได้ในตอนนี้ ผลยังดูได้ในหน้านี้ แต่จะหายเมื่อปิดแอป
    ลองปิดโหมดไม่ระบุตัวตน หรือลบรูปและแอปที่ไม่ใช้ แล้วกดบันทึกอีกครั้ง</p>
  </div>`;

let savedPlotObject = null; // currentPlot ที่บันทึกแล้ว กันการบันทึกซ้ำเมื่อกลับมาหน้านี้

function setupSaveButton(container, ranking, crops) {
  const button = container.querySelector("#save-plot");
  if (savedPlotObject === currentPlot) {
    showSaved(container, button);
  } else if (linkedPlotId) {
    button.textContent = "บันทึกเป็นรอบใหม่ของแปลงนี้";
  }
  const { recommended } = splitRecommendations(ranking);
  const nowTop3 = topThreeOf(recommended);
  showCompare(container, crops, nowTop3);
  button.addEventListener("click", () => {
    const round = makeRound(currentPlot, wizardDraft, recommended, currentClimate() !== null);
    const id = saveRound(linkedPlotId, round);
    if (!id) {
      container.querySelector("#save-notice").innerHTML = SAVE_FAILED_HTML;
      return;
    }
    linkedPlotId = id;
    savedPlotObject = currentPlot;
    showSaved(container, button);
    showCompare(container, crops, nowTop3);
  });
}

// ---------- บันทึกผลเป็นรูป (task 19) ตัววาดรูปอยู่ใน js/result-export.js ----------

function setupImageButton(container, recommended, crops) {
  const button = container.querySelector("#save-image");
  if (!button) return;
  button.addEventListener("click", async () => {
    const ok = await saveResultImage(currentPlot, recommended, crops);
    container.querySelector("#image-notice").innerHTML = ok
      ? `<div class="alert alert-ok">บันทึกรูปแล้ว ดูได้ในแอปรูปภาพ หรือในหัวข้อ \"ดาวน์โหลด\" ของแอปไฟล์</div>`
      : `<div class="alert alert-warn">บันทึกรูปไม่ได้ ลองกดอีกครั้ง หรือใช้วิธีจับภาพหน้าจอแทน</div>`;
  });
}

function showSaved(container, button) {
  button.disabled = true;
  button.textContent = "บันทึกแล้ว";
  container.querySelector("#save-notice").innerHTML = `
    <div class="alert alert-ok">บันทึกแปลงนี้แล้ว ดูได้ที่ <a href="#/plots">แปลงของฉัน</a></div>`;
}

// ถ้าเป็นแปลงเดิม แสดงเทียบกับครั้งก่อน (ก่อนบันทึก = รอบล่าสุดที่เก็บไว้, หลังบันทึก = รอบก่อนหน้านั้น)
function showCompare(container, crops, nowTop3) {
  const record = linkedPlotId ? findSavedPlot(linkedPlotId) : null;
  if (!record) return;
  const before = savedPlotObject === currentPlot ? record.earlier?.[0] : record;
  container.querySelector("#compare-slot").innerHTML = before ? compareHtml(before, nowTop3, crops) : "";
}

function cropById(crops, id) {
  return crops.find((crop) => crop.id === id);
}

function resultPageHtml(plot, ranking, crops) {
  const { recommended, others } = splitRecommendations(ranking);
  return `
    <h2 tabindex="-1">${recommended.length > 0 ? "พืชที่แนะนำสำหรับแปลงนี้" : "ยังแนะนำพืชให้แปลงนี้ไม่ได้"}</h2>
    <p class="plot-summary">${plotSummaryHtml(plot)}</p>
    ${recommended.length > 0 ? speakButtonHtml("ฟังคำแนะนำ") : ""}
    ${recommended.length > 0 ? recommendedHtml(recommended, plot, crops) : noResultHtml(ranking)}
    ${hintsHtml(plot)}
    ${othersHtml(others, crops)}
    ${notEnoughHtml(ranking.notEnoughData, crops)}
    <div id="compare-slot"></div>
    <div class="result-actions">
      <button id="save-plot" class="btn btn-primary" type="button">บันทึกแปลงนี้</button>
      <div id="save-notice" role="status"></div>
      ${recommended.length > 0 ? `<button id="save-image" class="btn btn-secondary" type="button">บันทึกผลเป็นรูป</button>
      <div id="image-notice" role="status"></div>` : ""}
      <a class="btn btn-secondary" href="#/input">ตรวจใหม่</a>
    </div>
    <p class="disclaimer">${DISCLAIMER}</p>
    <p class="disclaimer">${currentClimate() ? CLIMATE_NOTE : NO_CLIMATE_NOTE}</p>`;
}

// เนื้อดินที่ผู้ใช้ทดสอบเอง บอกความมั่นใจต่อท้าย ไม่ตัดคะแนน
const TEXTURE_CONFIDENCE_WORDS = { "fairly-sure": " (ค่อนข้างมั่นใจ)", unsure: " (ไม่แน่ใจ)" };

function plotSummaryHtml(plot) {
  const parts = [plot.name ? escapeHtml(plot.name) : UNNAMED_PLOT];
  if (plot.texture) parts.push(TEXTURE_NAMES[plot.texture] + (TEXTURE_CONFIDENCE_WORDS[plot.textureConfidence] ?? ""));
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
