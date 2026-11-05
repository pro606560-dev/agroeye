// ตรรกะของหน้าปฏิทินปลูก (task 12) แยกจากหน้าจอเพื่อให้ tests.html ทดสอบได้
// อ่านเดือนปลูกจาก crops.json เท่านั้น ห้ามเติมเดือนเอง

// ชื่อเดือนเต็ม ใช้เป็นหัวข้อของแต่ละเดือน (ชื่อย่ออยู่ใน MONTH_NAMES ใน js/reasons.js)
const MONTH_FULL_NAMES = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function plantingMonthsOf(crop) {
  const months = crop.plantingMonths?.months;
  return Array.isArray(months) ? months : null;
}

// คืน 12 ช่อง ช่องที่ 0 = ม.ค. แต่ละช่องคือ { month, crops } โดย crops เรียงตามลำดับใน crops.json
function cropsByMonth(crops) {
  return MONTH_FULL_NAMES.map((name, index) => {
    const month = index + 1;
    const list = crops.filter((crop) => plantingMonthsOf(crop)?.includes(month));
    return { month, crops: list };
  });
}

// พืชที่ยังไม่มีแหล่งข้อมูลเดือนปลูก (months เป็น null)
function cropsWithoutMonths(crops) {
  return crops.filter((crop) => plantingMonthsOf(crop) === null);
}

// อ่านค่าอากาศรายเดือนจากไฟล์ climate-maetha.json ถ้าไม่มีค่าคืน null
// ฝนรายเดือนมีแต่ของ Open-Meteo (สถานีลำปางมีแค่ทั้งปี) จึงใช้แสดงเท่านั้น ไม่ได้ใช้คิดคะแนน
function monthClimate(file, month) {
  const temp = file?.monthlyTempC?.[month - 1];
  const rain = file?.monthlyRainMm?.[month - 1];
  return {
    tempC: typeof temp === "number" ? temp : null,
    rainMm: typeof rain === "number" ? rain : null,
  };
}

// ฝนเดือนที่มากที่สุด ใช้กำหนดความยาวแถบฝน
function maxMonthlyRain(file) {
  const list = (file?.monthlyRainMm ?? []).filter((value) => typeof value === "number");
  return list.length > 0 ? Math.max(...list) : null;
}
