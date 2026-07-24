// backend/rebuild_script.js
import fs from 'fs';
import path from 'path';

const logPath = 'C:/Users/Purna/.gemini/antigravity/brain/8c6e8d94-6bc8-452e-acae-77435fe9a22c/.system_generated/logs/transcript_full.jsonl';
const scriptPath = '../js/script.js';

function rebuild() {
  const logContent = fs.readFileSync(logPath, 'utf8');
  const lines = logContent.split('\n');
  
  let step6053Args = null;
  let step6055Args = null;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      if (step.tool_calls) {
        step.tool_calls.forEach(tc => {
          if (tc.args && tc.args.ReplacementContent) {
            if (tc.args.ReplacementContent.includes('initUserSession')) {
              console.log(`Found initUserSession replacement in Step ${step.step_index}`);
              step6053Args = tc.args;
            }
            if (tc.args.ReplacementContent.includes('initGlobalSearch')) {
              console.log(`Found initGlobalSearch replacement in Step ${step.step_index}`);
              step6055Args = tc.args;
            }
          }
        });
      }
    } catch (e) {}
  }
  
  if (!step6053Args || !step6055Args) {
    console.error("Failed to find step 6053 or 6055 arguments in the log!");
    return;
  }
  
  console.log("Found step 6053 and 6055 replacements.");
  
  // Start with clean 632-line script
  let script = fs.readFileSync(scriptPath, 'utf8');
  
  // Apply step 6053 replacement
  console.log("Applying Step 6053 replacement...");
  if (script.includes(step6053Args.TargetContent)) {
    script = script.replace(step6053Args.TargetContent, step6053Args.ReplacementContent);
    console.log("Step 6053 applied successfully!");
  } else {
    console.error("Step 6053 TargetContent not found in script.js!");
    // Let's try to normalize line endings
    const normScript = script.replace(/\r\n/g, '\n');
    const normTarget = step6053Args.TargetContent.replace(/\r\n/g, '\n');
    if (normScript.includes(normTarget)) {
      script = normScript.replace(normTarget, step6053Args.ReplacementContent);
      console.log("Step 6053 applied successfully with normalization!");
    } else {
      console.error("TargetContent still not found after normalization.");
    }
  }
  
  // Apply step 6055 replacement
  console.log("Applying Step 6055 replacement...");
  if (script.includes(step6055Args.TargetContent)) {
    script = script.replace(step6055Args.TargetContent, step6055Args.ReplacementContent);
    console.log("Step 6055 applied successfully!");
  } else {
    const normScript = script.replace(/\r\n/g, '\n');
    const normTarget = step6055Args.TargetContent.replace(/\r\n/g, '\n');
    if (normScript.includes(normTarget)) {
      script = normScript.replace(normTarget, step6055Args.ReplacementContent);
      console.log("Step 6055 applied successfully with normalization!");
    } else {
      console.error("Step 6055 TargetContent not found!");
    }
  }
  
  // Write the rebuilt script back
  fs.writeFileSync(scriptPath, script, 'utf8');
  console.log("Successfully rebuilt js/script.js!");
}

rebuild();
