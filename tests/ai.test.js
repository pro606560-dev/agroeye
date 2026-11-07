// เทสต์หน้าตั้งค่าและ AI อธิบาย (task 16)
// tests.html ใช้ localStorage ร่วมกับแอป จึงสำรองค่าจริงไว้ก่อน แล้วคืนค่าหลังทุกข้อ

const AI_TEST_KEYS = [AI_KEY_STORAGE, AI_CACHE_STORAGE, TEXT_SIZE_KEY, SOUND_ON_KEY];

async function withCleanAiStorage(fn) {
  const backup = AI_TEST_KEYS.map((key) => [key, window.localStorage.getItem(STORAGE_PREFIX + key)]);
  AI_TEST_KEYS.forEach((key) => window.localStorage.removeItem(STORAGE_PREFIX + key));
  try {
    await fn();
  } finally {
    for (const [key, value] of backup) {
      if (value === null) window.localStorage.removeItem(STORAGE_PREFIX + key);
      else window.localStorage.setItem(STORAGE_PREFIX + key, value);
    }
    applyTextSize();
  }
}

// แปลงตัวอย่างที่มีชื่อและจุดสำรวจ เพื่อตรวจว่าไม่หลุดไปถึง AI
const AI_TEST_PLOT = { name: "นาลุงสมชาย", surveyPointId: "SP-01", ph: 5.5, texture: "heavy",
  drainage: "poor", month: 5, light: null, moisture: null, nitrogen: null, phosphorus: null, potassium: null };

// fetch ปลอม: คืนสถานะที่กำหนด และนับจำนวนครั้งที่ถูกเรียก
function fakeFetch(status, text = "ข้าวเหมาะกับดินเหนียว\nระวังน้ำท่วม") {
  const calls = [];
  const fn = async (url, options) => {
    calls.push({ url, options });
    if (status === "network") throw new TypeError("Failed to fetch");
    if (status === "timeout") throw new DOMException("aborted", "AbortError");
    return {
      ok: status === 200, status,
      json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    };
  };
  return { fn, calls };
}

async function firstCropAndResult() {
  const crops = await loadCrops();
  const crop = crops[0];
  return { crops, crop, result: scoreCrop(AI_TEST_PLOT, crop, null) };
}

test("AI: ข้อมูลที่ส่งไม่มีชื่อแปลง รหัสจุดสำรวจ หรือพิกัด", async () => {
  const { crop, result } = await firstCropAndResult();
  const payload = aiPayload(AI_TEST_PLOT, result, crop);
  const sent = aiPrompt(payload) + AI_RULES;
  assertEqual(Object.keys(payload), ["soilType", "ph", "waterlogging", "month", "crop", "totalScore",
    "factorScores", "care", "risks"]);
  assertTrue(!sent.includes("สมชาย") && !sent.includes("SP-01"), "ห้ามมีชื่อแปลงหรือรหัสจุด");
  assertTrue(!/lat|lon|18\.13|99\.51/i.test(sent), "ห้ามมีพิกัด");
  assertEqual(payload.soilType, "ดินเหนียว");
  assertEqual(payload.month, "พฤษภาคม");
  assertEqual(payload.care, crop.care.map((item) => item.text));
});

test("AI: คำสั่งบอกให้ตอบไทยง่าย ไม่เกิน 5 บรรทัด ห้ามชื่อสารเคมีนอกข้อมูล และให้ปรึกษาเกษตรอำเภอ", () => {
  assertTrue(AI_RULES.includes("ภาษาไทยง่าย"));
  assertTrue(AI_RULES.includes(`ไม่เกิน ${AI_MAX_LINES} บรรทัด`) && AI_MAX_LINES === 5);
  assertTrue(AI_RULES.includes("ห้ามแนะนำชื่อสารเคมี"));
  assertTrue(AI_RULES.includes("ปรึกษาเกษตรอำเภอ"));
});

test("AI: ไม่มีรหัส → ไม่เรียกเน็ตเลย", () => withCleanAiStorage(async () => {
  const { crop, result } = await firstCropAndResult();
  const fake = fakeFetch(200);
  const answer = await explain(AI_TEST_PLOT, result, crop, fake.fn);
  assertEqual(answer, { ok: false, reason: "noKey" });
  assertEqual(fake.calls.length, 0);
}));

test("AI: รหัสผิด เกินโควตา ไม่มีเน็ต หมดเวลา → บอกเหตุผลที่ถูกต้อง และมีข้อความให้ผู้ใช้", () => withCleanAiStorage(async () => {
  const { crop, result } = await firstCropAndResult();
  saveAiKey("test-key-not-real");
  const cases = { 400: "badKey", 403: "badKey", 429: "quota", 500: "error", network: "error", timeout: "timeout" };
  for (const [status, reason] of Object.entries(cases)) {
    const fake = fakeFetch(status === "network" || status === "timeout" ? status : Number(status));
    const answer = await explain(AI_TEST_PLOT, result, crop, fake.fn);
    assertEqual([answer.ok, answer.reason], [false, reason], `สถานะ ${status}`);
    assertTrue(Boolean(AI_FAIL_TEXTS[reason]), `ต้องมีข้อความของ ${reason}`);
  }
}));

test("AI: ส่งรหัสทาง header ไม่ใส่ใน URL และใช้รุ่นที่ตั้งไว้ใน config.js", () => withCleanAiStorage(async () => {
  const { crop, result } = await firstCropAndResult();
  saveAiKey("test-key-not-real");
  const fake = fakeFetch(200);
  await explain(AI_TEST_PLOT, result, crop, fake.fn);
  assertEqual(fake.calls[0].options.headers["x-goog-api-key"], "test-key-not-real");
  assertTrue(!fake.calls[0].url.includes("test-key"), "URL ต้องไม่มีรหัส");
  assertTrue(fake.calls[0].url.includes(GEMINI_MODEL));
}));

