const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../artifacts/meet/src/pages/Dashboard.tsx"), "utf8");
const lines = content.split("\n");

lines.forEach((line, idx) => {
  if (line.includes("isScheduleOpen") || line.includes("Schedule Meeting") || line.includes("ScheduleMeetingDialog")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
