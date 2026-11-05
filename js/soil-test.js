// ตรรกะทดสอบเนื้อดิน 3 วิธี ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้
// ทายเนื้อดินด้วยมือวิธีเดียวคลาดเคลื่อนสูง (SALLEY-2018) จึงใช้ 3 วิธีแล้วดูว่าตรงกันไหม
// เกณฑ์ตัวเลขทั้งหมดอยู่ใน js/config.js

// ---------- วิธี 1 ปั้นบอลและปั้นเส้น ----------

// คำตอบของหน้าปั้นเส้น แปลงเป็นเนื้อดิน
const BALL_ANSWERS = {
  crumble: "light",      // บีบแล้วแบมือ ก้อนแตกร่วน = ดินทราย
  long: "heavy",         // เส้นยาวตั้งแต่ RIBBON_CLAY_MIN_CM = ดินเหนียว
  "short-gritty": "light", // เส้นสั้นกว่า RIBBON_SAND_MAX_CM และสากมือมาก = ดินทราย
  middle: "medium",      // นอกนั้น = ดินร่วน
};

function ballTexture(answer) {
  return BALL_ANSWERS[answer] ?? null;
}

// ---------- วิธี 2 ขวดน้ำใส (ค่าประมาณ) ----------

// คืน null ถ้ายังไม่ได้ทำหรือตัวเลขใช้ไม่ได้
function bottleTexture(sandText, totalText, cloudy) {
  const sand = parseDecimal(sandText);
  const total = parseDecimal(totalText);
  if (sand === null || total === null || total <= 0 || sand > total) return null;
  const ratio = sand / total;
  if (ratio >= BOTTLE_SAND_MIN_RATIO) return "light";
  if (ratio <= BOTTLE_CLAY_MAX_RATIO && cloudy === "yes") return "heavy";
  return "medium";
}

function bottleError(draft) {
  const filled = [draft.bottleSandText, draft.bottleTotalText].filter((text) => !isBlank(text));
  if (filled.length === 0) return null;
  if (filled.length === 1) return "ใส่ความสูงให้ครบทั้ง 2 ช่อง หรือกด “ไม่ได้ทำ ข้ามไป”";
  if (bottleTexture(draft.bottleSandText, draft.bottleTotalText, "no") === null) {
    return "ชั้นทรายต้องไม่สูงกว่าดินทั้งหมด และต้องเป็นตัวเลข ลองวัดอีกครั้ง";
  }
  return null;
}

// ---------- วิธี 3 คำถามประสบการณ์ ----------

// ข้อของดินเหนียว 3 ข้อ และข้อของดินทราย 1 ข้อ ค่าแต่ละข้อเป็น "yes", "no" หรือ null
const FEEL_CLAY_QUESTIONS = ["feelSticky", "feelCracks", "feelPonding"];
const FEEL_SAND_QUESTION = "feelSandy";

function feelTexture(draft) {
  const answers = [...FEEL_CLAY_QUESTIONS, FEEL_SAND_QUESTION].map((key) => draft[key]);
  if (answers.every((answer) => answer == null)) return null;
  const clayYes = FEEL_CLAY_QUESTIONS.filter((key) => draft[key] === "yes").length;
  if (clayYes >= FEEL_CLAY_MIN_YES) return "heavy";
  return draft[FEEL_SAND_QUESTION] === "yes" ? "light" : "medium";
}

// ---------- รวมผล ----------

// ผลของทั้ง 3 วิธี ค่าที่ยังไม่ได้ทดสอบเป็น null
function soilTestResults(draft) {
  return [
    ballTexture(draft.ballAnswer),
    bottleTexture(draft.bottleSandText, draft.bottleTotalText, draft.bottleCloudy),
    feelTexture(draft),
  ];
}

// ถ้ามีอย่างน้อย SOIL_TEST_AGREE_MIN วิธีได้ผลตรงกัน คืนเนื้อดินนั้น ไม่อย่างนั้นคืน null
function agreedTexture(results) {
  return TEXTURES.find((texture) =>
    results.filter((result) => result === texture).length >= SOIL_TEST_AGREE_MIN) ?? null;
}

// ความมั่นใจเรื่องเนื้อดิน: ค่าจากจุดสำรวจ = "survey", ผู้ใช้เลือกตรงกับผลที่ตรงกัน = "fairly-sure"
// นอกนั้น = "unsure" ไม่ตัดคะแนน แต่หน้าผลจะบอกว่าไม่แน่ใจ
function textureConfidence(draft) {
  if (draft.prefilled.includes("texture")) return "survey";
  const agreed = agreedTexture(soilTestResults(draft));
  return agreed !== null && agreed === draft.texture ? "fairly-sure" : "unsure";
}
