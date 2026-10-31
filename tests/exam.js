// ข้อสอบเฉลยของผู้ใช้ และตารางกรณีทดสอบ ในหน้า tests.html
// อ่าน tests/expected.json อย่างเดียว ห้ามเขียนหรือแก้ไฟล์นั้น

const EXPECTED_URL = "tests/expected.json";
const SCORE_ALLOWED_DIFF = 1; // ยอมให้ต่างได้ ±1 จากการปัดเศษ

function checkScoreCase(oneCase, settings, scenarios, crops) {
  const label = `${oneCase.id}: ${oneCase.scenario} × ${oneCase.cropId}`;
  if (oneCase.expectedScore === null) return { status: "pending", text: `${label} รอผู้ใช้กรอก` };
  const scenario = scenarios.find((s) => s.id === oneCase.scenario);
  const crop = crops.find((c) => c.id === oneCase.cropId);
  if (!scenario || !crop) return { status: "fail", text: `${label} ไม่พบกรณีหรือพืช` };
  const plot = plotFromScenario(scenario, settings.month);
  const actual = scoreCrop(plot, crop, settings.climate).score;
  const passed = Math.abs(actual - oneCase.expectedScore) <= SCORE_ALLOWED_DIFF;
  return { status: passed ? "pass" : "fail", text: `${label} ได้ ${actual} เฉลย ${oneCase.expectedScore}` };
}

function rankAllScenarios(settings, scenarios, crops) {
  return scenarios.map((scenario) => ({
    scenario,
    ranked: rankCrops(plotFromScenario(scenario, settings.month), crops, settings.climate),
  }));
}

function usedFactorCount(result) {
  return result.factors.filter((factor) => factor.used).length;
}

// r1: พืชที่ข้อมูลน้อยต้องมี coverage น้อยกว่า
function checkRuleR1(settings, scenarios, crops) {
  const plot = plotFromScenario(scenarios.find((s) => s.id === "hs"), settings.month);
  const coverageOf = (id) => scoreCrop(plot, crops.find((c) => c.id === id), settings.climate).coverage;
  return coverageOf("longan") < coverageOf("cassava");
}

// r2: ทุกกรณี พืชใน top ต้องใช้ปัจจัยได้อย่างน้อย 2 ตัว
function checkRuleR2(settings, scenarios, crops) {
  return rankAllScenarios(settings, scenarios, crops)
    .every(({ ranked }) => ranked.top.every((result) => usedFactorCount(result) >= 2));
}

// r3: scoring.js ต้องไม่อ้างถึง AI และ rankCrops ต้องไม่เรียกเน็ต
async function checkRuleR3(settings, scenarios, crops) {
  const source = await fetchText("js/scoring.js");
  if (/gemini|ai\.js|callAi|askAi/i.test(source)) return false;
  const originalFetch = window.fetch;
  let fetchCount = 0;
  window.fetch = () => { fetchCount++; return Promise.reject(new Error("ปิดเน็ตเพื่อทดสอบ")); };
  try {
    rankAllScenarios(settings, scenarios, crops);
  } finally {
    window.fetch = originalFetch;
  }
  return fetchCount === 0;
}

const RULE_CHECKS = { r1: checkRuleR1, r2: checkRuleR2, r3: checkRuleR3 };

async function checkRuleCase(oneCase, settings, scenarios, crops) {
  const label = `${oneCase.id}: ${oneCase.rule}`;
  const check = RULE_CHECKS[oneCase.id];
  if (!check) return { status: "pending", text: `${label} (ยังไม่มีตัวตรวจข้อนี้)` };
  const passed = await check(settings, scenarios, crops);
  return { status: passed ? "pass" : "fail", text: label };
}

const STATUS_ICONS = { pass: "✅", fail: "❌", pending: "⬜" };

function showExamItems(items) {
  const list = document.getElementById("exam-results");
  for (const item of items) {
    const row = document.createElement("li");
    row.className = item.status;
    row.textContent = `${STATUS_ICONS[item.status]} ${item.text}`;
    list.appendChild(row);
  }
}

function showExamSummary(items) {
  const answered = items.filter((item) => item.status !== "pending");
  const passedCount = answered.filter((item) => item.status === "pass").length;
  const summary = document.getElementById("exam-summary");
  summary.textContent = `ข้อสอบเฉลย ผ่าน ${passedCount} / ${answered.length}`;
  const allPassed = answered.length > 0 && passedCount === answered.length;
  summary.className = allPassed ? "pass" : "fail";
}

function showScenarioTable(settings, scenarios, crops) {
  const nameOf = (result) => crops.find((crop) => crop.id === result.cropId).nameTh;
  const body = document.getElementById("scenario-body");
  for (const { scenario, ranked } of rankAllScenarios(settings, scenarios, crops)) {
    const row = document.createElement("tr");
    addCell(row, scenario.name);
    for (const result of ranked.top) {
      addCell(row, `${nameOf(result)} ${result.score} (มั่นใจ${CONFIDENCE_LABELS[result.confidence]})`);
    }
    body.appendChild(row);
  }
}

async function showExam() {
  const expected = await fetchJson(EXPECTED_URL);
  if (!expected) {
    document.getElementById("exam-summary").textContent = "อ่าน tests/expected.json ไม่ได้";
    document.getElementById("exam-summary").className = "fail";
    return;
  }
  const crops = await loadCrops();
  const scenarios = await loadScenarios();
  const { settings } = expected;
  const items = expected.scoreCases.map((c) => checkScoreCase(c, settings, scenarios, crops));
  for (const oneCase of expected.ruleCases) {
    items.push(await checkRuleCase(oneCase, settings, scenarios, crops));
  }
  showExamSummary(items);
  showExamItems(items);
  showScenarioTable(settings, scenarios, crops);
}
