// ชุดทดสอบข้อมูลอากาศ (js/weather.js) และปัจจัยอุณหภูมิ/ฝนใน js/scoring.js (task 10)

const SUMMER_PLOT = { ph: 6, texture: "medium", drainage: "good", month: 5, light: null };

// พืชสมมติที่มีแต่ข้อมูลอุณหภูมิ ส่งค่าที่อยากเปลี่ยนมาทาง changes
function makeTempCrop(changes = {}) {
  return makeScoringCrop({
    ph: { optimal: null, tolerable: null },
    tempC: { optimal: [20, 30], tolerable: [10, 35] },
    lifeForm: "annual",
    tempBasis: "growing_season_mean",
    cycleDays: { value: null },
    ...changes,
  });
}

// ม.ค. = 1 องศา ก.พ. = 2 ... ธ.ค. = 12 จะได้รู้ว่าใช้เดือนไหน
const COUNTING_CLIMATE = {
  monthlyTempC: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  annualMeanTempC: 26.7,
  coldestMonthMinTempC: 15.6,
  rainMmYear: 1107,
};

function tempOf(plot, crop, climate) {
  return factorOf(scoreCrop(plot, crop, climate), "tempC");
}

test("ไฟล์อากาศแม่ทะ: 12 เดือนครบ หน้าหนาวเย็นกว่าหน้าร้อน และมีค่าสถานีลำปาง", async () => {
  const file = await fetchJson(CLIMATE_URL);
  assertEqual(file.monthlyTempC.length, 12);
  assertEqual(file.monthlyRainMm.length, 12);
  assertEqual(file.source, "OPEN-METEO");
  assertTrue(file.years[1] - file.years[0] + 1 >= 10, "ต้องใช้อย่างน้อย 10 ปีเต็ม");
  const [jan, apr, dec] = [file.monthlyTempC[0], file.monthlyTempC[3], file.monthlyTempC[11]];
  assertTrue(jan < apr && dec < apr, `ม.ค. ${jan} และ ธ.ค. ${dec} ต้องเย็นกว่า เม.ย. ${apr}`);
  assertTrue(file.monthlyRainMm[7] > file.monthlyRainMm[0], "ส.ค. ต้องฝนมากกว่า ม.ค.");
  assertEqual(file.station.source, "TMD-LAMPANG-9120");
});

test("getClimate: ฝนและอุณหภูมิทั้งปีใช้สถานีลำปาง อุณหภูมิรายเดือนใช้ Open-Meteo", async () => {
  const climate = await getClimate();
  assertEqual(climate.rainMmYear, 1107);
  assertEqual(climate.annualMeanTempC, 26.7);
  assertEqual(climate.coldestMonthMinTempC, 15.6);
  assertEqual(climate.monthlyTempC.length, 12);
});

test("getClimate: อ่านไฟล์ไม่ได้ คืน null ไม่พัง", async () => {
  assertEqual(await getClimate("tests/fixtures/no-such-file.json"), null);
  assertEqual(await getClimate("tests/fixtures/broken.json"), null);
});

test("getToday: เรียกไม่สำเร็จ คืน null ไม่พัง", async () => {
  assertEqual(await getToday("tests/fixtures/no-such-file.json"), null);
  assertEqual(await getToday("tests/fixtures/broken.json"), null);
});

test("readForecast: อ่านอุณหภูมิตอนนี้และโอกาสฝนวันนี้", () => {
  const json = { current: { temperature_2m: 31.4 }, daily: { precipitation_probability_max: [60] } };
  assertEqual(readForecast(json), { tempC: 31.4, rainChance: 60 });
  assertEqual(readForecast({ current: { temperature_2m: 25 } }), { tempC: 25, rainChance: null });
  assertEqual(readForecast({}), null);
});

test("พืชล้มลุกไม่มีอายุพืช: ใช้อุณหภูมิเดือนที่ปลูกเดือนเดียว", () => {
  const temp = tempOf(SUMMER_PLOT, makeTempCrop(), COUNTING_CLIMATE);
  assertEqual(temp.plotValue, 5);
  assertEqual(temp.tempMonths, [5]);
});

test("พืชล้มลุกอายุ [240, 365] วัน: ใช้อายุสั้นสุด 8 เดือน (พ.ค.–ธ.ค.)", () => {
  const crop = makeTempCrop({ cycleDays: { value: [240, 365] } });
  const temp = tempOf(SUMMER_PLOT, crop, COUNTING_CLIMATE);
  assertEqual(temp.tempMonths, [5, 6, 7, 8, 9, 10, 11, 12]);
  assertEqual(temp.plotValue, 8.5); // (5+6+...+12) ÷ 8
});

test("อายุพืชข้ามปี: ปลูก พ.ย. 90 วัน = พ.ย. ธ.ค. ม.ค.", () => {
  const crop = makeTempCrop({ cycleDays: { value: [90, 150] } });
  const temp = tempOf({ ...SUMMER_PLOT, month: 11 }, crop, COUNTING_CLIMATE);
  assertEqual(temp.tempMonths, [11, 12, 1]);
  assertEqual(temp.plotValue, 8); // (11+12+1) ÷ 3
});

