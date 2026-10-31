// ชุดทดสอบของ js/data.js

const TEST_CODES = new Set(["AAA", "BBB"]);

// พืชสมมติที่ถูกต้อง ใช้เป็นตัวตั้งแล้วทำให้เสียทีละจุด
function makeGoodCrop() {
  return {
    id: "fake",
    nameTh: "พืชสมมติ",
    group: "ทดสอบ",
    ph: { optimal: [5, 7], tolerable: [4, 8], source: "AAA" },
    tempC: { optimal: null, tolerable: null, source: null },
    rainMmYear: { optimal: [1500, null], tolerable: null, source: "AAA" },
    texture: { good: ["medium"], ok: ["light"], source: "AAA" },
    drainage: { value: "good", source: "AAA" },
    light: { value: null, source: null },
    plantingMonths: { months: [4, 5], note: null, source: "AAA" },
    cycleDays: { value: [90, 120], source: "AAA" },
    care: [{ text: "ดูแล", source: "AAA" }],
    risks: [{ risk: "แมลง", fix: null, source: "AAA" }],
    localEvidence: { text: "ปลูกในแม่ทะ", source: "AAA" },
  };
}

// ทำให้พืชเสียด้วยฟังก์ชัน breakIt แล้วเช็กว่าตัวตรวจจับได้ และบอกเรื่องที่ถูก
function assertCaught(breakIt, expectedWord) {
  const crop = makeGoodCrop();
  breakIt(crop);
  const errors = validateCrop(crop, TEST_CODES);
  assertTrue(errors.length > 0, "ตัวตรวจจับข้อมูลผิดไม่ได้");
  assertTrue(errors.join(" ").includes(expectedWord), `ไม่พบคำว่า ${expectedWord} ใน: ${errors}`);
}

// เก็บข้อความเตือนจาก console.warn ระหว่างรัน fn
async function captureWarnings(fn) {
  const original = console.warn;
  const warnings = [];
  console.warn = (message) => warnings.push(String(message));
  try {
    await fn();
  } finally {
    console.warn = original;
  }
  return warnings;
}

// ---------- ไฟล์จริง ----------

test("ไฟล์จริง: พืชทุกชนิดผ่านการตรวจ และรหัสแหล่งตรงกับ SOURCES.md", async () => {
  const data = await fetchJson(CROPS_URL);
  const codes = await loadSourceCodes();
  const allErrors = data.crops.flatMap((crop) =>
    validateCrop(crop, codes).map((error) => `${crop.id}: ${error}`));
  assertEqual(allErrors, []);
});

test("ไฟล์จริง: โหลดพืชได้ครบ 12 ชนิด ไม่ถูกตัดทิ้ง", async () => {
  const crops = await loadCrops();
  assertEqual(crops.length, 12);
  assertEqual(new Set(crops.map((c) => c.id)).size, 12, "รหัสพืชซ้ำกัน");
});

test("ไฟล์จริง: โหลดจุดสำรวจและกรณีทดสอบได้", async () => {
  assertTrue((await loadSurveyPoints()).length > 0, "ไม่มีจุดสำรวจ");
  assertTrue((await loadScenarios()).length > 0, "ไม่มีกรณีทดสอบ");
});

// ---------- ข้อมูลผิดต้องถูกจับได้ ----------

test("พืชที่ถูกต้องไม่ถูกจับผิด", () => {
  assertEqual(validateCrop(makeGoodCrop(), TEST_CODES), []);
});

test("จับได้: ไม่มี id, nameTh หรือ group", () => {
  assertCaught((c) => delete c.id, "id");
  assertCaught((c) => delete c.nameTh, "nameTh");
  assertCaught((c) => delete c.group, "group");
});

test("จับได้: ช่วงตัวเลข min มากกว่า max", () => {
  assertCaught((c) => { c.ph.optimal = [7, 5]; }, "ph.optimal");
});

test("จับได้: ช่วงตัวเลขมีไม่ครบ 2 ค่า", () => {
  assertCaught((c) => { c.ph.tolerable = [4]; }, "ph.tolerable");
});

test("จับได้: max เป็น null ในช่องที่ไม่ใช่ฝน", () => {
  assertCaught((c) => { c.tempC = { optimal: [20, null], tolerable: null, source: "AAA" }; }, "tempC.optimal");
});

test("จับได้: optimal กว้างกว่า tolerable", () => {
  assertCaught((c) => { c.ph.optimal = [3.5, 7]; }, "นอกช่วง tolerable");
});

