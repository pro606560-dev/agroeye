// โหลดไฟล์ใน data/ และตรวจว่าข้อมูลถูกรูปแบบ
// ถ้าพืชตัวไหนผิด จะข้ามพืชนั้นและเตือนใน console แอปต้องไม่พัง

const CROPS_URL = "data/crops.json";
const SURVEY_POINTS_URL = "data/survey-points.json";
const SCENARIOS_URL = "data/test-scenarios.json";
const SOURCES_URL = "data/SOURCES.md";

// 7 ปัจจัยที่ใช้คิดคะแนนได้ (ดู docs/SPEC.md หัวข้อ 4.1)
const FACTORS = [
  { key: "ph", label: "pH", plainLabel: "ความเปรี้ยวของดิน (pH)" },
  { key: "texture", label: "ประเภทดิน" },
  { key: "drainage", label: "การระบายน้ำ", plainLabel: "น้ำขัง" },
  { key: "plantingMonths", label: "เดือนปลูก" },
  { key: "tempC", label: "อุณหภูมิ" },
  { key: "rainMmYear", label: "ฝน" },
  { key: "light", label: "แสง" },
];

// ---------- โหลดไฟล์ ----------

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`โหลดไม่ได้ (${response.status})`);
  return response.text();
}

// คืน null ถ้าโหลดไม่ได้หรือ JSON เสีย
async function fetchJson(url) {
  try {
    return JSON.parse(await fetchText(url));
  } catch (err) {
    console.warn(`อ่านไฟล์ ${url} ไม่ได้: ${err.message}`);
    return null;
  }
}

// อ่านรหัสแหล่งจากคอลัมน์ซ้ายของตารางใน SOURCES.md
function parseSourceCodes(markdown) {
  const codes = new Set();
  for (const line of markdown.split("\n")) {
    const match = line.match(/^\|\s*([A-Z][A-Z0-9-]+)\s*\|/);
    if (match) codes.add(match[1]);
  }
  return codes;
}

// คืน null ถ้าอ่านรหัสไม่ได้ เพื่อให้ข้ามการตรวจรหัสแหล่ง แทนที่จะตัดพืชทิ้งทั้งหมด
async function loadSourceCodes(url = SOURCES_URL) {
  try {
    const codes = parseSourceCodes(await fetchText(url));
    if (codes.size === 0) throw new Error("ไม่พบตารางรหัสแหล่ง");
    return codes;
  } catch (err) {
    console.warn(`อ่าน ${url} ไม่ได้ จึงไม่ได้ตรวจรหัสแหล่ง: ${err.message}`);
    return null;
  }
}

async function loadCrops(url = CROPS_URL) {
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.crops)) {
    console.warn(`ไม่พบรายการพืชใน ${url}`);
    return [];
  }
  const countError = checkCropCount(data.crops);
  if (countError) console.warn(countError);
  return keepValidCrops(data.crops, await loadSourceCodes());
}

async function loadSurveyPoints(url = SURVEY_POINTS_URL) {
  const data = await fetchJson(url);
  return data && Array.isArray(data.points) ? data.points : [];
}

async function loadScenarios(url = SCENARIOS_URL) {
  const data = await fetchJson(url);
  return data && Array.isArray(data.scenarios) ? data.scenarios : [];
}

// ---------- สรุปความครอบคลุมของข้อมูล ----------

// สรุปว่าพืชแต่ละชนิดมีปัจจัยกี่ตัวที่ใช้คิดคะแนนได้
function dataCoverageReport(crops) {
  return crops.map((crop) => {
    const missing = FACTORS.filter((f) => !hasValue(crop[f.key])).map((f) => f.label);
    return {
      id: crop.id,
      nameTh: crop.nameTh,
      usable: FACTORS.length - missing.length,
      total: FACTORS.length,
      missing,
    };
  });
}
