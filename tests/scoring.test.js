// ชุดทดสอบของ js/scoring.js และ js/reasons.js

const OK_PLOT = { ph: 6, texture: "medium", drainage: "good", month: 5, light: null };

// พืชสมมติที่มีข้อมูลเฉพาะ pH เหมาะกับเทสต์แบบตัดปัจจัย ส่งค่าที่อยากเปลี่ยนมาทาง changes
function makeScoringCrop(changes = {}) {
  return {
    id: "fake",
    nameTh: "พืชสมมติ",
    ph: { optimal: [5, 7], tolerable: [4, 8] },
    tempC: { optimal: null, tolerable: null },
    rainMmYear: { optimal: null, tolerable: null },
    texture: { good: null, ok: null },
    drainage: { value: null },
    light: { value: null },
    plantingMonths: { months: null },
    risks: [],
    ...changes,
  };
}

function factorOf(result, key) {
  return result.factors.find((factor) => factor.key === key);
}

test("scoreRange: อยู่ในช่วงเหมาะ = 1", () => {
  assertEqual(scoreRange(6, [5, 7], [4, 8]), 1);
});

test("scoreRange: อยู่ในช่วงที่ทนได้ = 0.5", () => {
  assertEqual(scoreRange(4.5, [5, 7], [4, 8]), 0.5);
  assertEqual(scoreRange(7.5, [5, 7], [4, 8]), 0.5);
});

test("scoreRange: นอกช่วง = 0", () => {
  assertEqual(scoreRange(3.9, [5, 7], [4, 8]), 0);
  assertEqual(scoreRange(8.1, [5, 7], [4, 8]), 0);
});

test("scoreRange: อยู่บนขอบพอดีนับว่าอยู่ในช่วง", () => {
  assertEqual(scoreRange(5, [5, 7], [4, 8]), 1);
  assertEqual(scoreRange(7, [5, 7], [4, 8]), 1);
  assertEqual(scoreRange(4, [5, 7], [4, 8]), 0.5);
  assertEqual(scoreRange(8, [5, 7], [4, 8]), 0.5);
});

test("scoreRange: optimal เป็น null ได้ 0.5 ในช่วงทนได้ และ 0 นอกช่วง", () => {
  assertEqual(scoreRange(6, null, [4, 8]), 0.5);
  assertEqual(scoreRange(9, null, [4, 8]), 0);
});

test("scoreRange: tolerable เป็น null ได้ 1 ในช่วงเหมาะ และ 0 นอกช่วง", () => {
  assertEqual(scoreRange(6, [5, 7], null), 1);
  assertEqual(scoreRange(8, [5, 7], null), 0);
});

test("scoreRange: ขอบบนเป็น null คือไม่จำกัด", () => {
  assertEqual(scoreRange(99999, [1500, null], null), 1);
  assertEqual(scoreRange(1499, [1500, null], null), 0);
});

test("scoreRange: ไม่มีข้อมูลฝั่งใดฝั่งหนึ่ง = null", () => {
  assertEqual(scoreRange(null, [5, 7], [4, 8]), null);
  assertEqual(scoreRange(undefined, [5, 7], [4, 8]), null);
  assertEqual(scoreRange(6, null, null), null);
});

test("scoreRange: ค่า 0 เป็นข้อมูล ไม่ใช่ไม่มีข้อมูล", () => {
  assertEqual(scoreRange(0, [5, 7], [4, 8]), 0);
});

test("scoreTexture: good = 1, ok = 0.5, ไม่อยู่ในทั้งสอง = 0, ไม่มีข้อมูล = null", () => {
  const texture = { good: ["medium"], ok: ["light"] };
  assertEqual(scoreTexture("medium", texture), 1);
  assertEqual(scoreTexture("light", texture), 0.5);
  assertEqual(scoreTexture("heavy", texture), 0);
  assertEqual(scoreTexture(null, texture), null);
  assertEqual(scoreTexture("heavy", { good: null, ok: null }), null);
});

test("scoreDrainage: พืชต้องการ good แต่แปลงน้ำขัง = 0 กรณีอื่น = 1", () => {
  assertEqual(scoreDrainage("poor", "good"), 0);
  assertEqual(scoreDrainage("good", "good"), 1);
  assertEqual(scoreDrainage("poor", "poor-ok"), 1);
  assertEqual(scoreDrainage("good", "poor-ok"), 1);
  assertEqual(scoreDrainage(null, "good"), null);
  assertEqual(scoreDrainage("poor", null), null);
});

test("scoreMonth: อยู่ในรายการ = 1, ห่าง 1 เดือน = 0.5, ห่างกว่านั้น = 0", () => {
  assertEqual(scoreMonth(5, [5, 6]), 1);
  assertEqual(scoreMonth(4, [5, 6]), 0.5);
  assertEqual(scoreMonth(7, [5, 6]), 0.5);
  assertEqual(scoreMonth(8, [5, 6]), 0);
  assertEqual(scoreMonth(5, null), null);
  assertEqual(scoreMonth(null, [5]), null);
});

