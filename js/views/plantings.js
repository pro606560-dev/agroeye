// ส่วน "บันทึกรอบปลูก" ในหน้าแปลงเดียว (#/plots/<รหัส>) task 19
// การอ่าน/เขียนข้อมูลอยู่ใน js/plantings-store.js ส่วนนี้ไม่บังคับกรอก และไม่มีผลกับคะแนน

// วาดส่วนรอบปลูกใหม่ทั้งส่วน (หลังบันทึกหรือลบ) message = ข้อความแจ้งผลด้านบน
function renderPlantings(slot, plotId, crops, message = "") {
  const record = findSavedPlot(plotId);
  if (!record) return;
  slot.innerHTML = plantingsHtml(record, crops, message);
  setupPlantingForm(slot, plotId, crops);
  setupPlantingDelete(slot, plotId, crops);
}

function plantingsHtml(record, crops, message) {
  const rows = sortedPlantings(record.plantings).map((item) => plantingRowHtml(item, crops)).join("");
  return `
    <section class="card plantings" aria-labelledby="plantings-title">
      <h3 id="plantings-title">บันทึกรอบปลูก</h3>
      <p class="muted">จดไว้ว่าปลูกอะไรจริง ปลูกและเก็บเกี่ยววันไหน ไม่ต้องกรอกก็ได้ และไม่มีผลกับคะแนน</p>
      <div id="planting-notice" role="status">${message}</div>
      ${rows ? `<ul class="planting-list">${rows}</ul>` : `<p>ยังไม่มีรอบปลูก กด "เพิ่มรอบปลูก" ด้านล่างเพื่อจดรอบแรก</p>`}
      <details class="fold" id="planting-fold">
        <summary>เพิ่มรอบปลูก</summary>
        ${plantingFormHtml(crops)}
      </details>
    </section>`;
}

function plantingCropName(item, crops) {
  return item.cropId ? cropName(crops, item.cropId) : escapeHtml(item.otherName ?? "");
}

// task 20: วันที่และหมายเหตุใช้แถว "หัวข้อ / คำ" แบบเดียวกับสรุปแปลง (factsListHtml อยู่ใน result.js)
function plantingRowHtml(item, crops) {
  const rows = [
    ["วันที่ปลูก", item.plantedOn ? thaiDay(item.plantedOn) : "ไม่ได้จด"],
    ["วันที่เก็บเกี่ยว", item.harvestedOn ? thaiDay(item.harvestedOn) : "ยังไม่ได้จด"],
  ];
  if (item.note) rows.push(["หมายเหตุ", escapeHtml(item.note)]);
  return `
    <li class="planting-row">
      <strong class="planting-name">${plantingCropName(item, crops)}</strong>
      ${factsListHtml(rows, "รายละเอียดรอบปลูก")}
      <div class="planting-delete" data-id="${escapeHtml(item.id)}">
        <button class="btn btn-secondary" type="button" data-action="ask">ลบรอบนี้</button>
      </div>
    </li>`;
}

