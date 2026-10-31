// เนื้อหาของแต่ละขั้นในหน้ากรอกข้อมูล
// ช่องกรอกทุกช่องตั้ง name ตรงกับชื่อใน draft แล้ว input.js จะอ่านและเติมค่าให้เอง
// title = คำถาม, html = เนื้อหา, check = ตรวจก่อนไปต่อ (คืนข้อความผิดพลาดหรือ null)
// skip = ปุ่มข้ามของขั้นนี้ (ไม่มี = ข้ามไม่ได้), setup = ผูกการทำงานเพิ่มหลังแสดงหน้า

function choiceHtml(field, value, picture, title, hint) {
  return `
    <label class="choice">
      <input type="radio" name="${field}" value="${value}">
      <img class="choice-picture" src="assets/${picture}.svg" alt="">
      <span class="choice-text">
        <span class="choice-title">${title}</span>
        ${hint ? `<span class="choice-hint">${hint}</span>` : ""}
      </span>
    </label>`;
}

function numberFieldHtml(field, label) {
  return `
    <div class="field">
      <label for="${field}">${label}</label>
      <input class="input" id="${field}" name="${field}" type="text" inputmode="decimal" autocomplete="off">
    </div>`;
}

// ---------- ขั้นชื่อแปลง ----------

function checkNameStep(draft) {
  if (!isBlank(draft.nameText)) {
    clearSurveyPoint(draft);
    return null;
  }
  if (draft.surveyPointId) return null;
  return "ยังไม่ได้ตั้งชื่อแปลง พิมพ์ชื่อ หรือกด “ข้าม ไม่ตั้งชื่อ”";
}

function skipNameStep(draft) {
  clearSurveyPoint(draft);
  draft.nameText = "";
}

function surveyPointButton(point, draft, onPick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-secondary";
  const isPicked = draft.surveyPointId === point.id;
  button.textContent = isPicked ? `✓ ${point.name}` : point.name;
  button.setAttribute("aria-pressed", String(isPicked));
  button.addEventListener("click", () => onPick(point));
  return button;
}

// ถ้าโหลดรายการจุดสำรวจไม่ได้ ส่วนนี้จะซ่อนไป ผู้ใช้ยังตั้งชื่อแปลงเองได้
async function setupNameStep(root, draft, goNext) {
  const points = await loadSurveyPoints();
  const box = root.querySelector("#survey-points");
  if (!box || points.length === 0) return;
  box.hidden = false;
  points.forEach((point) => {
    box.append(surveyPointButton(point, draft, (picked) => {
      applySurveyPoint(draft, picked);
      goNext();
    }));
  });
}

// ---------- ขั้น pH ----------

function showPhWord(root, text) {
  const word = root.querySelector("#ph-word");
  word.textContent = isTextInRange(text, PH_INPUT_MIN, PH_INPUT_MAX) ? phWord(parseDecimal(text)) : "";
}

function setupPhStep(root, draft) {
  const box = root.querySelector("#phText");
  const slider = root.querySelector("#ph-slider");
  const syncSlider = () => {
    if (isTextInRange(box.value, PH_INPUT_MIN, PH_INPUT_MAX)) slider.value = parseDecimal(box.value);
    showPhWord(root, box.value);
  };
  box.addEventListener("input", syncSlider);
  slider.addEventListener("input", () => {
    box.value = Number(slider.value).toFixed(1);
    draft.phText = box.value;
    showPhWord(root, box.value);
  });
  syncSlider();
}

// ---------- รายการขั้น ----------

