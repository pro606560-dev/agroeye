// ตรวจว่าข้อมูลพืชถูกรูปแบบ ถ้าผิดจะคืนรายการปัญหาเป็นภาษาไทย

const RANGE_FIELDS = ["ph", "tempC", "rainMmYear"];
const VALUE_PARTS = ["optimal", "tolerable", "good", "ok", "value", "months", "text", "risk"];

// ทุกช่องต้องมีส่วนย่อยครบ กันพิมพ์ชื่อผิดแล้วกลายเป็น "ยังไม่มีข้อมูล" แบบเงียบ ๆ
const REQUIRED_PARTS = {
  ph: ["optimal", "tolerable"],
  tempC: ["optimal", "tolerable"],
  rainMmYear: ["optimal", "tolerable"],
  texture: ["good", "ok"],
  drainage: ["value"],
  light: ["value"],
  plantingMonths: ["months"],
  cycleDays: ["value"],
  localEvidence: ["text"],
};
const REQUIRED_FIELDS = Object.keys(REQUIRED_PARTS);

const TEXTURES = ["heavy", "medium", "light"];
const DRAINAGES = ["good", "poor-ok"];
const LIGHTS = ["full-sun", "partial-ok"];
const PH_MIN = 3;
const PH_MAX = 10;

// ---------- ตรวจข้อมูลพืช ----------

function checkCropCount(crops) {
  if (crops.length === EXPECTED_CROP_COUNT) return null;
  return `จำนวนพืชเป็น ${crops.length} ชนิด แต่ควรมี ${EXPECTED_CROP_COUNT} ชนิด`;
}