test("scoreMonth: นับข้ามปีได้", () => {
  assertEqual(scoreMonth(1, [12]), 0.5);
  assertEqual(scoreMonth(12, [1]), 0.5);
  assertEqual(scoreMonth(2, [12]), 0);
});

test("scoreLight: พืชต้องการ full-sun แต่แปลงร่ม = 0 กรณีอื่น = 1", () => {
  assertEqual(scoreLight("shade", "full-sun"), 0);
  assertEqual(scoreLight("full-sun", "full-sun"), 1);
  assertEqual(scoreLight("shade", "partial-ok"), 1);
  assertEqual(scoreLight(null, "full-sun"), null);
  assertEqual(scoreLight("shade", null), null);
});

test("scoreCrop: คิดสูตรถ่วงน้ำหนักถูกต้อง", () => {
  const crop = makeScoringCrop({
    texture: { good: null, ok: ["medium"] },
    drainage: { value: "good" },
  });
  // (3×1 + 3×0.5 + 2×0) ÷ (3+3+2) = 4.5 ÷ 8 = 56.25
  const plot = { ...OK_PLOT, drainage: "poor" };
  assertEqual(scoreCrop(plot, crop, null).score, 56);
});

test("ปัจจัยที่ไม่มีข้อมูลถูกตัดออก ไม่นับเป็น 0", () => {
  const result = scoreCrop(OK_PLOT, makeScoringCrop(), null);
  assertEqual(result.score, 100);
  assertEqual(factorOf(result, "texture").used, false);
  assertEqual(factorOf(result, "texture").factorScore, null);
  assertEqual(factorOf(result, "ph").used, true);
});

test("scoreCrop: คืนคะแนนแยกครบ 7 ปัจจัย ตามรูปแบบที่ task กำหนด", () => {
  const result = scoreCrop(OK_PLOT, makeScoringCrop(), null);
  assertEqual(Object.keys(result), ["cropId", "score", "coverage", "confidence", "factors"]);
  assertEqual(result.factors.length, 7);
  assertEqual(Object.keys(result.factors[0]),
    ["key", "plotValue", "cropRange", "factorScore", "weight", "used"]);
});

test("ความครอบคลุมแปลงเป็นความมั่นใจตามเกณฑ์ และขอบ 70%/40% ถูกต้อง", () => {
  assertEqual(confidenceLevel(0.7), "high");
  assertEqual(confidenceLevel(0.69), "medium");
  assertEqual(confidenceLevel(0.4), "medium");
  assertEqual(confidenceLevel(0.39), "low");
  // pH อย่างเดียว น้ำหนัก 3 จากทั้งหมด 15 = 20%
  const result = scoreCrop(OK_PLOT, makeScoringCrop(), null);
  assertEqual(result.coverage, 0.2);
  assertEqual(result.confidence, "low");
});

test("ข้อมูลอากาศมีแล้ว อุณหภูมิใช้เดือนที่จะปลูก และฝนใช้ค่าทั้งปี", () => {
  const crop = makeScoringCrop({
    tempC: { optimal: [20, 30], tolerable: null },
    rainMmYear: { optimal: [1000, null], tolerable: null },
  });
  const monthlyTempC = [10, 10, 10, 10, 25, 10, 10, 10, 10, 10, 10, 10];
  const result = scoreCrop(OK_PLOT, crop, { monthlyTempC, rainMmYear: 1200 });
  assertEqual(factorOf(result, "tempC").plotValue, 25);
  assertEqual(factorOf(result, "tempC").factorScore, 1);
  assertEqual(factorOf(result, "rainMmYear").factorScore, 1);
});

test("rankCrops: คะแนนเท่ากันให้ความครอบคลุมสูงกว่าอยู่ก่อน", () => {
  const few = makeScoringCrop({ id: "few", drainage: { value: "good" } });
  const many = makeScoringCrop({
    id: "many",
    drainage: { value: "good" },
    texture: { good: ["medium"], ok: [] },
  });
  const ranked = rankCrops(OK_PLOT, [few, many], null);
  assertEqual(ranked.top.map((r) => r.cropId), ["many", "few"]);
});

test("rankCrops: พืชที่ใช้ปัจจัยได้น้อยกว่า 2 ตัวไปอยู่ใน notEnoughData", () => {
  const onlyOne = makeScoringCrop({ id: "one" });
  const two = makeScoringCrop({ id: "two", drainage: { value: "good" } });
  const ranked = rankCrops(OK_PLOT, [onlyOne, two], null);
  assertEqual(ranked.notEnoughData.map((r) => r.cropId), ["one"]);
  assertEqual(ranked.top.map((r) => r.cropId), ["two"]);
});

test("rankCrops: แบ่ง top 3 ตัว ที่เหลืออยู่ใน others และเรียงจากคะแนนมากไปน้อย", () => {
  const crops = [4, 5, 5.5, 6].map((low, index) => makeScoringCrop({
    id: `c${index}`,
    drainage: { value: "good" },
    ph: { optimal: [low, low + 0.5], tolerable: null },
  }));
  const ranked = rankCrops({ ...OK_PLOT, ph: 6.25 }, crops, null);
  assertEqual(ranked.top.length, 3);
  assertEqual(ranked.others.length, 1);
  assertEqual(ranked.top[0].cropId, "c3");
});

