// หน้ากรอกข้อมูลทีละขั้น: กรอบหน้า แถบบอกขั้น ปุ่มไปต่อ
// เนื้อหาแต่ละขั้นอยู่ใน input-steps.js ตรรกะอยู่ใน js/wizard.js
// แต่ละขั้นมี hash ของตัวเอง ปุ่มย้อนกลับจึงถอยทีละขั้นโดยคำตอบยังอยู่ใน draft

const FIRST_STEP = WIZARD_STEPS[0];

let wizardDraft = null; // คำตอบระหว่างกรอก
let currentPlot = null; // ข้อมูลแปลงที่กรอกเสร็จแล้ว หน้าผลลัพธ์อ่านจากตัวนี้
let linkedPlotId = null; // รหัสแปลงที่บันทึกไว้ ถ้ากำลังตรวจแปลงเดิมซ้ำ (task 11) ถ้าเป็นแปลงใหม่เป็น null

function startNewDraft() {
  wizardDraft = createDraft(new Date().getMonth() + 1);
  linkedPlotId = null;
  // แก้ URL โดยไม่เพิ่มประวัติ ไม่อย่างนั้นปุ่มย้อนกลับจะวนกลับมาล้างคำตอบ
  window.history.replaceState(null, "", `#/input/${FIRST_STEP}`);
}

// เปิด #/input = เริ่มใหม่, รีเฟรชกลางทางคำตอบหายจึงเริ่มใหม่ด้วย
function resolveStep(param) {
  if (param === null || !wizardDraft || !activeSteps(wizardDraft).includes(param)) {
    startNewDraft();
    return FIRST_STEP;
  }
  return param;
}

function renderInput(container, param) {
  const step = resolveStep(param);
  const view = STEP_VIEWS[step];
  container.innerHTML = stepFrameHtml(step, view);
  const form = container.querySelector("#wizard-form");
  fillForm(form, wizardDraft);
  form.addEventListener("input", () => readForm(form, wizardDraft));
  form.addEventListener("change", () => readForm(form, wizardDraft));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitStep(container, step, view);
  });
  container.querySelector("#step-skip")?.addEventListener("click", () => {
    view.skip.run(wizardDraft);
    leaveStep(step);
  });
  showPrefilledNotice(container, step);
  view.setup?.(container, wizardDraft, () => leaveStep(step));
}

function stepFrameHtml(step, view) {
  const steps = activeSteps(wizardDraft);
  const isLast = nextStep(wizardDraft, step) === null;
  return `
    <p class="step-count">ขั้นที่ ${steps.indexOf(step) + 1} จาก ${steps.length}</p>
    <h2 tabindex="-1">${view.title}</h2>
    ${view.intro ? `<p>${view.intro}</p>` : ""}
    <div id="prefilled-notice"></div>
    <form id="wizard-form" novalidate>
      ${view.html(wizardDraft)}
      <div id="step-error" role="alert"></div>
      <div class="step-actions">
        ${view.skip ? `<button id="step-skip" class="btn btn-secondary" type="button">${view.skip.label}</button>` : ""}
        <button class="btn btn-primary" type="submit">${isLast ? "ดูผล" : "ถัดไป"}</button>
      </div>
    </form>`;
}

// เติมคำตอบเดิมกลับลงช่อง เพื่อให้ย้อนกลับมาแล้วค่าไม่หาย
function fillForm(form, draft) {
  [...form.elements].filter((el) => el.name).forEach((el) => {
    if (el.type === "radio") el.checked = String(draft[el.name]) === el.value;
    else el.value = draft[el.name] ?? "";
  });
}

function readForm(form, draft) {
  [...form.elements].filter((el) => el.name).forEach((el) => {
    if (el.type !== "radio") draft[el.name] = el.value;
    else if (el.checked) draft[el.name] = el.value;
  });
}

function submitStep(container, step, view) {
  const error = view.check(wizardDraft);
  if (error) {
    showStepError(container, error);
    return;
  }
  leaveStep(step);
}

function showStepError(container, message) {
  const alert = document.createElement("div");
  alert.className = "alert alert-warn";
  alert.textContent = message;
  container.querySelector("#step-error").replaceChildren(alert);
  alert.scrollIntoView({ block: "center" });
}

function leaveStep(step) {
  const next = nextStep(wizardDraft, step);
  if (next) {
    window.location.hash = `#/input/${next}`;
    return;
  }
  currentPlot = buildPlot(wizardDraft);
  window.location.hash = "#/result";
}

// เริ่มจากแปลงที่บันทึกไว้: "recheck" = ตรวจใหม่ด้วยข้อมูลเดิม, "edit" = กลับไปแก้คำตอบ
// ผลที่บันทึกต่อจากนี้จะเป็นรอบใหม่ของแปลงเดิม
function startFromSaved(record, mode) {
  wizardDraft = structuredClone(record.answers);
  linkedPlotId = record.id;
  if (mode === "edit") {
    window.location.hash = `#/input/${activeSteps(wizardDraft)[0]}`;
    return;
  }
  currentPlot = buildPlot(wizardDraft);
  window.location.hash = "#/result";
}

// บอกค่าที่เติมจากจุดสำรวจไว้ที่ขั้นแรกหลังเลือกแปลง ผู้ใช้จะได้รู้ว่าทำไมคำถามหายไป
function showPrefilledNotice(container, step) {
  if (wizardDraft.prefilled.length === 0 || activeSteps(wizardDraft)[1] !== step) return;
  const alert = document.createElement("div");
  alert.className = "alert alert-ok";
  const title = document.createElement("strong");
  title.className = "alert-title";
  title.textContent = `ใช้ค่าที่สำรวจไว้ของ${wizardDraft.surveyPointName}`;
  alert.append(title, prefilledSummary(wizardDraft));
  container.querySelector("#prefilled-notice").append(alert);
}

function prefilledSummary(draft) {
  const parts = [];
  if (draft.prefilled.includes("texture")) parts.push(TEXTURE_NAMES[draft.texture]);
  if (draft.prefilled.includes("phText")) parts.push(`${phWord(Number(draft.phText))} (pH ${draft.phText})`);
  if (draft.prefilled.includes("drainage")) parts.push(draft.drainage === "poor" ? "น้ำขังนาน" : "น้ำไม่ขัง");
  return parts.join(", ");
}
