// ข้อความที่จะอ่านออกเสียง (task 15) คำนวณล้วน ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้
// ใช้ข้อความเดิมจาก crops.json และ js/reasons.js เท่านั้น แค่แปลงตัวเลขและสัญลักษณ์เป็นคำ ไม่เติมคำแนะนำเอง

const THAI_DIGITS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

// อ่านเลขไม่เกิน 6 หลัก เช่น 21 → ยี่สิบเอ็ด, 150 → หนึ่งร้อยห้าสิบ
function thaiBelowMillion(digits) {
  let words = "";
  const length = digits.length;
  for (let i = 0; i < length; i++) {
    const digit = Number(digits[i]);
    const place = length - 1 - i;
    if (digit === 0) continue;
    if (place === 1 && digit === 1) words += "สิบ";
    else if (place === 1 && digit === 2) words += "ยี่สิบ";
    else if (place === 0 && digit === 1 && length > 1 && digits[length - 2] !== "0") words += "เอ็ด";
    else words += THAI_DIGITS[digit] + THAI_PLACES[place];
  }
  return words;
}

// อ่านจำนวนเต็ม (สตริงตัวเลข) เป็นคำไทย ถ้าเกินล้าน แบ่งอ่านทีละล้าน
function thaiInteger(digits) {
  const clean = digits.replace(/^0+(?=\d)/, "");
  if (clean === "0") return THAI_DIGITS[0];
  if (clean.length <= 6) return thaiBelowMillion(clean);
  const millions = clean.slice(0, -6);
  const rest = clean.slice(-6);
  return thaiInteger(millions) + "ล้าน" + (/^0+$/.test(rest) ? "" : thaiBelowMillion(rest.replace(/^0+/, "")));
}

// อ่านตัวเลขเป็นคำไทย ทศนิยมอ่านทีละตัว เช่น "5.5" → ห้าจุดห้า, "0.75" → ศูนย์จุดเจ็ดห้า
function thaiNumberWords(text) {
  const [whole, decimals] = String(text).replace(/,/g, "").split(".");
  const wholeWords = thaiInteger(whole);
  if (!decimals) return wholeWords;
  return wholeWords + "จุด" + [...decimals].map((d) => THAI_DIGITS[Number(d)]).join("");
}

// หน่วยและสัญลักษณ์ที่พบในข้อมูลพืชและเหตุผล (เรียงคำยาวก่อน เพื่อไม่ให้คำสั้นแทนที่ก่อน)
const SPOKEN_REPLACEMENTS = [
  [/pH/g, " ค่าความเป็นกรดด่าง "],
  [/ซม\./g, " เซนติเมตร "],
  [/มม\./g, " มิลลิเมตร "],
  [/กก\./g, " กิโลกรัม "],
  [/°\s*C|°/g, " องศา "],
  [/%/g, " เปอร์เซ็นต์ "],
  [/\//g, " ต่อ "],
  [/[–—]/g, ", "],
  [/[()✓!·]/g, " "],
];

// แปลงข้อความให้เสียงอ่านถูก: ช่วงตัวเลข "5–10" → ห้าถึงสิบ, ตัวเลข → คำ, หน่วยย่อ → คำเต็ม
function toSpokenThai(text) {
  let spoken = String(text);
  spoken = spoken.replace(/(\d)\s*[–—-]\s*(?=\d)/g, "$1 ถึง ");
  spoken = spoken.replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, (n) => ` ${thaiNumberWords(n)} `);
  for (const [pattern, words] of SPOKEN_REPLACEMENTS) spoken = spoken.replace(pattern, words);
  return spoken.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
}

// ---------- ข้อความของแต่ละหน้า (คืนเป็นรายการประโยค อ่านทีละประโยค หยุดเว้นจังหวะให้ฟังทัน) ----------

// หน้าผล: บอกก่อนว่ามีกี่อย่าง แล้วอ่านทีละอันดับ: ชื่อ คะแนน ความมั่นใจ เหตุผล ปิดด้วยคำเตือน (closingNote)
function resultSpeechSentences(recommended, crops, closingNote) {
  const sentences = [`พืชที่แนะนำสำหรับแปลงนี้ มี ${recommended.length} อย่าง`];
  recommended.forEach((result, index) => {
    const crop = crops.find((c) => c.id === result.cropId);
    sentences.push(`อันดับ ${index + 1} ${crop.nameTh}`);
    sentences.push(`ได้ ${result.score} คะแนน จาก 100 ความมั่นใจ${CONFIDENCE_LABELS[result.confidence]}`);
    for (const reason of pickReasons(result, crop)) {
      sentences.push(reason.good ? reason.text : `ข้อที่ต้องระวัง ${reason.text}`);
    }
  });
  if (closingNote) sentences.push(closingNote);
  return sentences.map(toSpokenThai);
}

// หน้าพืช: วิธีดูแลทีละข้อ แล้วความเสี่ยงพร้อมวิธีแก้ ถ้าไม่มีข้อมูลให้บอกตรง ๆ
function cropSpeechSentences(crop) {
  const sentences = [`วิธีดูแล${crop.nameTh}`];
  if (crop.care.length === 0) sentences.push(NO_DATA_TEXT);
  crop.care.forEach((item, index) => sentences.push(`ข้อ ${index + 1} ${item.text}`));
  sentences.push("ความเสี่ยงและวิธีแก้");
  if (crop.risks.length === 0) sentences.push(NO_DATA_TEXT);
  crop.risks.forEach((item, index) => {
    sentences.push(`เรื่องที่ ${index + 1} ${item.risk}`);
    sentences.push(`วิธีแก้ ${item.fix || NO_DATA_TEXT}`);
  });
  return sentences.map(toSpokenThai);
}
