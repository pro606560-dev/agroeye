// รอบปลูก (task 19): บันทึกว่าแปลงนี้ปลูกอะไรจริง ปลูกเมื่อไร เก็บเกี่ยวเมื่อไร
// เก็บไว้ในแปลงที่บันทึกแล้ว (record.plantings ใน js/plots-store.js) ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้
// รอบปลูกเป็นแค่บันทึกของเกษตรกร ไม่เข้าสูตรคะแนนและไม่เปลี่ยนอันดับพืช
// รูปร่าง: { id, cropId, otherName, plantedOn, harvestedOn, note }
// วันที่เก็บแบบ "YYYY-MM-DD" ปี ค.ศ. ตามที่ช่องวันที่ของเบราว์เซอร์ให้มา (แสดงผลเป็น พ.ศ.)

const OTHER_CROP = "other";
const PLANTING_NOTE_MAX = 100;
const PLANTING_OTHER_MAX = 40;

// คืนรายการข้อความผิดพลาด ถ้ากรอกถูกคืนรายการว่าง
// input มาจากฟอร์ม: { cropId, otherName, plantedOn, harvestedOn, note } (ทุกช่องเป็นข้อความ)
function plantingErrors(input) {
  const errors = [];
  if (!input.cropId) errors.push("เลือกพืชที่ปลูกก่อน");
  else if (input.cropId === OTHER_CROP && !input.otherName.trim()) errors.push("พิมพ์ชื่อพืชที่ปลูก");
  if (input.plantedOn && input.harvestedOn && input.harvestedOn < input.plantedOn) {
    errors.push("วันเก็บเกี่ยวต้องอยู่หลังวันปลูก");
  }
  if (input.note.trim().length > PLANTING_NOTE_MAX) errors.push(`หมายเหตุยาวได้ไม่เกิน ${PLANTING_NOTE_MAX} ตัวอักษร`);
  return errors;
}

// แปลงคำตอบในฟอร์มเป็นรอบปลูก 1 รอบ (ช่องที่เว้นว่างเก็บเป็น null)
function makePlanting(input) {
  const isOther = input.cropId === OTHER_CROP;
  return {
    id: newPlotId("r"),
    cropId: isOther ? null : input.cropId,
    otherName: isOther ? input.otherName.trim().slice(0, PLANTING_OTHER_MAX) : null,
    plantedOn: input.plantedOn || null,
    harvestedOn: input.harvestedOn || null,
    note: input.note.trim() || null,
  };
}

// แก้รายการรอบปลูกของแปลงเดียว แล้วเขียนกลับ คืน true ถ้าบันทึกสำเร็จ
function changePlantings(plotId, change) {
  const list = loadSavedPlots();
  const record = list.find((item) => item.id === plotId);
  if (!record) return false;
  const updated = { ...record, plantings: change(record.plantings) };
  return writeStorage(PLOTS_KEY, list.map((item) => (item.id === plotId ? updated : item)));
}

function addPlanting(plotId, planting) {
  return changePlantings(plotId, (plantings) => [planting, ...plantings]);
}

function deletePlanting(plotId, plantingId) {
  return changePlantings(plotId, (plantings) => plantings.filter((item) => item.id !== plantingId));
}

// เรียงรอบที่ปลูกล่าสุดไว้บน รอบที่ไม่ได้ใส่วันปลูกไว้ท้าย
function sortedPlantings(plantings) {
  return [...plantings].sort((a, b) => (b.plantedOn ?? "").localeCompare(a.plantedOn ?? ""));
}

// "2026-06-15" → "15 มิ.ย. 2569" (แยกเลขเอง ไม่ใช้ new Date จะได้ไม่เพี้ยนเพราะเขตเวลา)
function thaiDay(dayText) {
  const [year, month, day] = dayText.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year + 543}`;
}
