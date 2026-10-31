// เทสต์ตรรกะหน้าผลลัพธ์

function fakeFactor(key, factorScore, weight = 2) {
  return { key, factorScore, weight, used: factorScore !== null, plotValue: null, cropRange: null };
}

test("ดาว: คะแนน ÷ 20 ปัดครึ่งดาว", () => {
  assertEqual(starCount(100), 5);
  assertEqual(starCount(85), 4.5);
  assertEqual(starCount(73), 3.5);
  assertEqual(starCount(70), 3.5);
  assertEqual(starCount(50), 2.5);
});

test("ดาว: คะแนนน้อยมากยังแสดง 1 ดาว", () => {
  assertEqual(starCount(5), 1);
});

test("พืชคะแนน 0 ไม่ถูกแนะนำ แต่ย้ายไปอยู่พืชอื่น ๆ", () => {
  const ranking = {
    top: [{ score: 40, coverage: 1 }, { score: 0, coverage: 1 }],
    others: [{ score: 0, coverage: 0.5 }],
    notEnoughData: [],
  };
  const { recommended, others } = splitRecommendations(ranking);
  assertEqual(recommended.length, 1);
  assertEqual(others.length, 2);
});

test("ไม่มีพืชเข้าเกณฑ์ ได้รายการแนะนำว่าง", () => {
  const { recommended } = splitRecommendations({ top: [], others: [], notEnoughData: [] });
  assertEqual(recommended.length, 0);
});

test("เหตุผลไม่เกิน 3 บรรทัด และเรื่องที่ต้องระวังไม่ถูกซ่อน", async () => {
  const crops = await loadCrops();
  const crop = crops.find((c) => c.id === "cassava");
  const plot = { ph: 6, texture: "light", drainage: "poor", month: 5, light: null };
  const picked = pickReasons(scoreCrop(plot, crop, null), crop);
  assertTrue(picked.length >= 2 && picked.length <= 3);
  assertTrue(picked.some((reason) => !reason.good));
  assertTrue(picked.some((reason) => reason.text.includes("น้ำขัง")));
});

test("เหตุผลที่ดีขึ้นก่อนเรื่องที่ต้องระวัง", () => {
  const crop = { nameTh: "ทดสอบ" };
  const result = { factors: [
    { ...fakeFactor("light", 0, 1), plotValue: "shade" },
    { ...fakeFactor("drainage", 1), plotValue: "good", cropRange: "good" },
  ] };
  const picked = pickReasons(result, crop);
  assertEqual(picked.map((reason) => reason.good), [true, false]);
});

test("ข้อมูลน้อย: ความมั่นใจต่ำ และมีคำแนะนำให้กรอกเพิ่ม", async () => {
  const crops = await loadCrops();
  const plot = { ph: null, texture: "medium", drainage: null, month: 5, light: null };
  const { top } = rankCrops(plot, crops, null);
  assertEqual(top[0].confidence, "low");
  assertTrue(moreDataHints(plot).some((hint) => hint.includes("pH")));
});

test("กรอกครบแล้วไม่มีคำแนะนำให้กรอกเพิ่ม", () => {
  const plot = { ph: 6, texture: "medium", drainage: "good", month: 5, light: "full-sun" };
  assertEqual(moreDataHints(plot), []);
});

test("คำแนะนำเรียงจากเรื่องที่มีผลมากก่อน", () => {
  const hints = moreDataHints({ ph: null, texture: "medium", drainage: null, month: 5, light: null });
  assertEqual(hints.length, 3);
  assertTrue(hints[0].includes("pH"));
});

test("แสดงว่ายังไม่มีข้อมูลด้วยคำง่าย ไม่ใช้คำว่า pH ลอย ๆ", () => {
  const text = missingDataText({ factors: [fakeFactor("ph", null), fakeFactor("drainage", null)] });
  assertEqual(text, "ยังไม่มีข้อมูล: ความเปรี้ยวของดิน (pH), น้ำขัง");
});

test("ชื่อแปลงที่มีเครื่องหมาย HTML ถูกแปลงก่อนแสดง", () => {
  assertEqual(escapeHtml("<b>แปลง"), "&lt;b&gt;แปลง");
});
