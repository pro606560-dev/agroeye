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
      ${rows ? `<ul class="planting-list">${rows}</ul>` : `
        <div class="empty-state empty-small">
          ${EMPTY_PICTURE}
          <p>ยังไม่มีรอบปลูก กด "เพิ่มรอบปลูก" ด้านล่างเพื่อจดรอบแรก</p>
        </div>`}
      <details class="fold" id="planting-fold">
        <summary>เพิ่มรอบปลูก</summary>
        ${plantingFormHtml(crops, record.top3)}
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

// task 20 ช่วงที่ 2: ไอคอนกลุ่มพืช (เส้น) ฝังในโค้ด ใช้ออฟไลน์ได้โดยไม่ต้องเพิ่มไฟล์ที่ต้องแคช
const CROP_ICON_START = `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">`;
const CROP_GROUP_ICONS = {
  rice: `${CROP_ICON_START}<path d="M12 22V5"/><ellipse cx="12" cy="3.6" rx="1.4" ry="2.2"/>
    <ellipse cx="9" cy="8" rx="1.5" ry="2.8" transform="rotate(-35 9 8)"/><ellipse cx="15" cy="8" rx="1.5" ry="2.8" transform="rotate(35 15 8)"/>
    <ellipse cx="9" cy="13" rx="1.5" ry="2.8" transform="rotate(-35 9 13)"/><ellipse cx="15" cy="13" rx="1.5" ry="2.8" transform="rotate(35 15 13)"/></svg>`,
  field: `${CROP_ICON_START}<path d="M3 21h18M12 21V10"/><path d="M12 14c-4 0-6-2-6-6 4 0 6 2 6 6z"/>
    <path d="M12 11c0-4 2-6 6-6 0 4-2 6-6 6z"/></svg>`,
  tree: `${CROP_ICON_START}<circle cx="12" cy="9" r="6.5"/><path d="M12 15.5V22M8 22h8M12 18l-2.5-2M12 17l2.5-2"/></svg>`,
  vegetable: `${CROP_ICON_START}<path d="M12 21c-5 0-8-4-8-9 0-4 3-7.5 8-9 5 1.5 8 5 8 9 0 5-3 9-8 9z"/>
    <path d="M12 21V8M12 13l-3-3M12 17l3-3"/></svg>`,
  other: `${CROP_ICON_START}<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/></svg>`,
};

function cropGroupIcon(group) {
  if (group === "ข้าว") return CROP_GROUP_ICONS.rice;
  if (group === "ไม้ผล" || group === "ไม้ยืนต้น") return CROP_GROUP_ICONS.tree;
  if (String(group).startsWith("พืชผัก")) return CROP_GROUP_ICONS.vegetable;
  return CROP_GROUP_ICONS.field;
}

function cropChoiceHtml(value, icon, title, hint) {
  return `
    <label class="choice crop-choice">
      <input type="radio" name="cropId" value="${escapeHtml(value)}">
      <span class="crop-icon" aria-hidden="true">${icon}</span>
      <span class="choice-text"><span class="choice-title">${title}</span><span class="choice-hint">${hint}</span></span>
    </label>`;
}

// การ์ดเลือกพืช (แบบรายการเลือกพันธุ์ของ Dragonfly): พืช 3 อันดับที่แอปแนะนำให้แปลงนี้ครั้งล่าสุด
// (top3 ที่บันทึกไว้ ไม่ได้คิดคะแนนใหม่) ขึ้นก่อนพร้อมดาว ที่เหลือเรียงตามไฟล์ข้อมูล ปิดท้ายด้วย "พืชอื่น"
function cropChoicesHtml(crops, top3) {
  const topIds = (top3 ?? []).map((item) => item.id);
  const topCrops = topIds.map((id) => cropById(crops, id)).filter(Boolean);
  const otherCrops = crops.filter((crop) => !topIds.includes(crop.id));
  const starHint = `<span class="crop-star" aria-hidden="true">★</span> <span class="crop-top">แนะนำ</span>`;
  const row = (crop, hint) => cropChoiceHtml(crop.id, cropGroupIcon(crop.group), crop.nameTh, hint);
  return [
    ...topCrops.map((crop) => row(crop, starHint)),
    ...otherCrops.map((crop) => row(crop, crop.group)),
    cropChoiceHtml(OTHER_CROP, CROP_GROUP_ICONS.other, "พืชอื่น", "พิมพ์ชื่อพืชเอง"),
  ].join("");
}

function plantingFormHtml(crops, top3) {
  return `
    <form id="planting-form" novalidate>
      <fieldset class="crop-field">
        <legend>พืชที่ปลูก (แตะเลือก 1 อย่าง)</legend>
        ${cropChoicesHtml(crops, top3)}
      </fieldset>
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
  // ช่องเลือกพืชเป็นการ์ดแบบ radio หลายอัน จึงฟังการเปลี่ยนที่ทั้งฟอร์ม
  form.addEventListener("change", () => { otherField.hidden = form.cropId.value !== OTHER_CROP; });
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
