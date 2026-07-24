// backend/recover_full_script.js
import fs from 'fs';
import path from 'path';

const logPath = 'C:/Users/Purna/.gemini/antigravity/brain/8c6e8d94-6bc8-452e-acae-77435fe9a22c/.system_generated/logs/transcript_full.jsonl';

function recover() {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log(`Total lines in log: ${lines.length}`);
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    try {
      const step = JSON.parse(lines[i]);
      if (step.tool_calls) {
        step.tool_calls.forEach(tc => {
          if (tc.args && tc.args.TargetFile && tc.args.TargetFile.replace(/\\/g, '/').endsWith('js/script.js')) {
            console.log(`FOUND MODIFICATION: Step ${step.step_index} | Tool: ${tc.name}`);
            console.log(`Arguments: ${JSON.stringify(tc.args, null, 2)}`);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }
}

recover();
