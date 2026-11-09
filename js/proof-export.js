// กราฟ (Chart.js) การบันทึกเป็นรูป และการคัดลอกตาราง ของหน้าพิสูจน์สมมติฐาน
// Chart.js โหลดจาก lib/ ในเครื่อง (ไม่ใช้ CDN) และโหลดเฉพาะตอนเปิดหน้านี้ หน้าอื่นจึงไม่ช้าลง

const CHART_LIB_URL = "lib/chartjs/chart.umd.min.js";

// สีกราฟจากระบบดีไซน์ (css/style.css) อันดับ 1 เข้มสุด ถ้าพิมพ์ขาวดำยังแยกออก
const CHART_COLORS = ["#1F3864", "#8C3A1E", "#C98A4B"];
const CHART_INK = "#22261E";
const CHART_GRID = "#D5D9CF";
const EXPORT_FONT = '"Sarabun", "Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif';

let chartLibPromise = null;

// โหลด Chart.js ครั้งเดียว คืน true ถ้าใช้ได้ ถ้าโหลดไม่ได้หน้ายังแสดงตารางได้
function loadChartLib() {
  if (window.Chart) return Promise.resolve(true);
  if (!chartLibPromise) {
    chartLibPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = CHART_LIB_URL;
      script.onload = () => resolve(Boolean(window.Chart));
      script.onerror = () => { chartLibPromise = null; resolve(false); };
      document.head.append(script);
    });
  }
  return chartLibPromise;
}

// ทาพื้นขาวใต้กราฟ รูปที่บันทึกจะไม่โปร่งใส วางในรายงานแล้วอ่านได้
const whiteBackground = {
  id: "whiteBackground",
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

// เขียนตัวเลขคะแนนไว้ปลายแท่ง รูปที่พิมพ์ลงกระดาษจึงอ่านค่าได้โดยไม่ต้องชี้
const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.fillStyle = CHART_INK;
    ctx.font = `bold 14px ${EXPORT_FONT}`;
    ctx.textBaseline = "middle";
    chart.getDatasetMeta(0).data.forEach((bar, i) => {
      ctx.fillText(String(chart.data.datasets[0].data[i]), bar.x + 6, bar.y);
    });
    ctx.restore();
  },
};

// กราฟแท่งแนวนอน 1 ชุด: labels = ชื่อพืช, values = ตัวเลข
function drawBarChart(canvas, { title, labels, values, colors, max }) {
  return new window.Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ data: values, backgroundColor: colors, barThickness: 22 }] },
    options: {
      indexAxis: "y",
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2, // รูปคมพอสำหรับพิมพ์
      layout: { padding: { right: 36 } },
      scales: {
        x: { min: 0, max, ticks: { color: CHART_INK, precision: 0 }, grid: { color: CHART_GRID } },
        y: { ticks: { color: CHART_INK, font: { size: 15 } }, grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        title: { display: Boolean(title), text: title, color: CHART_INK, font: { size: 16, weight: "bold" }, align: "start" },
        tooltip: { enabled: true },
      },
    },
    plugins: [whiteBackground, valueLabels],
  });
}

// ---------- บันทึกเป็นรูป ----------

// เอาหลาย canvas มาต่อกันจากบนลงล่างเป็นรูปเดียว
function stackCanvases(canvases) {
  const width = Math.max(...canvases.map((c) => c.width));
  const height = canvases.reduce((sum, c) => sum + c.height, 0);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  for (const canvas of canvases) {
    ctx.drawImage(canvas, 0, y);
    y += canvas.height;
  }
  return out;
}

// วาดตาราง (แถวแรกคือหัวตาราง) ลง canvas เพื่อบันทึกเป็นรูป
function tableToCanvas(rows) {
  const scale = 2;
  const pad = 10;
  const rowHeight = 34;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `bold 15px ${EXPORT_FONT}`;
  const widths = rows[0].map((_, col) =>
    Math.max(...rows.map((row) => measure.measureText(String(row[col] ?? "")).width)) + pad * 2
  );
  const canvas = document.createElement("canvas");
  canvas.width = widths.reduce((a, b) => a + b, 0) * scale;
  canvas.height = rows.length * rowHeight * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";
  ctx.strokeStyle = CHART_GRID;
  rows.forEach((row, r) => {
    let x = 0;
    ctx.font = `${r === 0 ? "bold " : ""}15px ${EXPORT_FONT}`;
    row.forEach((cell, col) => {
      ctx.strokeRect(x, r * rowHeight, widths[col], rowHeight);
      ctx.fillStyle = CHART_INK;
      ctx.fillText(String(cell ?? ""), x + pad, r * rowHeight + rowHeight / 2);
      x += widths[col];
    });
  });
  return canvas;
}

// ดาวน์โหลด canvas เป็นไฟล์ PNG
function downloadCanvas(canvas, fileName) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

// ---------- คัดลอกตาราง ----------

// ตาราง HTML สำหรับวางใน Word แล้วเป็นตารางทันที (escapeHtml อยู่ใน js/result-logic.js)
function tableToHtml(rows) {
  const cells = (row, tag) => row.map((cell) => `<${tag}>${escapeHtml(String(cell ?? ""))}</${tag}>`).join("");
  const [head, ...body] = rows;
  return `<table border="1"><tr>${cells(head, "th")}</tr>${body.map((row) => `<tr>${cells(row, "td")}</tr>`).join("")}</table>`;
}

// วิธีสำรองเมื่อเบราว์เซอร์ไม่ให้ใช้ clipboard API (เช่น เปิดผ่าน http://IP ของคอม)
function copyWithTextarea(text) {
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.append(box);
  box.select();
  const ok = document.execCommand("copy");
  box.remove();
  return ok;
}

// คัดลอกทั้งแบบข้อความคั่น tab และแบบตาราง HTML คืน true ถ้าสำเร็จ
async function copyTable(rows) {
  const tsv = tableToTsv(rows);
  try {
    if (window.ClipboardItem && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([tsv], { type: "text/plain" }),
        "text/html": new Blob([tableToHtml(rows)], { type: "text/html" }),
      })]);
      return true;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
  } catch (err) {
    // ไปใช้วิธีสำรองด้านล่าง
  }
  return copyWithTextarea(tsv);
}
