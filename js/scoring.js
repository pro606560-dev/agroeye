// สูตรให้คะแนนพืช (docs/SPEC.md หัวข้อ 4) แอปเลือกพืชด้วยสูตรนี้เท่านั้น
// น้ำหนักอยู่ใน js/config.js
//
// ค่าที่ใช้:
// plot    = { ph, texture, drainage, month, light }  ค่าที่ไม่รู้ให้เป็น null
//           light คือ "full-sun" (แดดจัด) หรือ "shade" (ร่มรำไร)
// climate = { monthlyTempC: [ค่าเดือน 1..12], annualMeanTempC, coldestMonthMinTempC, rainMmYear }
//           หรือ null ถ้าไม่มีข้อมูลอากาศ (มาจาก js/weather.js ช่องที่ไม่มีให้เป็น null)

// ---------- คะแนนแต่ละปัจจัย: คืน 1, 0.5, 0 หรือ null (ไม่มีข้อมูล) ----------

// ขอบที่เป็น null แปลว่าไม่จำกัด เช่น [1500, null] = ตั้งแต่ 1500 ขึ้นไป
function isInRange(value, [min, max]) {
  return (min === null || value >= min) && (max === null || value <= max);
}

// ใช้กับ pH อุณหภูมิ และฝน
function scoreRange(value, optimal, tolerable) {
  if (value == null || (!optimal && !tolerable)) return null;
  if (optimal && isInRange(value, optimal)) return 1;
  if (tolerable && isInRange(value, tolerable)) return 0.5;
  return 0;
}

function scoreTexture(plotTexture, { good, ok }) {
  if (plotTexture == null || (!good && !ok)) return null;
  if (good && good.includes(plotTexture)) return 1;
  if (ok && ok.includes(plotTexture)) return 0.5;
  return 0;
}

// ได้ 0 กรณีเดียว: พืชต้องการดินระบายน้ำดี แต่แปลงน้ำขัง
function scoreDrainage(plotDrainage, cropDrainage) {
  if (plotDrainage == null || cropDrainage == null) return null;
  return cropDrainage === "good" && plotDrainage === "poor" ? 0 : 1;
}

// ระยะห่างของเดือนแบบวนรอบปี เช่น ธ.ค. (12) กับ ม.ค. (1) ห่างกัน 1 เดือน
function monthDistance(monthA, monthB) {
  const distance = Math.abs(monthA - monthB);
  return Math.min(distance, 12 - distance);
}

function scoreMonth(month, cropMonths) {
  if (month == null || cropMonths == null) return null;
  const nearest = Math.min(...cropMonths.map((m) => monthDistance(month, m)));
  if (nearest === 0) return 1;
  return nearest === 1 ? 0.5 : 0;
}

// ได้ 0 กรณีเดียว: พืชต้องการแดดจัด แต่แปลงร่ม
function scoreLight(plotLight, cropLight) {
  if (plotLight == null || cropLight == null) return null;
  return cropLight === "full-sun" && plotLight === "shade" ? 0 : 1;
}

// ---------- อุณหภูมิ (docs/SPEC.md ข้อ 4.1 และ 4.1.1) ----------

// จำนวนเดือนที่พืชล้มลุกอยู่ในแปลง นับเดือนที่ปลูกเป็นเดือนแรก
// - ข้าวไวแสง: ปลูกจนถึงเดือนที่เก็บเกี่ยว (harvestApprox เช่น "11-21" = พ.ย.)
// - พืชที่มีอายุเป็นช่วง [สั้นสุด, นานสุด] วัน: ใช้อายุสั้นสุด เช่น 240 วัน = 8 เดือน
// - ไม่มีข้อมูลอายุพืช: ใช้เดือนที่ปลูกเดือนเดียว (ผู้ใช้เลือก 5 พ.ย. 2569)
function monthsInField(plantMonth, crop) {
  const harvest = crop.harvestApprox?.value;
  if (harvest) {
    const harvestMonth = Number(harvest.split("-")[0]);
    return ((harvestMonth - plantMonth + 12) % 12) + 1;
  }
  const days = crop.cycleDays?.value;
  if (days) return Math.min(12, Math.max(1, Math.round(days[0] / DAYS_PER_MONTH)));
  return 1;
}