test("AI: ตอบสำเร็จแล้วเก็บไว้ ถามชุดข้อมูลเดิมไม่เรียกซ้ำ", () => withCleanAiStorage(async () => {
  const { crop, result } = await firstCropAndResult();
  saveAiKey("test-key-not-real");
  const fake = fakeFetch(200, "**บรรทัด 1**\n\n2\n3\n4\n5\n6\n7");
  const first = await explain(AI_TEST_PLOT, result, crop, fake.fn);
  const second = await explain(AI_TEST_PLOT, result, crop, fake.fn);
  assertEqual(fake.calls.length, 1);
  assertEqual([first.ok, first.fromCache, second.fromCache], [true, false, true]);
  assertEqual(first.text, "บรรทัด 1\n2\n3\n4\n5", "ตัด ** และเหลือไม่เกิน 5 บรรทัด");
  assertEqual(second.text, first.text);
}));

test("AI: เมื่อ AI ใช้ไม่ได้ อันดับและคะแนนของทุกกรณีทดสอบเหมือนเดิมทุกตัว", () => withCleanAiStorage(async () => {
  const [crops, scenarios] = await Promise.all([loadCrops(), loadScenarios()]);
  saveAiKey("test-key-not-real");
  for (const scenario of scenarios) {
    const plot = plotFromScenario(scenario, 5);
    const before = rankCrops(plot, crops, null);
    const snapshot = JSON.stringify(before);
    for (const result of before.top) {
      const crop = crops.find((c) => c.id === result.cropId);
      await explain(plot, result, crop, fakeFetch("network").fn);
    }
    assertEqual(JSON.stringify(before), snapshot, `${scenario.id}: ผลเดิมต้องไม่ถูกแก้`);
    assertEqual(JSON.stringify(rankCrops(plot, crops, null)), snapshot, `${scenario.id}: คิดใหม่ต้องได้เท่าเดิม`);
  }
}));

test("ตั้งค่า: ขนาดตัวอักษร 3 ระดับ จำค่าไว้ และค่าแปลกใช้ขนาดปกติ", () => withCleanAiStorage(() => {
  const root = document.documentElement;
  assertEqual(textSizeChoice(), "normal");
  saveTextSizeChoice("xlarge");
  assertEqual([textSizeChoice(), root.classList.contains("text-xlarge")], ["xlarge", true]);
  saveTextSizeChoice("large");
  assertEqual([root.classList.contains("text-large"), root.classList.contains("text-xlarge")], [true, false]);
  writeStorage(TEXT_SIZE_KEY, "huge");
  assertEqual(textSizeChoice(), "normal");
}));

test("ตั้งค่า: ปิดเสียงแล้วปุ่มฟังถูกซ่อน แม้เครื่องมีเสียงไทย", () => withCleanAiStorage(() => {
  assertEqual(soundOn(), true);
  saveSoundOn(false);
  assertEqual([soundOn(), showSpeakButtons()], [false, false]);
}));

// ---------- จับเวลา AI ในหน้าพิสูจน์ (งานเสริมค้างจาก task 14) ----------

test("จับเวลา AI: ถามใหม่ทุกรอบ ไม่ใช้และไม่เพิ่มคำตอบที่เก็บไว้", () => withCleanAiStorage(async () => {
  const { crop, result } = await firstCropAndResult();
  saveAiKey("test-key-not-real");
  const fake = fakeFetch(200);
  await explain(AI_TEST_PLOT, result, crop, fake.fn); // มีคำตอบเก็บไว้แล้ว 1 ชุด
  const cacheBefore = JSON.stringify(readAiCache());
  const timed = await timeAsyncRounds(() => askAiFresh(AI_TEST_PLOT, result, crop, fake.fn), PROOF_AI_ROUNDS);
  assertEqual(fake.calls.length, 1 + PROOF_AI_ROUNDS, "ต้องเรียกเน็ตทุกรอบ");
  assertEqual([timed.times.length, timed.failReason], [PROOF_AI_ROUNDS, null]);
  assertTrue(timed.times.every((t) => t >= 0), "เวลาต้องไม่ติดลบ");
  assertEqual(JSON.stringify(readAiCache()), cacheBefore, "ห้ามแก้คำตอบที่เก็บไว้");
}));

test("จับเวลา AI: ไม่มีรหัส → ไม่เรียกเน็ต และหยุดตั้งแต่รอบแรก", () => withCleanAiStorage(async () => {
  const { crop, result } = await firstCropAndResult();
  const fake = fakeFetch(200);
  const timed = await timeAsyncRounds(() => askAiFresh(AI_TEST_PLOT, result, crop, fake.fn), PROOF_AI_ROUNDS);
  assertEqual([timed.times.length, timed.failReason, fake.calls.length], [0, "noKey", 0]);
}));

test("จับเวลา AI: รอบที่ 3 ไม่สำเร็จ → หยุดทันที เก็บเวลา 2 รอบแรก และมีข้อความบอกผู้ใช้", async () => {
  let round = 0;
  const task = async () => { round++; return round === 3 ? { ok: false, reason: "quota" } : { ok: true }; };
  const seen = [];
  const timed = await timeAsyncRounds(task, PROOF_AI_ROUNDS, (n) => seen.push(n));
  assertEqual([timed.times.length, timed.failReason, round], [2, "quota", 3]);
  assertEqual(seen, [1, 2, 3]);
  for (const reason of ["noKey", "offline", "timeout", "badKey", "quota", "error"]) {
    assertTrue(Boolean(AI_TIMING_FAIL_TEXTS[reason]), `ต้องมีข้อความของ ${reason}`);
  }
});
