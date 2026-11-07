// หน้าตั้งค่า: ขนาดตัวอักษร เสียงอ่าน (task 15–16) รหัส AI ล้างประวัติ ลิงก์พิสูจน์สมมติฐาน (task 14) และเกี่ยวกับแอป
// ส่วนรหัส AI ล้างประวัติ และเกี่ยวกับแอป อยู่ใน js/views/settings-more.js

const SPEECH_RATE_LABELS = { normal: "ปกติ", slow: "ช้า" };
const TEXT_SIZE_LABELS = { normal: "ปกติ", large: "ใหญ่", xlarge: "ใหญ่มาก" };

function renderSettings(container) {
  container.innerHTML = `
    <h2 tabindex="-1">ตั้งค่า</h2>
    <h3 class="settings-heading">ขนาดตัวอักษร</h3>
    <div id="text-size-settings">${textSizeSettingsHtml()}</div>
    <h3 class="settings-heading">เสียงอ่าน</h3>
    <div id="speech-settings"></div>
    <h3 class="settings-heading">AI ช่วยอธิบาย</h3>
    <div id="ai-settings">${aiSettingsHtml()}</div>
    <h3 class="settings-heading">ล้างประวัติ</h3>
    <div id="history-settings">${historySettingsHtml()}</div>
    <h3 class="settings-heading">สำหรับครูและรายงาน</h3>
    <a class="btn btn-secondary" href="#/proof">ดูผลพิสูจน์สมมติฐาน</a>
    <h3 class="settings-heading">เกี่ยวกับแอป</h3>
    <div id="about-settings">${aboutHtml(null)}</div>
  `;
  setupTextSizeSettings(container);
  showSpeechSettings();
  setupAiSettings(container);
  setupHistorySettings(container);
  showAbout(container);
}

// ตัวเลือกแบบปุ่มวิทยุ (ใช้กับขนาดตัวอักษร เปิด/ปิดเสียง และความเร็ว)
function radioGroupHtml(name, legend, labels, chosen) {
  const options = Object.keys(labels).map((choice) => `
    <label class="choice">
      <input type="radio" name="${name}" value="${choice}" ${choice === chosen ? "checked" : ""}>
      ${labels[choice]}
    </label>`).join("");
  return `<fieldset class="speech-rate"><legend>${legend}</legend>${options}</fieldset>`;
}

// ---------- ขนาดตัวอักษร ----------
function textSizeSettingsHtml() {
  return radioGroupHtml("text-size", "เลือกขนาดที่อ่านสบาย ใช้กับทุกหน้า", TEXT_SIZE_LABELS, textSizeChoice());
}

function setupTextSizeSettings(container) {
  container.querySelectorAll("input[name='text-size']").forEach((input) => {
    input.addEventListener("change", () => saveTextSizeChoice(input.value));
  });
}

// ---------- เสียงอ่าน ----------
// ถ้าไม่มีเสียงไทย บอกเหตุผลแทนการแสดงตัวเลือกที่ใช้ไม่ได้
function speechSettingsHtml() {
  if (!hasThaiSpeech()) {
    return `<p class="muted">เครื่องนี้ไม่มีเสียงอ่านภาษาไทย จึงไม่มีปุ่ม "ฟัง" ในแอป
      ถ้าต้องการฟัง ให้ติดตั้งเสียงภาษาไทยในการตั้งค่าของมือถือ (หัวข้อ "แปลงข้อความเป็นเสียง") แล้วเปิดแอปใหม่</p>`;
  }
  const onOff = radioGroupHtml("sound-on", "ปุ่ม \"ฟัง\" ในแอป", { on: "เปิดเสียง", off: "ปิดเสียง" },
    soundOn() ? "on" : "off");
  const rate = radioGroupHtml("speech-rate", "ความเร็วเสียงอ่าน", SPEECH_RATE_LABELS, speechRateChoice());
  return onOff + rate;
}

function showSpeechSettings() {
  const slot = document.getElementById("speech-settings");
  if (!slot) return;
  slot.innerHTML = speechSettingsHtml();
  slot.querySelectorAll("input[name='speech-rate']").forEach((input) => {
    input.addEventListener("change", () => saveSpeechRateChoice(input.value));
  });
  slot.querySelectorAll("input[name='sound-on']").forEach((input) => {
    input.addEventListener("change", () => saveSoundOn(input.value === "on"));
  });
}

// เสียงบางเครื่องโหลดช้า เมื่อเจอเสียงแล้วให้อัปเดตส่วนนี้ (ถ้ากำลังเปิดหน้าตั้งค่าอยู่)
document.addEventListener("agroeye:voices", showSpeechSettings);
