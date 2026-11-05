// ตรรกะของหน้ากรอกข้อมูล ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้
// draft คือคำตอบระหว่างกรอก ค่าตัวเลขเก็บเป็นข้อความตามที่พิมพ์ แล้วค่อยแปลงตอนจบ

// เนื้อดินมี 3 ขั้นทดสอบ (ปั้นเส้น, ขวดน้ำ, คำถามประสบการณ์) ก่อนขั้นเลือกดิน
const WIZARD_STEPS = ["name", "soil-ball", "soil-bottle", "soil-feel", "soil", "ph", "water", "month", "extra"];

// ขั้นที่ไม่ต้องถาม ถ้าจุดสำรวจมีค่าของขั้นนั้นแล้ว
const STEPS_OF_PREFILLED = {
  texture: ["soil-ball", "soil-bottle", "soil-feel", "soil"],
  phText: ["ph"],
  drainage: ["water"],
};

// คำตอบ "ไม่ทราบ" ของขั้นน้ำขัง ต้องแยกจาก null ซึ่งแปลว่ายังไม่ได้ตอบ
const ANSWER_UNKNOWN = "unknown";

function createDraft(currentMonth) {
  return {
    nameText: "",
    surveyPointId: null,
    surveyPointName: null,
    prefilled: [],
    ballAnswer: null,
    bottleSandText: "",
    bottleTotalText: "",
    bottleCloudy: null,
    feelSticky: null,
    feelCracks: null,
    feelPonding: null,
    feelSandy: null,
    texture: null,
    phText: "",
    drainage: null,
    month: String(currentMonth),
    light: null,
    moistureText: "",
    nitrogenText: "",
    phosphorusText: "",
    potassiumText: "",
  };
}

// ---------- จุดสำรวจ ----------

function clearSurveyPoint(draft) {
  draft.prefilled.forEach((key) => { draft[key] = key === "phText" ? "" : null; });
  draft.prefilled = [];
  draft.surveyPointId = null;
  draft.surveyPointName = null;
}

// เติมเฉพาะค่าที่จุดสำรวจมี ค่าที่เป็น null ยังต้องถามผู้ใช้ ห้ามเดาเติม
function applySurveyPoint(draft, point) {
  clearSurveyPoint(draft);
  draft.nameText = "";
  draft.surveyPointId = point.id;
  draft.surveyPointName = point.name;
  const known = { texture: point.texture, phText: point.ph, drainage: point.drainage };
  Object.entries(known).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    draft[key] = key === "phText" ? String(value) : value;
    draft.prefilled.push(key);
  });
}

// ---------- ลำดับขั้น ----------

function activeSteps(draft) {
  const skipped = draft.prefilled.flatMap((key) => STEPS_OF_PREFILLED[key]);
  return WIZARD_STEPS.filter((step) => !skipped.includes(step));
}

// คืนขั้นถัดไป หรือ null ถ้าเป็นขั้นสุดท้ายแล้ว
function nextStep(draft, step) {
  const steps = activeSteps(draft);
  return steps[steps.indexOf(step) + 1] ?? null;
}

// ---------- ตรวจค่าที่กรอก ----------

// แปลงข้อความเป็นตัวเลข ยอมรับจุลภาคแทนจุด คืน null ถ้าว่างหรือไม่ใช่ตัวเลข
function parseDecimal(text) {
  const clean = String(text ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(clean)) return null;
  return Number(clean);
}

function isBlank(text) {
  return String(text ?? "").trim() === "";
}

function isTextInRange(text, min, max) {
  const value = parseDecimal(text);
  return value !== null && value >= min && value <= max;
}

function phError(text) {
  if (isBlank(text)) return "ยังไม่ได้ใส่ค่า pH ใส่ตัวเลข หรือกด “ไม่ทราบ” ถ้ายังไม่ได้วัด";
  if (isTextInRange(text, PH_INPUT_MIN, PH_INPUT_MAX)) return null;
  return `ค่า pH ต้องอยู่ระหว่าง ${PH_INPUT_MIN} ถึง ${PH_INPUT_MAX} ลองดูตัวเลขอีกครั้ง`;
}

function extraError(draft) {
  if (!isBlank(draft.moistureText) && !isTextInRange(draft.moistureText, 0, 100)) {
    return "ความชื้นดินต้องอยู่ระหว่าง 0 ถึง 100 ลองดูตัวเลขอีกครั้ง หรือลบออกถ้าไม่ทราบ";
  }
  const npk = [draft.nitrogenText, draft.phosphorusText, draft.potassiumText];
  if (npk.some((text) => !isBlank(text) && parseDecimal(text) === null)) {
    return "ค่าปุ๋ยต้องเป็นตัวเลขเท่านั้น ลองดูอีกครั้ง หรือลบออกถ้าไม่ทราบ";
  }
  return null;
}

// คำง่ายที่แสดงข้างตัวเลข pH แบ่ง 4 กลุ่ม (เกณฑ์ใน js/config.js)
function phWord(ph) {
  if (ph <= PH_VERY_ACID_MAX) return "ดินเปรี้ยวมาก";
  if (ph < PH_NORMAL_MIN) return "ดินเปรี้ยว";
  return ph > PH_NORMAL_MAX ? "ดินเป็นด่าง" : "ปกติ";
}

// ---------- ผลลัพธ์ ----------

// สร้างข้อมูลแปลงให้ scoring.js ค่าที่ไม่รู้เป็น null เพื่อให้ตัดปัจจัยนั้นออกจากการคำนวณ
// ความชื้นดินและ N/P/K ยังไม่ใช้คำนวณ แต่เก็บไว้ใช้ในประวัติ (SPEC ข้อ 4.1)
function buildPlot(draft) {
  return {
    name: draft.surveyPointName ?? (draft.nameText.trim() || null),
    surveyPointId: draft.surveyPointId,
    ph: parseDecimal(draft.phText),
    texture: draft.texture,
    textureConfidence: draft.texture ? textureConfidence(draft) : null,
    drainage: draft.drainage === ANSWER_UNKNOWN ? null : draft.drainage,
    month: draft.month === null ? null : Number(draft.month),
    light: draft.light,
    moisture: parseDecimal(draft.moistureText),
    nitrogen: parseDecimal(draft.nitrogenText),
    phosphorus: parseDecimal(draft.phosphorusText),
    potassium: parseDecimal(draft.potassiumText),
  };
}
