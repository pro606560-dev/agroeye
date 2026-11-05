// เทสต์ทดสอบเนื้อดิน 3 วิธี (js/soil-test.js)

// draft ที่ตอบเฉพาะค่าที่ส่งมา ค่าอื่นยังไม่ได้ทดสอบ
function soilDraft(answers = {}) {
  return { ...createDraft(5), ...answers };
}

test("ปั้นเส้น: แปลงคำตอบเป็นเนื้อดิน", () => {
  assertEqual(ballTexture("crumble"), "light");
  assertEqual(ballTexture("long"), "heavy");
  assertEqual(ballTexture("short-gritty"), "light");
  assertEqual(ballTexture("middle"), "medium");
  assertEqual(ballTexture(null), null);
});

test("ขวดน้ำ: ทราย 2/3 ขึ้นไป = ทราย, ไม่เกิน 1/3 และน้ำขุ่น = เหนียว, นอกนั้น = ร่วน", () => {
  assertEqual(bottleTexture("6", "9", "no"), "light");
  assertEqual(bottleTexture("3", "9", "yes"), "heavy");
  assertEqual(bottleTexture("3", "9", "no"), "medium", "น้ำใสแล้วไม่นับเป็นเหนียว");
  assertEqual(bottleTexture("4", "9", "yes"), "medium");
  assertEqual(bottleTexture("", "9", "yes"), null);
  assertEqual(bottleTexture("10", "9", "yes"), null, "ทรายสูงกว่าทั้งหมดไม่ได้");
});

test("ขวดน้ำ: กรอกช่องเดียว หรือค่าเป็นไปไม่ได้ ต้องเตือน ว่างทั้งคู่ผ่าน", () => {
  assertEqual(bottleError(soilDraft()), null);
  assertTrue(bottleError(soilDraft({ bottleSandText: "3" })) !== null);
  assertTrue(bottleError(soilDraft({ bottleSandText: "10", bottleTotalText: "9" })) !== null);
  assertEqual(bottleError(soilDraft({ bottleSandText: "3", bottleTotalText: "9" })), null);
});

test("คำถามประสบการณ์: ใช่ 2 ข้อของดินเหนียว = เหนียว, แห้งเร็ว = ทราย, นอกนั้น = ร่วน", () => {
  assertEqual(feelTexture(soilDraft({ feelSticky: "yes", feelPonding: "yes" })), "heavy");
  assertEqual(feelTexture(soilDraft({ feelSticky: "yes", feelSandy: "yes" })), "light");
  assertEqual(feelTexture(soilDraft({ feelSticky: "yes", feelSandy: "no" })), "medium");
  assertEqual(feelTexture(soilDraft()), null, "ไม่ได้ตอบเลย = ยังไม่ได้ทดสอบ");
});

test("รวมผล: ตรงกัน 2 ใน 3 วิธีใช้ผลนั้น ตรงกันวิธีเดียวหรือไม่ตรงกันได้ null", () => {
  assertEqual(agreedTexture(["heavy", null, "heavy"]), "heavy");
  assertEqual(agreedTexture(["light", "light", "heavy"]), "light");
  assertEqual(agreedTexture(["heavy", "medium", "light"]), null);
  assertEqual(agreedTexture(["heavy", null, null]), null);
});

test("ความมั่นใจเรื่องดิน: เลือกตรงผลที่ตรงกัน = ค่อนข้างมั่นใจ, นอกนั้น = ไม่แน่ใจ ไม่ตัดคะแนน", async () => {
  const sure = soilDraft({ ballAnswer: "long", feelSticky: "yes", feelCracks: "yes", texture: "heavy" });
  assertEqual(textureConfidence(sure), "fairly-sure");
  assertEqual(textureConfidence({ ...sure, texture: "medium" }), "unsure");
  assertEqual(textureConfidence(soilDraft({ ballAnswer: "long", texture: "heavy" })), "unsure");
  const plot = buildPlot({ ...sure, texture: "medium", drainage: "good" });
  assertEqual(plot.textureConfidence, "unsure");
  const crops = await loadCrops();
  const cassava = crops.find((crop) => crop.id === "cassava");
  const sureScore = scoreCrop(buildPlot({ ...sure, texture: "medium", drainage: "good" }), cassava, null).score;
  const plainScore = scoreCrop({ ...plot, textureConfidence: null }, cassava, null).score;
  assertEqual(sureScore, plainScore, "ความมั่นใจต้องไม่เปลี่ยนคะแนน");
});

test("ค่าดินจากจุดสำรวจนับเป็นค่าที่วัดจริง", () => {
  const draft = createDraft(5);
  applySurveyPoint(draft, { id: "p", name: "แปลง ทดสอบ", texture: "heavy", ph: null, drainage: null });
  assertEqual(textureConfidence(draft), "survey");
});
