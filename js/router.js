// จับคู่ hash ใน URL กับหน้าจอ แยกจาก app.js เพื่อให้ tests.html ทดสอบได้โดยไม่ต้องเริ่มแอป

// title คือชื่อบนแถบหัว, hasParam = true คือหน้าที่มีค่าต่อท้าย เช่น #/crop/cassava
const ROUTES = {
  home: { title: "AgroEye" },
  input: { title: "ตรวจแปลงใหม่" },
  result: { title: "ผลการตรวจ" },
  crop: { title: "รายละเอียดพืช", hasParam: true },
  plots: { title: "แปลงของฉัน" },
  calendar: { title: "ปฏิทินปลูก" },
  proof: { title: "พิสูจน์สมมติฐาน" },
  settings: { title: "ตั้งค่า" },
};

// คืน { name, param } ถ้ารู้จัก hash นี้ ถ้าไม่รู้จักคืน null
function matchRoute(hash) {
  const [first, name, param, ...extra] = hash.split("/");
  const route = ROUTES[name];
  if (first !== "#" || !Object.hasOwn(ROUTES, name) || extra.length > 0) return null;
  if (route.hasParam) return param ? { name, param: decodeParam(param) } : null;
  return param === undefined ? { name, param: null } : null;
}

// ค่าใน URL อาจเข้ารหัสผิดรูป ถ้าถอดไม่ได้ให้ใช้ค่าเดิม ไม่ให้แอปพัง
function decodeParam(text) {
  try {
    return decodeURIComponent(text);
  } catch (err) {
    return text;
  }
}
