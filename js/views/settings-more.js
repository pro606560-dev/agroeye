// หน้าตั้งค่า (ต่อ): รหัส AI, ล้างประวัติ, เกี่ยวกับแอป (task 16)

// ---------- รหัส AI ----------
function aiKeyStatusText() {
  return aiKey()
    ? "ใส่รหัสแล้ว หน้าพืชจะมีคำอธิบายจาก AI เมื่อมีอินเทอร์เน็ต"
    : "ยังไม่ได้ใส่รหัส แอปใช้งานได้ครบตามปกติ";
}

function aiSettingsHtml() {
  return `
    <p>ถ้าใส่รหัส AI หน้าวิธีปลูกจะมีคำอธิบายสั้น ๆ สำหรับแปลงของคุณ ไม่ใส่ก็ใช้แอปได้ครบ</p>
    <div class="field">
      <label for="ai-key">รหัส AI (Gemini API key)</label>
      <input id="ai-key" class="input" type="password" autocomplete="off" autocapitalize="off"
        spellcheck="false" value="${escapeHtml(aiKey())}">
    </div>
    <button id="ai-key-toggle" class="btn btn-secondary" type="button">แสดงรหัส</button>
    <button id="ai-key-save" class="btn btn-primary" type="button">บันทึกรหัส</button>
    <button id="ai-key-remove" class="btn btn-secondary" type="button">ลบรหัส</button>
    <p id="ai-key-status" class="settings-status" role="status">${aiKeyStatusText()}</p>
    <p class="muted">รหัสเก็บไว้ในเครื่องนี้เท่านั้น แอปส่งให้ AI แค่ข้อมูลดิน เดือน และชื่อพืช
      ไม่ส่งชื่อแปลงหรือที่ตั้งแปลง</p>`;
}

function setAiStatus(container, text) {
  container.querySelector("#ai-key-status").textContent = text;
}

function setupAiSettings(container) {
  const input = container.querySelector("#ai-key");
  const toggle = container.querySelector("#ai-key-toggle");
  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.textContent = showing ? "แสดงรหัส" : "ซ่อนรหัส";
  });
  container.querySelector("#ai-key-save").addEventListener("click", () => {
    if (!input.value.trim()) {
      setAiStatus(container, "ยังไม่ได้ใส่รหัส ให้วางรหัสในช่องด้านบนก่อน แล้วกดบันทึก");
      return;
    }
    setAiStatus(container, saveAiKey(input.value) ? "บันทึกรหัสแล้ว" : "บันทึกไม่ได้ เพราะเครื่องนี้เก็บข้อมูลไม่ได้ในตอนนี้");
  });
  container.querySelector("#ai-key-remove").addEventListener("click", () => {
    removeAiKey();
    input.value = "";
    setAiStatus(container, "ลบรหัสแล้ว แอปยังใช้งานได้ครบตามปกติ");
  });
}

// ---------- ล้างประวัติ ----------
function historySettingsHtml() {
  const count = loadSavedPlots().length;
  if (count === 0) return `<p class="muted">ยังไม่มีแปลงที่บันทึกไว้</p>`;
  return `
    <p>มีแปลงที่บันทึกไว้ ${count} แปลง</p>
    <button id="clear-history" class="btn btn-danger" type="button">ลบแปลงที่บันทึกไว้ทั้งหมด</button>
    <dialog id="clear-dialog" class="dialog" aria-labelledby="clear-title">
      <h2 id="clear-title">ลบแปลงที่บันทึกไว้ทั้งหมด ${count} แปลง ไหม</h2>
      <p>ผลการตรวจทุกแปลงจะหายไป เอากลับมาไม่ได้</p>
      <button id="clear-yes" class="btn btn-danger" type="button">ลบทั้งหมด</button>
      <button id="clear-no" class="btn btn-secondary" type="button">ไม่ลบ เก็บไว้</button>
    </dialog>`;
}

function setupHistorySettings(container) {
  const slot = container.querySelector("#history-settings");
  const dialog = slot.querySelector("#clear-dialog");
  if (!dialog) return;
  slot.querySelector("#clear-history").addEventListener("click", () => {
    dialog.showModal();
    slot.querySelector("#clear-no").focus();
  });
  slot.querySelector("#clear-no").addEventListener("click", () => dialog.close());
  slot.querySelector("#clear-yes").addEventListener("click", () => {
    dialog.close();
    const done = clearSavedPlots();
    slot.innerHTML = done
      ? `<p class="settings-status" role="status">ลบแปลงที่บันทึกไว้ทั้งหมดแล้ว</p>`
      : `<div class="alert alert-warn">ลบไม่ได้ เพราะเครื่องนี้เขียนข้อมูลไม่ได้ในตอนนี้ ลองปิดแอปแล้วเปิดใหม่</div>`;
    slot.querySelector("[role='status'], .alert").setAttribute("tabindex", "-1");
    slot.querySelector("[tabindex='-1']").focus();
  });
}

// ---------- เกี่ยวกับแอป ----------
// sources = Map ของแหล่งข้อมูลจาก data/SOURCES.md (null = กำลังโหลด)
function aboutHtml(sources) {
  let list = `<p class="muted">กำลังโหลดรายการแหล่งข้อมูล…</p>`;
  if (sources && sources.size === 0) list = `<p class="muted">อ่านรายการแหล่งข้อมูลไม่ได้ในตอนนี้</p>`;
  if (sources && sources.size > 0) {
    const items = [...sources.keys()].map((code) => sourceItemHtml(code, sources)).join("");
    list = `<details class="about-sources"><summary>แหล่งข้อมูลทั้งหมด ${sources.size} แหล่ง</summary>
      <ol class="source-list">${items}</ol></details>`;
  }
  return `
    <p>AgroEye เวอร์ชัน ${APP_VERSION}</p>
    <p>แอปแนะนำพืชสำหรับอำเภอแม่ทะ จังหวัดลำปาง พืชที่แนะนำคิดจากสูตรคะแนนในแอป ไม่ได้ให้ AI เลือก</p>
    ${list}`;
}

async function showAbout(container) {
  const sources = await getSources();
  const slot = container.querySelector("#about-settings");
  if (slot && slot.isConnected) slot.innerHTML = aboutHtml(sources);
}
