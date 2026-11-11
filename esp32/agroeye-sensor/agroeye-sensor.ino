// AgroEye เซนเซอร์ (task 18) สำหรับบอร์ด ESP32
// บอร์ดเปิด Wi-Fi ของตัวเองชื่อ "AgroEye-Sensor" (ไม่ต้องมีเน็ตหรือเราเตอร์ ใช้ในไร่ได้)
// มือถือต่อ Wi-Fi นี้ แล้วเปิด http://192.168.4.1 จะเห็นข้อความแบบ M=45;T=29;L=62 พร้อมปุ่มคัดลอก
// นำไปวางในแอป AgroEye ขั้น "มีข้อมูลเพิ่มเติมไหม" → "วางค่าจากเซนเซอร์ (ESP32)"
//
// M = ความชื้นดิน (%) เทียบจากค่าดินแห้งและดินเปียก (ต้องเทียบค่าเอง ดู docs/ESP32.md)
// T = อุณหภูมิอากาศ (องศาเซลเซียส) จาก DHT11 หรือ DHT22
// L = ความสว่างเทียบ 0–100 จาก LDR (ไม่ใช่หน่วยลักซ์)
//
// ไลบรารีที่ต้องติดตั้งใน Arduino IDE: "DHT sensor library" (Adafruit) + "Adafruit Unified Sensor"
// WiFi.h กับ WebServer.h มากับบอร์ด ESP32 อยู่แล้ว

#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

// ---------- ตั้งค่าที่ผู้ใช้แก้ได้ ----------

// ชื่อและรหัส Wi-Fi ของบอร์ด (รหัสต้องยาวอย่างน้อย 8 ตัว) ควรเปลี่ยนรหัสเป็นของทีมเอง
const char* WIFI_NAME = "AgroEye-Sensor";
const char* WIFI_PASSWORD = "agroeye123";

// ขาที่ต่อ ต้องใช้ขา ADC1 (32–39) เพราะขา ADC2 ใช้ไม่ได้ตอนเปิด Wi-Fi
const int SOIL_PIN = 34;   // AOUT ของเซนเซอร์ความชื้นดิน
const int LIGHT_PIN = 35;  // AO ของ LDR
const int DHT_PIN = 4;     // DATA ของ DHT

// เปลี่ยนเป็น DHT11 ถ้าใช้ตัวสีฟ้า หรือ DHT22 ถ้าใช้ตัวสีขาว
#define DHT_TYPE DHT22

// ค่าเทียบ (calibrate) ดูวิธีหาใน docs/ESP32.md แล้วแก้ตัวเลข 4 ตัวนี้
// ค่าดิบของ ESP32 อยู่ระหว่าง 0–4095
const int SOIL_RAW_DRY = 3000;    // ค่าดิบตอนเซนเซอร์อยู่ในอากาศ / ดินแห้งสนิท
const int SOIL_RAW_WET = 1200;    // ค่าดิบตอนเสียบในน้ำ / ดินเปียกโชก
const int LIGHT_RAW_DARK = 4000;  // ค่าดิบตอนเอามือปิด LDR มิด
const int LIGHT_RAW_BRIGHT = 300; // ค่าดิบตอนตากแดดจัด

// ---------- ส่วนทำงาน ----------

WebServer server(80);
DHT dht(DHT_PIN, DHT_TYPE);

// อ่านค่าดิบหลายครั้งแล้วเฉลี่ย เพื่อให้ตัวเลขนิ่งขึ้น
int readAverage(int pin) {
  long total = 0;
  for (int i = 0; i < 20; i++) {
    total += analogRead(pin);
    delay(5);
  }
  return total / 20;
}

// แปลงค่าดิบเป็น 0–100 เทียบกับจุดต่ำสุดและสูงสุดที่วัดไว้
// map() ใช้ได้ทั้งตอนค่าดิบเพิ่มขึ้นหรือลดลง เช่นเซนเซอร์ความชื้นดิน ดินยิ่งเปียกค่าดิบยิ่งน้อย
int toPercent(int raw, int rawAtZero, int rawAtHundred) {
  long percent = map(raw, rawAtZero, rawAtHundred, 0, 100);
  return constrain(percent, 0, 100);
}

