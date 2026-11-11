// task 18: อ่านข้อความจากบอร์ด ESP32 เช่น "M=45;T=29;L=62" ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้
// M = ความชื้นดิน (%) ที่บอร์ดเทียบค่ากับดินแห้งและดินเปียกแล้ว
// T = อุณหภูมิอากาศตอนวัด (องศาเซลเซียส) จาก DHT11/DHT22
// L = ความสว่างเทียบ 0–100 จาก LDR (0 = มืดสุด 100 = สว่างสุดที่เทียบไว้) ไม่ใช่หน่วยลักซ์
// ค่าเซนเซอร์ไม่ใช้คิดคะแนน (เหตุผลอยู่ใน PROGRESS.md task 18) ความชื้นดินเติมลงช่องเดิม ส่วน T กับ L เก็บไว้ในประวัติแปลง

// ช่วงค่าที่ยอมรับ ถ้าเกินแปลว่าบอร์ดอ่านพลาดหรือพิมพ์ผิด
const SENSOR_LIMITS = {
  M: { min: 0, max: 100, field: "moisture", name: "ความชื้นดิน" },
  T: { min: -10, max: 60, field: "tempC", name: "อุณหภูมิ" },
  L: { min: 0, max: 100, field: "light", name: "แสง" },
};

// แยกข้อความเป็นคู่ ชื่อ=ค่า ยอมให้คั่นด้วย ; , ช่องว่าง หรือขึ้นบรรทัดใหม่ และใช้ : แทน = ได้
function sensorPairs(text) {
  return String(text ?? "")
    .split(/[;,\s]+/)
    .filter((part) => part !== "")
    .map((part) => part.split(/[=:]/))
    .filter((pair) => pair.length === 2)
    .map(([key, value]) => [key.trim().toUpperCase(), value.trim()]);
}

// คืน { ok: true, moisture, tempC, light } (ค่าที่ไม่มีเป็น null) หรือ { ok: false, error: "ข้อความภาษาไทย" }
function parseSensorText(text) {
  const reading = { ok: true, moisture: null, tempC: null, light: null };
  const known = sensorPairs(text).filter(([key]) => SENSOR_LIMITS[key]);
  if (known.length === 0) {
    return { ok: false, error: "อ่านค่าไม่ออก ข้อความต้องหน้าตาแบบ M=45;T=29;L=62 ลองคัดลอกจากหน้าเว็บของบอร์ดอีกครั้ง" };
  }
  for (const [key, valueText] of known) {
    const limit = SENSOR_LIMITS[key];
    const value = parseSensorNumber(valueText); // อยู่ใน wizard.js คืน null ถ้าไม่ใช่ตัวเลข เช่น "nan"
    if (value === null || value < limit.min || value > limit.max) {
      return { ok: false, error: `ค่า${limit.name} (${key}) ต้องเป็นตัวเลข ${limit.min} ถึง ${limit.max} ลองวัดใหม่อีกครั้ง` };
    }
    reading[limit.field] = value;
  }
  return reading;
}

// ใส่ค่าที่อ่านได้ลงคำตอบ ความชื้นดินเติมช่องเดิม (ผู้ใช้แก้เองต่อได้) ค่าที่บอร์ดไม่ส่งมาจะไม่ทับของเดิม
function applySensorReading(draft, reading) {
  if (reading.moisture !== null) draft.moistureText = String(reading.moisture);
  draft.sensorTempText = reading.tempC === null ? "" : String(reading.tempC);
  draft.sensorLightText = reading.light === null ? "" : String(reading.light);
}

// ข้อความสรุปค่าจากเซนเซอร์ที่เก็บในแปลง เช่น "อุณหภูมิตอนวัด 29 องศา · แสง 62%" ถ้าไม่มีเลยคืน null
function sensorSummaryText(plot) {
  const parts = [];
  if (plot.sensorTempC !== null && plot.sensorTempC !== undefined) parts.push(`อุณหภูมิตอนวัด ${plot.sensorTempC} องศา`);
  if (plot.sensorLight !== null && plot.sensorLight !== undefined) parts.push(`แสง ${plot.sensorLight}%`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
