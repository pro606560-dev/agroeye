// AI ช่วยอธิบาย (Gemini) — AI ไม่ได้เลือกหรือจัดอันดับพืช อันดับมาจาก js/scoring.js เท่านั้น
// AI แค่เรียบเรียงข้อมูลที่แอปมีอยู่แล้วให้อ่านง่ายขึ้น ถ้าเรียกไม่สำเร็จ แอปใช้ข้อความจาก crops.json ตามเดิม
// ความเป็นส่วนตัว: ส่งเฉพาะค่าดิน เดือน ชื่อพืช คะแนน และข้อความจาก crops.json ห้ามส่งชื่อแปลงหรือพิกัด

const AI_KEY_STORAGE = "gemini-key";
const AI_CACHE_STORAGE = "ai-cache";

// ข้อความเมื่อ AI ใช้ไม่ได้: บอกว่าเกิดอะไรขึ้น และต้องทำอะไรต่อ
const AI_FAIL_TEXTS = {
  offline: "ตอนนี้ไม่มีอินเทอร์เน็ต จึงขอคำอธิบายจาก AI ไม่ได้ อ่านวิธีดูแลด้านบนแทนได้เลย",
  timeout: "AI ตอบช้าเกินไป อ่านวิธีดูแลด้านบนแทน หรือเปิดหน้านี้ใหม่ภายหลัง",
  badKey: "รหัส AI ใช้ไม่ได้ ให้ตรวจรหัสในหน้าตั้งค่า ระหว่างนี้อ่านวิธีดูแลด้านบนได้",
  quota: "วันนี้ขอคำอธิบายจาก AI ครบจำนวนที่ใช้ฟรีแล้ว ลองใหม่พรุ่งนี้ ระหว่างนี้อ่านวิธีดูแลด้านบนได้",
  error: "ขอคำอธิบายจาก AI ไม่สำเร็จ อ่านวิธีดูแลด้านบนแทนได้เลย",
};

// ใช้ในหน้าพิสูจน์ตอนจับเวลา AI ไม่สำเร็จ บอกว่าเกิดอะไรขึ้น และทำอะไรต่อได้
const AI_TIMING_FAIL_TEXTS = {
  noKey: "ยังไม่มีรหัส AI ใส่รหัสในหน้าตั้งค่าก่อน",
  offline: "ตอนนี้ไม่มีอินเทอร์เน็ต ต่อเน็ตแล้วกดใหม่",
  timeout: "AI ตอบช้าเกินไป ลองกดใหม่ภายหลัง",
  badKey: "รหัส AI ใช้ไม่ได้ ตรวจรหัสในหน้าตั้งค่า",
  quota: "ใช้ AI ครบจำนวนที่ใช้ฟรีแล้ว รอสักครู่หรือลองพรุ่งนี้",
  error: "ถาม AI ไม่สำเร็จ ลองกดใหม่ภายหลัง",
};

// คำสั่งที่ส่งให้ Gemini (ข้อ 4 ของ task 16)
const AI_RULES = [
  "คุณช่วยอธิบายผลแนะนำพืชให้เกษตรกรสูงอายุในอำเภอแม่ทะ จังหวัดลำปาง",
  `ตอบเป็นภาษาไทยง่าย ๆ ไม่เกิน ${AI_MAX_LINES} บรรทัด ประโยคสั้น ไม่ใช้ศัพท์เทคนิค ไม่ใช้เครื่องหมาย * หรือ #`,
  "ใช้เฉพาะข้อมูลที่ให้ไปเท่านั้น ห้ามเพิ่มข้อเท็จจริงใหม่",
  "ห้ามแนะนำชื่อสารเคมี ปุ๋ย ยา หรืออัตราการใช้ ที่ไม่ได้อยู่ในข้อมูล",
  "ห้ามเปลี่ยนคะแนนหรือแนะนำพืชชนิดอื่น",
  "ถ้าข้อมูลไม่พอจะตอบ ให้บอกให้ปรึกษาเกษตรอำเภอแม่ทะ",
].join("\n");

// ---------- รหัส (API key) เก็บในเครื่องนี้เท่านั้น ----------
function aiKey() {
  const key = readStorage(AI_KEY_STORAGE, "");
  return typeof key === "string" ? key.trim() : "";
}

function saveAiKey(key) {
  return writeStorage(AI_KEY_STORAGE, String(key).trim());
}

function removeAiKey() {
  return removeStorage(AI_KEY_STORAGE);
}

// ---------- ข้อมูลที่ส่ง ----------
function plainFactorLabel(key) {
  const info = FACTORS.find((f) => f.key === key);
  return info?.plainLabel ?? info?.label ?? key;
}

