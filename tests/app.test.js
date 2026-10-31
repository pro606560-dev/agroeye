// เทสต์การจับคู่หน้าและการเก็บข้อมูลในเครื่อง

test("hash ที่รู้จักทุกหน้าจับคู่ได้", () => {
  ["home", "input", "result", "plots", "calendar", "proof", "settings"].forEach((name) => {
    assertEqual(matchRoute(`#/${name}`), { name, param: null });
  });
});

test("หน้ารายละเอียดพืชได้รหัสพืช", () => {
  assertEqual(matchRoute("#/crop/cassava"), { name: "crop", param: "cassava" });
});

test("hash ที่ไม่รู้จักคืน null", () => {
  ["", "#", "#/", "#/nothing", "home", "#/crop", "#/crop/", "#/home/x", "#/crop/a/b", "#/constructor", "#/__proto__"]
    .forEach((hash) => assertEqual(matchRoute(hash), null, `hash "${hash}"`));
});

test("รหัสใน URL ที่เข้ารหัสผิดรูปไม่ทำให้พัง", () => {
  assertEqual(matchRoute("#/crop/%E0%A4%A"), { name: "crop", param: "%E0%A4%A" });
});

test("เขียนแล้วอ่านค่าเดิมได้ และลบได้", () => {
  assertTrue(writeStorage("test-key", { a: 1 }));
  assertEqual(readStorage("test-key"), { a: 1 });
  assertTrue(removeStorage("test-key"));
  assertEqual(readStorage("test-key", "ไม่มี"), "ไม่มี");
});

test("ข้อมูลในเครื่องเสียคืนค่าสำรอง", () => {
  window.localStorage.setItem(STORAGE_PREFIX + "test-key", "{เสีย");
  assertEqual(readStorage("test-key", "สำรอง"), "สำรอง");
  removeStorage("test-key");
});

test("ปิด localStorage แล้วไม่พัง", () => {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() { throw new Error("ปิดอยู่"); },
  });
  try {
    assertEqual(readStorage("test-key", "สำรอง"), "สำรอง");
    assertEqual(writeStorage("test-key", 1), false);
    assertEqual(removeStorage("test-key"), false);
  } finally {
    Object.defineProperty(window, "localStorage", original);
  }
});
