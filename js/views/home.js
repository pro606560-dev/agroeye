// หน้าแรก: ปุ่มหลัก 2 ปุ่ม และลิงก์ไปหน้าอื่น
// weather-slot ว่างไว้ให้ task 10 ใส่สภาพอากาศ

function renderHome(container) {
  container.innerHTML = `
    <h2 tabindex="-1">วันนี้จะดูแปลงไหน</h2>
    <p>บอกสภาพดินของแปลง แล้วแอปจะแนะนำพืชที่เหมาะ 3 อย่าง</p>
    <div id="weather-slot" class="slot"></div>
    <a class="btn btn-primary" href="#/input">ตรวจแปลงใหม่</a>
    <a class="btn btn-secondary" href="#/plots">แปลงของฉัน</a>
    <nav aria-label="หน้าอื่น ๆ" class="home-links">
      <a class="link-big" href="#/calendar">ปฏิทินปลูก</a>
      <a class="link-big" href="#/settings">ตั้งค่า</a>
    </nav>
  `;
}
