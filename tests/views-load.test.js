// เทสต์โหลดไฟล์หน้าจอ (งานเสริม 9 พ.ย. 2569)
// โหลดสคริปต์ของแอปจริงในกรอบที่ซ่อนไว้ แล้วดูว่ามี error ตอนโหลดไหม จับได้ทั้งชื่อซ้ำ (SyntaxError)
// โค้ดพิมพ์ผิด เรียกของที่ยังไม่มีตอนโหลด และไฟล์หาย ส่วนการตรวจชื่อซ้ำแบบอ่านข้อความมีอยู่แล้วใน proof.test.js

// js/app.js เรียก startApp() ทันทีที่โหลด (เปลี่ยนหน้า ดึงอากาศ) จึงไม่โหลดในกรอบทดสอบ
// (ชื่อในไฟล์นี้ยังถูกตรวจโดยเทสต์ชื่อซ้ำใน proof.test.js)
const APP_STARTER_FILE = "js/app.js";

// รายชื่อสคริปต์ตามลำดับเดียวกับที่ index.html โหลดจริง
async function indexScriptList() {
  const html = await fetchText("index.html");
  return [...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);
}

// โหลดสคริปต์ทีละไฟล์ตามลำดับในกรอบ (iframe) ที่ซ่อนไว้ แล้วคืนรายการ error ที่เกิดตอนโหลด
// ดักแบบ capture (true) เพื่อให้จับได้ทั้ง error ในโค้ด และไฟล์ที่โหลดไม่ได้ (เช่น 404)
function scriptLoadErrors(files) {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.hidden = true;
    const catcher = `<script>
      window.loadErrors = [];
      window.addEventListener("error", (event) => {
        const target = event.target;
        if (target && target.tagName === "SCRIPT") {
          loadErrors.push("โหลดไฟล์ไม่ได้: " + target.getAttribute("src"));
        } else {
          loadErrors.push((event.filename || "").split("/").slice(-2).join("/") + ": " + event.message);
        }
      }, true);
    <\/script>`;
    const tags = files.map((file) => `<script src="${file}"><\/script>`).join("");
    frame.srcdoc = `<!doctype html><html><head><base href="${location.href}">${catcher}</head><body>${tags}</body></html>`;
    frame.addEventListener("load", () => {
      const errors = frame.contentWindow.loadErrors.slice();
      frame.remove();
      resolve(errors);
    });
    document.body.appendChild(frame);
  });
}

test("โหลดหน้าจอ: ทุกสคริปต์ใน index.html (ยกเว้น app.js) โหลดได้โดยไม่มี error", async () => {
  const files = (await indexScriptList()).filter((file) => file !== APP_STARTER_FILE);
  assertTrue(files.some((file) => file.startsWith("js/views/")), "ไม่พบไฟล์ js/views/ ใน index.html");
  assertEqual(await scriptLoadErrors(files), [], "error ตอนโหลด:");
});

test("โหลดหน้าจอ: ทุกไฟล์ js/views/ ในรายชื่อแคช ถูกเรียกใน index.html", async () => {
  const used = await indexScriptList();
  const cachedViews = (await cachedFileList()).filter((file) => file.startsWith("js/views/"));
  assertTrue(cachedViews.length > 0, "ไม่พบไฟล์ js/views/ ในรายชื่อแคชของ sw.js");
  assertEqual(cachedViews.filter((file) => !used.includes(file)), [], "ไฟล์หน้าจอที่ index.html ไม่ได้เรียก:");
});

test("โหลดหน้าจอ: ตัวโหลดจับไฟล์ที่หายได้จริง (ข้อมูลทดสอบ)", async () => {
  assertEqual(await scriptLoadErrors(["tests/fixtures/no-such-file.js"]),
    ["โหลดไฟล์ไม่ได้: tests/fixtures/no-such-file.js"]);
});
