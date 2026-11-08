// เทสต์รอบปลูกและตัวแปลงข้อมูลเก่า (task 19)
// tests/fixtures/plots-v1.json = แปลงที่แอปเวอร์ชัน 1.1 บันทึกจริง (2 แปลง แปลงหนึ่งตรวจ 2 ครั้ง)
// withCleanPlots อยู่ใน tests/plots.test.js (สำรองแปลงจริงของเครื่องไว้ แล้วคืนให้หลังเทสต์)

async function loadOldPlots() {
  const response = await fetch("tests/fixtures/plots-v1.json", { cache: "no-store" });
  return response.text();
}

function putOldPlots(text) {
  window.localStorage.setItem(STORAGE_PREFIX + PLOTS_KEY, text);
}

function plantingInput(fields) {
  return { cropId: "", otherName: "", plantedOn: "", harvestedOn: "", note: "", ...fields };
}

test("รอบปลูก: ข้อมูลเก่าจริง (เวอร์ชัน 1.1) ยังเปิดได้ครบ ไม่หาย และได้รอบปลูกว่าง", async () => {
  const text = await loadOldPlots();
  withCleanPlots(() => {
    putOldPlots(text);
    const list = loadSavedPlots();
    assertEqual(list.length, 2);
    const rice = list.find((record) => record.name === "นาบนหลังบ้าน");
    assertEqual(rice.top3[0], { id: "sugarcane", score: 100 });
    assertEqual(rice.earlier.length, 1);
    assertEqual(rice.earlier[0].plot.ph, 5.5);
    assertEqual(rice.answers.phText, "6");
    for (const record of list) {
      assertEqual(record.plantings, []);
      assertEqual(record.dataVersion, PLOTS_DATA_VERSION);
    }
  });
});

test("รอบปลูก: แปลงเก่าจริง เพิ่มรอบปลูกได้ แล้วอ่านกลับได้ ของเดิมยังอยู่", async () => {
  const text = await loadOldPlots();
  withCleanPlots(() => {
    putOldPlots(text);
    const id = "pmw7wnhqnywipe";
    const planting = makePlanting(plantingInput({ cropId: "rice-rd6", plantedOn: "2026-06-15", harvestedOn: "2026-10-30", note: " ได้ประมาณ 40 ถัง " }));
    assertTrue(addPlanting(id, planting));
    const record = findSavedPlot(id); // อ่านใหม่จาก localStorage เหมือนปิดแล้วเปิดแอปใหม่
    assertEqual(record.plantings.length, 1);
    assertEqual(record.plantings[0].cropId, "rice-rd6");
    assertEqual(record.plantings[0].note, "ได้ประมาณ 40 ถัง");
    assertEqual(record.earlier.length, 1);
    assertEqual(loadSavedPlots().length, 2);
  });
});

test("รอบปลูก: ตรวจแปลงเดิมซ้ำ รอบปลูกยังอยู่ และไม่ถูกย้ายไปอยู่ในรอบตรวจเก่า", () => withCleanPlots(() => {
  const id = saveRound(null, fakeRound("นาบน", ["rice-rd6"], "2026-11-01T08:00:00Z"));
  assertTrue(addPlanting(id, makePlanting(plantingInput({ cropId: "maize" }))));
  saveRound(id, fakeRound("นาบน", ["maize"], "2026-11-05T08:00:00Z"));
  const record = findSavedPlot(id);
  assertEqual(record.plantings.length, 1);
  assertEqual(record.earlier.length, 1);
  assertEqual(record.earlier[0].plantings, undefined);
}));

test("รอบปลูก: ตรวจคำตอบในฟอร์ม", () => {
  assertEqual(plantingErrors(plantingInput({})), ["เลือกพืชที่ปลูกก่อน"]);
  assertEqual(plantingErrors(plantingInput({ cropId: OTHER_CROP, otherName: "  " })), ["พิมพ์ชื่อพืชที่ปลูก"]);
  assertEqual(plantingErrors(plantingInput({ cropId: "maize", plantedOn: "2026-06-15", harvestedOn: "2026-06-01" })),
    ["วันเก็บเกี่ยวต้องอยู่หลังวันปลูก"]);
  assertEqual(plantingErrors(plantingInput({ cropId: "maize", note: "ก".repeat(PLANTING_NOTE_MAX + 1) })).length, 1);
  assertEqual(plantingErrors(plantingInput({ cropId: "maize" })), []); // ไม่ใส่วันที่ก็บันทึกได้
});

test("รอบปลูก: พืชอื่นเก็บชื่อที่พิมพ์ ช่องว่างเก็บเป็น null", () => {
  const planting = makePlanting(plantingInput({ cropId: OTHER_CROP, otherName: " ถั่วเหลือง " }));
  assertEqual(planting.cropId, null);
  assertEqual(planting.otherName, "ถั่วเหลือง");
  assertEqual(planting.plantedOn, null);
  assertEqual(planting.note, null);
});

test("รอบปลูก: ลบได้เฉพาะรอบนั้น และเรียงรอบที่ปลูกล่าสุดไว้บน", () => withCleanPlots(() => {
  const id = saveRound(null, fakeRound("ไร่", ["maize"], "2026-11-01T08:00:00Z"));
  const old = makePlanting(plantingInput({ cropId: "maize", plantedOn: "2025-05-01" }));
  const recent = makePlanting(plantingInput({ cropId: "cassava", plantedOn: "2026-05-01" }));
  const noDate = makePlanting(plantingInput({ cropId: "peanut" }));
  addPlanting(id, old);
  addPlanting(id, noDate);
  addPlanting(id, recent);
  assertEqual(sortedPlantings(findSavedPlot(id).plantings).map((item) => item.cropId), ["cassava", "maize", "peanut"]);
  assertTrue(deletePlanting(id, old.id));
  assertEqual(findSavedPlot(id).plantings.map((item) => item.cropId), ["cassava", "peanut"]);
}));

test("รอบปลูก: localStorage เขียนไม่ได้ บันทึกคืน false และไม่พัง / แปลงที่ไม่มีอยู่คืน false", () => withCleanPlots(() => {
  const id = saveRound(null, fakeRound("ก", ["a"], "2026-11-01T08:00:00Z"));
  withBrokenStorage(() => assertEqual(addPlanting(id, makePlanting(plantingInput({ cropId: "maize" }))), false));
  assertEqual(findSavedPlot(id).plantings, []);
  assertEqual(addPlanting("ไม่มีแปลงนี้", makePlanting(plantingInput({ cropId: "maize" }))), false);
}));

test("รอบปลูก: วันที่แบบไทย ไม่เพี้ยนเพราะเขตเวลา", () => {
  assertEqual(thaiDay("2026-06-15"), `15 ${MONTH_NAMES[5]} 2569`);
  assertEqual(thaiDay("2027-01-01"), `1 ${MONTH_NAMES[0]} 2570`);
});
