// เทสต์ตรรกะหน้ารายละเอียดพืช

test("อ่านรหัสแหล่งที่มีหลายตัวในช่องเดียว", () => {
  assertEqual(sourceCodesOf("DOA-CASSAVA-2563 (optimal), ECOCROP-CASSAVA (tolerable)"),
    ["DOA-CASSAVA-2563", "ECOCROP-CASSAVA"]);
  assertEqual(sourceCodesOf(null), []);
});

test("แหล่งเดียวกันได้เลขเดียวกัน", () => {
  const citations = createCitations();
  assertEqual(citations.cite("LDD-GINGER"), "ที่มา: แหล่ง 1");
  assertEqual(citations.cite("LDD-HUASUEA-2567, LDD-GINGER"), "ที่มา: แหล่ง 2, 1");
  assertEqual(citations.codes, ["LDD-GINGER", "LDD-HUASUEA-2567"]);
});

test("ทุกรหัสแหล่งใน crops.json มีชื่อใน SOURCES.md", async () => {
  const [crops, sources] = await Promise.all([loadCrops(), loadSourceNames()]);
  const fields = (crop) => [crop.plantingMonths, crop.cycleDays, crop.localEvidence, ...crop.care, ...crop.risks,
    crop.ph, crop.texture, crop.drainage, crop.tempC, crop.rainMmYear, crop.light];
  crops.flatMap(fields).flatMap((field) => sourceCodesOf(field.source))
    .forEach((code) => assertTrue(sources.has(code), `ไม่พบ ${code}`));
});

test("ชื่อแหล่งมีครบทุกรหัส และแยกลิงก์ออกมาได้", async () => {
  const markdown = await (await fetch(SOURCES_URL)).text();
  const names = parseSourceNames(markdown);
  assertEqual([...names.keys()], [...parseSourceCodes(markdown)]);
  assertEqual(names.get("OPEN-METEO").url, "https://open-meteo.com/");
  assertEqual(names.get("SURVEY-TEAM").url, null);
});

test("note ที่ไม่มีแหล่งจะไม่ถูกแสดง", async () => {
  const crops = await loadCrops();
  const rubber = crops.find((crop) => crop.id === "rubber");
  assertEqual(sourcedNote(rubber.cycleDays), null);
  const ginger = crops.find((crop) => crop.id === "ginger");
  assertTrue(sourcedNote(ginger.cycleDays).includes("ขิงอ่อน"));
});

test("ข้อความช่วงตัวเลข", () => {
  assertEqual(rangeText([5, 6.5]), "5–6.5");
  assertEqual(rangeText([1500, null]), "1500 ขึ้นไป");
});

test("ตารางคะแนนมีครบ 7 ปัจจัย และบอกผลเป็นคำ", async () => {
  const crops = await loadCrops();
  const crop = crops.find((c) => c.id === "cassava");
  const plot = { ph: 4.5, texture: "heavy", drainage: "poor", month: 5, light: null };
  const rows = factorRows(scoreCrop(plot, crop, null));
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));
  assertEqual(rows.length, 7);
  assertEqual(byKey.ph.verdict, "พอได้");
  assertEqual(byKey.ph.needText, "pH 5–6.5, ทนได้ pH 4–9");
  assertEqual(byKey.drainage.verdict, "ไม่ผ่าน");
  assertEqual(byKey.drainage.plotText, "น้ำขัง");
  assertEqual(byKey.plantingMonths.verdict, "ผ่าน");
  assertEqual(byKey.light.plotText, "ยังไม่มีข้อมูล");
  assertEqual(byKey.light.verdict, "ยังไม่มีข้อมูล");
});

test("พืชทุกชนิดสร้างตารางคะแนนได้ แม้ข้อมูลไม่ครบ", async () => {
  const crops = await loadCrops();
  const plot = { ph: 6, texture: "medium", drainage: "good", month: 5, light: "shade" };
  const climate = { monthlyTempC: Array(12).fill(28), rainMmYear: 1100 };
  crops.forEach((crop) => {
    factorRows(scoreCrop(plot, crop, climate)).forEach((row) => {
      assertTrue(row.plotText && row.needText && row.verdict, `${crop.id} ${row.key}`);
      assertTrue(!JSON.stringify(row).includes("undefined"), `${crop.id} ${row.key}`);
    });
  });
});
