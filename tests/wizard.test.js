// เทสต์ตรรกะหน้ากรอกข้อมูล

const POINT_A = { id: "point-A", name: "แปลง A", texture: "heavy", ph: 4, drainage: null };

test("แปลงใหม่ต้องถามครบ 9 ขั้น รวมทดสอบดิน 3 วิธี", () => {
  assertEqual(activeSteps(createDraft(5)), WIZARD_STEPS);
});

test("เลือกแปลง A แล้วเติมดินและ pH ให้ และข้าม 2 ขั้นนั้น", () => {
  const draft = createDraft(5);
  applySurveyPoint(draft, POINT_A);
  assertEqual(draft.texture, "heavy");
  assertEqual(draft.phText, "4");
  assertEqual(activeSteps(draft), ["name", "water", "month", "extra"], "ข้ามขั้นทดสอบดินทั้ง 3 วิธีด้วย");
});

test("ค่าที่จุดสำรวจเป็น null ยังต้องถาม ไม่เดาเติม", () => {
  const draft = createDraft(5);
  applySurveyPoint(draft, POINT_A);
  assertEqual(draft.drainage, null);
  assertEqual(nextStep(draft, "name"), "water");
});

test("เปลี่ยนจากจุดสำรวจเป็นแปลงใหม่ ค่าที่เติมไว้หายและกลับมาถาม", () => {
  const draft = createDraft(5);
  applySurveyPoint(draft, POINT_A);
  draft.drainage = "good";
  clearSurveyPoint(draft);
  assertEqual(draft.texture, null);
  assertEqual(draft.phText, "");
  assertEqual(draft.drainage, "good");
  assertEqual(activeSteps(draft), WIZARD_STEPS);
});

test("ขั้นสุดท้ายไม่มีขั้นถัดไป", () => {
  assertEqual(nextStep(createDraft(5), "extra"), null);
});

test("แปลงตัวเลขได้ทั้งจุดและจุลภาค ค่าที่ไม่ใช่ตัวเลขได้ null", () => {
  assertEqual(parseDecimal("5.6"), 5.6);
  assertEqual(parseDecimal(" 5,6 "), 5.6);
  assertEqual(parseDecimal("7"), 7);
  ["", "  ", "abc", "5.6.1", "-1", "1e3", null].forEach((text) => assertEqual(parseDecimal(text), null));
});

test("ตรวจ pH: ว่าง นอกช่วง และค่าที่ใช้ได้", () => {
  assertTrue(phError("") !== null);
  assertTrue(phError("15") !== null);
  assertTrue(phError("abc") !== null);
  assertEqual(phError("0"), null);
  assertEqual(phError("14"), null);
  assertEqual(phError("5.6"), null);
});

test("ตรวจค่าเพิ่มเติม: ว่างผ่าน ค่าผิดไม่ผ่าน", () => {
  const draft = createDraft(5);
  assertEqual(extraError(draft), null);
  draft.moistureText = "101";
  assertTrue(extraError(draft) !== null);
  draft.moistureText = "40";
  draft.potassiumText = "มาก";
  assertTrue(extraError(draft) !== null);
  draft.potassiumText = "12";
  assertEqual(extraError(draft), null);
});

test("คำข้างตัวเลข pH แบ่ง 4 ช่วงตรงขอบ", () => {
  assertEqual(phWord(4), "ดินเปรี้ยวมาก");
  assertEqual(phWord(5.5), "ดินเปรี้ยวมาก");
  assertEqual(phWord(5.6), "ดินเปรี้ยว");
  assertEqual(phWord(6.5), "ดินเปรี้ยว");
  assertEqual(phWord(6.6), "ปกติ");
  assertEqual(phWord(7.3), "ปกติ");
  assertEqual(phWord(7.4), "ดินเป็นด่าง");
  assertTrue(!["4", "5.5", "6", "7", "8"].some((ph) => phWord(Number(ph)).includes("เปรี้ยวจัด")), "ห้ามใช้คำว่าดินเปรี้ยวจัด");
});

test("ไม่ทราบทุกข้อได้ค่า null เหลือแค่ดิน 1 ปัจจัย จึงเข้ากลุ่มข้อมูลไม่พอ ไม่พัง", async () => {
  const draft = createDraft(5);
  draft.texture = "medium";
  draft.drainage = ANSWER_UNKNOWN;
  draft.month = null;
  const plot = buildPlot(draft);
  assertEqual(plot.ph, null);
  assertEqual(plot.drainage, null);
  assertEqual(plot.month, null);
  assertEqual(plot.name, null);
  const crops = await loadCrops();
  const result = rankCrops(plot, crops, null);
  assertEqual(result.top.length, 0);
  assertEqual(result.notEnoughData.length, crops.length);
});

test("ข้อมูลแปลงจาก draft มีช่องครบตามที่สูตรคะแนนต้องการ", () => {
  const draft = createDraft(11);
  draft.nameText = "  แปลงหลังบ้าน ";
  draft.texture = "light";
  draft.phText = "6,5";
  draft.drainage = "good";
  draft.light = "shade";
  draft.moistureText = "30";
  const plot = buildPlot(draft);
  assertEqual(plot.name, "แปลงหลังบ้าน");
  assertEqual(plot.ph, 6.5);
  assertEqual(plot.month, 11);
  assertEqual(plot.light, "shade");
  assertEqual(plot.moisture, 30);
  assertEqual(plot.nitrogen, null);
});

test("hash ของแต่ละขั้นในหน้ากรอกข้อมูลจับคู่ได้", () => {
  assertEqual(matchRoute("#/input/ph"), { name: "input", param: "ph" });
  assertEqual(matchRoute("#/input/ph/x"), null);
});
