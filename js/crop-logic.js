// ตรรกะของหน้ารายละเอียดพืช ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้

const NO_DATA_TEXT = "ยังไม่มีข้อมูล — สอบถามเกษตรอำเภอแม่ทะ";
const NO_VALUE_TEXT = "ยังไม่มีข้อมูล";

const VERDICT_WORDS = { 1: "ผ่าน", 0.5: "พอได้", 0: "ไม่ผ่าน" };
const DRAINAGE_WORDS = { good: "น้ำไม่ขัง", poor: "น้ำขัง" };
const LIGHT_WORDS = { "full-sun": "แดดจัด", shade: "ร่มรำไร" };
const CROP_DRAINAGE_WORDS = { good: "น้ำไม่ขัง", "poor-ok": "ทนน้ำขังได้" };
const CROP_LIGHT_WORDS = { "full-sun": "แดดจัด", "partial-ok": "ทนร่มรำไรได้" };

// ---------- แหล่งข้อมูล ----------

// source อาจมีหลายรหัส เช่น "DOA-CASSAVA-2563 (optimal), ECOCROP-CASSAVA (tolerable)"
function sourceCodesOf(source) {
  return source ? source.match(/[A-Z][A-Z0-9-]+/g) ?? [] : [];
}

// ให้เลขแหล่งตามลำดับที่พบในหน้า เลขเดียวกันถ้าเป็นแหล่งเดียวกัน
function createCitations() {
  const codes = [];
  return {
    codes,
    cite(source) {
      const numbers = sourceCodesOf(source).map((code) => {
        if (!codes.includes(code)) codes.push(code);
        return codes.indexOf(code) + 1;
      });
      return numbers.length > 0 ? `ที่มา: แหล่ง ${numbers.join(", ")}` : "";
    },
  };
}

// note แสดงได้เฉพาะช่องที่มีแหล่ง ถ้า source เป็น null ตัวเลขใน note ยังไม่มีที่มา
function sourcedNote(field) {
  return field.source && field.note ? field.note : null;
}

// ---------- ตาราง "ทำไมได้คะแนนนี้" ----------

// เช่น [5, 6.5] = "5–6.5" และ [1500, null] = "1500 ขึ้นไป"
function rangeText([min, max]) {
  if (max === null) return `${min} ขึ้นไป`;
  return min === null ? `ไม่เกิน ${max}` : `${min}–${max}`;
}

function rangeNeedText(range, prefix, unit) {
  const parts = [];
  if (range.optimal) parts.push(`${prefix}${rangeText(range.optimal)}${unit}`);
  if (range.tolerable) parts.push(`ทนได้ ${prefix}${rangeText(range.tolerable)}${unit}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

function textureNames(list) {
  return list.map((key) => TEXTURE_NAMES[key]).join(", ");
}

function textureNeedText({ good, ok }) {
  const parts = [];
  if (good?.length) parts.push(textureNames(good));
  if (ok?.length) parts.push(`พอได้ ${textureNames(ok)}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

function monthNames(months) {
  return months.map((month) => MONTH_NAMES[month - 1]).join(", ");
}

const FACTOR_TEXTS = {
  ph: {
    plot: (value) => `pH ${value}`,
    need: (range) => rangeNeedText(range, "pH ", ""),
  },
  texture: { plot: (value) => TEXTURE_NAMES[value], need: textureNeedText },
  drainage: {
    plot: (value) => DRAINAGE_WORDS[value],
    need: (value) => CROP_DRAINAGE_WORDS[value],
  },
  plantingMonths: {
    plot: (value) => MONTH_NAMES[value - 1],
    need: (months) => monthNames(months),
  },
  tempC: {
    plot: (value) => `${value} องศา`,
    need: (range) => rangeNeedText(range, "", " องศา"),
  },
  rainMmYear: {
    plot: (value) => `${value} มม. ต่อปี`,
    need: (range) => rangeNeedText(range, "", " มม. ต่อปี"),
  },
  light: {
    plot: (value) => LIGHT_WORDS[value],
    need: (value) => CROP_LIGHT_WORDS[value],
  },
};

function factorRow(factor) {
  const texts = FACTOR_TEXTS[factor.key];
  const info = FACTORS.find((f) => f.key === factor.key);
  const need = factor.cropRange == null ? null : texts.need(factor.cropRange);
  return {
    key: factor.key,
    label: info.plainLabel ?? info.label,
    plotText: factor.plotValue === null ? NO_VALUE_TEXT : texts.plot(factor.plotValue),
    needText: need ?? NO_VALUE_TEXT,
    verdict: factor.used ? VERDICT_WORDS[factor.factorScore] : NO_VALUE_TEXT,
  };
}

function factorRows(result) {
  return result.factors.map(factorRow);
}
