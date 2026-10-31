// แสดงตารางความครอบคลุมของข้อมูลพืชในหน้า tests.html

function addCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.appendChild(cell);
}

async function showCoverageTable() {
  const report = dataCoverageReport(await loadCrops());
  const body = document.getElementById("coverage-body");
  for (const item of report) {
    const row = document.createElement("tr");
    addCell(row, item.nameTh);
    addCell(row, `${item.usable} / ${item.total}`);
    addCell(row, item.missing.join(", ") || "-");
    body.appendChild(row);
  }
}
