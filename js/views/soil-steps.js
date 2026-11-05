// ขั้นทดสอบเนื้อดิน 3 วิธี และขั้นเลือกดิน (หน้าละ 1 วิธี)
// ตรรกะอยู่ใน js/soil-test.js เกณฑ์ตัวเลขอยู่ใน js/config.js
// ต้องโหลดก่อน input-steps.js เพราะ STEP_VIEWS ใช้ SOIL_STEP_VIEWS

const SOIL_ADVICE = "ถ้าเป็นไปได้ ให้ถามหมอดินอาสา หรือสถานีพัฒนาที่ดินลำปาง";

function yesNoHtml(field, question) {
  return `
    <fieldset class="yes-no">
      <legend>${question}</legend>
      <div class="yes-no-row">
        <label class="yes-no-choice"><input type="radio" name="${field}" value="yes"><span>ใช่</span></label>
        <label class="yes-no-choice"><input type="radio" name="${field}" value="no"><span>ไม่ใช่</span></label>
      </div>
    </fieldset>`;
}

// ไม้บรรทัดบนจอใช้หน่วย ซม. ของเบราว์เซอร์ จอแต่ละรุ่นอาจยาวไม่ตรงจริง
function rulerHtml() {
  const ticks = [0, 1, 2, 3, 4, 5].map((cm) => `<span class="ruler-tick" style="left:${cm}cm">${cm}</span>`).join("");
  return `
    <div class="ruler" aria-hidden="true">
      ${ticks}
      <span class="ruler-mark" style="left:${RIBBON_SAND_MAX_CM}cm"></span>
      <span class="ruler-mark" style="left:${RIBBON_CLAY_MIN_CM}cm"></span>
    </div>
    <p class="muted field-hint">ไม้บรรทัดบนจอ (ซม.) ถ้ามีไม้บรรทัดจริง ใช้อันจริงจะแม่นกว่า</p>`;
}

function clearKeys(draft, keys, empty) {
  keys.forEach((key) => { draft[key] = empty; });
}

// ---------- ขั้นเลือกดิน: สรุปผลทดสอบก่อนให้เลือก ----------

function soilResultText(texture) {
  return texture ? TEXTURE_NAMES[texture] : "ไม่ได้ทำ";
}

function soilSummaryAlert(results, agreed) {
  const alert = document.createElement("div");
  alert.className = agreed ? "alert alert-ok" : "alert alert-warn";
  const title = document.createElement("strong");
  title.className = "alert-title";
  const count = results.filter((result) => result === agreed).length;
  title.textContent = agreed
    ? `ค่อนข้างมั่นใจ: ${count} จาก 3 วิธีบอกว่าเป็น${TEXTURE_NAMES[agreed]}`
    : "ไม่แน่ใจ: ผลทดสอบยังไม่ตรงกัน ให้เลือกรูปที่ใกล้ที่สุดเอง";
  const detail = document.createElement("p");
  const names = ["ปั้นเส้น", "ขวดน้ำ", "จากที่เคยเห็น"];
  detail.textContent = names.map((name, i) => `${name}: ${soilResultText(results[i])}`).join(" · ");
  alert.append(title, detail);
  if (!agreed) alert.append(Object.assign(document.createElement("p"), { textContent: SOIL_ADVICE }));
  return alert;
}

function setupSoilStep(root, draft) {
  const results = soilTestResults(draft);
  const agreed = agreedTexture(results);
  root.querySelector("#soil-summary").append(soilSummaryAlert(results, agreed));
  if (agreed && !draft.texture) {
    draft.texture = agreed;
    root.querySelector(`input[name="texture"][value="${agreed}"]`).checked = true;
  }
}

// ---------- รายการขั้น ----------