// รายชื่อเดือน (1–12) ที่พืชอยู่ในแปลง วนข้ามปีได้ เช่น ปลูก พ.ย. 3 เดือน = [11, 12, 1]
function fieldMonthList(plantMonth, crop) {
  const count = monthsInField(plantMonth, crop);
  return Array.from({ length: count }, (_, i) => ((plantMonth - 1 + i) % 12) + 1);
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

// อุณหภูมิของแปลงที่ใช้เทียบกับพืช
// - ไม้ยืนต้น (tempBasis = "annual_mean") อยู่ในแปลงทั้งปี จึงใช้อุณหภูมิเฉลี่ยทั้งปี
// - พืชล้มลุก ใช้อุณหภูมิเฉลี่ยของเดือนที่อยู่ในแปลง ต้องรู้เดือนที่ปลูก
// ปัดเป็นทศนิยม 1 ตำแหน่ง ให้ตรงกับตัวเลขที่แสดงบนหน้าจอ
function plotTempC(plot, crop, climate) {
  if (!climate) return null;
  if (crop.tempBasis === "annual_mean") return climate.annualMeanTempC ?? null;
  if (plot.month == null || !climate.monthlyTempC) return null;
  const temps = fieldMonthList(plot.month, crop).map((m) => climate.monthlyTempC[m - 1]);
  return Math.round(average(temps) * 10) / 10;
}

// ตัวกรองความหนาว: หนาวเกินไปถ้าต่ำสุดเฉลี่ยของเดือนที่หนาวที่สุดต่ำกว่าขอบล่างของ coldLimitC
// พืชที่ไม่มี coldLimitC หรือไม่มีข้อมูลต่ำสุด = ไม่กรอง
function isTooCold(crop, climate) {
  const limit = crop.coldLimitC?.value;
  const coldest = climate?.coldestMonthMinTempC;
  return limit != null && coldest != null && coldest < limit[0];
}

// คะแนนอุณหภูมิ = แบบเดียวกับ pH แล้วคูณ COLD_PENALTY_FACTOR ถ้าหนาวเกินไป (ลด ไม่ตัดเป็น 0)
function scoreTemp(value, range, crop, climate) {
  const base = scoreRange(value, range.optimal, range.tolerable);
  if (base === null || !isTooCold(crop, climate)) return base;
  return base * COLD_PENALTY_FACTOR;
}

// ---------- รายการปัจจัย: แต่ละปัจจัยอ่านค่าจากไหน และให้คะแนนอย่างไร ----------

const readRange = (field) => ({ optimal: field.optimal, tolerable: field.tolerable });

const FACTOR_RULES = [
  {
    key: "ph",
    plotValue: (plot) => plot.ph,
    cropRange: (crop) => readRange(crop.ph),
    score: (value, range) => scoreRange(value, range.optimal, range.tolerable),
  },
  {
    key: "texture",
    plotValue: (plot) => plot.texture,
    cropRange: (crop) => ({ good: crop.texture.good, ok: crop.texture.ok }),
    score: scoreTexture,
  },
  {
    key: "drainage",
    plotValue: (plot) => plot.drainage,
    cropRange: (crop) => crop.drainage.value,
    score: scoreDrainage,
  },
  {
    key: "plantingMonths",
    plotValue: (plot) => plot.month,
    cropRange: (crop) => crop.plantingMonths.months,
    score: scoreMonth,
  },
  {
    key: "tempC",
    plotValue: (plot, climate, crop) => plotTempC(plot, crop, climate),
    cropRange: (crop) => readRange(crop.tempC),
    score: scoreTemp,
  },
  {
    key: "rainMmYear",
    plotValue: (plot, climate) => climate?.rainMmYear,
    cropRange: (crop) => readRange(crop.rainMmYear),
    score: (value, range) => scoreRange(value, range.optimal, range.tolerable),
  },
  {
    key: "light",
    plotValue: (plot) => plot.light,
    cropRange: (crop) => crop.light.value,
    score: scoreLight,
  },
];

function scoreFactor(rule, plot, crop, climate) {
  const plotValue = rule.plotValue(plot, climate, crop) ?? null;
  const cropRange = rule.cropRange(crop);
  const factorScore = rule.score(plotValue, cropRange, crop, climate);
  const weight = SCORE_WEIGHTS[rule.key];
  const factor = { key: rule.key, plotValue, cropRange, factorScore, weight, used: factorScore !== null };
  if (rule.key === "tempC") addTempDetails(factor, plot, crop, climate);
  return factor;
}

// เก็บที่มาของอุณหภูมิไว้แสดงบนหน้าจอ: เฉลี่ยทั้งปี หรือเฉลี่ยเดือนไหนบ้าง และโดนลดเพราะหนาวไหม
function addTempDetails(factor, plot, crop, climate) {
  if (factor.plotValue === null) return;
  factor.tempMonths = crop.tempBasis === "annual_mean" ? null : fieldMonthList(plot.month, crop);
  factor.coldPenalty = factor.used && isTooCold(crop, climate);
}

// ---------- คะแนนรวมของพืช 1 ชนิด ----------

function sumWeights(factors) {
  return factors.reduce((total, factor) => total + factor.weight, 0);
}

function confidenceLevel(coverage) {
  if (coverage >= CONFIDENCE_HIGH_MIN) return "high";
  return coverage >= CONFIDENCE_MEDIUM_MIN ? "medium" : "low";
}

function scoreCrop(plot, crop, climate) {
  // 1) ให้คะแนนทีละปัจจัย ปัจจัยละ 1, 0.5 หรือ 0
  //    ถ้าฝั่งแปลงหรือฝั่งพืชไม่มีข้อมูล ปัจจัยนั้นจะเป็น used = false
  const factors = FACTOR_RULES.map((rule) => scoreFactor(rule, plot, crop, climate));

  // 2) เลือกเฉพาะปัจจัยที่มีข้อมูลครบทั้งสองฝั่ง
  //    ปัจจัยที่ไม่มีข้อมูลถูกตัดออกจากทั้งตัวตั้งและตัวหาร จึงไม่ถูกนับเป็น 0
  const usedFactors = factors.filter((factor) => factor.used);

  // 3) ตัวตั้ง = นำน้ำหนักคูณคะแนนของแต่ละปัจจัย แล้วบวกกัน
  const earned = usedFactors.reduce((total, f) => total + f.weight * f.factorScore, 0);

  // 4) ตัวหาร = ผลรวมน้ำหนักของปัจจัยที่ใช้ได้
  const usedWeight = sumWeights(usedFactors);

  // 5) คะแนนรวม = 100 × ตัวตั้ง ÷ ตัวหาร แล้วปัดเป็นจำนวนเต็ม
  //    ถ้าไม่มีปัจจัยที่ใช้ได้เลย จะไม่มีคะแนน (null)
  const score = usedWeight > 0 ? Math.round((100 * earned) / usedWeight) : null;

  // 6) ความครอบคลุม = น้ำหนักที่ใช้ได้ ÷ น้ำหนักทั้งหมด 7 ปัจจัย (ค่า 0 ถึง 1)
  //    บอกว่าคะแนนนี้คิดจากข้อมูลมากแค่ไหน แล้วแปลงเป็นระดับความมั่นใจ
  const coverage = usedWeight / sumWeights(factors);

  return { cropId: crop.id, score, coverage, confidence: confidenceLevel(coverage), factors };
}

// ---------- จัดอันดับพืชทุกชนิด ----------

function hasEnoughData(result) {
  const usedCount = result.factors.filter((factor) => factor.used).length;
  return usedCount >= MIN_USED_FACTORS && result.score !== null;
}

// คะแนนมากก่อน ถ้าเท่ากันให้ความครอบคลุมมากก่อน ถ้ายังเท่ากันให้เรียงตามลำดับใน crops.json
function compareResults(a, b) {
  return b.score - a.score || b.coverage - a.coverage;
}

function rankCrops(plot, crops, climate) {
  const results = crops.map((crop) => scoreCrop(plot, crop, climate));
  const ranked = results.filter(hasEnoughData).sort(compareResults);
  return {
    top: ranked.slice(0, TOP_CROP_COUNT),
    others: ranked.slice(TOP_CROP_COUNT),
    notEnoughData: results.filter((result) => !hasEnoughData(result)),
  };
}

// แปลงกรณีทดสอบหรือจุดสำรวจให้เป็นค่าแปลงในเดือนที่กำหนด
function plotFromScenario(scenario, month) {
  return {
    ph: scenario.ph ?? null,
    texture: scenario.texture ?? null,
    drainage: scenario.drainage ?? null,
    month,
    light: scenario.light ?? null,
  };
}
