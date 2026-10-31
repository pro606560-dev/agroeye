# ลำดับงาน

ทำตามลำดับเลข ห้ามข้าม CHECKPOINT จนกว่าผู้ใช้จะตอบว่าผ่าน
แชตละ 1–2 task แล้วหยุดให้ผู้ใช้เริ่มแชตใหม่ task ที่มีป้าย **[ใช้ reviewer]** ต้องให้ subagent `reviewer` ตรวจก่อนปิด task (02, 03, 09, 13, 14, 16, 17)
ทุกไฟล์ task มี 6 ส่วน: เป้าหมาย, ต้องทำเสร็จก่อน, ขั้นตอน, Skill ที่ใช้, เกณฑ์ผ่าน, หมายเหตุ

| ช่วง | task | ชื่อ | เป้าวันเสร็จ | Skill |
| --- | --- | --- | --- | --- |
| 1 | 01 | ตั้งค่าโปรเจกต์ | | — |
| 1 | 02 | โหลดและตรวจข้อมูล | | — |
| 1 | 03 | สูตรคะแนน + ชุดทดสอบ | | — |
| 1 | 04 | ระบบดีไซน์ | | frontend-design, accessibility-review |
| 1 | 05 | หน้าแรก + การเปลี่ยนหน้า | | frontend-design |
| 1 | 06 | หน้ากรอกข้อมูลทีละขั้น | | ux-copy, frontend-design |
| 1 | 07 | หน้าผลลัพธ์ | | ux-copy |
| 1 | 08 | หน้ารายละเอียดพืช | | ux-copy |
| 1 | 09 | เผยแพร่บน GitHub Pages — **CHECKPOINT A** | 20 ธ.ค. 2569 | accessibility-review, design-critique |
| 2 | 10 | สภาพอากาศ (Open-Meteo) | | — |
| 2 | 11 | แปลงของฉัน (ประวัติ) | | ux-copy |
| 2 | 12 | ปฏิทินปลูก | | frontend-design |
| 2 | 13 | ใช้ออฟไลน์ได้ (PWA) — **CHECKPOINT B** | 17 ม.ค. 2570 | accessibility-review, ux-copy |
| 3 | 14 | หน้าพิสูจน์สมมติฐาน + กราฟ | | frontend-design, ux-copy |
| 3 | 15 | อ่านออกเสียงภาษาไทย | | ux-copy |
| 3 | 16 | หน้าตั้งค่า + Gemini อธิบาย | | ux-copy, accessibility-review |
| 3 | 17 | ตรวจรอบสุดท้าย + เตรียมของใส่รายงาน — **CHECKPOINT C** | 14 ก.พ. 2570 | accessibility-review, design-critique, ux-copy |

หลัง CHECKPOINT C จะเป็นช่วงที่ผู้ใช้ทดสอบกับเกษตรกรและเขียนรายงาน Claude Code แก้งานตามที่ผู้ใช้ขอเท่านั้น
`18-esp32-optional.md` ทำเมื่อผู้ใช้สั่งเท่านั้น

## โครงไฟล์ของแอปเมื่อเสร็จ
```
AgroEye/
  index.html            ← หน้าเดียว ทุกหน้าจอสลับด้วย hash
  tests.html            ← หน้ารันชุดทดสอบ
  manifest.webmanifest
  sw.js
  css/style.css
  js/config.js          ← น้ำหนักคะแนนและค่าคงที่
  js/data.js            ← โหลดและตรวจไฟล์ใน data/
  js/scoring.js         ← สูตรคะแนน (หัวใจของรายงาน)
  js/reasons.js         ← สร้างเหตุผลภาษาไทย
  js/storage.js         ← localStorage แบบปลอดภัย
  js/weather.js
  js/speech.js
  js/ai.js
  js/views/*.js         ← แต่ละหน้าจอ
  js/app.js             ← เริ่มแอป + เปลี่ยนหน้า
  lib/                  ← Chart.js, ฟอนต์ (ถ้ามี)
  assets/               ← ไอคอน รูปประเภทดิน
  data/                 ← ข้อมูล (มีแล้ว)
  tests/*.test.js
  tests/expected.json   ← ข้อสอบเฉลยของผู้ใช้ (ห้ามแก้)
  checkpoints/          ← เช็กลิสต์จุดตรวจ A, B, C
  evidence/             ← ภาพหน้าจอหลักฐาน
  .claude/agents/reviewer.md, .claude/settings.json
```
โครงนี้เป็นแนวทาง ปรับได้ถ้ามีเหตุผล แต่ต้องจดเหตุผลไว้ใน PROGRESS.md
