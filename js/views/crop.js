// หน้ารายละเอียดพืช: แสดงเฉพาะข้อมูลใน crops.json ที่มีแหล่ง ห้ามเติมข้อความเอง
// ตรรกะอยู่ใน js/crop-logic.js ชื่อแหล่งอ่านจาก data/SOURCES.md

let loadedSources = null; // เก็บไว้ ไม่ต้องโหลดใหม่ทุกครั้ง

async function getSources() {
  if (!loadedSources || loadedSources.size === 0) loadedSources = await loadSourceNames();
  return loadedSources;
}

async function renderCrop(container, cropId) {
  container.innerHTML = `<h2 tabindex="-1">กำลังเปิดข้อมูลพืช</h2>`;
  const [crops, sources] = await Promise.all([getCrops(), getSources()]);
  if (matchRoute(window.location.hash)?.param !== cropId) return; // ผู้ใช้ออกจากหน้านี้ระหว่างรอโหลด
  const crop = cropById(crops, cropId);
  if (!crop) {
    container.innerHTML = `
      <h2 tabindex="-1">ไม่พบข้อมูลพืชนี้</h2>
      <p>พืชนี้ไม่มีในรายการของแอป หรือโหลดข้อมูลไม่สำเร็จ ลองกลับไปหน้าแรกแล้วเริ่มใหม่</p>
      <a class="btn btn-primary" href="#/home">กลับหน้าแรก</a>`;
  } else {
    container.innerHTML = cropPageHtml(crop, sources);
  }
  container.querySelector("h2").focus({ preventScroll: true });
}

function cropPageHtml(crop, sources) {
  const citations = createCitations();
  const body = [
    whyScoreHtml(crop),
    plantingHtml(crop.plantingMonths, citations),
    cycleHtml(crop.cycleDays, citations),
    careHtml(crop.care, citations),
    risksHtml(crop.risks, citations),
    localHtml(crop.localEvidence, citations),
  ].join("");
  return `
    <h2 class="crop-title" tabindex="-1">${crop.nameTh}</h2>
    <p class="muted">${crop.group}</p>
    <div id="speech-slot" class="slot"></div>
    ${body}
    <div id="ai-slot" class="slot"></div>
    ${sourcesHtml(citations.codes, sources)}
    <p class="disclaimer">${DISCLAIMER}</p>`;
}

function sectionHtml(title, content) {
  return `<section class="detail"><h3>${title}</h3>${content}</section>`;
}

function citeHtml(text) {
  return text ? `<p class="cite">${text}</p>` : "";
}

function noDataHtml() {
  return `<p class="no-data">${NO_DATA_TEXT}</p>`;
}

// แสดงเมื่อเปิดจากแปลงที่เพิ่งตรวจ ถ้าเปิดลิงก์ตรง ๆ จะไม่มีข้อมูลแปลงให้เทียบ
function whyScoreHtml(crop) {
  if (!currentPlot) return "";
  const result = scoreCrop(currentPlot, crop, currentClimate());
  const rows = factorRows(result).map((row) => `
    <li class="why-row">
      <div class="why-head"><strong>${row.label}</strong><span class="verdict">${row.verdict}</span></div>
      <div>แปลงนี้: ${row.plotText}</div>
      <div>พืชต้องการ: ${row.needText}</div>
    </li>`).join("");
  const score = result.score === null ? "" : `<p>ได้ <strong>${result.score}</strong> คะแนน จาก 100</p>`;
  return sectionHtml("ทำไมได้คะแนนนี้", `${score}<ul class="why-list">${rows}</ul>`);
}

function monthBarHtml(months) {
  const cells = MONTH_NAMES.map((name, index) => {
    const active = months.includes(index + 1);
    return `<span class="month-cell${active ? " month-on" : ""}">${name}</span>`;
  }).join("");
  return `
    <p>ปลูกได้เดือน ${monthNames(months)}</p>
    <div class="month-bar" aria-hidden="true">${cells}</div>`;
}

function plantingHtml(planting, citations) {
  const note = sourcedNote(planting);
  const months = planting.months ? monthBarHtml(planting.months) : noDataHtml();
  const cite = planting.months || note ? citeHtml(citations.cite(planting.source)) : "";
  return sectionHtml("เดือนที่ปลูกได้", `${months}${note ? `<p>${note}</p>` : ""}${cite}`);
}

function cycleHtml(cycle, citations) {
  if (!cycle.value) return sectionHtml("อายุเก็บเกี่ยว", noDataHtml());
  const note = sourcedNote(cycle);
  return sectionHtml("อายุเก็บเกี่ยว", `
    <p>${rangeText(cycle.value)} วัน</p>
    ${note ? `<p>${note}</p>` : ""}
    ${citeHtml(citations.cite(cycle.source))}`);
}

function careHtml(care, citations) {
  if (care.length === 0) return sectionHtml("วิธีดูแล", noDataHtml());
  const items = care.map((item) => `<li>${item.text}${citeHtml(citations.cite(item.source))}</li>`);
  return sectionHtml("วิธีดูแล", `<ul class="detail-list">${items.join("")}</ul>`);
}

function risksHtml(risks, citations) {
  if (risks.length === 0) return sectionHtml("ความเสี่ยงและวิธีแก้", noDataHtml());
  const items = risks.map((item) => `
    <li>
      <strong>${item.risk}</strong>
      ${item.fix ? `<p>วิธีแก้: ${item.fix}</p>` : `<p class="no-data">วิธีแก้: ${NO_DATA_TEXT}</p>`}
      ${citeHtml(citations.cite(item.source))}
    </li>`);
  return sectionHtml("ความเสี่ยงและวิธีแก้", `<ul class="detail-list">${items.join("")}</ul>`);
}

function localHtml(evidence, citations) {
  if (!evidence?.text) return sectionHtml("การปลูกในแม่ทะ", noDataHtml());
  return sectionHtml("การปลูกในแม่ทะ", `<p>${evidence.text}</p>${citeHtml(citations.cite(evidence.source))}`);
}

function sourceItemHtml(code, sources) {
  const source = sources.get(code);
  if (!source) return `<li>${escapeHtml(code)}</li>`;
  const title = escapeHtml(source.title);
  return source.url
    ? `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${title}</a></li>`
    : `<li>${title}</li>`;
}

function sourcesHtml(codes, sources) {
  if (codes.length === 0) return "";
  const items = codes.map((code) => sourceItemHtml(code, sources)).join("");
  return sectionHtml("แหล่งข้อมูล", `<ol class="source-list">${items}</ol>`);
}
