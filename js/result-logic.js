// ตรรกะของหน้าผลลัพธ์ ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้

const MIN_STARS = 1;
const MAX_REASONS = 3;
const MAX_PROBLEM_REASONS = 2;

// คะแนน ÷ 20 แล้วปัดเป็นครึ่งดาว เช่น 73 ÷ 20 = 3.65 ได้ 3.5 ดาว ต่ำสุด 1 ดาว
function starCount(score) {
  return Math.max(MIN_STARS, Math.round((score / 20) * 2) / 2);
}

// พืชที่คะแนน 0 ไม่เข้ากับแปลงเลย จึงไม่แนะนำ แม้อยู่ใน 3 อันดับแรก
function splitRecommendations(ranking) {
  const recommended = ranking.top.filter((result) => result.score > 0);
  const notFit = ranking.top.filter((result) => result.score === 0);
  return { recommended, others: [...notFit, ...ranking.others].sort(compareResults) };
}

function byWeightThenScore(a, b) {
  return a.factor.factorScore - b.factor.factorScore || b.factor.weight - a.factor.weight;
}

// เลือกเหตุผลไม่เกิน 3 บรรทัด: เรื่องที่ต้องระวังมาก่อนเพื่อไม่ให้ถูกซ่อน แล้วเติมเรื่องที่ดี
// คืน [{ text, good }] เรียงเรื่องดีขึ้นก่อน
function pickReasons(result, crop) {
  const texts = buildReasons(result, crop);
  const items = result.factors
    .filter((factor) => factor.used)
    .map((factor, index) => ({ factor, text: texts[index] }));
  const problems = items.filter((item) => item.factor.factorScore < 1)
    .sort(byWeightThenScore).slice(0, MAX_PROBLEM_REASONS);
  const goods = items.filter((item) => item.factor.factorScore === 1)
    .sort((a, b) => b.factor.weight - a.factor.weight)
    .slice(0, MAX_REASONS - problems.length);
  return [
    ...goods.map((item) => ({ text: item.text, good: true })),
    ...problems.map((item) => ({ text: item.text, good: false })),
  ];
}

// บอกว่าถ้าตอบคำถามไหนเพิ่ม ผลจะแม่นขึ้น เรียงจากปัจจัยที่มีน้ำหนักมากก่อน
function moreDataHints(plot) {
  const hints = [
    { missing: plot.ph == null, text: "ถ้ารู้ค่า pH (ความเปรี้ยวของดิน) ผลจะแม่นขึ้น" },
    { missing: plot.texture == null, text: "ถ้ารู้ประเภทดิน ผลจะแม่นขึ้น" },
    { missing: plot.drainage == null, text: "ถ้ารู้ว่าฝนตกหนักแล้วน้ำขังนานไหม ผลจะแม่นขึ้น" },
    { missing: plot.month == null, text: "ถ้าเลือกเดือนที่จะปลูก ผลจะแม่นขึ้น" },
    { missing: plot.light == null, text: "ถ้ารู้ว่าแปลงได้แดดจัดหรือร่มรำไร ผลจะแม่นขึ้น" },
  ];
  return hints.filter((hint) => hint.missing).map((hint) => hint.text);
}

// ข้อความจากผู้ใช้ต้องแปลงก่อนใส่ใน HTML เช่น ชื่อแปลงที่มีเครื่องหมาย <
function escapeHtml(text) {
  const box = document.createElement("div");
  box.textContent = text;
  return box.innerHTML;
}
