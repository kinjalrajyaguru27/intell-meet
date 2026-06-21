const fs = require('fs');

try {
  const content = fs.readFileSync('./lib/api-spec/openapi.yaml', 'utf8');
  // Simple check for duplicate keys or structural anomalies
  console.log("YAML file size:", content.length, "characters");
  // Let's use a dynamic import of js-yaml or another parser if available,
  // or write a basic parser to verify it.
} catch (e) {
  console.error("Error reading file:", e);
}
