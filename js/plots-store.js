// เก็บแปลงที่บันทึกไว้ในเครื่อง (localStorage) ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้
// แต่ละแปลงเก็บผลรอบล่าสุดไว้ด้านบน และรอบก่อน ๆ ไว้ใน earlier (ใหม่สุดอยู่หน้า)
// รูปร่าง: { id, name, date, plot, top3: [{ id, score }], appVersion, usedClimate, answers, earlier: [...],
//          plantings: [...], dataVersion }
// dataVersion 1 (ไม่มีเลข) = แปลงที่บันทึกจากแอปเวอร์ชัน 1.0–1.1 / 2 = มีรอบปลูก (plantings) เพิ่ม task 19

const PLOTS_KEY = "plots";
const PLOTS_DATA_VERSION = 2;
const STORAGE_CHECK_KEY = "storage-check";

// ลองเขียนแล้วลบ เพื่อรู้ว่าเครื่องนี้เก็บข้อมูลได้ไหม (โหมดไม่ระบุตัวตนบางเครื่องเก็บไม่ได้)
function canUseStorage() {
  return writeStorage(STORAGE_CHECK_KEY, 1) && removeStorage(STORAGE_CHECK_KEY);
}

// คืนรายการแปลงเรียงจากตรวจล่าสุด ถ้าข้อมูลเสียคืนรายการว่าง
function loadSavedPlots() {
  const list = readStorage(PLOTS_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter((record) => record && record.id && record.date)
    .map(upgradePlotRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ตัวแปลงข้อมูลเก่า: แปลงที่บันทึกก่อนเวอร์ชัน 1.2 ไม่มีรอบปลูก ให้เติมรายการว่าง ของเดิมไม่หาย
// แปลงตอนอ่านทุกครั้ง แล้วจะถูกเขียนเป็นรูปแบบใหม่เองเมื่อบันทึกครั้งถัดไป
function upgradePlotRecord(record) {
  if (record.dataVersion >= PLOTS_DATA_VERSION) return record;
  return {
    ...record,
    earlier: Array.isArray(record.earlier) ? record.earlier : [],
    plantings: Array.isArray(record.plantings) ? record.plantings : [],
    dataVersion: PLOTS_DATA_VERSION,
  };
}

function findSavedPlot(id) {
  return loadSavedPlots().find((record) => record.id === id) ?? null;
}

// เก็บเฉพาะรหัสพืชกับคะแนนของพืชที่แนะนำ (ไม่เกิน 3 อันดับ)
function topThreeOf(recommended) {
  return recommended.slice(0, TOP_CROP_COUNT).map((result) => ({ id: result.cropId, score: result.score }));
}

// ผลการตรวจ 1 รอบ answers คือคำตอบในหน้ากรอก ใช้ตอนกด "แก้ข้อมูล"
function makeRound(plot, answers, recommended, usedClimate, now = new Date()) {
  return {
    date: now.toISOString(),
    plot,
    top3: topThreeOf(recommended),
    appVersion: APP_VERSION,
    usedClimate,
    answers: structuredClone(answers),
  };
}

// บันทึกรอบใหม่ ถ้า plotId ตรงกับแปลงเดิม รอบเดิมจะย้ายไปอยู่ใน earlier
// คืนรหัสแปลงถ้าบันทึกสำเร็จ คืน null ถ้าเครื่องเก็บข้อมูลไม่ได้
function saveRound(plotId, round) {
  const list = loadSavedPlots();
  const old = list.find((record) => record.id === plotId);
  let record;
  if (old) {
    // รอบปลูกเป็นของแปลง ไม่ใช่ของรอบตรวจ จึงไม่ย้ายไป earlier
    const { id, name, earlier, plantings, dataVersion, ...lastRound } = old;
    record = { ...round, id, name: round.plot.name, earlier: [lastRound, ...earlier], plantings, dataVersion };
  } else {
    record = { ...round, id: newPlotId(), name: round.plot.name, earlier: [], plantings: [], dataVersion: PLOTS_DATA_VERSION };
  }
  const others = list.filter((item) => item.id !== record.id);
  return writeStorage(PLOTS_KEY, [record, ...others]) ? record.id : null;
}

// รหัสไม่ซ้ำ: เวลา + เลขสุ่ม (บันทึกเร็ว ๆ ในมิลลิวินาทีเดียวกันก็ไม่ชน)
function newPlotId(prefix = "p") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// คืน true ถ้าลบสำเร็จ
function deleteSavedPlot(id) {
  const list = loadSavedPlots();
  return writeStorage(PLOTS_KEY, list.filter((record) => record.id !== id));
}

// ล้างประวัติทั้งหมด (หน้าตั้งค่า task 16) คืน true ถ้าลบสำเร็จ
function clearSavedPlots() {
  return removeStorage(PLOTS_KEY);
}

// วันที่แบบไทย พ.ศ. เช่น "5 พ.ย. 2569"
function thaiDate(isoText) {
  const date = new Date(isoText);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear() + 543}`;
}

// เทียบพืชทีละอันดับ ระหว่างครั้งก่อนกับครั้งนี้
function compareTop3(before, after) {
  const count = Math.max(before.length, after.length);
  return Array.from({ length: count }, (_, index) => ({
    rank: index + 1,
    before: before[index] ?? null,
    after: after[index] ?? null,
    same: before[index]?.id === after[index]?.id,
  }));
}
