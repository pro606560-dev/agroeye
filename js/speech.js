// อ่านออกเสียงภาษาไทยด้วย speechSynthesis ของเบราว์เซอร์ (task 15, docs/SPEC.md หัวข้อเทคโนโลยี)
// ถ้าเครื่องไม่มีเสียงไทย ปุ่มฟังจะถูกซ่อนไว้ทั้งหมด ไม่มีปุ่มที่กดแล้วเงียบ
// ข้อความที่อ่านสร้างใน js/speech-text.js

const SPEECH_RATE_KEY = "speechRate";
const SPEAK_STOP_LABEL = "หยุดฟัง";

let thaiVoice = null;           // เสียงไทยที่เจอ ถ้ายังไม่เจอเป็น null
let activeSpeakButton = null;   // ปุ่มที่กำลังอ่านอยู่ (กดซ้ำ = หยุด)

// คืนเสียงภาษาไทยตัวแรกในรายการ (lang อาจเขียนเป็น th-TH หรือ th_TH)
function findThaiVoice(voices) {
  return voices.find((voice) => /^th([-_]|$)/i.test(voice.lang)) ?? null;
}

function speechSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function hasThaiSpeech() {
  return thaiVoice !== null;
}

// ความเร็วที่ผู้ใช้เลือกในหน้าตั้งค่า (normal / slow) ถ้าค่าแปลก ใช้ปกติ
function speechRateChoice() {
  const choice = readStorage(SPEECH_RATE_KEY, "normal");
  return Object.hasOwn(SPEECH_RATES, choice) ? choice : "normal";
}

function saveSpeechRateChoice(choice) {
  return writeStorage(SPEECH_RATE_KEY, choice);
}

// เสียงบางเครื่องโหลดช้า จึงตรวจซ้ำทุกครั้งที่รายการเสียงเปลี่ยน แล้วแสดง/ซ่อนปุ่มให้ตรง
function refreshVoices() {
  thaiVoice = findThaiVoice(window.speechSynthesis.getVoices());
  document.querySelectorAll(".speak-btn").forEach((button) => { button.hidden = !hasThaiSpeech(); });
  document.dispatchEvent(new CustomEvent("agroeye:voices"));
}

function startSpeech() {
  if (!speechSupported()) return;
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

// หยุดอ่านและคืนป้ายปุ่มเดิม (เรียกเมื่อกดซ้ำ อ่านจบ หรือเปลี่ยนหน้า)
function stopSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  if (activeSpeakButton) {
    activeSpeakButton.textContent = activeSpeakButton.dataset.label;
    activeSpeakButton.setAttribute("aria-pressed", "false");
  }
  activeSpeakButton = null;
}

// อ่านทีละประโยค เบราว์เซอร์จะต่อคิวให้เอง ประโยคสุดท้ายจบแล้วคืนปุ่มเป็น "ฟัง"
function speakSentences(sentences, button) {
  const rate = SPEECH_RATES[speechRateChoice()];
  sentences.forEach((sentence, index) => {
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.voice = thaiVoice;
    utterance.lang = thaiVoice.lang;
    utterance.rate = rate;
    if (index === sentences.length - 1) utterance.onend = () => { if (activeSpeakButton === button) stopSpeaking(); };
    utterance.onerror = () => { if (activeSpeakButton === button) stopSpeaking(); };
    window.speechSynthesis.speak(utterance);
  });
}

// HTML ของปุ่มฟัง ซ่อนไว้ก่อนเสมอ แสดงเมื่อเจอเสียงไทย
function speakButtonHtml(label) {
  return `<button class="btn btn-secondary speak-btn" type="button" aria-pressed="false" data-label="${label}" hidden>${label}</button>`;
}

// ผูกปุ่มกับข้อความ getSentences() เรียกตอนกด เพื่อให้ได้ข้อความล่าสุด
function setupSpeakButton(button, getSentences) {
  if (!button) return;
  button.hidden = !hasThaiSpeech();
  button.addEventListener("click", () => {
    const wasThisButton = activeSpeakButton === button;
    stopSpeaking();
    if (wasThisButton || !hasThaiSpeech()) return;
    activeSpeakButton = button;
    button.textContent = SPEAK_STOP_LABEL;
    button.setAttribute("aria-pressed", "true");
    speakSentences(getSentences(), button);
  });
}