test("ข้าวไวแสง (cycleDays = null): ใช้เดือนที่ปลูกถึงเดือนเก็บเกี่ยว", () => {
  const crop = makeTempCrop({ harvestApprox: { value: "11-21" } });
  assertEqual(tempOf(SUMMER_PLOT, crop, COUNTING_CLIMATE).tempMonths, [5, 6, 7, 8, 9, 10, 11]);
});

test("ไม้ยืนต้น: ใช้อุณหภูมิเฉลี่ยทั้งปี ไม่สนเดือนที่ปลูก", () => {
  const crop = makeTempCrop({ lifeForm: "perennial", tempBasis: "annual_mean" });
  const temp = tempOf({ ...SUMMER_PLOT, month: 1 }, crop, COUNTING_CLIMATE);
  assertEqual(temp.plotValue, 26.7);
  assertEqual(temp.tempMonths, null);
  assertEqual(temp.factorScore, 1);
});

test("ไม่รู้เดือนที่ปลูก: พืชล้มลุกตัดปัจจัยอุณหภูมิ แต่ไม้ยืนต้นยังใช้ได้", () => {
  const plot = { ...SUMMER_PLOT, month: null };
  assertEqual(tempOf(plot, makeTempCrop(), COUNTING_CLIMATE).used, false);
  const tree = makeTempCrop({ tempBasis: "annual_mean" });
  assertEqual(tempOf(plot, tree, COUNTING_CLIMATE).used, true);
});

test("ตัวกรองความหนาว: ต่ำสุดเดือนหนาวสุดต่ำกว่าเกณฑ์ ลดคะแนนอุณหภูมิ แต่ไม่เป็น 0", () => {
  const crop = makeTempCrop({ tempBasis: "annual_mean", coldLimitC: { value: [14, 15] } });
  const cold = { ...COUNTING_CLIMATE, coldestMonthMinTempC: 12 };
  const temp = tempOf(SUMMER_PLOT, crop, cold);
  assertEqual(temp.factorScore, 1 * COLD_PENALTY_FACTOR);
  assertTrue(temp.factorScore > 0, "ห้ามตัดเป็น 0");
  assertEqual(temp.coldPenalty, true);
  assertTrue(buildReasons(scoreCrop(SUMMER_PLOT, crop, cold), crop)[0].includes("หน้าหนาว"));
});

test("ตัวกรองความหนาว: ไม่หนาวกว่าเกณฑ์ หรือพืชไม่มี coldLimitC ไม่ลดคะแนน", () => {
  const crop = makeTempCrop({ tempBasis: "annual_mean", coldLimitC: { value: [14, 15] } });
  assertEqual(tempOf(SUMMER_PLOT, crop, COUNTING_CLIMATE).factorScore, 1); // 15.6 ไม่ต่ำกว่า 14
  const noLimit = makeTempCrop({ tempBasis: "annual_mean" });
  const cold = { ...COUNTING_CLIMATE, coldestMonthMinTempC: 0 };
  assertEqual(tempOf(SUMMER_PLOT, noLimit, cold).factorScore, 1);
});

test("ข้อมูลจริง: ยางพาราที่ลำปาง อุณหภูมิผ่าน ไม่โดนตัวกรองหนาว ฝนได้ 0", async () => {
  const [crops, climate] = [await loadCrops(), await getClimate()];
  const result = scoreCrop(SUMMER_PLOT, crops.find((crop) => crop.id === "rubber"), climate);
  assertEqual(factorOf(result, "tempC").plotValue, 26.7);
  assertEqual(factorOf(result, "tempC").factorScore, 1);
  assertEqual(factorOf(result, "tempC").coldPenalty, false);
  assertEqual(factorOf(result, "rainMmYear").factorScore, 0);
});

test("ข้อมูลจริง: ข้าวโพดกับฝน 1,107 มม. ได้คะแนนฝนเต็ม", async () => {
  const [crops, climate] = [await loadCrops(), await getClimate()];
  const result = scoreCrop(SUMMER_PLOT, crops.find((crop) => crop.id === "maize"), climate);
  assertEqual(factorOf(result, "rainMmYear").factorScore, 1);
  assertEqual(factorOf(result, "tempC").used, true);
});

test("ข้อมูลจริง: ทุกพืชคิดคะแนนกับข้อมูลอากาศจริงได้ ไม่มีค่าเพี้ยน", async () => {
  const [crops, climate] = [await loadCrops(), await getClimate()];
  for (let month = 1; month <= 12; month++) {
    crops.forEach((crop) => {
      const result = scoreCrop({ ...SUMMER_PLOT, month }, crop, climate);
      assertTrue(result.score === null || (result.score >= 0 && result.score <= 100), `${crop.id} เดือน ${month}`);
      factorRows(result).forEach((row) => assertTrue(row.verdict !== undefined, `${crop.id} ${row.key}`));
    });
  }
});

test("หน้าแรก: แสดงอุณหภูมิและโอกาสฝนเป็นตัวเลขจำนวนเต็ม", () => {
  const html = todayWeatherHtml({ tempC: 31.4, rainChance: 60 });
  assertTrue(html.includes("31°") && html.includes("60%"), html);
  assertTrue(!todayWeatherHtml({ tempC: 25, rainChance: null }).includes("โอกาสฝน"));
});
