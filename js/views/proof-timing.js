// ส่วนที่ 2 ของหน้าพิสูจน์สมมติฐาน: จับเวลาการคำนวณ 10 รอบ (สมมติฐานข้อ 2)
// 1 รอบ = จัดอันดับพืชทุกชนิดให้ครบทุกพื้นที่ในตารางที่ 1 (ไม่รวมเวลาโหลดไฟล์ เพราะโหลดครั้งเดียวตอนเปิดแอป)

let lastTimes = null; // เวลาของการจับครั้งล่าสุด (มิลลิวินาที) null = ยังไม่ได้กด
let lastAiTimes = null; // เวลาที่ AI ใช้ในการจับครั้งล่าสุด null = ยังไม่ได้กด
let aiTimingRunning = false; // กันกดซ้ำระหว่างรอ AI

function msText(ms) {
  return ms.toFixed(2);
}

function hypothesisTwoHtml() {
  lastTimes = null; // คำนวณใหม่ (เช่น สลับคิดอุณหภูมิและฝน) ต้องจับเวลาใหม่
  lastAiTimes = null;
  const { areas, crops } = proofState;
  return `
    <section class="proof-section" aria-labelledby="h2-title">
      <h3 id="h2-title">สมมติฐานข้อ 2: แอปประมวลผลได้ในเวลาไม่นาน</h3>
      <p>1 รอบ = จัดอันดับพืช ${crops.length} ชนิด ให้ครบ ${areas.length} พื้นที่ ในเครื่องนี้ (ไม่ใช้เน็ต)</p>
      <button class="btn btn-primary" type="button" data-run-timing>จับเวลา ${PROOF_TIMING_ROUNDS} รอบ</button>
      <div id="timing-result"></div>
      <p class="proof-note">เวลานี้ไม่รวมคำอธิบายจาก AI เพราะ AI ไม่ได้ใช้เลือกพืช และต้องใช้อินเทอร์เน็ต (เวลาของ AI แยกไว้ด้านล่าง)</p>
      ${aiTimingHtml()}
    </section>`;
}

// แถวของตารางเวลา (แถวแรกคือหัวตาราง) ใช้ทั้งแสดง คัดลอก และบันทึกรูป
// times = เวลาแต่ละรอบ (ใช้ทั้งตารางที่ 2 และตารางที่ 3)
function timesToRows(times) {
  const stats = timeStats(times);
  const rounds = times.map((time, i) => [`รอบที่ ${i + 1}`, msText(time)]);
  return [
    ["รอบ", "เวลา (มิลลิวินาที)"],
    ...rounds,
    ["ค่าเฉลี่ย", msText(stats.average)],
    ["ต่ำสุด", msText(stats.min)],
    ["สูงสุด", msText(stats.max)],
  ];
}

function timingTableRows() {
  return timesToRows(lastTimes);
}

function timingSummary(times = lastTimes) {
  const { average, max } = timeStats(times);
  return `เฉลี่ยรอบละ ${msText(average)} มิลลิวินาที ช้าสุด ${msText(max)} มิลลิวินาที (1 วินาที = 1,000 มิลลิวินาที)`;
}

function showTiming(root) {
  const { areas, crops } = proofState;
  const climate = activeClimate();
  lastTimes = timeRounds(() => runProof(areas, crops, climate));
  root.querySelector("#timing-result").innerHTML = `
    <div class="alert alert-ok proof-summary" role="status">
      <strong class="alert-title">${timingSummary()}</strong>
      <p>เครื่องต่างกัน เวลาจะต่างกัน กดซ้ำได้ทุกเมื่อ</p>
    </div>
    ${tableHtml(timingTableRows(), "ตารางที่ 2 เวลาที่ใช้คำนวณ 10 รอบ")}
    ${tableButtonsHtml("timing")}`;
}

// ---------- เวลาที่ AI ใช้อธิบาย (ใช้เน็ต ต้องมีรหัส AI) ----------

// ถาม AI เรื่องพืชอันดับ 1 ของพื้นที่แรกที่มีพืช (พื้นที่ไหนก็ได้ เพราะวัดเวลา ไม่ได้วัดคำตอบ)
function aiTimingSample() {
  const row = proofState.rows.find((r) => r.ranked.top.length > 0);
  if (!row) return null;
  const cropResult = row.ranked.top[0];
  const crop = proofState.crops.find((c) => c.id === cropResult.cropId);
  return { areaName: row.area.name, plot: plotFromScenario(row.area, PROOF_MONTH), cropResult, crop };
}

function aiTimingHtml() {
  const sample = aiTimingSample();
  if (!aiKey() || !sample) {
    return `<p class="proof-note">ยังไม่ได้ใส่รหัส AI ในหน้าตั้งค่า จึงยังจับเวลาของ AI ไม่ได้</p>`;
  }
  return `
    <h4>เวลาที่ AI ใช้อธิบาย</h4>
    <p>1 รอบ = ขอคำอธิบาย${escapeHtml(sample.crop.nameTh)} (อันดับ 1 ของ${escapeHtml(sample.areaName)}) จาก AI 1 ครั้ง ใช้อินเทอร์เน็ต และถามใหม่ทุกรอบ ไม่ใช้คำตอบที่เก็บไว้</p>
    <button class="btn btn-secondary" type="button" data-run-ai-timing>จับเวลา AI ${PROOF_AI_ROUNDS} รอบ</button>
    <p class="proof-status" role="status" id="ai-timing-status"></p>
    <div id="ai-timing-result"></div>`;
}

function aiTimingTableRows() {
  return timesToRows(lastAiTimes);
}

function aiTimingResultHtml({ times, failReason }) {
  const fail = failReason
    ? `<div class="alert alert-warn" role="alert"><strong class="alert-title">${AI_TIMING_FAIL_TEXTS[failReason] ?? AI_TIMING_FAIL_TEXTS.error}</strong>
       <p>สำเร็จ ${times.length} จาก ${PROOF_AI_ROUNDS} รอบ</p></div>`
    : "";
  if (times.length === 0) return fail;
  const caption = `ตารางที่ 3 เวลาที่ AI ใช้อธิบาย ${times.length} รอบ`;
  return `${fail}
    <div class="alert alert-ok proof-summary" role="status">
      <strong class="alert-title">AI ${timingSummary(times)}</strong>
      <p>เวลาของ AI ขึ้นกับความเร็วเน็ตและเครื่องของ Google จึงช้ากว่าการคำนวณในเครื่องมาก แต่ไม่ได้ใช้เลือกพืช</p>
    </div>
    ${tableHtml(timesToRows(times), caption)}
    ${tableButtonsHtml("aiTiming")}`;
}

async function showAiTiming(root) {
  const sample = aiTimingSample();
  const button = root.querySelector("[data-run-ai-timing]");
  if (aiTimingRunning || !sample || !button) return;
  aiTimingRunning = true;
  button.disabled = true;
  const status = root.querySelector("#ai-timing-status");
  const ask = () => askAiFresh(sample.plot, sample.cropResult, sample.crop);
  const showRound = (n) => { status.textContent = `กำลังถาม AI รอบที่ ${n} จาก ${PROOF_AI_ROUNDS}`; };
  const result = await timeAsyncRounds(ask, PROOF_AI_ROUNDS, showRound);
  aiTimingRunning = false;
  button.disabled = false;
  status.textContent = "";
  lastAiTimes = result.times;
  const box = root.querySelector("#ai-timing-result");
  if (box) box.innerHTML = aiTimingResultHtml(result); // ผู้ใช้อาจออกจากหน้านี้ระหว่างรอ
}
