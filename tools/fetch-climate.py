# ดึงข้อมูลอากาศย้อนหลังของแม่ทะจาก Open-Meteo แล้วคำนวณค่าเฉลี่ยรายเดือน
# ใช้ตอนพัฒนาเท่านั้น (task 10) แอปไม่ได้เรียกสคริปต์นี้
# วิธีรัน (ในโฟลเดอร์ AgroEye):  python tools/fetch-climate.py
# ผลลัพธ์: data/climate-maetha.json
#
# เอกสาร API: https://open-meteo.com/en/docs/historical-weather-api
# ปลายทาง /v1/archive ใช้ latitude, longitude, start_date, end_date, daily, timezone

import json
import urllib.request
from datetime import date

LATITUDE = 18.135
LONGITUDE = 99.513
FIRST_YEAR = 2016  # ใช้ 10 ปีเต็ม 2016–2025
LAST_YEAR = 2025
DAILY = "temperature_2m_mean,temperature_2m_min,precipitation_sum"

# ค่าสถิติสถานีลำปาง 48328 พิมพ์ตามแหล่ง TMD-LAMPANG-9120 ใน data/SOURCES.md (ไม่ได้ดึงจาก API)
# ผู้ใช้เลือกให้ใช้ฝนของสถานีนี้คิดคะแนน (5 พ.ย. 2569) เพราะเป็นค่าวัดจริง 30 ปี
# ต่ำสุดเฉลี่ยของเดือนที่หนาวที่สุด = ม.ค. 15.6°C (ห้ามใช้ค่าเดือน ก.ย. 8.0 ที่ผิดปกติ)
STATION = {
    "name": "สถานีอุตุนิยมวิทยาลำปาง (48328)",
    "years": [1991, 2020],
    "source": "TMD-LAMPANG-9120",
    "annualMeanTempC": 26.7,
    "coldestMonthMinTempC": 15.6,
    "rainMmYear": 1107,
}

URL = (
    "https://archive-api.open-meteo.com/v1/archive"
    f"?latitude={LATITUDE}&longitude={LONGITUDE}"
    f"&start_date={FIRST_YEAR}-01-01&end_date={LAST_YEAR}-12-31"
    f"&daily={DAILY}&timezone=Asia%2FBangkok"
)


def download():
    with urllib.request.urlopen(URL, timeout=60) as response:
        return json.load(response)


def group_by_year_month(daily):
    """รวมค่ารายวันเป็นกลุ่ม (ปี, เดือน) -> รายการค่าแต่ละวัน"""
    groups = {}
    for i, day in enumerate(daily["time"]):
        year, month = int(day[:4]), int(day[5:7])
        group = groups.setdefault((year, month), {"mean": [], "min": [], "rain": []})
        group["mean"].append(daily["temperature_2m_mean"][i])
        group["min"].append(daily["temperature_2m_min"][i])
        group["rain"].append(daily["precipitation_sum"][i])
    return groups


def average(values):
    values = [v for v in values if v is not None]
    return sum(values) / len(values)


def summarize(groups):
    years = range(FIRST_YEAR, LAST_YEAR + 1)
    temp, temp_min, rain = [], [], []
    for month in range(1, 13):
        # อุณหภูมิ: เฉลี่ยทุกวันของเดือนนั้นในแต่ละปี แล้วเฉลี่ยข้าม 10 ปี
        temp.append(average([average(groups[(y, month)]["mean"]) for y in years]))
        temp_min.append(average([average(groups[(y, month)]["min"]) for y in years]))
        # ฝน: รวมฝนทั้งเดือนในแต่ละปี แล้วเฉลี่ยข้าม 10 ปี
        rain.append(average([sum(v or 0 for v in groups[(y, month)]["rain"]) for y in years]))
    return temp, temp_min, rain


def main():
    data = download()
    temp, temp_min, rain = summarize(group_by_year_month(data["daily"]))
    result = {
        "_readme": "ค่าเฉลี่ยรายเดือนของแม่ทะจาก Open-Meteo (ดึงครั้งเดียวด้วย tools/fetch-climate.py) ช่องที่ 1 = ม.ค. ถึง 12 = ธ.ค. แอปใช้ monthlyTempC คิดคะแนนพืชล้มลุก ส่วนฝน อุณหภูมิทั้งปี และต่ำสุดเดือนหนาวสุดใช้ station (ผู้ใช้เลือก 5 พ.ย. 2569) ค่า Open-Meteo ที่เหลือเก็บไว้เทียบเท่านั้น",
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "years": [FIRST_YEAR, LAST_YEAR],
        "fetchedOn": date.today().isoformat(),
        "source": "OPEN-METEO",
        "monthlyTempC": [round(v, 1) for v in temp],
        "monthlyMinTempC": [round(v, 1) for v in temp_min],
        "monthlyRainMm": [round(v) for v in rain],
        "rainMmYear": round(sum(rain)),
        "annualMeanTempC": round(sum(temp) / 12, 1),
        "station": STATION,
    }
    with open("data/climate-maetha.json", "w", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)
        file.write("\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
