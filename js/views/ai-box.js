// กล่อง "คำอธิบายจาก AI" ในหน้าพืช (task 16) ใส่ใน #ai-slot ของ js/views/crop.js
// แสดงเฉพาะเมื่อเปิดจากแปลงที่เพิ่งตรวจ และผู้ใช้ใส่รหัส AI ไว้แล้ว
// ถ้า AI ใช้ไม่ได้ หน้านี้ยังมีวิธีดูแลและความเสี่ยงจาก crops.json ครบเหมือนเดิม

const AI_BOX_TITLE = "คำอธิบายสำหรับแปลงนี้";
const AI_WARNING = "คำอธิบายจาก AI อาจผิดพลาดได้";

function aiBoxHtml(content) {
  return `<section class="detail ai-box"><h3>${AI_BOX_TITLE}</h3>${content}</section>`;
}

function aiAnswerHtml(text) {
  const lines = text.split("\n").map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  return `<p class="ai-badge">${AI_WARNING}</p>${lines}`;
}

async function showAiExplanation(container, crop) {
  const slot = container.querySelector("#ai-slot");
  if (!slot || !currentPlot || !aiKey()) return;
  const cropId = crop.id;
  slot.setAttribute("aria-live", "polite"); // โปรแกรมอ่านหน้าจออ่านคำอธิบายเมื่อมาถึง
  slot.innerHTML = aiBoxHtml(`<p class="muted">กำลังขอคำอธิบายจาก AI…</p>`);
  const result = scoreCrop(currentPlot, crop, currentClimate());
  const answer = await explain(currentPlot, result, crop);
  if (matchRoute(window.location.hash)?.param !== cropId) return; // ผู้ใช้ออกจากหน้านี้แล้ว
  slot.innerHTML = aiBoxHtml(answer.ok
    ? aiAnswerHtml(answer.text)
    : `<p class="ai-fail">${AI_FAIL_TEXTS[answer.reason] ?? AI_FAIL_TEXTS.error}</p>`);
}
