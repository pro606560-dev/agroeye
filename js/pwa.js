// ลงทะเบียน service worker (ใช้ออฟไลน์ได้) และแสดงแถบ "มีเวอร์ชันใหม่"
// เบราว์เซอร์เก่าที่ไม่รองรับ แอปก็ยังใช้ได้ตามปกติ แค่ใช้ออฟไลน์ไม่ได้

const UPDATE_BAR_ID = "update-bar";

// แถบปุ่มด้านล่างจอ แตะแล้วให้เวอร์ชันใหม่เริ่มทำงาน
function showUpdateBar(waitingWorker) {
  if (document.getElementById(UPDATE_BAR_ID)) return;
  const bar = document.createElement("button");
  bar.id = UPDATE_BAR_ID;
  bar.type = "button";
  bar.className = "update-bar";
  bar.innerHTML = `<strong>มีเวอร์ชันใหม่ แตะเพื่ออัปเดต</strong>
    <span>แปลงที่บันทึกไว้ยังอยู่ครบ</span>`;
  bar.addEventListener("click", () => {
    bar.disabled = true;
    bar.querySelector("strong").textContent = "กำลังอัปเดต...";
    waitingWorker.postMessage("skip-waiting");
  });
  // ครอบด้วย role="status" ให้โปรแกรมอ่านหน้าจออ่านแถบนี้เมื่อแถบโผล่ขึ้นมา
  const region = document.createElement("div");
  region.setAttribute("role", "status");
  document.body.appendChild(region);
  region.appendChild(bar);
}

// เวอร์ชันใหม่โหลดเสร็จแล้ว แต่รออยู่ ให้แสดงแถบ
function watchForUpdate(registration) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    showUpdateBar(registration.waiting);
  }
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker.addEventListener("statechange", () => {
      // มี controller อยู่แล้ว = เป็นการอัปเดต (ครั้งแรกที่ติดตั้งไม่ต้องแสดงแถบ)
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdateBar(worker);
      }
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // เมื่อเวอร์ชันใหม่เริ่มทำงาน ให้โหลดหน้าใหม่ครั้งเดียว
  // เปิดแอปครั้งแรกสุด (ยังไม่เคยมี service worker) ไม่โหลดใหม่ คำตอบที่กำลังกรอกจะได้ไม่หาย
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded || !hadController) return;
    reloaded = true;
    window.location.reload();
  });
  navigator.serviceWorker.register("sw.js")
    .then(watchForUpdate)
    .catch((err) => console.warn("ลงทะเบียน service worker ไม่ได้", err));
}