test("จับได้: ค่าไม่ใช่ null แต่ไม่มี source", () => {
  assertCaught((c) => { c.ph.source = null; }, "ไม่มี source");
  assertCaught((c) => { c.care[0].source = null; }, "care[0]");
  assertCaught((c) => { c.risks[0].source = null; }, "risks[0]");
});

test("จับได้: รหัสแหล่งไม่มีใน SOURCES.md", () => {
  assertCaught((c) => { c.ph.source = "ZZZ"; }, "ZZZ");
});

test("จับได้: รหัสแหล่งตัวที่สองในช่องเดียวกันผิด", () => {
  assertCaught((c) => { c.ph.source = "AAA (optimal), ZZZ (tolerable)"; }, "ZZZ");
});

test("ช่อง source ที่มีหลายรหัสและรหัสถูกหมด ไม่ถูกจับผิด", () => {
  const crop = makeGoodCrop();
  crop.ph.source = "AAA (optimal), BBB (tolerable)";
  crop.localEvidence.source = "AAA, BBB";
  assertEqual(validateCrop(crop, TEST_CODES), []);
});

test("จับได้: ประเภทดินไม่รู้จัก", () => {
  assertCaught((c) => { c.texture.good = ["sandy"]; }, "sandy");
});

test("จับได้: เดือนนอกช่วง 1–12", () => {
  assertCaught((c) => { c.plantingMonths.months = [13]; }, "13");
  assertCaught((c) => { c.plantingMonths.months = [0]; }, "เดือนไม่ถูกต้อง");
});

test("จับได้: ค่า pH นอกช่วง 3–10", () => {
  assertCaught((c) => { c.ph = { optimal: [5, 7], tolerable: [2, 8], source: "AAA" }; }, "pH");
  assertCaught((c) => { c.ph = { optimal: [5, 7], tolerable: [4, 11], source: "AAA" }; }, "pH");
});

test("จับได้: ช่องหายไปทั้งช่อง และค่าที่ไม่ใช่พืช", () => {
  assertCaught((c) => delete c.drainage, "drainage");
  assertTrue(validateCrop(null).length > 0, "null ต้องถูกจับได้");
  assertTrue(validateCrop("ข้าว").length > 0, "ข้อความต้องถูกจับได้");
});

test("จับได้: ค่าผิดชนิด โดยตัวตรวจต้องไม่พัง", () => {
  assertCaught((c) => { c.ph.optimal = 5; }, "ph.optimal");
  assertCaught((c) => { c.texture.good = true; }, "texture");
  assertCaught((c) => { c.ph.source = 123; }, "ต้องเป็นข้อความ");
  assertCaught((c) => { c.ph = [5, 7]; }, "ไม่มีช่อง ph");
});

test("จับได้: พิมพ์ชื่อช่องย่อยผิด", () => {
  assertCaught((c) => { c.ph = { optimum: [5, 7], tolerable: null, source: "AAA" }; }, "ph.optimal");
});

test("จับได้: care หรือ risks ผิดรูปแบบ", () => {
  assertCaught((c) => { c.care = ["ข้อความเปล่า ๆ"]; }, "care[0]");
  assertCaught((c) => { c.care = [{ tip: "ชื่อช่องผิด" }]; }, "care[0]");
  assertCaught((c) => { c.risks = [{ risk: null, fix: "แก้", source: "AAA" }]; }, "risks[0]");
  assertCaught((c) => delete c.care, "care");
  assertCaught((c) => { c.risks = "ไม่ใช่รายการ"; }, "risks");
});

test("จับได้: รายการว่างที่ควรเป็น null", () => {
  assertCaught((c) => { c.plantingMonths.months = []; }, "months");
  assertCaught((c) => { c.texture.good = []; c.texture.ok = []; }, "texture");
});

test("จับได้: texture.ok, drainage, light และ cycleDays ผิด", () => {
  assertCaught((c) => { c.texture.ok = ["sandy"]; }, "sandy");
  assertCaught((c) => { c.drainage.value = "bad"; }, "drainage");
  assertCaught((c) => { c.light.value = "dark"; c.light.source = "AAA"; }, "light");
  assertCaught((c) => { c.cycleDays.value = [120, 90]; }, "cycleDays");
});

test("จับได้: เดือนเป็นทศนิยมหรือข้อความ", () => {
  assertCaught((c) => { c.plantingMonths.months = [4.5]; }, "เดือนไม่ถูกต้อง");
  assertCaught((c) => { c.plantingMonths.months = ["พ.ค."]; }, "เดือนไม่ถูกต้อง");
});

