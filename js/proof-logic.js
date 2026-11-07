// การคำนวณของหน้าพิสูจน์สมมติฐาน (task 14) แยกจากหน้าจอเพื่อให้ tests.html ทดสอบได้
// ใช้ rankCrops() ตัวเดียวกับหน้าผลลัพธ์ จึงได้ตัวเลขเดียวกับ tests.html และแอปจริง

// ทุกกรณีใช้เดือนพฤษภาคม (ตรงกับ tests/expected.json)
const PROOF_MONTH = 5;

// จับเวลากี่รอบ (สมมติฐานข้อ 2)
const PROOF_TIMING_ROUNDS = 10;

// จับเวลา AI กี่รอบ (น้อยกว่าการคำนวณ เพราะทุกรอบใช้เน็ตและโควตาฟรีของ Gemini)
const PROOF_AI_ROUNDS = 5;

// จุดสำรวจต้องมีค่าที่วัดแล้วอย่างน้อยกี่ปัจจัย จึงนำมาแสดง
const PROOF_MIN_SURVEY_FACTORS = 2;

// ค่าของแปลงที่ใช้คิดคะแนน (เดือนไม่นับ เพราะทุกกรณีใช้ พ.ค. เหมือนกัน)
const PLOT_VALUE_KEYS = ["ph", "texture", "drainage", "light"];

// ที่มาของแต่ละพื้นที่ ใช้ในตารางและส่วนข้อจำกัด
const AREA_KINDS = {
  survey: "ข้อมูลจริงที่ทีมวัด",
  soilSeries: "จำลองจากข้อมูลชุดดิน",
  assumed: "กรณีสมมติ",
};

function countMeasuredValues(point) {
  return PLOT_VALUE_KEYS.filter((key) => point[key] !== null && point[key] !== undefined).length;
}

function areaFromScenario(scenario) {
  const kind = scenario.source === "สมมติ" ? "assumed" : "soilSeries";
  return { ...scenario, kind };
}

function areaFromSurveyPoint(point) {
  return { ...point, kind: "survey" };
}

// รวมกรณีทดสอบทั้งหมด + จุดสำรวจจริงที่มีค่าอย่างน้อย 2 ปัจจัย
function proofAreas(scenarios, surveyPoints) {
  const usablePoints = surveyPoints.filter(
    (point) => countMeasuredValues(point) >= PROOF_MIN_SURVEY_FACTORS
  );
  return [...scenarios.map(areaFromScenario), ...usablePoints.map(areaFromSurveyPoint)];
}

// จัดอันดับพืชของทุกพื้นที่ climate = null คือไม่คิดอุณหภูมิ (เหมือนข้อสอบเฉลย)
function runProof(areas, crops, climate) {
  return areas.map((area) => ({
    area,
    ranked: rankCrops(plotFromScenario(area, PROOF_MONTH), crops, climate),
  }));
}

// พืชอันดับ 1 ของแต่ละพื้นที่ (null ถ้าพื้นที่นั้นไม่มีพืชที่ข้อมูลพอ)
function topCropIds(rows) {
  return rows.map((row) => row.ranked.top[0]?.cropId ?? null);
}

// ข้อสรุปสมมติฐานข้อ 1: กี่พื้นที่ ได้พืชอันดับ 1 ต่างกันกี่ชนิด
function summarizeTopCrops(rows) {
  const tops = topCropIds(rows).filter((id) => id !== null);
  return { areaCount: rows.length, distinctTopCount: new Set(tops).size };
}

// นับว่าพืชแต่ละชนิดติด 3 อันดับแรกกี่ครั้ง เรียงมากไปน้อย (เท่ากันเรียงตาม crops.json)
// พืชที่ไม่ติดเลยก็แสดงเป็น 0 เพื่อให้เห็นครบทุกชนิด
function countTopAppearances(rows, crops) {
  const counts = crops.map((crop) => ({
    cropId: crop.id,
    nameTh: crop.nameTh,
    count: rows.filter((row) => row.ranked.top.some((r) => r.cropId === crop.id)).length,
  }));
  return counts.sort((a, b) => b.count - a.count);
}

// ---------- สมมติฐานข้อ 2: จับเวลา ----------

// เรียก task ซ้ำหลายรอบ วัดเวลาแต่ละรอบด้วย performance.now() (มิลลิวินาที)
function timeRounds(task, rounds = PROOF_TIMING_ROUNDS) {
  const times = [];
  for (let i = 0; i < rounds; i++) {
    const start = performance.now();
    task();
    times.push(performance.now() - start);
  }
  return times;
}

// จับเวลางานที่ต้องรอคำตอบ (เช่น ถาม AI) task ต้องคืน { ok, reason }
// รอบไหนไม่สำเร็จให้หยุดทันที (ไม่ถามต่อให้เปลืองโควตา) คืนเวลาของรอบที่สำเร็จ + เหตุผลที่หยุด
async function timeAsyncRounds(task, rounds, onRound = () => {}) {
  const times = [];
  for (let i = 0; i < rounds; i++) {
    onRound(i + 1);
    const start = performance.now();
    const result = await task();
    const time = performance.now() - start;
    if (!result.ok) return { times, failReason: result.reason };
    times.push(time);
  }
  return { times, failReason: null };
}

// ค่าเฉลี่ย ต่ำสุด สูงสุด ของเวลาทุกรอบ
function timeStats(times) {
  const total = times.reduce((sum, time) => sum + time, 0);
  return { average: total / times.length, min: Math.min(...times), max: Math.max(...times) };
}

// ---------- ส่งออกตาราง ----------

// ข้อความคั่นด้วย tab (คอลัมน์) และขึ้นบรรทัดใหม่ (แถว) วางใน Word หรือ Excel ได้
// ตัด tab และการขึ้นบรรทัดในช่องออก ไม่อย่างนั้นช่องจะเลื่อน
function tableToTsv(rows) {
  const clean = (cell) => String(cell ?? "").replace(/[\t\r\n]+/g, " ");
  return rows.map((row) => row.map(clean).join("\t")).join("\n");
}
