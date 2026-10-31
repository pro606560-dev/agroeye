// อ่าน/เขียนข้อมูลในเครื่อง ทุกการเรียกครอบ try/catch
// ถ้า localStorage ใช้ไม่ได้ (เช่น โหมดส่วนตัว หรือพื้นที่เต็ม) แอปยังทำงานต่อได้ แค่จำค่าไม่ได้

const STORAGE_PREFIX = "agroeye.";

// คืนค่าที่เก็บไว้ ถ้าไม่มีหรืออ่านไม่ได้ คืน fallback
function readStorage(key, fallback = null) {
  try {
    const text = window.localStorage.getItem(STORAGE_PREFIX + key);
    return text === null ? fallback : JSON.parse(text);
  } catch (err) {
    console.warn(`อ่านข้อมูล ${key} ไม่ได้`, err);
    return fallback;
  }
}

// คืน true ถ้าบันทึกสำเร็จ
function writeStorage(key, value) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`บันทึกข้อมูล ${key} ไม่ได้`, err);
    return false;
  }
}

// คืน true ถ้าลบสำเร็จ
function removeStorage(key) {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (err) {
    console.warn(`ลบข้อมูล ${key} ไม่ได้`, err);
    return false;
  }
}
