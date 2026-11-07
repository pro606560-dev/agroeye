// เทสต์อ่านออกเสียง (task 15): แปลงตัวเลขเป็นคำ ข้อความของหน้าผล/หน้าพืช และการหาเสียงไทย

test("เสียง: อ่านตัวเลขเป็นคำไทย", () => {
  const cases = { "0": "ศูนย์", "5": "ห้า", "10": "สิบ", "11": "สิบเอ็ด", "20": "ยี่สิบ", "21": "ยี่สิบเอ็ด",
    "85": "แปดสิบห้า", "100": "หนึ่งร้อย", "101": "หนึ่งร้อยหนึ่ง", "150": "หนึ่งร้อยห้าสิบ",
    "1,200": "หนึ่งพันสองร้อย", "2000000": "สองล้าน", "5.5": "ห้าจุดห้า", "0.75": "ศูนย์จุดเจ็ดห้า", "4.0": "สี่จุดศูนย์" };
  for (const [number, words] of Object.entries(cases)) assertEqual(thaiNumberWords(number), words, number);
});

test("เสียง: แปลงตัวอย่างใน task (pH 5.5 และ 5–10 ซม.)", () => {
  assertEqual(toSpokenThai("pH 5.5"), "ค่าความเป็นกรดด่าง ห้าจุดห้า");
  assertEqual(toSpokenThai("5–10 ซม."), "ห้า ถึง สิบ เซนติเมตร");
});

test("เสียง: ข้อความจริงใน crops.json ไม่เหลือตัวเลขหรือสัญลักษณ์ที่อ่านผิด", async () => {
  const crops = await loadCrops();
  const left = [];
  for (const crop of crops) {
    for (const sentence of cropSpeechSentences(crop)) {
      if (/[0-9%°/–—()]|pH|ซม\./.test(sentence)) left.push(sentence);
    }
  }
  assertEqual(left, []);
  assertEqual(toSpokenThai("ใส่ปูน pH 4.5–5.0 ใช้ 0.5 ตัน/ไร่"),
    "ใส่ปูน ค่าความเป็นกรดด่าง สี่จุดห้า ถึง ห้าจุดศูนย์ ใช้ ศูนย์จุดห้า ตัน ต่อ ไร่");
});

test("เสียง: หน้าพืชอ่านวิธีดูแลและความเสี่ยงครบทุกข้อ ถ้าไม่มีข้อมูลบอกว่ายังไม่มี", () => {
  const crop = { nameTh: "พืชทดสอบ", care: [{ text: "รดน้ำ" }, { text: "ใส่ปุ๋ย" }],
    risks: [{ risk: "หนอนกินใบ", fix: null }] };
  const sentences = cropSpeechSentences(crop);
  assertEqual(sentences.slice(0, 3), ["วิธีดูแลพืชทดสอบ", "ข้อ หนึ่ง รดน้ำ", "ข้อ สอง ใส่ปุ๋ย"]);
  assertTrue(sentences.includes("เรื่องที่ หนึ่ง หนอนกินใบ"));
  assertTrue(sentences.some((s) => s.startsWith("วิธีแก้ ยังไม่มีข้อมูล")));
  const empty = cropSpeechSentences({ nameTh: "ว่าง", care: [], risks: [] });
  assertEqual(empty.filter((s) => s.startsWith("ยังไม่มีข้อมูล")).length, 2);
});

test("เสียง: หน้าผลอ่าน 3 อันดับ พร้อมคะแนนและเหตุผล ตรงกับที่แสดงบนจอ", async () => {
  const crops = await loadCrops();
  const plot = { ph: 6.5, texture: "medium", drainage: "good", light: "full", month: 5 };
  const { recommended } = splitRecommendations(rankCrops(plot, crops, null));
  const sentences = resultSpeechSentences(recommended, crops, "ปรึกษาเกษตรอำเภอ");
  assertEqual(sentences[0], toSpokenThai(`พืชที่แนะนำสำหรับแปลงนี้ มี ${recommended.length} อย่าง`));
  recommended.forEach((result, index) => {
    const crop = crops.find((c) => c.id === result.cropId);
    assertTrue(sentences.includes(toSpokenThai(`อันดับ ${index + 1} ${crop.nameTh}`)), crop.nameTh);
    assertTrue(sentences.some((s) => s.startsWith(`ได้ ${thaiNumberWords(String(result.score))} คะแนน`)), crop.nameTh);
  });
  assertEqual(sentences[sentences.length - 1], "ปรึกษาเกษตรอำเภอ");
});

test("เสียง: หาเสียงไทยได้ทั้ง th-TH และ th_TH ถ้าไม่มีคืน null", () => {
  assertEqual(findThaiVoice([{ lang: "en-US" }, { lang: "th-TH", name: "ไทย" }])?.name, "ไทย");
  assertEqual(findThaiVoice([{ lang: "th_TH", name: "a" }])?.name, "a");
  assertEqual(findThaiVoice([{ lang: "en-US" }, { lang: "thai" }]), null);
  assertEqual(findThaiVoice([]), null);
});

test("เสียง: ปุ่มฟังซ่อนไว้ก่อนเสมอ (ไม่มีเสียงไทย = ไม่มีปุ่มที่กดแล้วเงียบ)", () => {
  const box = document.createElement("div");
  box.innerHTML = speakButtonHtml("ฟังคำแนะนำ");
  assertTrue(box.querySelector(".speak-btn").hidden);
});

test("เสียง: ความเร็วมี 2 ระดับ ปกติ และ ช้า", () => {
  assertEqual(Object.keys(SPEECH_RATES), ["normal", "slow"]);
  assertTrue(SPEECH_RATES.slow < SPEECH_RATES.normal);
});
