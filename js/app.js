// เริ่มแอปและสลับหน้าจอตาม hash ใน URL

const HOME_HASH = "#/home";

// หน้าที่ทำแล้ว หน้าที่ไม่อยู่ในรายการนี้จะแสดง "หน้านี้กำลังสร้าง"
const VIEWS = {
  home: renderHome,
  input: renderInput,
  result: renderResult,
};

// นับจำนวนหน้าที่เปิดในแอปรอบนี้ เพื่อรู้ว่ากดย้อนกลับแล้วยังอยู่ในแอปไหม
let visitedPageCount = 0;

function showRoute(route) {
  const main = document.getElementById("app");
  const view = VIEWS[route.name] || renderPlaceholder;
  view(main, route.param);

  const title = ROUTES[route.name].title;
  document.getElementById("page-title").textContent = title;
  document.title = route.name === "home" ? title : `${title} - AgroEye`;
  document.getElementById("back-button").hidden = route.name === "home";

  // เปิดหน้าใหม่ให้เริ่มจากด้านบน และย้ายโฟกัสมาที่หัวข้อเพื่อให้โปรแกรมอ่านหน้าจออ่านหน้าใหม่
  window.scrollTo(0, 0);
  main.querySelector("[tabindex='-1']")?.focus({ preventScroll: true });
}

// replace แทนการเพิ่มประวัติ ไม่อย่างนั้นปุ่มย้อนกลับของมือถือจะวนกลับมาหน้าที่ไม่รู้จัก
function handleHashChange() {
  const route = matchRoute(window.location.hash);
  if (!route) {
    window.location.replace(HOME_HASH);
    return;
  }
  visitedPageCount++;
  showRoute(route);
}

// ปุ่มย้อนกลับในแอปทำงานเหมือนปุ่มย้อนกลับของมือถือ
// ถ้าเปิดลิงก์เข้าหน้านี้ตรง ๆ จะไม่มีหน้าก่อนหน้าในแอป จึงไปหน้าแรกแทน
function handleBackClick() {
  if (visitedPageCount > 1) {
    window.history.back();
  } else {
    window.location.replace(HOME_HASH);
  }
}

function startApp() {
  window.addEventListener("hashchange", handleHashChange);
  document.getElementById("back-button").addEventListener("click", handleBackClick);
  handleHashChange();
}

startApp();