test("pH ตรงขอบ 3 และ 10 ผ่าน และ optimal นอกช่วงถูกจับเมื่อ tolerable เป็น null", () => {
  const crop = makeGoodCrop();
  crop.ph = { optimal: null, tolerable: [3, 10], source: "AAA" };
  assertEqual(validateCrop(crop, TEST_CODES), []);
  assertCaught((c) => { c.ph = { optimal: [5, 11], tolerable: null, source: "AAA" }; }, "pH");
});

test("จับได้: รหัสพืชซ้ำ เก็บไว้แค่ตัวแรก", async () => {
  let crops = [];
  const warnings = await captureWarnings(() => {
    crops = keepValidCrops([makeGoodCrop(), makeGoodCrop()], TEST_CODES);
  });
  assertEqual(crops.length, 1);
  assertTrue(warnings.some((w) => w.includes("ซ้ำ")), "ไม่มีคำเตือนเรื่องรหัสซ้ำ");
});

test("พืชผิดชนิดปนอยู่ในรายการ: แอปไม่พัง พืชดียังอยู่", async () => {
  const bad = makeGoodCrop();
  bad.id = "bad";
  bad.ph.optimal = 5;
  let crops = [];
  await captureWarnings(() => {
    crops = keepValidCrops([bad, null, makeGoodCrop()], TEST_CODES);
  });
  assertEqual(crops.map((c) => c.id), ["fake"]);
});

test("จับได้: จำนวนพืชไม่เท่ากับ 12", () => {
  assertTrue(checkCropCount(new Array(11).fill({})) !== null, "11 ชนิดต้องถูกจับได้");
  assertEqual(checkCropCount(new Array(12).fill({})), null);
});

// ---------- แอปต้องไม่พัง ----------

test("พืชผิด 1 ตัว: ข้ามเฉพาะตัวนั้น และมีคำเตือน", async () => {
  let crops = [];
  const warnings = await captureWarnings(async () => {
    crops = await loadCrops("tests/fixtures/one-bad-crop.json");
  });
  assertEqual(crops.map((c) => c.id), ["fake-good"]);
  assertTrue(warnings.some((w) => w.includes("fake-bad")), "ไม่มีคำเตือนเรื่อง fake-bad");
});

test("ไฟล์ JSON เสีย: ได้รายการว่าง ไม่พัง และมีคำเตือน", async () => {
  let crops = null;
  const warnings = await captureWarnings(async () => {
    crops = await loadCrops("tests/fixtures/broken.json");
  });
  assertEqual(crops, []);
  assertTrue(warnings.length > 0, "ไม่มีคำเตือน");
});

test("ไม่มีไฟล์: ได้รายการว่าง ไม่พัง", async () => {
  let crops = null;
  await captureWarnings(async () => {
    crops = await loadCrops("tests/fixtures/no-such-file.json");
  });
  assertEqual(crops, []);
});

test("โหลด SOURCES.md ไม่ได้: พืชยังผ่านการตรวจส่วนอื่นได้", async () => {
  let codes = "ยังไม่ได้โหลด";
  await captureWarnings(async () => {
    codes = await loadSourceCodes("tests/fixtures/no-such-file.md");
  });
  assertEqual(codes, null);
  assertEqual(keepValidCrops([makeGoodCrop()], codes).length, 1);
});

test("SOURCES.md โหลดได้แต่ไม่มีตารางรหัส: ถือว่าโหลดไม่ได้ ไม่ตัดพืชทิ้ง", async () => {
  let codes = "ยังไม่ได้โหลด";
  await captureWarnings(async () => {
    codes = await loadSourceCodes("tests/fixtures/broken.json");
  });
  assertEqual(codes, null);
});

// ---------- ตารางความครอบคลุม ----------

test("ตารางความครอบคลุม: มีครบ 12 ชนิด", async () => {
  const report = dataCoverageReport(await loadCrops());
  assertEqual(report.length, 12);
});

// ตัวเลขเหล่านี้นับด้วยตาจาก crops.json
test("ตารางความครอบคลุม: นับปัจจัยตรงกับที่นับด้วยมือ", async () => {
  const report = dataCoverageReport(await loadCrops());
  const usableOf = (id) => report.find((row) => row.id === id).usable;
  assertEqual(usableOf("maize"), 4, "ข้าวโพด");
  assertEqual(usableOf("longan"), 2, "ลำไย");
  assertEqual(usableOf("rubber"), 5, "ยางพารา");
  assertEqual(usableOf("cassava"), 7, "มันสำปะหลัง");
});
