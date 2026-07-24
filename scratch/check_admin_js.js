const fs = require('fs');
const path = require('path');
const vm = require('vm');

const adminPath = 'c:/Users/Purna/OneDrive/Desktop/Ecom/pages/admin.html';
const html = fs.readFileSync(adminPath, 'utf8');

// Extract script
const match = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!match) {
  console.log("No script tag found!");
  process.exit(1);
}

const scriptText = match[1];

try {
  new vm.Script(scriptText);
  console.log("✅ Script syntax is VALID!");
} catch (err) {
  console.error("❌ Script syntax has ERROR:");
  console.error(err);
}