// ใช้เฉพาะช่องที่อนุญาต ไม่ส่ง plot.name, plot.surveyPointId หรือพิกัดใด ๆ
function aiPayload(plot, cropResult, crop) {
  const factors = cropResult.factors.map((factor) => ({
    factor: plainFactorLabel(factor.key),
    score: factor.used ? factor.factorScore : "ไม่มีข้อมูล",
  }));
  return {
    soilType: TEXTURE_NAMES[plot.texture] ?? "ไม่ทราบ",
    ph: plot.ph ?? "ไม่ทราบ",
    waterlogging: { poor: "ฝนตกหนักแล้วน้ำขังนาน", good: "น้ำไม่ขัง" }[plot.drainage] ?? "ไม่ทราบ",
    month: plot.month ? MONTH_FULL_NAMES[plot.month - 1] : "ไม่ทราบ",
    crop: crop.nameTh,
    totalScore: cropResult.score,
    factorScores: factors,
    care: crop.care.map((item) => item.text),
    risks: crop.risks.map((item) => ({ risk: item.risk, fix: item.fix ?? "ยังไม่มีข้อมูล" })),
  };
}

function aiPrompt(payload) {
  return "ข้อมูลแปลงและพืช (คะแนนปัจจัย 1 = เหมาะ, 0.5 = พอใช้, 0 = ไม่เหมาะ):\n"
    + JSON.stringify(payload, null, 1)
    + "\n\nช่วยอธิบายว่าพืชนี้เหมาะกับแปลงนี้แค่ไหน และควรระวังอะไร";
}

// ---------- เก็บคำตอบไว้ (ชุดข้อมูลเดียวกัน = ไม่เรียกซ้ำ) ----------
function aiCacheKey(payload) {
  return `${GEMINI_MODEL}|${JSON.stringify(payload)}`;
}

function readAiCache() {
  const cache = readStorage(AI_CACHE_STORAGE, []);
  return Array.isArray(cache) ? cache : [];
}

function cachedAnswer(cacheKey) {
  return readAiCache().find((entry) => entry.key === cacheKey)?.text ?? null;
}

// คำตอบใหม่อยู่หน้า เก็บไม่เกิน AI_CACHE_LIMIT ชุด
function saveAnswer(cacheKey, text) {
  const others = readAiCache().filter((entry) => entry.key !== cacheKey);
  writeStorage(AI_CACHE_STORAGE, [{ key: cacheKey, text }, ...others].slice(0, AI_CACHE_LIMIT));
}

// ---------- เรียก Gemini ----------
// ตัดเครื่องหมาย markdown และให้เหลือไม่เกิน AI_MAX_LINES บรรทัด
function cleanAiText(text) {
  return text.split("\n")
    .map((line) => line.replace(/[*#`]/g, "").trim())
    .filter(Boolean)
    .slice(0, AI_MAX_LINES)
    .join("\n");
}

// แปลงสถานะ HTTP เป็นชนิดของปัญหา
function failReasonFromStatus(status) {
  if (status === 400 || status === 401 || status === 403) return "badKey";
  if (status === 429) return "quota";
  return "error";
}

function requestBody(payload) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: AI_RULES }] },
    contents: [{ role: "user", parts: [{ text: aiPrompt(payload) }] }],
    generationConfig: { maxOutputTokens: 2048 },
  });
}

// ส่งรหัสทาง header (ไม่ใส่ใน URL)
async function callGemini(key, payload, fetchFn) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const response = await fetchFn(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: requestBody(payload),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, reason: failReasonFromStatus(response.status) };
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = cleanAiText(parts.map((part) => part.text ?? "").join(""));
    return text ? { ok: true, text } : { ok: false, reason: "error" };
  } catch (err) {
    if (err.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: navigator.onLine === false ? "offline" : "error" };
  } finally {
    clearTimeout(timer);
  }
}

// คืน { ok: true, text, fromCache } หรือ { ok: false, reason }
// reason = "noKey" | "offline" | "timeout" | "badKey" | "quota" | "error"
// ไม่แก้ plot หรือ cropResult ที่ส่งเข้ามา คะแนนและอันดับจึงไม่เปลี่ยน
async function explain(plot, cropResult, crop, fetchFn = window.fetch.bind(window)) {
  const key = aiKey();
  if (!key) return { ok: false, reason: "noKey" };
  const payload = aiPayload(plot, cropResult, crop);
  const cacheKey = aiCacheKey(payload);
  const saved = cachedAnswer(cacheKey);
  if (saved) return { ok: true, text: saved, fromCache: true };
  if (navigator.onLine === false) return { ok: false, reason: "offline" };
  const answer = await callGemini(key, payload, fetchFn);
  if (answer.ok) saveAnswer(cacheKey, answer.text);
  return { ...answer, fromCache: false };
}

// ใช้จับเวลาในหน้าพิสูจน์: ถาม AI จริงทุกครั้ง ไม่อ่านและไม่บันทึกคำตอบที่เก็บไว้
// (ถ้าอ่านจากที่เก็บไว้ เวลาจะใกล้ 0 ซึ่งไม่ใช่เวลาที่ AI ใช้จริง)
async function askAiFresh(plot, cropResult, crop, fetchFn = window.fetch.bind(window)) {
  const key = aiKey();
  if (!key) return { ok: false, reason: "noKey" };
  if (navigator.onLine === false) return { ok: false, reason: "offline" };
  return callGemini(key, aiPayload(plot, cropResult, crop), fetchFn);
}
