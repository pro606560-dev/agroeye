// แปลงคะแนนแยกปัจจัยจาก scoring.js เป็นเหตุผลภาษาไทยคำง่าย (docs/SPEC.md หัวข้อ 4.3)

const TEXTURE_NAMES = { heavy: "ดินเหนียว", medium: "ดินร่วน", light: "ดินทราย/ร่วนปนทราย" };
const MONTH_NAMES = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const CONFIDENCE_LABELS = { high: "สูง", medium: "ปานกลาง", low: "ต่ำ" };

// บอกว่าดินเปรี้ยวหรือด่างกว่าช่วงที่พืชชอบ ใช้ขอบของช่วงเหมาะ ถ้าไม่มีใช้ช่วงที่ทนได้
// pH 7 คือจุดกลาง ถ้าสูงกว่าช่วงแต่ยังไม่ถึง 7 ดินยังเปรี้ยวอยู่ จึงห้ามเรียกว่าด่าง
function phDirectionWord(ph, range) {
  const bounds = range.optimal || range.tolerable;
  if (bounds[0] !== null && ph < bounds[0]) return "ดินเปรี้ยว";
  return ph > 7 ? "ดินเป็นด่าง" : "ดินเปรี้ยวน้อย";
}

function phReason(factor) {
  const ph = factor.plotValue;
  if (factor.factorScore === 1) return `ความเปรี้ยวของดินพอดี (pH ${ph})`;
  const word = phDirectionWord(ph, factor.cropRange);
  if (factor.factorScore === 0.5 && !factor.cropRange.optimal) return `พืชนี้ทนดินแบบนี้ได้ (pH ${ph})`;
  if (factor.factorScore === 0.5) return `${word}ไปนิด (pH ${ph}) แต่พืชนี้ทนได้`;
  return `${word}เกินไป (pH ${ph})`;
}

function textureReason(factor, crop) {
  const name = TEXTURE_NAMES[factor.plotValue];
  if (factor.factorScore === 1) return `${name} เหมาะกับ${crop.nameTh}`;
  if (factor.factorScore === 0.5) return `${name} พอปลูก${crop.nameTh}ได้`;
  return `${name} ไม่เหมาะกับ${crop.nameTh}`;
}

function drainageReason(factor) {
  if (factor.factorScore === 0) return "แปลงน้ำขัง แต่พืชนี้ไม่ชอบน้ำขัง";
  if (factor.plotValue === "poor") return "แปลงน้ำขัง แต่พืชนี้ทนได้";
  return factor.cropRange === "good" ? "แปลงน้ำไม่ขัง เหมาะกับพืชนี้" : "แปลงน้ำไม่ขัง";
}

// หาเดือนปลูกถัดไปที่ใกล้ที่สุด นับต่อไปข้างหน้าแบบวนรอบปี
function nextPlantingMonth(month, months) {
  const monthsAhead = (m) => (m - month + 12) % 12;
  return months.reduce((best, m) => (monthsAhead(m) < monthsAhead(best) ? m : best));
}

function monthReason(factor) {
  const name = MONTH_NAMES[factor.plotValue - 1];
  if (factor.factorScore === 1) return `เดือน ${name} เป็นช่วงปลูกของพืชนี้`;
  const next = nextPlantingMonth(factor.plotValue, factor.cropRange);
  return `เดือน ${name} ไม่ใช่ช่วงปลูก ควรรอถึง ${MONTH_NAMES[next - 1]}`;
}

function levelReason(subject, factorScore) {
  if (factorScore === 1) return `${subject}เหมาะกับพืชนี้`;
  return factorScore === 0.5 ? `${subject}พอใช้ได้ พืชนี้ทนได้` : `${subject}ไม่เหมาะกับพืชนี้`;
}

function lightReason(factor) {
  if (factor.factorScore === 0) return "แปลงร่ม แต่พืชนี้ต้องการแดดจัด";
  return "แสงที่แปลงเหมาะกับพืชนี้";
}

// ตัวกรองความหนาว (js/scoring.js) ลดคะแนนแล้ว จึงบอกเหตุผลเรื่องหน้าหนาวแทน
function tempReason(factor) {
  if (factor.coldPenalty) return "หน้าหนาวที่นี่เย็นเกินไปสำหรับพืชนี้ จึงลดคะแนนอุณหภูมิลง";
  return levelReason("อุณหภูมิ", factor.factorScore);
}

const REASON_BUILDERS = {
  ph: phReason,
  texture: textureReason,
  drainage: drainageReason,
  plantingMonths: monthReason,
  tempC: tempReason,
  rainMmYear: (factor) => levelReason("ปริมาณฝน", factor.factorScore),
  light: lightReason,
};

// เหตุผลเรียงตามลำดับปัจจัยใน scoring.js เฉพาะปัจจัยที่ใช้คิดคะแนน
function buildReasons(result, crop) {
  return result.factors
    .filter((factor) => factor.used)
    .map((factor) => REASON_BUILDERS[factor.key](factor, crop));
}

// ความเสี่ยงที่ตรงกับแปลง ตอนนี้ตรวจได้เรื่องดินเปรี้ยว
// ตัวเลขเกณฑ์อ่านจากข้อความความเสี่ยงใน crops.json ไม่ได้กำหนดเอง
function matchingRisks(plot, crop) {
  return crop.risks.filter(({ risk }) => {
    const match = risk.match(/ดินเปรี้ยวมาก \(pH ต่ำกว่า ([\d.]+)\)/);
    return match !== null && plot.ph != null && plot.ph < Number(match[1]);
  });
}

// บอกปัจจัยที่ยังไม่ได้ใช้คิดคะแนน คืน null ถ้าครบทุกปัจจัย
function missingDataText(result) {
  const labels = result.factors
    .filter((factor) => !factor.used)
    .map((factor) => FACTORS.find((f) => f.key === factor.key))
    .map((info) => info.plainLabel ?? info.label);
  return labels.length > 0 ? `ยังไม่มีข้อมูล: ${labels.join(", ")}` : null;
}
