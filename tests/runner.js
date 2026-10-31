// ตัวรันชุดทดสอบเล็ก ๆ ที่เขียนเอง ไม่ใช้ไลบรารี
// วิธีใช้ในไฟล์เทสต์: test("ชื่อข้อ", () => { assertEqual(ค่าที่ได้, ค่าที่ควรได้); });

const registeredTests = [];

function test(name, fn) {
  registeredTests.push({ name, fn });
}

function assertEqual(actual, expected, message = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${message} ได้ ${a} แต่ควรได้ ${b}`.trim());
  }
}

function assertTrue(value, message = "ค่าควรเป็นจริง") {
  if (!value) throw new Error(message);
}

// รันทีละข้อ ถ้าข้อไหนพังจะจดว่าไม่ผ่าน แล้วไปข้อถัดไป
async function runOneTest({ name, fn }) {
  try {
    await fn();
    return { name, passed: true };
  } catch (err) {
    return { name, passed: false, error: err.message };
  }
}

function showResult(result) {
  const item = document.createElement("li");
  item.className = result.passed ? "pass" : "fail";
  item.textContent = `${result.passed ? "✅" : "❌"} ${result.name}`;
  if (result.error) {
    const detail = document.createElement("pre");
    detail.textContent = result.error;
    item.appendChild(detail);
  }
  document.getElementById("results").appendChild(item);
}

function showSummary(passedCount, totalCount) {
  const summary = document.getElementById("summary");
  summary.textContent = `ผ่าน ${passedCount} / ${totalCount}`;
  const allPassed = totalCount > 0 && passedCount === totalCount;
  summary.className = allPassed ? "pass" : "fail";
}

async function runTests() {
  let passedCount = 0;
  for (const oneTest of registeredTests) {
    const result = await runOneTest(oneTest);
    if (result.passed) passedCount++;
    showResult(result);
  }
  showSummary(passedCount, registeredTests.length);
}
