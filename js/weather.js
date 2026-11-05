// ข้อมูลอากาศของแม่ทะ
// getClimate() = ค่าเฉลี่ยหลายปีจากไฟล์ในเครื่อง ใช้คิดคะแนน (ใช้ได้แม้ไม่มีเน็ต)
// getToday()   = พยากรณ์วันนี้จาก Open-Meteo ใช้แสดงในหน้าแรกเท่านั้น ไม่มีผลกับคะแนน

const CLIMATE_URL = "data/climate-maetha.json";

// พิกัดอำเภอแม่ทะ (ไม่ใช่พิกัดบ้านของผู้ใช้)
const MAETHA_LATITUDE = 18.135;
const MAETHA_LONGITUDE = 99.513;

// เอกสาร: https://open-meteo.com/en/docs (ปลายทาง /v1/forecast)
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
  + `?latitude=${MAETHA_LATITUDE}&longitude=${MAETHA_LONGITUDE}`
  + "&current=temperature_2m"
  + "&daily=precipitation_probability_max"
  + "&timezone=Asia%2FBangkok&forecast_days=1";

// บอกผู้ใช้ว่าตัวเลขอากาศมาจากไหน (แสดงในหน้าผล)
const CLIMATE_NOTE = "ข้อมูลอากาศ: อุณหภูมิรายเดือนของแม่ทะจาก Open-Meteo (เฉลี่ย 2559–2568) "
  + "ส่วนฝนทั้งปีและอุณหภูมิทั้งปีใช้สถานีอุตุนิยมวิทยาลำปางแทน เพราะแม่ทะไม่มีสถานีวัด";

let loadedClimate; // undefined = ยังไม่โหลด, null = โหลดไม่ได้

// เลือกค่าที่สูตรคะแนนใช้ (ดูความหมายแต่ละช่องใน js/scoring.js)
function climateForScoring(file) {
  const station = file.station ?? {};
  return {
    monthlyTempC: file.monthlyTempC,
    annualMeanTempC: station.annualMeanTempC ?? null,
    coldestMonthMinTempC: station.coldestMonthMinTempC ?? null,
    rainMmYear: station.rainMmYear ?? null,
  };
}

function isValidClimateFile(file) {
  return file != null && Array.isArray(file.monthlyTempC) && file.monthlyTempC.length === 12;
}

// คืนข้อมูลอากาศ หรือ null ถ้าอ่านไฟล์ไม่ได้ (สูตรจะตัดปัจจัยอุณหภูมิและฝนออก)
async function getClimate(url = CLIMATE_URL) {
  if (loadedClimate !== undefined && url === CLIMATE_URL) return loadedClimate;
  const file = await fetchJson(url);
  const climate = isValidClimateFile(file) ? climateForScoring(file) : null;
  if (!climate) console.warn(`ข้อมูลอากาศ ${url} ใช้ไม่ได้ จะคิดคะแนนโดยไม่ใช้อุณหภูมิและฝน`);
  if (url === CLIMATE_URL) loadedClimate = climate;
  return climate;
}

// อ่านคำตอบของ Open-Meteo ให้เหลือ 2 ค่า ถ้าไม่มีค่าไหนเลยคืน null
function readForecast(json) {
  const tempC = json?.current?.temperature_2m ?? null;
  const rainChance = json?.daily?.precipitation_probability_max?.[0] ?? null;
  if (tempC === null && rainChance === null) return null;
  return { tempC, rainChance };
}

// คืน { tempC, rainChance } หรือ null ถ้าไม่มีเน็ต ช้าเกิน 8 วินาที หรือคำตอบผิดรูปแบบ
async function getToday(url = FORECAST_URL, timeoutMs = WEATHER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return readForecast(await response.json());
  } catch (err) {
    return null; // ไม่มีเน็ตเป็นเรื่องปกติ ไม่ต้องเตือนผู้ใช้
  } finally {
    clearTimeout(timer);
  }
}
