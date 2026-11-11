// task 18: อ่านข้อความจากบอร์ด ESP32 (js/sensor.js)

test("เซนเซอร์: อ่านข้อความครบ 3 ค่าตามแบบที่บอร์ดส่ง", () => {
  assertEqual(parseSensorText("M=45;T=29;L=62"), { ok: true, moisture: 45, tempC: 29, light: 62 });
});

test("เซนเซอร์: ยอมรับตัวเล็ก ช่องว่าง จุลภาค ขึ้นบรรทัดใหม่ เครื่องหมาย : และสลับลำดับ", () => {
  assertEqual(parseSensorText(" l:62, t:29.5\nm=45 "), { ok: true, moisture: 45, tempC: 29.5, light: 62 });
});

test("เซนเซอร์: ค่าที่บอร์ดไม่ส่งมาเป็น null และชื่อที่ไม่รู้จักถูกข้าม", () => {
  assertEqual(parseSensorText("M=40;H=70"), { ok: true, moisture: 40, tempC: null, light: null });
});

test("เซนเซอร์: อุณหภูมิติดลบได้ แต่ความชื้นดินติดลบไม่ได้", () => {
  assertEqual(parseSensorText("T=-2").tempC, -2);
  assertEqual(parseSensorText("M=-1").ok, false);
});

test("เซนเซอร์: ค่าเกินช่วงหรือไม่ใช่ตัวเลข บอกเหตุผลเป็นภาษาไทย", () => {
  assertEqual(parseSensorText("M=101").error, "ค่าความชื้นดิน (M) ต้องเป็นตัวเลข 0 ถึง 100 ลองวัดใหม่อีกครั้ง");
  assertEqual(parseSensorText("M=40;T=nan").ok, false); // DHT อ่านไม่ได้
  assertEqual(parseSensorText("L=150").ok, false);
});

test("เซนเซอร์: ข้อความว่างหรือไม่ใช่รูปแบบที่รู้จัก อ่านไม่ออก", () => {
  assertEqual(parseSensorText("").ok, false);
  assertEqual(parseSensorText("hello").ok, false);
  assertEqual(parseSensorText(null).ok, false);
});

test("เซนเซอร์: ใส่ค่าลงคำตอบ แล้วข้อมูลแปลงเก็บอุณหภูมิกับแสงไว้", () => {
  const draft = createDraft(5);
  applySensorReading(draft, parseSensorText("M=45;T=29;L=62"));
  const plot = buildPlot(draft);
  assertEqual([plot.moisture, plot.sensorTempC, plot.sensorLight], [45, 29, 62]);
});

test("เซนเซอร์: บอร์ดไม่ส่งความชื้นดิน ช่องความชื้นที่ผู้ใช้กรอกเองไม่ถูกลบ", () => {
  const draft = createDraft(5);
  draft.moistureText = "30";
  applySensorReading(draft, parseSensorText("T=28"));
  assertEqual(buildPlot(draft).moisture, 30);
});

test("เซนเซอร์: แปลงเก่าที่ไม่มีช่องเซนเซอร์ ได้ค่า null และไม่มีข้อความสรุป", () => {
  const oldDraft = createDraft(5);
  delete oldDraft.sensorTempText;
  delete oldDraft.sensorLightText;
  const plot = buildPlot(oldDraft);
  assertEqual([plot.sensorTempC, plot.sensorLight], [null, null]);
  assertEqual(sensorSummaryText(plot), null);
  assertEqual(sensorSummaryText({}), null);
});

test("เซนเซอร์: ข้อความสรุปในหน้าแปลงของฉัน", () => {
  assertEqual(sensorSummaryText({ sensorTempC: 29, sensorLight: 62 }), "อุณหภูมิตอนวัด 29 องศา · แสง 62%");
  assertEqual(sensorSummaryText({ sensorTempC: null, sensorLight: 0 }), "แสง 0%");
});

test("เซนเซอร์: ค่าเซนเซอร์ไม่เปลี่ยนคะแนน (ยังไม่ใช้คิดคะแนน)", async () => {
  const crop = (await loadCrops()).find((item) => item.id === "cassava");
  const draft = createDraft(5);
  draft.texture = "medium";
  draft.phText = "6";
  const before = scoreCrop(buildPlot(draft), crop, null).score;
  draft.sensorTempText = "45";
  draft.sensorLightText = "5";
  assertEqual(scoreCrop(buildPlot(draft), crop, null).score, before);
});