// สร้างข้อความ M=..;T=..;L=.. ถ้า DHT อ่านไม่ได้จะไม่ใส่ T (แอปจะบอกว่าไม่มีค่า)
String sensorText(int soilRaw, int lightRaw) {
  String text = "M=" + String(toPercent(soilRaw, SOIL_RAW_DRY, SOIL_RAW_WET));
  float temp = dht.readTemperature();
  if (!isnan(temp)) text += ";T=" + String(temp, 1);
  text += ";L=" + String(toPercent(lightRaw, LIGHT_RAW_DARK, LIGHT_RAW_BRIGHT));
  return text;
}

// หน้าเว็บของบอร์ด ตัวใหญ่ อ่านง่าย มีปุ่มคัดลอก และค่าดิบไว้ใช้ตอนเทียบค่า
String pageHtml(const String& text, int soilRaw, int lightRaw) {
  String html = F("<!doctype html><html lang='th'><head><meta charset='utf-8'>"
    "<meta name='viewport' content='width=device-width,initial-scale=1'><title>AgroEye เซนเซอร์</title>"
    "<style>body{font-family:sans-serif;font-size:22px;margin:16px;background:#fff;color:#1f2a1f}"
    "#v{width:100%;font-size:30px;padding:12px;box-sizing:border-box}"
    "button,a{display:block;width:100%;font-size:24px;padding:16px;margin-top:12px;text-align:center;box-sizing:border-box}"
    "button{background:#2f6b3a;color:#fff;border:0;border-radius:12px}small{color:#555}</style></head><body>"
    "<h1>ค่าจากเซนเซอร์</h1><input id='v' readonly value='");
  html += text;
  html += F("'><button onclick='copyText()'>คัดลอก</button><p id='s' role='status'></p>"
    "<a href='/'>วัดใหม่</a><p><small>ค่าดิบ (ใช้ตอนเทียบค่า) ดิน ");
  html += String(soilRaw) + " · แสง " + String(lightRaw);
  // หน้านี้เป็น http ธรรมดา navigator.clipboard ใช้ไม่ได้ จึงใช้วิธีเลือกข้อความแล้ว execCommand
  html += F("</small></p><script>function copyText(){var v=document.getElementById('v');v.select();"
    "v.setSelectionRange(0,99);var ok=document.execCommand('copy');document.getElementById('s').textContent="
    "ok?'คัดลอกแล้ว เปิดแอป AgroEye แล้ววางได้เลย':'คัดลอกไม่ได้ กดค้างที่ช่องแล้วเลือกคัดลอก';}</script></body></html>");
  return html;
}

void handleHome() {
  int soilRaw = readAverage(SOIL_PIN);
  int lightRaw = readAverage(LIGHT_PIN);
  server.send(200, "text/html; charset=utf-8", pageHtml(sensorText(soilRaw, lightRaw), soilRaw, lightRaw));
}

// ข้อความล้วน เผื่อใช้ทดสอบ เช่น เปิด http://192.168.4.1/text
void handleText() {
  server.send(200, "text/plain; charset=utf-8", sensorText(readAverage(SOIL_PIN), readAverage(LIGHT_PIN)));
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);        // ค่าดิบ 0–4095
  analogSetAttenuation(ADC_11db);  // อ่านแรงดันได้ถึงราว 3.3V
  dht.begin();
  WiFi.softAP(WIFI_NAME, WIFI_PASSWORD);
  server.on("/", handleHome);
  server.on("/text", handleText);
  server.begin();
  Serial.print("เปิด Wi-Fi แล้ว เข้าเว็บที่ http://");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  server.handleClient();
  // พิมพ์ค่าดิบออก Serial Monitor ทุก 2 วินาที ใช้ตอนเทียบค่า (เปิด Serial Monitor ที่ 115200)
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 2000) {
    lastPrint = millis();
    int soilRaw = readAverage(SOIL_PIN);
    int lightRaw = readAverage(LIGHT_PIN);
    Serial.println("ดินดิบ=" + String(soilRaw) + " แสงดิบ=" + String(lightRaw) + " → " + sensorText(soilRaw, lightRaw));
  }
}
