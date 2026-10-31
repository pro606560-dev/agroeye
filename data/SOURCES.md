# แหล่งข้อมูลของ AgroEye

รหัสในคอลัมน์ซ้ายตรงกับช่อง `source` ใน `crops.json`, `test-scenarios.json` และ `survey-points.json`
ถ้าจะเพิ่มค่าใหม่ ให้เพิ่มแหล่งที่นี่ก่อน แล้วค่อยอ้างรหัสในไฟล์ข้อมูล

ค่าจาก ECOCROP กับ ICRAF เป็นค่าทั่วโลก ไม่ได้วัดเฉพาะประเทศไทย ใช้เป็นจุดเริ่มต้นได้ ถ้าเจอแหล่งไทยที่ดีกว่า (กรมวิชาการเกษตร, กรมการข้าว, กรมพัฒนาที่ดิน) ให้ใช้แหล่งไทยแทน

| รหัส | แหล่ง | ใช้กับ |
| --- | --- | --- |
| ECOCROP-MAIZE | FAO ECOCROP, Zea mays — https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2175 | ข้าวโพด |
| ECOCROP-CASSAVA | FAO ECOCROP, Manihot esculenta — https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1420 | มันสำปะหลัง |
| ECOCROP-SUGARCANE | FAO ECOCROP, Saccharum officinarum — https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1884 | อ้อย |
| ECOCROP-MANGO | FAO ECOCROP, Mangifera indica — https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1416 | มะม่วง |
| ECOCROP-PEANUT | FAO ECOCROP, Arachis hypogaea — https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2199 | ถั่วลิสง |
| ECOCROP-WATERMELON | FAO ECOCROP, Citrullus lanatus — https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=708 | แตงโม |
| DOA-CASSAVA-2563 | สถาบันวิจัยพืชไร่และพืชทดแทนพลังงาน กรมวิชาการเกษตร (2563) เทคโนโลยีการผลิตมันสำปะหลัง — https://www.doa.go.th/fcri/wp-content/uploads/2020/tachno/E-Book-2.pdf | มันสำปะหลัง |
| LDD-RICE-REQ | กรมพัฒนาที่ดิน ตารางระดับความต้องการปัจจัยของข้าว (S1–N) — https://e-library.ldd.go.th/library/flip/bib1605f/files/basic-html/page72.html และ https://e-library.ldd.go.th/library/flip/bib10145f/files/basic-html/page146.html | ข้าว |
| LDD-ACID-RICE | กรมพัฒนาที่ดิน คู่มือจัดการดินเปรี้ยวจัดสำหรับปลูกข้าว — https://lddmordin.ldd.go.th/web/data/Knowledge_9.pdf | ข้าว, ถั่วลิสง (พืชหมุนเวียน) |
| LDD-GINGER | กรมพัฒนาที่ดิน การศึกษาการปลูกขิงด้วยวิธีการอนุรักษ์ดินและน้ำบนพื้นที่สูง — https://orgweb.ldd.go.th/sources/img/part_km/FILES_2675_67bfc4c22f982.pdf | ขิง |
| LDD-HUASUEA-2567 | สถานีพัฒนาที่ดินลำปาง (ก.ย. 2567) แผนการใช้ที่ดิน ต.หัวเสือ อ.แม่ทะ — https://service.ldd.go.th/lpd/node_modules/img/Landusedistrict/r06_lpg.67_08.pdf | พื้นที่ปลูกในแม่ทะ, ชุดดิน |
| ICRAF-HEVEA | World Agroforestry, Agroforestree Database: Hevea brasiliensis — https://apps.worldagroforestry.org/treedb2/AFTPDFS/Hevea_brasiliensis.PDF | ยางพารา |
| ICRAF-TAMARIND | World Agroforestry, Agroforestree Database: Tamarindus indica — https://apps.worldagroforestry.org/treedb/AFTPDFS/Tamarindus_indica.PDF | มะขาม |
| UF-IFAS-LONGAN | Crane และคณะ (2020) Longan Growing in the Florida Home Landscape, UF/IFAS — https://ask.ifas.ufl.edu/publication/MG049 | ลำไย (ข้อมูลจากฟลอริดา ควรหาแหล่งไทยแทน) |
| STOU-MAIZE-MAETHA | บุญช่วย อุดคำมี (2562) การส่งเสริมการใช้เทคโนโลยีการผลิตข้าวโพดเลี้ยงสัตว์ของเกษตรกรอำเภอแม่ทะ (มสธ.) — https://repository.stou.ac.th/items/69e78451-7a4a-42b9-a796-40bc0f9a24eb/full | ข้าวโพด |
| THEPRAK-2568 | Theprak และคณะ (2568) การพัฒนาระบบการผลิตข้าวและเมล็ดพันธุ์ข้าววิถีวัฒนธรรมของชุมชนลุ่มน้ำจาง อ.แม่ทะ — https://so04.tci-thaijo.org/index.php/JMHR/article/download/aa-0006/aaa-006 | ข้าว กข6, หอมมะลิ 105 |
| GP-MAETHA-STORY | Greenpeace Thailand, แม่ทะบ้านฉัน — https://www.greenpeace.org/thailand/story/53831/maetha-lifestlye-may-change-after-coal-mining-project/ | มันสำปะหลัง, แตงโม |
| GP-MAETHA-CHECKPOINTS | Greenpeace Thailand, Mae Tha check points — https://www.greenpeace.org/thailand/explore/resist/coal/maetha-check-points | ช่วงปลูกข้าว |
| DOAE-FAW-NEWS | ข่าวประชาสัมพันธ์กรมส่งเสริมการเกษตร: เฝ้าระวังหนอนกระทู้ข้าวโพดลายจุด (Thai Post) — https://www.thaipost.net/public-relations-news/431112/ | ข้าวโพด |
| OPEN-METEO | Open-Meteo API (ฟรีสำหรับงานไม่แสวงกำไร ไม่ต้องใช้ key) — https://open-meteo.com/ | สภาพอากาศ |
| SURVEY-TEAM | ผลสำรวจภาคสนามของทีม AgroEye (ภาคผนวก ก ในรายงาน) | จุดสำรวจ |

## ข้อมูลที่ยังขาด (ช่อง `todo` ใน crops.json)

- เดือนที่ปลูกได้ของ ข้าวโพด อ้อย ลำไย ยางพารา มะม่วง ถั่วลิสง มะขาม แตงโม
- ค่า pH ของ ลำไย และมะขาม
- วิธีแก้โรคแมลงของ มันสำปะหลัง (เพลี้ยแป้ง ไรแดง) และพืชที่ยังไม่มีรายการความเสี่ยง
- พืชผักเพิ่มเติม (พริก มะเขือ ถั่วฝักยาว ฯลฯ) จากการถามเกษตรกรวันลงสำรวจ เพื่อให้ครบ 15–25 ชนิด
