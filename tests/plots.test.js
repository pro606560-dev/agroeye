// เทสต์การเก็บแปลง (task 11)
// tests.html ใช้ localStorage ร่วมกับแอป จึงสำรองแปลงจริงไว้ก่อน แล้วคืนค่าหลังทุกข้อ

function withCleanPlots(fn) {
  const fullKey = STORAGE_PREFIX + PLOTS_KEY;
  const backup = window.localStorage.getItem(fullKey);
  window.localStorage.removeItem(fullKey);
  try {
    fn();
  } finally {
    if (backup === null) window.localStorage.removeItem(fullKey);
    else window.localStorage.setItem(fullKey, backup);
  }
}

// ทำให้ localStorage เขียนไม่ได้ชั่วคราว เหมือนโหมดไม่ระบุตัวตนหรือพื้นที่เต็ม
function withBrokenStorage(fn) {
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = () => { throw new Error("QuotaExceededError"); };
  try {
    fn();
  } finally {
    Storage.prototype.setItem = original;
  }
}

function fakeRound(name, cropIds, date) {
  const recommended = cropIds.map((id, index) => ({ cropId: id, score: 90 - index * 10 }));
  const plot = { name, ph: 6, texture: "medium" };
  return makeRound(plot, { nameText: name ?? "" }, recommended, true, new Date(date));
}

test("แปลง: บันทึก 3 แปลง อ่านกลับได้ครบ เรียงจากล่าสุด", () => withCleanPlots(() => {
  assertTrue(saveRound(null, fakeRound("นาบน", ["rice-rd6"], "2026-11-01T08:00:00Z")));
  assertTrue(saveRound(null, fakeRound("ไร่ข้าวโพด", ["maize"], "2026-11-03T08:00:00Z")));
  assertTrue(saveRound(null, fakeRound(null, ["cassava"], "2026-11-02T08:00:00Z")));
  const names = loadSavedPlots().map((record) => record.name);
  assertEqual(names, ["ไร่ข้าวโพด", null, "นาบน"]);
}));

test("แปลง: เก็บ top3 เป็นรหัสพืชกับคะแนน ไม่เกิน 3 อันดับ และเก็บเวอร์ชันแอป", () => withCleanPlots(() => {
  const id = saveRound(null, fakeRound("ก", ["a", "b", "c", "d"], "2026-11-01T08:00:00Z"));
  const record = findSavedPlot(id);
  assertEqual(record.top3, [{ id: "a", score: 90 }, { id: "b", score: 80 }, { id: "c", score: 70 }]);
  assertEqual(record.appVersion, APP_VERSION);
  assertEqual(record.usedClimate, true);
}));

test("แปลง: ตรวจแปลงเดิมซ้ำ เก็บเป็นรอบใหม่ รอบเดิมย้ายไป earlier", () => withCleanPlots(() => {
  const id = saveRound(null, fakeRound("นาบน", ["rice-rd6"], "2026-11-01T08:00:00Z"));
  assertEqual(saveRound(id, fakeRound("นาบน", ["maize"], "2026-11-05T08:00:00Z")), id);
  const list = loadSavedPlots();
  assertEqual(list.length, 1);
  assertEqual(list[0].top3[0].id, "maize");
  assertEqual(list[0].earlier.length, 1);
  assertEqual(list[0].earlier[0].top3[0].id, "rice-rd6");
}));

test("แปลง: ลบแล้วหายเฉพาะแปลงนั้น", () => withCleanPlots(() => {
  const keep = saveRound(null, fakeRound("เก็บ", ["a"], "2026-11-01T08:00:00Z"));
  const remove = saveRound(null, fakeRound("ลบ", ["b"], "2026-11-02T08:00:00Z"));
  assertTrue(deleteSavedPlot(remove));
  assertEqual(loadSavedPlots().map((record) => record.id), [keep]);
  assertEqual(findSavedPlot(remove), null);
}));

test("แปลง: localStorage เขียนไม่ได้ บันทึกคืน null และไม่พัง", () => withCleanPlots(() => {
  withBrokenStorage(() => {
    assertEqual(saveRound(null, fakeRound("ก", ["a"], "2026-11-01T08:00:00Z")), null);
    assertEqual(canUseStorage(), false);
    assertEqual(loadSavedPlots(), []);
  });
  assertEqual(canUseStorage(), true);
}));

test("แปลง: ข้อมูลในเครื่องเสียหรือไม่ใช่รายการ คืนรายการว่าง", () => withCleanPlots(() => {
  window.localStorage.setItem(STORAGE_PREFIX + PLOTS_KEY, "{เสีย");
  assertEqual(loadSavedPlots(), []);
  window.localStorage.setItem(STORAGE_PREFIX + PLOTS_KEY, JSON.stringify({ a: 1 }));
  assertEqual(loadSavedPlots(), []);
}));

test("วันที่แบบไทย พ.ศ.", () => {
  assertEqual(thaiDate(new Date(2026, 10, 5, 10).toISOString()), "5 พ.ย. 2569");
  assertEqual(thaiDate(new Date(2027, 3, 8, 10).toISOString()), "8 เม.ย. 2570");
});

test("เทียบผลทีละอันดับ บอกได้ว่าอันดับไหนเปลี่ยน", () => {
  const rows = compareTop3([{ id: "a", score: 90 }, { id: "b", score: 80 }], [{ id: "a", score: 95 }, { id: "c", score: 70 }, { id: "d", score: 60 }]);
  assertEqual(rows.map((row) => row.same), [true, false, false]);
  assertEqual(rows[2].before, null);
});

test("หน้าแปลงของฉัน: #/plots และ #/plots/<รหัส> จับคู่ได้", () => {
  assertEqual(matchRoute("#/plots/p123"), { name: "plots", param: "p123" });
  assertEqual(matchRoute("#/plots/p1/x"), null);
});