test("กรณีทดสอบทั้ง 5 กรณีรันได้กับพืชจริง", async () => {
  const crops = await loadCrops();
  const scenarios = await loadScenarios();
  assertEqual(scenarios.length, 5);
  for (const scenario of scenarios) {
    const ranked = rankCrops(plotFromScenario(scenario, 5), crops, null);
    assertEqual(ranked.top.length, 3, scenario.id);
    const count = ranked.top.length + ranked.others.length + ranked.notEnoughData.length;
    assertEqual(count, crops.length, scenario.id);
  }
});

test("เปลี่ยนน้ำหนักใน config แล้วคะแนนเปลี่ยนตาม", () => {
  const crop = makeScoringCrop({ drainage: { value: "good" } });
  const plot = { ...OK_PLOT, drainage: "poor" };
  const original = SCORE_WEIGHTS.drainage;
  assertEqual(scoreCrop(plot, crop, null).score, 60); // 3 ÷ (3+2)
  try {
    SCORE_WEIGHTS.drainage = 7;
    assertEqual(scoreCrop(plot, crop, null).score, 30); // 3 ÷ (3+7)
  } finally {
    SCORE_WEIGHTS.drainage = original;
  }
});

test("เหตุผล: ใช้ข้อความตามตัวอย่างใน SPEC", () => {
  const peanut = makeScoringCrop({
    nameTh: "ถั่วลิสง",
    ph: { optimal: [5.5, 6.5], tolerable: [4.5, 8.5] },
    texture: { good: ["medium"], ok: [] },
    plantingMonths: { months: [5, 6] },
  });
  const plot = { ...OK_PLOT, ph: 5.2, month: 2 };
  const reasons = buildReasons(scoreCrop(plot, peanut, null), peanut);
  assertTrue(reasons.includes("ดินร่วน เหมาะกับถั่วลิสง"), reasons.join(" | "));
  assertTrue(reasons.includes("ดินเปรี้ยวไปนิด (pH 5.2) แต่พืชนี้ทนได้"), reasons.join(" | "));
  assertTrue(reasons.includes("เดือน ก.พ. ไม่ใช่ช่วงปลูก ควรรอถึง พ.ค."), reasons.join(" | "));
});

test("เหตุผล: ดินเป็นด่าง และเดือนปลูกถัดไปนับข้ามปีได้", () => {
  assertEqual(phReason({ plotValue: 8, factorScore: 0.5, cropRange: { optimal: [5, 7], tolerable: [4, 9] } }),
    "ดินเป็นด่างไปนิด (pH 8) แต่พืชนี้ทนได้");
  assertEqual(nextPlantingMonth(12, [4, 5]), 4);
});

test("เหตุผล: pH สูงกว่าช่วงแต่ไม่ถึง 7 ห้ามเรียกว่าดินเป็นด่าง", () => {
  assertEqual(phReason({ plotValue: 6.8, factorScore: 0.5, cropRange: { optimal: [5.5, 6.5], tolerable: [4.5, 8.5] } }),
    "ดินเปรี้ยวน้อยไปนิด (pH 6.8) แต่พืชนี้ทนได้");
});

test("เหตุผล: พูดว่าเหมาะเรื่องน้ำไม่ขัง เฉพาะพืชที่ต้องการดินระบายน้ำดี", () => {
  assertEqual(drainageReason({ plotValue: "good", factorScore: 1, cropRange: "good" }), "แปลงน้ำไม่ขัง เหมาะกับพืชนี้");
  assertEqual(drainageReason({ plotValue: "good", factorScore: 1, cropRange: "poor-ok" }), "แปลงน้ำไม่ขัง");
  assertEqual(drainageReason({ plotValue: "poor", factorScore: 1, cropRange: "poor-ok" }), "แปลงน้ำขัง แต่พืชนี้ทนได้");
});

test("เหตุผล: ปัจจัยที่ไม่มีข้อมูลไม่สร้างเหตุผล แต่บอกว่ายังไม่มีข้อมูล", () => {
  const crop = makeScoringCrop();
  const result = scoreCrop(OK_PLOT, crop, null);
  assertEqual(buildReasons(result, crop).length, 1);
  assertTrue(missingDataText(result).startsWith("ยังไม่มีข้อมูล: ประเภทดิน"));
});

test("ความเสี่ยงดินเปรี้ยวมากแสดงเมื่อ pH ต่ำกว่าเกณฑ์ในข้อมูลเท่านั้น", async () => {
  const crops = await loadCrops();
  const rice = crops.find((crop) => crop.id === "rice-rd6");
  assertEqual(matchingRisks({ ph: 4.8 }, rice).length, 1);
  assertEqual(matchingRisks({ ph: 5 }, rice).length, 0);
  assertEqual(matchingRisks({ ph: null }, rice).length, 0);
});
