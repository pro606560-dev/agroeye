// เทสต์รูปผลลัพธ์ (task 19): ข้อความในรูปครบ และไม่มีพิกัดหรือรหัสจุดสำรวจหลุดออกไป

async function sampleRecommended(plot) {
  const crops = await loadCrops();
  const { recommended } = splitRecommendations(rankCrops(plot, crops, null));
  return { crops, recommended };
}

const EXPORT_PLOT = {
  name: "นาบนหลังบ้าน", surveyPointId: "point-A", ph: 6, texture: "heavy", textureConfidence: null,
  drainage: "poor", month: 6, light: "full-sun", moisture: null, nitrogen: null, phosphorus: null, potassium: null,
  // ใส่พิกัดปลอมไว้ เพื่อตรวจว่าโค้ดไม่หยิบไปใส่ในรูป แม้วันหลังจะมีพิกัดในข้อมูลแปลง
  lat: 18.12345, lon: 99.56789,
};

test("รูปผล: มีชื่อแปลง วันที่ พืช 3 อันดับ เหตุผล และข้อความเตือน", async () => {
  const { crops, recommended } = await sampleRecommended(EXPORT_PLOT);
  const lines = resultImageLines(EXPORT_PLOT, recommended, crops, new Date(2026, 10, 8, 10));
  const texts = lines.map((line) => line.text);
  assertTrue(texts.includes("แปลง: นาบนหลังบ้าน"));
  assertTrue(texts.includes(`วันที่ตรวจ: 8 ${MONTH_NAMES[10]} 2569`));
  const cropLines = lines.filter((line) => line.kind === "crop");
  assertEqual(cropLines.length, 3);
  const first = cropById(crops, recommended[0].cropId);
  assertEqual(cropLines[0].text, `อันดับ 1 ${first.nameTh}`);
  const scoreLine = lines[lines.indexOf(cropLines[0]) + 1];
  assertTrue(scoreLine.text.startsWith(`${recommended[0].score} คะแนน จาก 100`));
  assertTrue(lines.some((line) => line.kind === "body" && line.text.startsWith("✓")));
  assertTrue(texts.includes("ผลจากสูตรคะแนนของ AgroEye ใช้ประกอบการตัดสินใจเท่านั้น"));
});

test("รูปผล: ไม่มีพิกัด ไม่มีรหัสจุดสำรวจ", async () => {
  const { crops, recommended } = await sampleRecommended(EXPORT_PLOT);
  const all = resultImageLines(EXPORT_PLOT, recommended, crops).map((line) => line.text).join("\n");
  assertEqual(all.includes("18.12"), false);
  assertEqual(all.includes("99.56"), false);
  assertEqual(all.includes("point-A"), false);
});

test("รูปผล: แปลงไม่มีชื่อ และกรณีแนะนำพืชไม่ได้", async () => {
  const plot = { ...EXPORT_PLOT, name: null };
  const { crops } = await sampleRecommended(plot);
  const texts = resultImageLines(plot, [], crops).map((line) => line.text);
  assertTrue(texts.includes(`แปลง: ${UNNAMED_PLOT}`));
  assertTrue(texts.includes("ยังแนะนำพืชให้แปลงนี้ไม่ได้"));
});

test("รูปผล: ตัดข้อความยาวเป็นหลายบรรทัด ไม่มีบรรทัดไหนล้นความกว้าง และไม่มีตัวอักษรหาย", () => {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = fontOf(RESULT_IMAGE_STYLES.body);
  const text = "คำแนะนำนี้คำนวณจากข้อมูลทั่วไป ควรปรึกษาเกษตรอำเภอก่อนลงทุน และดูแลแปลงตามคำแนะนำของเจ้าหน้าที่";
  const rows = wrapText(ctx, text, 200);
  assertTrue(rows.length > 1);
  for (const row of rows) assertTrue(ctx.measureText(row).width <= 200);
  assertEqual(rows.join("").replace(/\s/g, ""), text.replace(/\s/g, ""));
});

test("รูปผล: วาดลง canvas ได้ กว้างเท่าที่ตั้งไว้ (คมขึ้น 2 เท่า) และชื่อไฟล์เป็นตัวอังกฤษ", async () => {
  const { crops, recommended } = await sampleRecommended(EXPORT_PLOT);
  const canvas = resultLinesToCanvas(resultImageLines(EXPORT_PLOT, recommended, crops));
  assertEqual(canvas.width, RESULT_IMAGE_WIDTH * 2);
  assertTrue(canvas.height > 400);
  assertEqual(resultImageFileName(new Date(2026, 10, 8)), "agroeye-result-2026-11-08.png");
});
