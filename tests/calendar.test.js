// เทสต์ปฏิทินปลูก (task 12): เดือนที่แสดงต้องตรงกับ crops.json ทุกพืช

// อ่าน crops.json ตรง ๆ (ไม่ผ่านตัวตรวจ) เพื่อเทียบกับไฟล์จริงทุกพืช
async function rawCrops() {
  const file = await fetchJson(CROPS_URL);
  return file.crops;
}

test("ปฏิทิน: มี 12 เดือน เรียง ม.ค. ถึง ธ.ค.", async () => {
  const months = cropsByMonth(await loadCrops()).map((entry) => entry.month);
  assertEqual(months, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test("ปฏิทิน: ทุกพืชทุกเดือนตรงกับ plantingMonths.months ใน crops.json", async () => {
  const raw = await rawCrops();
  const calendar = cropsByMonth(await loadCrops());
  for (const crop of raw) {
    const months = crop.plantingMonths?.months ?? [];
    for (const { month, crops } of calendar) {
      const shown = crops.some((item) => item.id === crop.id);
      assertEqual(shown, months.includes(month), `${crop.id} เดือน ${month}`);
    }
  }
});

test("ปฏิทิน: พืชที่ไม่มีเดือนปลูก = พืชที่ months เป็น null ใน crops.json", async () => {
  const raw = await rawCrops();
  const expected = raw.filter((crop) => crop.plantingMonths?.months == null).map((crop) => crop.id);
  const actual = cropsWithoutMonths(await loadCrops()).map((crop) => crop.id);
  assertEqual(actual, expected);
});

// ค่าที่นับด้วยมือจาก crops.json (5 พ.ย. 2569) ถ้าข้อมูลพืชเปลี่ยน ต้องนับใหม่
test("ปฏิทิน: ตัวอย่างนับมือ เม.ย. / พ.ค. / ม.ค. / ธ.ค.", async () => {
  const calendar = cropsByMonth(await loadCrops());
  const ids = (month) => calendar[month - 1].crops.map((crop) => crop.id);
  assertEqual(ids(4), ["maize", "rice-rd6", "rice-kdml105", "ginger"]);
  assertEqual(ids(5), ["maize", "rice-rd6", "rice-kdml105", "cassava", "ginger"]);
  assertEqual(ids(1), []);
  assertEqual(ids(12), ["cassava"]);
});

test("ปฏิทิน: อากาศรายเดือนจาก climate-maetha.json และไม่มีไฟล์ก็ไม่พัง", async () => {
  const file = await fetchJson(CLIMATE_URL);
  assertEqual(monthClimate(file, 1), { tempC: 23.0, rainMm: 21 });
  assertEqual(monthClimate(file, 9), { tempC: 26.6, rainMm: 272 });
  assertEqual(maxMonthlyRain(file), 272);
  assertEqual(monthClimate(null, 5), { tempC: null, rainMm: null });
  assertEqual(maxMonthlyRain(null), null);
});
