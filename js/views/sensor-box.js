// task 18: กล่อง "วางค่าจากเซนเซอร์" ในขั้นข้อมูลเพิ่มเติม
// ผู้ใช้คัดลอกข้อความจากหน้าเว็บของบอร์ด ESP32 (เช่น M=45;T=29;L=62) มาวาง แล้วกด "ใช้ค่านี้"
// ช่องวางไม่มี name จึงไม่ถูกเก็บลง draft ตรง ๆ ค่าที่อ่านได้จะเข้า draft ผ่าน applySensorReading (js/sensor.js)

function sensorBoxHtml(draft) {
  const hasReading = !isBlank(draft.sensorTempText) || !isBlank(draft.sensorLightText);
  return `
    <details class="help" ${hasReading ? "open" : ""}>
      <summary>วางค่าจากเซนเซอร์ (ESP32)</summary>
      <p class="muted">เปิดหน้าเว็บของบอร์ด กด “คัดลอก” แล้วนำมาวางที่ช่องนี้ ความชื้นดินจะเติมให้เอง อุณหภูมิและแสงเก็บไว้ดูย้อนหลัง ยังไม่ใช้คิดคะแนน</p>
      <div class="field">
        <label for="sensor-paste">ข้อความจากบอร์ด</label>
        <input class="input" id="sensor-paste" type="text" autocomplete="off" placeholder="M=45;T=29;L=62">
      </div>
      <button id="sensor-read-clipboard" class="btn btn-secondary" type="button" hidden>วางจากที่คัดลอกไว้</button>
      <button id="sensor-apply" class="btn btn-secondary" type="button">ใช้ค่านี้</button>
      <div id="sensor-status" role="status"></div>
    </details>`;
}

function setupSensorBox(root, draft) {
  const pasteBox = root.querySelector("#sensor-paste");
  if (!pasteBox) return;
  root.querySelector("#sensor-apply").addEventListener("click", () => applySensorText(root, draft, pasteBox.value));
  // กด Enter ในช่องวาง = ใช้ค่านี้ (ไม่อย่างนั้นฟอร์มจะไปหน้าผลทันที)
  pasteBox.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    applySensorText(root, draft, pasteBox.value);
  });
  setupClipboardButton(root, draft, pasteBox);
  if (!isBlank(draft.sensorTempText) || !isBlank(draft.sensorLightText)) {
    showSensorStatus(root, "alert-ok", savedSensorText(draft));
  }
}

// ปุ่มวางจากคลิปบอร์ด ใช้ได้เฉพาะเว็บ https ที่เบราว์เซอร์รองรับ ถ้าไม่รองรับปุ่มนี้จะซ่อนไว้ ผู้ใช้กดค้างแล้ววางเองได้
function setupClipboardButton(root, draft, pasteBox) {
  const button = root.querySelector("#sensor-read-clipboard");
  if (!navigator.clipboard?.readText || !window.isSecureContext) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      pasteBox.value = await navigator.clipboard.readText();
      applySensorText(root, draft, pasteBox.value);
    } catch {
      showSensorStatus(root, "alert-warn", "อ่านที่คัดลอกไว้ไม่ได้ ลองกดค้างที่ช่องแล้วเลือก “วาง”");
    }
  });
}

function applySensorText(root, draft, text) {
  const reading = parseSensorText(text);
  if (!reading.ok) {
    showSensorStatus(root, "alert-warn", reading.error);
    return;
  }
  applySensorReading(draft, reading);
  const moistureBox = root.querySelector("#moistureText");
  if (moistureBox) moistureBox.value = draft.moistureText;
  showSensorStatus(root, "alert-ok", readingText(reading));
}

// ข้อความยืนยันว่าอ่านอะไรได้บ้าง ค่าที่บอร์ดไม่ส่งมาบอกว่า "ไม่มีค่า"
function readingText(reading) {
  const show = (value, unit) => (value === null ? "ไม่มีค่า" : `${value}${unit}`);
  return `ใช้ค่าจากเซนเซอร์แล้ว: ความชื้นดิน ${show(reading.moisture, "%")} · อุณหภูมิ ${show(reading.tempC, " องศา")} · แสง ${show(reading.light, "%")}`;
}

function savedSensorText(draft) {
  const plot = { sensorTempC: parseSensorNumber(draft.sensorTempText), sensorLight: parseSensorNumber(draft.sensorLightText) };
  return `มีค่าจากเซนเซอร์อยู่แล้ว: ${sensorSummaryText(plot)}`;
}

function showSensorStatus(root, kind, message) {
  const alert = document.createElement("div");
  alert.className = `alert ${kind}`;
  alert.textContent = message;
  root.querySelector("#sensor-status").replaceChildren(alert);
}
