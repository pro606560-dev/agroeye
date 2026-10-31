// ค่าคงที่ของแอป

// จำนวนพืชที่ควรมีใน data/crops.json ถ้าเพิ่มพืช ให้ผู้ใช้เป็นคนแก้เลขนี้
const EXPECTED_CROP_COUNT = 12;

// น้ำหนักของแต่ละปัจจัย ยิ่งมากยิ่งมีผลต่อคะแนนรวมมาก (docs/SPEC.md หัวข้อ 4.2)
const SCORE_WEIGHTS = {
  ph: 3,             // ความเปรี้ยวของดิน
  texture: 3,        // ประเภทดิน (เหนียว/ร่วน/ทราย)
  drainage: 2,       // ฝนตกหนักแล้วน้ำขังไหม
  plantingMonths: 2, // เดือนที่จะปลูก
  tempC: 2,          // อุณหภูมิเฉลี่ยของเดือนที่จะปลูก
  rainMmYear: 2,     // ฝนรวมต่อปีของแม่ทะ
  light: 1,          // แดดจัดหรือร่มรำไร
};

// ความครอบคลุมตั้งแต่ 70% = มั่นใจสูง, ตั้งแต่ 40% = ปานกลาง, ต่ำกว่านั้น = ต่ำ
const CONFIDENCE_HIGH_MIN = 0.7;
const CONFIDENCE_MEDIUM_MIN = 0.4;

// พืชต้องมีปัจจัยที่ใช้ได้อย่างน้อยเท่านี้ จึงจะจัดอันดับ
const MIN_USED_FACTORS = 2;

// จำนวนพืชที่แนะนำ
const TOP_CROP_COUNT = 3;

// ช่วง pH ที่กรอกได้ และช่วงของแถบเลื่อน
const PH_INPUT_MIN = 0;
const PH_INPUT_MAX = 14;
const PH_SLIDER_MIN = 3;
const PH_SLIDER_MAX = 10;

// ใช้แสดงคำข้างตัวเลข pH เท่านั้น ไม่มีผลกับคะแนน
const PH_NORMAL_MIN = 6.6; // ต่ำกว่านี้ = ดินเปรี้ยว
const PH_NORMAL_MAX = 7.3; // สูงกว่านี้ = ดินเป็นด่าง
