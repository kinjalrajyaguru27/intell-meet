const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../artifacts/meet/src/pages/Dashboard.tsx"), "utf8");
const lines = content.split("\n");

for (let i = 1045; i < 1115; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