const SOIL_STEP_VIEWS = {
  "soil-ball": {
    title: "ทดสอบดิน วิธีที่ 1: ปั้นเป็นเส้น",
    html: () => `
      <ol class="test-steps">
        <li>ขุดดินลึกประมาณ 1 คืบ จาก 3–5 จุดในแปลง เก็บหิน กรวด ลูกรังออกก่อน เพราะทำให้ทายพลาดง่าย</li>
        <li>หยิบดินขนาดลูกปิงปอง พรมน้ำ แล้วนวดจนเหนียวเหมือนดินน้ำมัน</li>
        <li>บีบเป็นก้อน แล้วแบมือ ถ้าก้อนแตกร่วน ให้เลือกข้อแรก</li>
        <li>ถ้ายังเป็นก้อน ใช้นิ้วโป้งดันดินเป็นแผ่นยื่นเลยนิ้วชี้ จนหักเอง แล้ววางเทียบไม้บรรทัดด้านล่าง</li>
      </ol>
      ${rulerHtml()}
      <h3>ผลเป็นแบบไหน</h3>
      ${choiceHtml("ballAnswer", "crumble", "soil-light", "บีบแล้วก้อนแตกร่วน")}
      ${choiceHtml("ballAnswer", "long", "soil-heavy", `เส้นยาว ${RIBBON_CLAY_MIN_CM} ซม. ขึ้นไป`)}
      ${choiceHtml("ballAnswer", "short-gritty", "soil-light", `เส้นสั้นกว่า ${RIBBON_SAND_MAX_CM} ซม.`, "และสากมือมาก")}
      ${choiceHtml("ballAnswer", "middle", "soil-medium", "แบบอื่น", `เช่น เส้นยาว ${RIBBON_SAND_MAX_CM}–${RIBBON_CLAY_MIN_CM} ซม.`)}`,
    check: (draft) => (draft.ballAnswer ? null : "ยังไม่ได้เลือกผล แตะข้อที่ตรงกับดิน หรือกด “ไม่ได้ลอง ข้ามไป”"),
    skip: { label: "ไม่ได้ลอง ข้ามไป", run: (draft) => { draft.ballAnswer = null; } },
  },

  "soil-bottle": {
    title: "ทดสอบดิน วิธีที่ 2: ขวดน้ำใส",
    intro: "ไม่บังคับ ใช้เวลา 1 วัน ถ้าไม่สะดวก กด “ไม่ได้ทำ ข้ามไป”",
    html: () => `
      <ol class="test-steps">
        <li>ใส่ดินประมาณ 1 ใน 3 ของขวดน้ำใสขนาด 600 มล.</li>
        <li>เติมน้ำเกือบเต็ม ใส่น้ำยาล้างจานครึ่งช้อนชา ปิดฝา เขย่า 2–3 นาที</li>
        <li>วางนิ่ง ครบ 1 นาที ขีดเส้นที่ชั้นทรายก้นขวด</li>
        <li>ทิ้งไว้ 1 วัน แล้วขีดเส้นที่ผิวดินทั้งหมด วัดความสูงจากก้นขวด</li>
      </ol>
      ${numberFieldHtml("bottleSandText", "ชั้นทราย สูงกี่ ซม.")}
      ${numberFieldHtml("bottleTotalText", "ดินทั้งหมด สูงกี่ ซม.")}
      ${yesNoHtml("bottleCloudy", "ผ่านไป 1 วัน น้ำยังขุ่นอยู่ไหม")}
      <p class="muted">ผลจากขวดเป็นค่าประมาณ เกณฑ์นี้ยังไม่ได้ทดสอบกับดินจริง</p>`,
    check: bottleError,
    skip: {
      label: "ไม่ได้ทำ ข้ามไป",
      run: (draft) => {
        clearKeys(draft, ["bottleSandText", "bottleTotalText"], "");
        draft.bottleCloudy = null;
      },
    },
  },

  "soil-feel": {
    title: "ทดสอบดิน วิธีที่ 3: จากที่เคยเห็น",
    html: () => `
      ${yesNoHtml("feelSticky", "หน้าฝน ดินติดจอบเป็นก้อนเหนียวไหม")}
      ${yesNoHtml("feelCracks", "หน้าแล้ง ดินแตกระแหง หรือแข็งมากไหม")}
      ${yesNoHtml("feelPonding", "ฝนตกแล้ว น้ำขังเป็นวันไหม")}
      ${yesNoHtml("feelSandy", "ดินแห้งเร็ว เป็นเม็ดทราย ต้องรดน้ำบ่อยไหม")}`,
    check: (draft) => (feelTexture(draft) ? null : "ยังไม่ได้ตอบ ตอบอย่างน้อย 1 ข้อ หรือกด “ไม่ทราบ ข้ามไป”"),
    skip: {
      label: "ไม่ทราบ ข้ามไป",
      run: (draft) => clearKeys(draft, [...FEEL_CLAY_QUESTIONS, FEEL_SAND_QUESTION], null),
    },
  },

  soil: {
    title: "ดินในแปลงเป็นแบบไหน",
    html: () => `
      <div id="soil-summary"></div>
      ${choiceHtml("texture", "heavy", "soil-heavy", TEXTURE_NAMES.heavy, "เนื้อแน่น แตกเป็นร่อง")}
      ${choiceHtml("texture", "medium", "soil-medium", TEXTURE_NAMES.medium, "เป็นก้อนเล็ก ร่วนซุย")}
      ${choiceHtml("texture", "light", "soil-light", TEXTURE_NAMES.light, "เม็ดละเอียด หลุดจากมือง่าย")}`,
    check: (draft) => (draft.texture ? null : "ยังไม่ได้เลือกดิน แตะรูปที่ใกล้กับดินในแปลงที่สุด"),
    setup: setupSoilStep,
  },
};
