// เทสต์หน้าพิสูจน์สมมติฐาน (task 14): ตัวเลขต้องตรงกับตารางใน tests.html และส่งออกตารางได้ถูกรูป

async function proofInputs() {
  const [crops, scenarios, points] = await Promise.all([loadCrops(), loadScenarios(), loadSurveyPoints()]);
  return { crops, scenarios, points, areas: proofAreas(scenarios, points) };
}

// แถวผลปลอม ใช้ทดสอบการนับโดยไม่ขึ้นกับข้อมูลพืชจริง
function fakeRow(...cropIds) {
  return { area: {}, ranked: { top: cropIds.map((cropId) => ({ cropId })) } };
}

test("พิสูจน์: รวมกรณีทดสอบทุกกรณี + จุดสำรวจที่มีค่าอย่างน้อย 2 ปัจจัย", async () => {
  const { scenarios, points, areas } = await proofInputs();
  const usablePoints = points.filter((p) => countMeasuredValues(p) >= 2);
  assertEqual(areas.length, scenarios.length + usablePoints.length);
  assertEqual(areas.slice(0, scenarios.length).map((a) => a.id), scenarios.map((s) => s.id));
});

test("พิสูจน์: จุดสำรวจที่วัดได้ค่าเดียว ไม่ถูกนำมาแสดง และที่มาถูกต้อง", () => {
  const points = [
    { id: "one", ph: 6, texture: null, drainage: null },
    { id: "two", ph: 6, texture: "heavy", drainage: null },
  ];
  const scenarios = [{ id: "s", source: "LDD-HUASUEA-2567" }, { id: "x", source: "สมมติ" }];
  const areas = proofAreas(scenarios, points);
  assertEqual(areas.map((a) => [a.id, a.kind]), [["s", "soilSeries"], ["x", "assumed"], ["two", "survey"]]);
});

// เทียบกับ rankAllScenarios() ของ tests/exam.js ซึ่งเป็นตัวที่วาดตารางที่ 1 และ 2 ในหน้านี้
async function assertSameAsExamTable(climate) {
  const { crops, scenarios, areas } = await proofInputs();
  const fromExam = rankAllScenarios({ month: 5, climate }, scenarios, crops);
  const fromProof = runProof(areas, crops, climate);
  const pick = (rows) => rows.map((row) => row.ranked.top.map((r) => [r.cropId, r.score, r.confidence]));
  assertEqual(pick(fromProof.slice(0, scenarios.length)), pick(fromExam));
}

test("พิสูจน์: ไม่คิดอุณหภูมิ ได้พืช 3 อันดับและคะแนนตรงกับตารางที่ 1 ของ tests.html", async () => {
  await assertSameAsExamTable(null);
});

test("พิสูจน์: คิดอุณหภูมิ ได้ตรงกับตารางที่ 2 ของ tests.html", async () => {
  await assertSameAsExamTable(await getClimate());
});

test("พิสูจน์: จุดสำรวจจริงคิดคะแนนด้วยค่าที่วัดได้เท่านั้น", async () => {
  const { crops, points, areas } = await proofInputs();
  const surveyRows = runProof(areas.filter((a) => a.kind === "survey"), crops, null);
  surveyRows.forEach((row) => {
    const point = points.find((p) => p.id === row.area.id);
    const expected = rankCrops(plotFromScenario(point, 5), crops, null);
    assertEqual(row.ranked.top.map((r) => r.score), expected.top.map((r) => r.score));
  });
});

test("พิสูจน์: ข้อสรุปนับพืชอันดับ 1 ที่ต่างกัน (ไม่นับพื้นที่ที่ไม่มีพืช)", () => {
  const rows = [fakeRow("a", "b"), fakeRow("a"), fakeRow("c"), fakeRow()];
  assertEqual(summarizeTopCrops(rows), { areaCount: 4, distinctTopCount: 2 });
});

test("พิสูจน์: นับพืชติด 3 อันดับ เรียงมากไปน้อย และพืชที่ไม่ติดได้ 0", () => {
  const crops = [{ id: "a", nameTh: "ก" }, { id: "b", nameTh: "ข" }, { id: "c", nameTh: "ค" }];
  const rows = [fakeRow("b", "a"), fakeRow("b")];
  assertEqual(countTopAppearances(rows, crops).map((c) => [c.cropId, c.count]), [["b", 2], ["a", 1], ["c", 0]]);
});

test("พิสูจน์: จับเวลาได้ 10 รอบ และค่าเฉลี่ย/ต่ำสุด/สูงสุดถูก", () => {
  let calls = 0;
  const times = timeRounds(() => { calls++; });
  assertEqual(calls, 10);
  assertEqual(times.length, 10);
  assertTrue(times.every((t) => t >= 0), "เวลาต้องไม่ติดลบ");
  assertEqual(timeStats([1, 2, 6]), { average: 3, min: 1, max: 6 });
});

test("พิสูจน์: ตารางคั่น tab ตัด tab และขึ้นบรรทัดในช่องออก", () => {
  assertEqual(tableToTsv([["ก", "ข"], ["1\t2", "บรรทัด\nใหม่"], [null, 5]]), "ก\tข\n1 2\tบรรทัด ใหม่\n\t5");
});

test("พิสูจน์: ตาราง HTML สำหรับ Word แปลงเครื่องหมาย < ให้ปลอดภัย", () => {
  assertEqual(tableToHtml([["ก"], ["<b>"]]), "<table border=\"1\"><tr><th>ก</th></tr><tr><td>&lt;b&gt;</td></tr></table>");
});

test("พิสูจน์: ไฟล์กรณีทดสอบและ Chart.js อยู่ในรายชื่อแคช (ใช้ออฟไลน์ได้)", async () => {
  const list = await cachedFileList();
  assertTrue(list.includes(SCENARIOS_URL), "ไม่มีไฟล์กรณีทดสอบ");
  assertTrue(list.includes(CHART_LIB_URL), "ไม่มี Chart.js");
});

test("พิสูจน์: Chart.js ในเครื่องโหลดได้ และเป็นรุ่น 4.6.1", async () => {
  assertTrue(await loadChartLib(), "โหลด Chart.js ไม่ได้");
  assertEqual(window.Chart.version, "4.6.1");
});

// ทุกไฟล์ใน index.html เป็น script ธรรมดา ฟังก์ชันชื่อซ้ำกันจะทับกันเงียบ ๆ (เคยเกิดกับ cropName ใน task 14)
test("แอป: ไม่มีฟังก์ชันหรือค่าคงที่ชื่อซ้ำกันระหว่างไฟล์ที่ index.html โหลด", async () => {
  const html = await fetchText("index.html");
  const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  const seen = {};
  const clashes = [];
  for (const file of files) {
    const code = await fetchText(file);
    for (const match of code.matchAll(/^(?:async\s+)?(?:function\s+(\w+)|(?:const|let)\s+(\w+))/gm)) {
      const name = match[1] ?? match[2];
      if (name && seen[name] && seen[name] !== file) clashes.push(`${name}: ${seen[name]} กับ ${file}`);
      seen[name] = seen[name] ?? file;
    }
  }
  assertEqual(clashes, []);
});
