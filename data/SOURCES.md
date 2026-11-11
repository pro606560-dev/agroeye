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
| LDD-RUBBER-NAN29 | กรมพัฒนาที่ดิน การจัดการดินเพื่อปลูกยางพาราในกลุ่มชุดดินที่ 29 จังหวัดน่าน หน้า 23: "ปริมาณน้ำฝนที่เหมาะสมสำหรับการปลูกยางพาราไม่ควรน้อยกว่า 1,250 มิลลิเมตรต่อปี" (เอกสารอ้างต่อจากการยางแห่งประเทศไทย 2556) — https://e-library.ldd.go.th/library/flip/bib9784f/files/basic-html/page23.html | ยางพารา (ปริมาณน้ำฝน) |
| ICRAF-TAMARIND | World Agroforestry, Agroforestree Database: Tamarindus indica — https://apps.worldagroforestry.org/treedb/AFTPDFS/Tamarindus_indica.PDF | มะขาม |
| UF-IFAS-LONGAN | Crane และคณะ (2020) Longan Growing in the Florida Home Landscape, UF/IFAS — https://ask.ifas.ufl.edu/publication/MG049 | ลำไย (ข้อมูลจากฟลอริดา ควรหาแหล่งไทยแทน) |
| STOU-MAIZE-MAETHA | บุญช่วย อุดคำมี (2562) การส่งเสริมการใช้เทคโนโลยีการผลิตข้าวโพดเลี้ยงสัตว์ของเกษตรกรอำเภอแม่ทะ (มสธ.) — https://repository.stou.ac.th/items/69e78451-7a4a-42b9-a796-40bc0f9a24eb/full | ข้าวโพด |
| LDD-MAIZE-REQ | กรมพัฒนาที่ดิน ตารางผนวกที่ 3 ระดับความเหมาะสมของค่าพิสัยของคุณภาพที่ดินสำหรับข้าวโพด (การวิเคราะห์ปัจจัยทางกายภาพและคุณภาพที่ดิน ลุ่มน้ำสาขาลำเชิงไกร หน้า 118): ชั้นการระบายน้ำ 5,6 = S1, 4 = S2, 3 = S3, 1,2 = N, "excessive moisture within the rootzone for 36 hrs will injure the plants", เนื้อดิน sl, l, sil, cl, อายุ 110–120 วัน — https://e-library.ldd.go.th/library/flip/bib10145f/files/basic-html/page148.html | ข้าวโพด |
| MJU-MAIZE | ห้องสมุดมหาวิทยาลัยแม่โจ้ (MJU The Library) เปิดสูตรเด็ด..ปลูกข้าวโพดเลี้ยงสัตว์ให้ฝักโต เต็มเมล็ด ผลิตผลเต็มไร่: รุ่นฤดูฝนปลูกต้นฝน เม.ย.–มิ.ย. และปลายฝน ก.ค.–ส.ค., รุ่นหลังนา พ.ย.–ธ.ค., ดินโปร่งระบายน้ำดี — https://thelibrary.mju.ac.th/11734/ | ข้าวโพด |
| THEPRAK-2568 | Theprak และคณะ (2568) การพัฒนาระบบการผลิตข้าวและเมล็ดพันธุ์ข้าววิถีวัฒนธรรมของชุมชนลุ่มน้ำจาง อ.แม่ทะ — https://so04.tci-thaijo.org/index.php/JMHR/article/download/aa-0006/aaa-006 | ข้าว กข6, หอมมะลิ 105 |
| GP-MAETHA-STORY | Greenpeace Thailand, แม่ทะบ้านฉัน — https://www.greenpeace.org/thailand/story/53831/maetha-lifestlye-may-change-after-coal-mining-project/ | มันสำปะหลัง, แตงโม |
| GP-MAETHA-CHECKPOINTS | Greenpeace Thailand, Mae Tha check points — https://www.greenpeace.org/thailand/explore/resist/coal/maetha-check-points | ช่วงปลูกข้าว |
| DOAE-FAW-NEWS | ข่าวประชาสัมพันธ์กรมส่งเสริมการเกษตร: เฝ้าระวังหนอนกระทู้ข้าวโพดลายจุด (Thai Post) — https://www.thaipost.net/public-relations-news/431112/ | ข้าวโพด |
| OPEN-METEO | Open-Meteo API (ฟรีสำหรับงานไม่แสวงกำไร ไม่ต้องใช้ key) — https://open-meteo.com/ | สภาพอากาศ |
| SURVEY-TEAM | ผลสำรวจภาคสนามของทีม AgroEye (ภาคผนวก ก ในรายงาน) | จุดสำรวจ |
| SALLEY-2018 | Salley และคณะ (2018) ความแม่นยำของการประเมินเนื้อดินด้วยมือ, Soil Science Society of America Journal 82:1526–1537 | วิธีทดสอบเนื้อดิน (ผู้ฝึกน้อยทายถูก 27–41%) |
| NRCS-TEXTURE-FEEL | USDA NRCS, Guide to Texture by Feel (ผังตัดสินใจ ดัดแปลงจาก Thien 1979) | วิธีปั้นบอลและปั้นเส้น |
| THIEN-1979 | Thien (1979) A flow diagram for teaching texture-by-feel analysis, Journal of Agronomic Education 8:54–55 | วิธีปั้นบอลและปั้นเส้น |
| NRCS-NH-SOILS-2024 | USDA NRCS, New Hampshire Soils Handbook (2024) ตาราง soil reaction classes | คำเรียก pH (ปกติ = 6.6–7.3) |
| NRCS-053252 | USDA NRCS, เอกสาร nrcs142p2_053252 (soil reaction classes) | คำเรียก pH |
| LDD-ZONE1-ASS | สถานีพัฒนาที่ดินสุพรรณบุรี นิยาม "ดินเปรี้ยวจัด" = ดินกรดกำมะถัน (Acid Sulfate Soils) | เหตุผลที่แอปไม่ใช้คำว่า "ดินเปรี้ยวจัด" กับค่า pH อย่างเดียว |
| RKB-RD6 | กรมการข้าว คลังความรู้เรื่องข้าว (Rice Knowledge Bank) ข้าวพันธุ์ กข6: ไวต่อช่วงแสง เก็บเกี่ยวประมาณ 21 พฤศจิกายน | ข้าวเหนียว กข6 |
| RKB-KDML105 | กรมการข้าว คลังความรู้เรื่องข้าว (Rice Knowledge Bank) ข้าวขาวดอกมะลิ 105: ไวต่อช่วงแสง เก็บเกี่ยวประมาณ 25 พฤศจิกายน | ข้าวหอมมะลิ 105 |
| KUBOTA-RICE-SEASON | สยามคูโบต้า ช่วงปลูกข้าวนาปี พ.ค.–ส.ค. (แหล่งเอกชน **รอยืนยัน** กับสำนักงานเกษตรอำเภอแม่ทะหรือศูนย์วิจัยข้าว ยังไม่ใช้ในแอป) | ช่วงปลูกข้าว |
| FAO-ITC-ECOCROP | FAO/ITC คู่มือฐานข้อมูล ECOCROP: ค่าอุณหภูมิเป็นช่วงของอุณหภูมิเฉลี่ยตลอดฤดูเติบโต และมีอุณหภูมิที่ทำให้ตายแยกต่างหาก | วิธีเทียบอุณหภูมิ |
| CDKN-CIRCA-WP21 | CDKN CIRCA Working Paper 21 สรุปแบบจำลอง EcoCrop ของ CIAT (Hijmans) | วิธีเทียบอุณหภูมิ |
| TMD-LAMPANG-9120 | กรมอุตุนิยมวิทยา สถิติภูมิอากาศ พ.ศ. 2534–2563 สถานีลำปาง (48328): เฉลี่ยทั้งปี 26.7°C, ต่ำสุดเฉลี่ย ธ.ค. 16.2 / ม.ค. 15.6°C, ฝนเฉลี่ย 1,107 มม./ปี (ค่าเดือนกันยายน 8.0 ในตารางต้นฉบับผิดปกติ ห้ามใช้) | อากาศลำปาง (ใช้แทนแม่ทะ) |
| LDD-RUBBER | กรมพัฒนาที่ดิน ความต้องการของยางพารา: อุณหภูมิเฉลี่ยเหมาะสม 22–30°C ถ้ามีช่วงต่ำกว่า 15°C นานเกินไปจะโตช้า | ยางพารา |
| FAO-RUBBERWOOD | FAO, Rubberwood outlook: อุณหภูมิเหมาะสม 20–28°C | ยางพารา |
| FIO-RUBBER-2550 | องค์การอุตสาหกรรมป่าไม้ (2550) เกณฑ์ปลูกยาง: ต่ำสุดเฉลี่ย >18°C = L1, 14–18°C = L2, <14°C = L3 | ยางพารา |
| OIE-RUBBER | rubber.oie.go.th เกณฑ์ฝนปลูกยาง 1,250 มม./ปี (ใช้ประกอบรายงาน ยังไม่ใช้ในสูตร) | ยางพารา |
| PFAF-TAMARIND | Plants For A Future, Tamarindus indica: ทนหนาวได้ราว -1 ถึง -3°C (ข้อมูลมือสอง) | มะขาม |

## ข้อมูลที่ยังขาด (ช่อง `todo` ใน crops.json)

- เดือนที่ปลูกได้ของ ข้าวโพด อ้อย ลำไย ยางพารา มะม่วง ถั่วลิสง มะขาม แตงโม
- ค่า pH ของ ลำไย และมะขาม
- ลิงก์ของแหล่งที่เพิ่มเมื่อ 5 พ.ย. 2569 (SALLEY-2018 ถึง PFAF-TAMARIND) ผู้ใช้ให้ชื่อเอกสารมา แต่ยังไม่ได้ใส่ลิงก์
- เอกสารกรมพัฒนาที่ดินที่ใช้เกณฑ์ pH 6.6–7.3 = กลาง (ยังไม่ได้ระบุชื่อเอกสาร)
- ค่า ECOCROP ต้นฉบับของยางพาราและมะขาม
- วิธีแก้โรคแมลงของ มันสำปะหลัง (เพลี้ยแป้ง ไรแดง) และพืชที่ยังไม่มีรายการความเสี่ยง
- พืชผักเพิ่มเติม (พริก มะเขือ ถั่วฝักยาว ฯลฯ) จากการถามเกษตรกรวันลงสำรวจ เพื่อให้ครบ 15–25 ชนิด
