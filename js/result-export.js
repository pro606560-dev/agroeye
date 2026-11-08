// บันทึกผลหน้าผลลัพธ์เป็นรูป (task 19) ใช้ downloadCanvas, EXPORT_FONT และสีจาก js/proof-export.js
// ในรูปมีแค่ชื่อแปลง วันที่ พืช 3 อันดับ คะแนน เหตุผลสั้น ๆ และข้อความเตือน
// ไม่ใส่พิกัด รหัสจุดสำรวจ หรือข้อมูลอื่นของเจ้าของแปลง

const RESULT_IMAGE_NOTE = "ผลจากสูตรคะแนนของ AgroEye ใช้ประกอบการตัดสินใจเท่านั้น";
const RESULT_IMAGE_WIDTH = 420; // กว้างเท่าจอมือถือ ตัวอักษรในรูปจึงไม่เล็กลงมากเมื่อเปิดดูบนจอ 360px
const RESULT_IMAGE_PAD = 20;
const RESULT_IMAGE_STYLES = {
  title: { size: 28, bold: true, color: CHART_COLORS[0], gapBefore: 0 },
  info: { size: 21, bold: false, color: CHART_INK, gapBefore: 0 },
  crop: { size: 25, bold: true, color: CHART_COLORS[0], gapBefore: 18 },
  score: { size: 21, bold: true, color: CHART_INK, gapBefore: 0 },
  body: { size: 21, bold: false, color: CHART_INK, gapBefore: 0 },
  note: { size: 20, bold: true, color: CHART_INK, gapBefore: 18 },
};

// ข้อความทีละบรรทัดของรูป (ไม่แตะหน้าจอ จึงทดสอบใน tests.html ได้)
// คืน [{ kind, text }] kind คือชื่อแบบตัวอักษรใน RESULT_IMAGE_STYLES
function resultImageLines(plot, recommended, crops, now = new Date()) {
  const lines = [
    { kind: "title", text: "AgroEye ผลตรวจแปลง" },
    { kind: "info", text: `แปลง: ${plot.name || UNNAMED_PLOT}` },
    { kind: "info", text: `วันที่ตรวจ: ${thaiDate(now.toISOString())}` },
  ];
  if (recommended.length === 0) lines.push({ kind: "crop", text: "ยังแนะนำพืชให้แปลงนี้ไม่ได้" });
  recommended.slice(0, TOP_CROP_COUNT).forEach((result, index) => {
    const crop = cropById(crops, result.cropId);
    lines.push({ kind: "crop", text: `อันดับ ${index + 1} ${crop.nameTh}` });
    lines.push({ kind: "score", text: `${result.score} คะแนน จาก 100` });
    lines.push({ kind: "body", text: `ความมั่นใจ: ${CONFIDENCE_LABELS[result.confidence]}` });
    for (const reason of pickReasons(result, crop)) {
      lines.push({ kind: "body", text: `${reason.good ? "✓" : "!"} ${reason.text}` });
    }
  });
  lines.push({ kind: "note", text: RESULT_IMAGE_NOTE });
  lines.push({ kind: "body", text: DISCLAIMER });
  return lines;
}

function fontOf(style) {
  return `${style.bold ? "bold " : ""}${style.size}px ${EXPORT_FONT}`;
}

// ตัดข้อความยาวเป็นหลายบรรทัด ภาษาไทยไม่มีช่องว่างระหว่างคำ จึงใช้ Intl.Segmenter แยกคำ
// ถ้าเบราว์เซอร์ไม่มี Intl.Segmenter จะตัดทีละตัวอักษรแทน
function wrapText(ctx, text, maxWidth) {
  const pieces = window.Intl?.Segmenter
    ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text), (part) => part.segment)
    : Array.from(text);
  const rows = [];
  let row = "";
  for (const piece of pieces) {
    if (row && ctx.measureText(row + piece).width > maxWidth) {
      rows.push(row.trimEnd());
      row = piece.trimStart();
    } else {
      row += piece;
    }
  }
  if (row) rows.push(row);
  return rows;
}

// วาดบรรทัดทั้งหมดลง canvas พื้นขาว (วัดความสูงก่อน แล้วค่อยวาด)
function resultLinesToCanvas(lines) {
  const scale = 2;
  const maxWidth = RESULT_IMAGE_WIDTH - RESULT_IMAGE_PAD * 2;
  const measure = document.createElement("canvas").getContext("2d");
  const rows = [];
  for (const line of lines) {
    const style = RESULT_IMAGE_STYLES[line.kind];
    measure.font = fontOf(style);
    wrapText(measure, line.text, maxWidth).forEach((text, i) =>
      rows.push({ text, style, gap: i === 0 ? style.gapBefore : 0 }));
  }
  const rowHeight = (style) => Math.round(style.size * 1.6);
  const height = RESULT_IMAGE_PAD * 2 + rows.reduce((sum, row) => sum + row.gap + rowHeight(row.style), 0);
  const canvas = document.createElement("canvas");
  canvas.width = RESULT_IMAGE_WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, RESULT_IMAGE_WIDTH, height);
  ctx.textBaseline = "middle";
  let y = RESULT_IMAGE_PAD;
  for (const row of rows) {
    y += row.gap;
    ctx.font = fontOf(row.style);
    ctx.fillStyle = row.style.color;
    ctx.fillText(row.text, RESULT_IMAGE_PAD, y + rowHeight(row.style) / 2);
    y += rowHeight(row.style);
  }
  return canvas;
}

// ชื่อไฟล์ใช้ตัวอักษรอังกฤษ มือถือบางรุ่นตั้งชื่อไฟล์ภาษาไทยไม่ได้
function resultImageFileName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `agroeye-result-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.png`;
}

// คืน true ถ้าสั่งดาวน์โหลดสำเร็จ
async function saveResultImage(plot, recommended, crops) {
  try {
    await document.fonts?.ready; // รอฟอนต์ไทยโหลดเสร็จ ตัวอักษรในรูปจะได้ไม่เพี้ยน
    const canvas = resultLinesToCanvas(resultImageLines(plot, recommended, crops));
    downloadCanvas(canvas, resultImageFileName());
    return true;
  } catch (err) {
    console.warn("บันทึกรูปผลไม่ได้", err);
    return false;
  }
}
