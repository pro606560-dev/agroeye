// ส่วนที่ 2 ของหน้าพิสูจน์สมมติฐาน: จับเวลาการคำนวณ 10 รอบ (สมมติฐานข้อ 2)
// 1 รอบ = จัดอันดับพืชทุกชนิดให้ครบทุกพื้นที่ในตารางที่ 1 (ไม่รวมเวลาโหลดไฟล์ เพราะโหลดครั้งเดียวตอนเปิดแอป)

let lastTimes = null; // เวลาของการจับครั้งล่าสุด (มิลลิวินาที) null = ยังไม่ได้กด

function msText(ms) {
  return ms.toFixed(2);
}

function hypothesisTwoHtml() {
  lastTimes = null; // คำนวณใหม่ (เช่น สลับคิดอุณหภูมิและฝน) ต้องจับเวลาใหม่
  const { areas, crops } = proofState;
  return `
    <section class="proof-section" aria-labelledby="h2-title">
      <h3 id="h2-title">สมมติฐานข้อ 2: แอปประมวลผลได้ในเวลาไม่นาน</h3>
      <p>1 รอบ = จัดอันดับพืช ${crops.length} ชนิด ให้ครบ ${areas.length} พื้นที่ ในเครื่องนี้ (ไม่ใช้เน็ต)</p>
      <button class="btn btn-primary" type="button" data-run-timing>จับเวลา ${PROOF_TIMING_ROUNDS} รอบ</button>
      <div id="timing-result"></div>
      <p class="proof-note">ยังไม่มีส่วน AI ในแอป จึงยังไม่มีตารางเวลาของ AI</p>
    </section>`;
}

// แถวของตารางเวลา (แถวแรกคือหัวตาราง) ใช้ทั้งแสดง คัดลอก และบันทึกรูป
function timingTableRows() {
  const stats = timeStats(lastTimes);
  const rounds = lastTimes.map((time, i) => [`รอบที่ ${i + 1}`, msText(time)]);
  return [
    ["รอบ", "เวลา (มิลลิวินาที)"],
    ...rounds,
    ["ค่าเฉลี่ย", msText(stats.average)],
    ["ต่ำสุด", msText(stats.min)],
    ["สูงสุด", msText(stats.max)],
  ];
}

function timingSummary() {
  const { average, max } = timeStats(lastTimes);
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