function hasValue(field) {
  return Boolean(field) && VALUE_PARTS.some((part) => field[part] != null);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

// ช่วงที่ถูกต้องคือ [min, max] โดย min ≤ max
// ปริมาณฝนใส่ max เป็น null ได้ แปลว่าไม่จำกัด (ดู _units ใน crops.json)
function isValidRange(range, allowOpenMax = false) {
  if (!Array.isArray(range) || range.length !== 2) return false;
  const [min, max] = range;
  if (typeof min !== "number") return false;
  if (max === null) return allowOpenMax;
  return typeof max === "number" && min <= max;
}

function isRangeInside(inner, outer) {
  const innerMax = inner[1] ?? Infinity;
  const outerMax = outer[1] ?? Infinity;
  return inner[0] >= outer[0] && innerMax <= outerMax;
}

function checkIdentity(crop) {
  return ["id", "nameTh", "group"]
    .filter((key) => !crop[key])
    .map((key) => `ไม่มี ${key}`);
}

function checkRequiredFields(crop) {
  const errors = [];
  for (const key of REQUIRED_FIELDS) {
    if (!isPlainObject(crop[key])) {
      errors.push(`ไม่มีช่อง ${key}`);
      continue;
    }
    const missing = REQUIRED_PARTS[key].filter((part) => !(part in crop[key]));
    errors.push(...missing.map((part) => `ไม่มีช่อง ${key}.${part}`));
    if (!("source" in crop[key])) errors.push(`ไม่มีช่อง ${key}.source`);
  }
  return errors;
}

// care ต้องมี text และ risks ต้องมี risk ถ้าไม่ใช่รายการ หน้าจอจะวนแสดงผลไม่ได้
function checkListField(name, list, mainPart) {
  if (!Array.isArray(list)) return [`${name} ต้องเป็นรายการ`];
  const isGoodItem = (item) => isPlainObject(item) && Boolean(item[mainPart]);
  return list.flatMap((item, i) => (isGoodItem(item) ? [] : [`${name}[${i}] ไม่มี ${mainPart}`]));
}

function checkRangeField(name, field) {
  if (!field) return [];
  const errors = [];
  const allowOpenMax = name === "rainMmYear";
  for (const part of ["optimal", "tolerable"]) {
    if (field[part] != null && !isValidRange(field[part], allowOpenMax)) {
      errors.push(`${name}.${part} ไม่ใช่ช่วง [min, max] ที่ถูกต้อง`);
    }
  }
  if (errors.length === 0 && field.optimal && field.tolerable
      && !isRangeInside(field.optimal, field.tolerable)) {
    errors.push(`${name}.optimal อยู่นอกช่วง tolerable`);
  }
  return errors;
}

function checkPhLimits(ph) {
  if (!ph) return [];
  const values = [...asList(ph.optimal), ...asList(ph.tolerable)];
  const isOutside = values.some((v) => typeof v === "number" && (v < PH_MIN || v > PH_MAX));
  return isOutside ? [`ค่า pH ต้องอยู่ระหว่าง ${PH_MIN}–${PH_MAX}`] : [];
}

function checkTexture(texture) {
  if (!texture) return [];
  const { good, ok } = texture;
  if (good == null && ok == null) return [];
  if (!Array.isArray(good) || !Array.isArray(ok)) return ["texture.good และ ok ต้องเป็นรายการ"];
  // รายการว่างทั้งคู่จะได้คะแนน 0 ผิด ๆ ถ้าไม่มีข้อมูลต้องใส่ null
  if (good.length + ok.length === 0) return ["texture ว่างทั้งคู่ ถ้าไม่มีข้อมูลให้ใส่ null"];
  return [...good, ...ok].filter((v) => !TEXTURES.includes(v)).map((v) => `ประเภทดินไม่รู้จัก: ${v}`);
}

function checkChoice(name, field, choices) {
  if (!field || field.value == null || choices.includes(field.value)) return [];
  return [`${name} ไม่รู้จักค่า ${field.value}`];
}

function checkMonths(plantingMonths) {
  const months = plantingMonths && plantingMonths.months;
  if (months == null) return [];
  if (!Array.isArray(months) || months.length === 0) {
    return ["plantingMonths.months ต้องเป็นรายการเดือน ถ้าไม่มีข้อมูลให้ใส่ null"];
  }
  const isValidMonth = (m) => Number.isInteger(m) && m >= 1 && m <= 12;
  return months.filter((m) => !isValidMonth(m)).map((m) => `เดือนไม่ถูกต้อง: ${m}`);
}

function checkCycleDays(cycleDays) {
  if (!cycleDays || cycleDays.value == null || isValidRange(cycleDays.value)) return [];
  return ["cycleDays.value ไม่ใช่ช่วง [min, max] ที่ถูกต้อง"];
}

// ไม้ยืนต้นเทียบอุณหภูมิกับค่าเฉลี่ยทั้งปี พืชล้มลุกเทียบกับเดือนที่อยู่ในแปลง (docs/SPEC.md ข้อ 4.1)
const TEMP_BASIS_OF = { annual: "growing_season_mean", perennial: "annual_mean" };

// lifeForm กับ tempBasis ไม่บังคับ แต่ถ้ามีต้องเป็นค่าที่รู้จักและเข้าคู่กัน
function checkLifeForm(crop) {
  if (crop.lifeForm == null && crop.tempBasis == null) return [];
  if (!Object.hasOwn(TEMP_BASIS_OF, crop.lifeForm)) return [`lifeForm ไม่รู้จักค่า ${crop.lifeForm}`];
  if (crop.tempBasis === TEMP_BASIS_OF[crop.lifeForm]) return [];
  return [`tempBasis ของพืช ${crop.lifeForm} ต้องเป็น ${TEMP_BASIS_OF[crop.lifeForm]}`];
}

// ช่องเสริมของข้าวไวแสงและเกณฑ์ความหนาว มีเฉพาะบางพืช
function checkOptionalFields(crop) {
  const errors = [];
  if (crop.photoperiodSensitive != null && typeof crop.photoperiodSensitive !== "boolean") {
    errors.push("photoperiodSensitive ต้องเป็น true หรือ false");
  }
  const harvest = crop.harvestApprox?.value;
  if (harvest != null && !/^(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/.test(harvest)) {
    errors.push("harvestApprox.value ต้องเป็น เดือน-วัน เช่น 11-21");
  }
  const cold = crop.coldLimitC?.value;
  if (cold != null && !isValidRange(cold)) errors.push("coldLimitC.value ไม่ใช่ช่วง [min, max] ที่ถูกต้อง");
  return errors;
}

// ช่อง source อาจมีหลายรหัส เช่น "ก (optimal), ข (tolerable)"
function splitSourceCodes(source) {
  return source.split(",").map((part) => part.replace(/\(.*?\)/g, "").trim());
}

function fieldsWithSource(crop) {
  const named = [...REQUIRED_FIELDS, "harvestApprox", "coldLimitC"].map((key) => [key, crop[key]]);
  const listed = ["care", "risks"].flatMap((key) =>
    asList(crop[key]).map((item, i) => [`${key}[${i}]`, item]));
  return [...named, ...listed].filter(([, field]) => isPlainObject(field));
}

// ค่าที่ไม่ใช่ null ต้องมี source และรหัสต้องอยู่ใน SOURCES.md
function checkSources(crop, sourceCodes) {
  const errors = [];
  for (const [name, field] of fieldsWithSource(crop)) {
    if (hasValue(field) && !field.source) errors.push(`${name} มีค่าแต่ไม่มี source`);
    if (!field.source) continue;
    if (typeof field.source !== "string") {
      errors.push(`${name}.source ต้องเป็นข้อความ`);
      continue;
    }
    if (!sourceCodes) continue;
    for (const code of splitSourceCodes(field.source)) {
      if (!sourceCodes.has(code)) errors.push(`${name} อ้างรหัสแหล่งที่ไม่มี: ${code}`);
    }
  }
  return errors;
}

// คืนรายการปัญหาของพืช 1 ชนิด ถ้าไม่มีปัญหาจะได้รายการว่าง
function validateCrop(crop, sourceCodes = null) {
  if (!crop || typeof crop !== "object") return ["ไม่ใช่ข้อมูลพืช"];
  return [
    ...checkIdentity(crop),
    ...checkRequiredFields(crop),
    ...RANGE_FIELDS.flatMap((name) => checkRangeField(name, crop[name])),
    ...checkPhLimits(crop.ph),
    ...checkTexture(crop.texture),
    ...checkChoice("drainage", crop.drainage, DRAINAGES),
    ...checkChoice("light", crop.light, LIGHTS),
    ...checkMonths(crop.plantingMonths),
    ...checkCycleDays(crop.cycleDays),
    ...checkLifeForm(crop),
    ...checkOptionalFields(crop),
    ...checkListField("care", crop.care, "text"),
    ...checkListField("risks", crop.risks, "risk"),
    ...checkSources(crop, sourceCodes),
  ];
}

// try/catch กันข้อมูลแปลก ๆ ที่นึกไม่ถึง พืชตัวเดียวต้องไม่ทำให้แอปล้มทั้งหมด
function findCropErrors(crop, sourceCodes, seenIds) {
  try {
    const errors = validateCrop(crop, sourceCodes);
    if (crop && seenIds.has(crop.id)) errors.push("รหัสพืชซ้ำ");
    return errors;
  } catch (err) {
    return [`ตรวจไม่ได้: ${err.message}`];
  }
}

function keepValidCrops(crops, sourceCodes = null) {
  const seenIds = new Set();
  return crops.filter((crop) => {
    const errors = findCropErrors(crop, sourceCodes, seenIds);
    if (errors.length > 0) {
      const name = (crop && crop.id) || "ไม่ทราบชื่อ";
      console.warn(`ข้ามพืช ${name}: ${errors.join("; ")}`);
      return false;
    }
    seenIds.add(crop.id);
    return true;
  });
}
