// หน้าตั้งค่า: ความเร็วเสียงอ่าน (task 15) และลิงก์ไปหน้าพิสูจน์สมมติฐาน (task 14)
// ขนาดตัวอักษร Gemini key ล้างประวัติ และเวอร์ชัน จะเพิ่มใน task 16

const SPEECH_RATE_LABELS = { normal: "ปกติ", slow: "ช้า" };

function renderSettings(container) {
  container.innerHTML = `
    <h2 tabindex="-1">ตั้งค่า</h2>
    <h3>เสียงอ่าน</h3>
    <div id="speech-settings"></div>
    <h3>สำหรับครูและรายงาน</h3>
    <a class="btn btn-secondary" href="#/proof">ดูผลพิสูจน์สมมติฐาน</a>
  `;
  showSpeechSettings();
}

// ถ้าไม่มีเสียงไทย บอกเหตุผลแทนการแสดงตัวเลือกที่ใช้ไม่ได้
function speechSettingsHtml() {
  if (!hasThaiSpeech()) {
    return `<p class="muted">เครื่องนี้ไม่มีเสียงอ่านภาษาไทย จึงไม่มีปุ่ม "ฟัง" ในแอป
      ถ้าต้องการฟัง ให้ติดตั้งเสียงภาษาไทยในการตั้งค่าของมือถือ (หัวข้อ "แปลงข้อความเป็นเสียง") แล้วเปิดแอปใหม่</p>`;
  }
  const options = Object.keys(SPEECH_RATES).map((choice) => `
    <label class="choice">
      <input type="radio" name="speech-rate" value="${choice}" ${choice === speechRateChoice() ? "checked" : ""}>
      ${SPEECH_RATE_LABELS[choice]}
    </label>`).join("");
  return `<fieldset class="speech-rate"><legend>ความเร็วเสียงอ่าน</legend>${options}</fieldset>`;
}

function showSpeechSettings() {
  const slot = document.getElementById("speech-settings");
  if (!slot) return;
  slot.innerHTML = speechSettingsHtml();
  slot.querySelectorAll("input[name='speech-rate']").forEach((input) => {
    input.addEventListener("change", () => saveSpeechRateChoice(input.value));
  });
}

// เสียงบางเครื่องโหลดช้า เมื่อเจอเสียงแล้วให้อัปเดตส่วนนี้ (ถ้ากำลังเปิดหน้าตั้งค่าอยู่)
document.addEventListener("agroeye:voices", showSpeechSettings);
