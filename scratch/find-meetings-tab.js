const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../artifacts/meet/src/pages/Dashboard.tsx"), "utf8");
const lines = content.split("\n");

console.log("=== Matching lines ===");
lines.forEach((line, idx) => {
  if (line.includes('activeTab === "meetings"') || line.includes('activeTab === "teams"') || line.includes('activeTab === "ai"') || line.includes('activeTab === "chat"')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