const STEP_VIEWS = {
  name: {
    title: "แปลงนี้ชื่ออะไร",
    html: () => `
      <div class="field">
        <label for="nameText">ชื่อแปลง</label>
        <input class="input" id="nameText" name="nameText" type="text" maxlength="40" autocomplete="off">
        <p class="muted field-hint">เช่น แปลงหลังบ้าน ใช้ชื่อแปลงแทนชื่อคน</p>
      </div>
      <div id="survey-points" class="step-group" hidden>
        <h3>หรือเลือกแปลงที่สำรวจแล้ว</h3>
      </div>`,
    check: checkNameStep,
    skip: { label: "ข้าม ไม่ตั้งชื่อ", run: skipNameStep },
    setup: setupNameStep,
  },

  soil: {
    title: "ดินในแปลงเป็นแบบไหน",
    html: () => `
      ${choiceHtml("texture", "heavy", "soil-heavy", TEXTURE_NAMES.heavy, "เนื้อแน่น แตกเป็นร่อง")}
      ${choiceHtml("texture", "medium", "soil-medium", TEXTURE_NAMES.medium, "เป็นก้อนเล็ก ร่วนซุย")}
      ${choiceHtml("texture", "light", "soil-light", TEXTURE_NAMES.light, "เม็ดละเอียด หลุดจากมือง่าย")}
      <details class="help">
        <summary>วิธีทดสอบดินด้วยมือ</summary>
        <p>พรมน้ำให้ดินชื้น แล้วคลึงเป็นเส้นบนฝ่ามือ</p>
        <ul>
          <li>คลึงเป็นเส้นยาวไม่ขาด = ดินเหนียว</li>
          <li>เส้นสั้นแตก = ดินร่วน</li>
          <li>ปั้นไม่ติดและสากมือ = ดินทราย</li>
        </ul>
      </details>`,
    check: (draft) => (draft.texture ? null : "ยังไม่ได้เลือกดิน แตะรูปที่ตรงกับดินในแปลง ถ้าไม่แน่ใจ ลองกด “วิธีทดสอบดินด้วยมือ”"),
  },

  ph: {
    title: "ดินเปรี้ยวแค่ไหน (ค่า pH)",
    html: () => `
      <div class="ph-reading">
        <label for="phText">ค่า pH</label>
        <input class="input ph-input" id="phText" name="phText" type="text" inputmode="decimal" autocomplete="off">
        <output id="ph-word" class="ph-word" for="phText"></output>
      </div>
      <input id="ph-slider" class="ph-slider" type="range" min="${PH_SLIDER_MIN}" max="${PH_SLIDER_MAX}" step="0.1"
        value="7" aria-label="เลื่อนเพื่อเลือกค่า pH">
      <div class="ph-scale" aria-hidden="true"><span>เปรี้ยว</span><span>ด่าง</span></div>`,
    check: (draft) => phError(draft.phText),
    skip: { label: "ไม่ทราบ", run: (draft) => { draft.phText = ""; } },
    setup: setupPhStep,
  },

  water: {
    title: "ฝนตกหนักแล้ว น้ำขังนานไหม",
    html: () => `
      ${choiceHtml("drainage", "poor", "water-poor", "น้ำขังนาน")}
      ${choiceHtml("drainage", "good", "water-good", "น้ำไม่ขัง")}
      ${choiceHtml("drainage", ANSWER_UNKNOWN, "unknown", "ไม่ทราบ")}`,
    check: (draft) => (draft.drainage ? null : "ยังไม่ได้เลือกคำตอบ แตะข้อที่ตรงกับแปลง หรือแตะ “ไม่ทราบ”"),
  },

  month: {
    title: "อยากปลูกเดือนไหน",
    html: () => `
      <div class="month-grid" role="group" aria-label="เดือนที่อยากปลูก">
        ${MONTH_NAMES.map((name, index) => `
          <label class="month-choice">
            <input type="radio" name="month" value="${index + 1}">
            <span>${name}</span>
          </label>`).join("")}
      </div>`,
    check: (draft) => (draft.month ? null : "ยังไม่ได้เลือกเดือน แตะเดือนที่อยากปลูก หรือกด “ยังไม่รู้เดือน”"),
    skip: { label: "ยังไม่รู้เดือน", run: (draft) => { draft.month = null; } },
  },

  extra: {
    title: "มีข้อมูลเพิ่มเติมไหม",
    intro: "ไม่บังคับ ถ้าไม่มีให้กด “ข้าม ไปดูผล”",
    html: (draft) => `
      <h3>แปลงได้แดดแบบไหน</h3>
      ${choiceHtml("light", "full-sun", "light-sun", "แดดจัด")}
      ${choiceHtml("light", "shade", "light-shade", "ร่มรำไร")}
      ${numberFieldHtml("moistureText", "ความชื้นดิน (%)")}
      <details class="help" ${hasNutrientValue(draft) ? "open" : ""}>
        <summary>ค่าปุ๋ยในดิน (N/P/K)</summary>
        ${numberFieldHtml("nitrogenText", "ไนโตรเจน (N)")}
        ${numberFieldHtml("phosphorusText", "ฟอสฟอรัส (P)")}
        ${numberFieldHtml("potassiumText", "โพแทสเซียม (K)")}
      </details>`,
    check: extraError,
    skip: { label: "ข้าม ไปดูผล", run: clearExtraStep },
  },
};

function hasNutrientValue(draft) {
  return [draft.nitrogenText, draft.phosphorusText, draft.potassiumText].some((text) => !isBlank(text));
}

function clearExtraStep(draft) {
  draft.light = null;
  ["moistureText", "nitrogenText", "phosphorusText", "potassiumText"].forEach((key) => { draft[key] = ""; });
}
