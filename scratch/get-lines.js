const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../artifacts/meet/src/pages/Dashboard.tsx"), "utf8");
const lines = content.split("\n");

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);

for (let i = start - 1; i < end; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
