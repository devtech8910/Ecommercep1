import fs from 'fs';
import path from 'path';
import vm from 'vm';

function checkDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      checkDirectory(fullPath);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let count = 0;
      while ((match = scriptRegex.exec(content)) !== null) {
        const jsCode = match[1].trim();
        // Skip external script tags
        if (!jsCode) continue;
        count++;
        try {
          new vm.Script(jsCode);
        } catch (e) {
          console.error(`Syntax error in file ${fullPath}, script tag ${count}:`, e.message);
        }
      }
    }
  }
}

console.log('=== Starting syntax checks on all HTML files ===');
checkDirectory('pages');
checkDirectory('.');
console.log('=== Finished syntax checks ===');
