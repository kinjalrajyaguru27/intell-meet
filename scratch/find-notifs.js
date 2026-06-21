const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../artifacts/meet/src/pages/Dashboard.tsx"), "utf8");
const lines = content.split("\n");

lines.forEach((line, idx) => {
  if (line.includes("notifications.map") || line.includes("NotificationItem") || line.includes("notifications.length")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
