// ค่าที่ผู้ใช้ตั้งในหน้าตั้งค่า (task 16): ขนาดตัวอักษร และเปิด/ปิดเสียงอ่าน
// เก็บใน localStorage ของเครื่องนี้ ถ้าอ่านไม่ได้ใช้ค่าเริ่มต้น

const TEXT_SIZE_KEY = "text-size";
const SOUND_ON_KEY = "sound-on";

// คืน "normal" / "large" / "xlarge" ถ้าค่าที่เก็บไว้ไม่รู้จัก คืน "normal"
function textSizeChoice() {
  const choice = readStorage(TEXT_SIZE_KEY, "normal");
  return Object.hasOwn(TEXT_SIZE_CLASSES, choice) ? choice : "normal";
}

// ใส่คลาสให้ <html> ทุกหน้าใช้ขนาดตาม rem จึงเปลี่ยนตามกันทั้งแอป
function applyTextSize(choice = textSizeChoice()) {
  const root = document.documentElement;
  Object.values(TEXT_SIZE_CLASSES).filter(Boolean).forEach((name) => root.classList.remove(name));
  if (TEXT_SIZE_CLASSES[choice]) root.classList.add(TEXT_SIZE_CLASSES[choice]);
}

function saveTextSizeChoice(choice) {
  if (!Object.hasOwn(TEXT_SIZE_CLASSES, choice)) return;
  writeStorage(TEXT_SIZE_KEY, choice);
  applyTextSize(choice);
}

// เสียงอ่านเปิดไว้เป็นค่าเริ่มต้น
function soundOn() {
  return readStorage(SOUND_ON_KEY, true) !== false;
}

function saveSoundOn(isOn) {
  writeStorage(SOUND_ON_KEY, Boolean(isOn));
}