function plantingFormHtml(crops) {
  const options = crops.map((crop) => `<option value="${escapeHtml(crop.id)}">${crop.nameTh}</option>`).join("");
  return `
    <form id="planting-form" novalidate>
      <div class="field">
        <label for="pl-crop">พืชที่ปลูก</label>
        <select id="pl-crop" class="input" name="cropId">
          <option value="">เลือกพืช</option>
          ${options}
          <option value="${OTHER_CROP}">พืชอื่น (พิมพ์ชื่อเอง)</option>
        </select>
      </div>
      <div class="field" id="pl-other-field" hidden>
        <label for="pl-other">ชื่อพืช</label>
        <input id="pl-other" class="input" name="otherName" type="text" maxlength="${PLANTING_OTHER_MAX}" autocomplete="off">
      </div>
      <div class="field">
        <label for="pl-planted">วันที่ปลูก (ไม่ใส่ก็ได้)</label>
        <input id="pl-planted" class="input" name="plantedOn" type="date">
      </div>
      <div class="field">
        <label for="pl-harvested">วันที่เก็บเกี่ยว (ไม่ใส่ก็ได้)</label>
        <input id="pl-harvested" class="input" name="harvestedOn" type="date">
      </div>
      <div class="field">
        <label for="pl-note">หมายเหตุ (ไม่ใส่ก็ได้)</label>
        <textarea id="pl-note" class="input" name="note" rows="2" maxlength="${PLANTING_NOTE_MAX}"
          aria-describedby="pl-note-hint"></textarea>
        <p id="pl-note-hint" class="muted">เช่น ผลผลิตที่ได้โดยประมาณ ไม่เกิน ${PLANTING_NOTE_MAX} ตัวอักษร</p>
      </div>
      <div id="planting-error" role="alert"></div>
      <button class="btn btn-primary" type="submit">บันทึกรอบปลูก</button>
    </form>`;
}

function readPlantingForm(form) {
  const data = new FormData(form);
  const text = (name) => String(data.get(name) ?? "");
  return {
    cropId: text("cropId"),
    otherName: text("otherName"),
    plantedOn: text("plantedOn"),
    harvestedOn: text("harvestedOn"),
    note: text("note"),
  };
}

function setupPlantingForm(slot, plotId, crops) {
  const form = slot.querySelector("#planting-form");
  const otherField = slot.querySelector("#pl-other-field");
  form.cropId.addEventListener("change", () => { otherField.hidden = form.cropId.value !== OTHER_CROP; });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = readPlantingForm(form);
    const errors = plantingErrors(input);
    if (errors.length > 0) {
      showPlantingError(slot, errors.join(" และ"));
      return;
    }
    if (!addPlanting(plotId, makePlanting(input))) {
      showPlantingError(slot, "บันทึกไม่ได้ เพราะเครื่องนี้เก็บข้อมูลไม่ได้ในตอนนี้ ลองปิดแอปแล้วเปิดใหม่");
      return;
    }
    renderPlantings(slot, plotId, crops, `<div class="alert alert-ok">บันทึกรอบปลูกแล้ว</div>`);
    slot.querySelector("#plantings-title").scrollIntoView({ block: "start" });
  });
}

function showPlantingError(slot, text) {
  slot.querySelector("#planting-error").innerHTML = `
    <div class="alert alert-warn"><strong class="alert-title">ยังบันทึกไม่ได้</strong><p>${text}</p></div>`;
}

// ลบ 2 ขั้น: กด "ลบรอบนี้" แล้วต้องกด "ลบ" อีกครั้ง กันกดพลาด
function setupPlantingDelete(slot, plotId, crops) {
  slot.querySelectorAll(".planting-delete").forEach((box) => {
    box.addEventListener("click", (event) => {
      const action = event.target.closest("button")?.dataset.action;
      if (action === "ask") showDeleteConfirm(box);
      if (action === "no") renderPlantings(slot, plotId, crops);
      if (action === "yes") {
        const ok = deletePlanting(plotId, box.dataset.id);
        const notice = ok ? "" : `<div class="alert alert-warn">ลบไม่ได้ เพราะเครื่องนี้เขียนข้อมูลไม่ได้ในตอนนี้</div>`;
        renderPlantings(slot, plotId, crops, ok ? `<div class="alert alert-ok">ลบรอบปลูกแล้ว</div>` : notice);
      }
    });
  });
}

function showDeleteConfirm(box) {
  box.innerHTML = `
    <p><strong>ลบรอบปลูกนี้ไหม</strong> ลบแล้วเอากลับมาไม่ได้</p>
    <button class="btn btn-danger" type="button" data-action="yes">ลบรอบปลูกนี้</button>
    <button class="btn btn-secondary" type="button" data-action="no">ไม่ลบ</button>`;
  box.querySelector('[data-action="no"]').focus();
}
