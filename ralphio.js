#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { query } = require('@anthropic-ai/claude-code');

// Resolve Claude Code CLI executable
const CLAUDE_EXEC = (() => {
  if (process.env.CLAUDE_CODE_EXECUTABLE) return process.env.CLAUDE_CODE_EXECUTABLE;
  if (process.env.CLAUDE_PATH) return process.env.CLAUDE_PATH;
  try {
    // Preferred: package entrypoint
    return require.resolve('@anthropic-ai/claude-code/entrypoints/cli.js');
  } catch (e1) {
    try {
      // Fallback: older package name
      return require.resolve('@anthropic-ai/entrypoints/cli.js');
    } catch (e2) {
      return null;
    }
  }
})();

if (!CLAUDE_EXEC) {
  console.error('❌ Claude Code CLI not found. Install @anthropic-ai/claude-code or set CLAUDE_CODE_EXECUTABLE to the Node CLI path (…/@anthropic-ai/claude-code/entrypoints/cli.js)');
  process.exit(1);
}

// Logging functionality
function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const logsDir = './.agent/logs';

  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return path.join(logsDir, `ralphio_${dateStr}.log`);
}

function logToFile(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type}] ${message}\n`;

  try {
    fs.appendFileSync(getLogFilePath(), logEntry);
  } catch (error) {
    // Silently fail if logging doesn't work - don't break the main functionality
  }
}

function logOutput(text, type = 'OUTPUT') {
  // Write to console
  console.log(text);

  // Also log to file (strip ANSI colors for clean file logs)
  const cleanText = text.replace(/\u001b\[[0-9;]*m/g, '');
  logToFile(cleanText, type);
}


const args = process.argv.slice(2);

// Check if there are any unchecked tasks remaining
function hasUnfinishedTasks() {
  try {
    // Try .agent/planning.md first (new portable format), fallback to planning.md
    let planningPath = './.agent/planning.md';
    if (!fs.existsSync(planningPath)) {
      planningPath = './planning.md';
      if (!fs.existsSync(planningPath)) {
        logToFile('No planning.md found in .agent/ or root directory', 'WARNING');
        return false;
      }
    }

    const planningContent = fs.readFileSync(planningPath, 'utf8');
    // Look for unchecked tasks: - [ ]
    const uncheckedTasks = planningContent.match(/^[ \t]*- \[ \]/gm);

    if (uncheckedTasks && uncheckedTasks.length > 0) {
      logToFile(`Found ${uncheckedTasks.length} unchecked tasks remaining in ${planningPath}`, 'INFO');
      return true;
    } else {
      logToFile('No unchecked tasks found - all tasks completed!', 'SUCCESS');
      return false;
    }
  } catch (error) {
    logToFile(`Error checking for unfinished tasks: ${error.message}`, 'ERROR');
    return false; // Assume no tasks if we can't read the file
  }
}

// Get timeout from environment variable (default: 2 minutes)
function getTimeout() {
  const envTimeout = process.env.LOOP_TIMEOUT_MS;
  if (envTimeout) {
    const timeout = parseInt(envTimeout, 10);
    if (isNaN(timeout) || timeout <= 0) {
      console.warn(`⚠️ Invalid LOOP_TIMEOUT_MS: ${envTimeout}. Using default 600000ms.`);
      return 600000;
    }
    return timeout;
  }
  return 600000; // Default 2 minutes
}

// Timeout wrapper for SDK calls
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

function printHelp() {
  console.log(`RALPHIO - One task per loop agent orchestrator

Usage:
  ralphio --once              Run single task iteration
  ralphio --until-success     Run until all tasks complete or failure limit reached
  ralphio --parse-prd <file>  Parse PRD and generate tasks in planning.md
  ralphio init                Initialize .agent/ structure with template files
  ralphio --version           Show version number
  ralphio --help              Show this help message

Options:
  --once                      Execute one task and exit
  --until-success             Continue executing tasks until completion or failure
  --parse-prd <file>          Parse a PRD file and append tasks to planning.md
  init                        Initialize project with .agent/ structure and templates
  --version                   Display version information
  --help                      Display this help message`);
}

function printVersion() {
  const pkg = require('./package.json');
  console.log(`ralphio v${pkg.version}`);
}

async function initializeAgentStructure() {
  const agentDir = './.agent';

  try {
    // Check if .agent directory already exists
    if (fs.existsSync(agentDir)) {
      console.log('⚠️  .agent/ directory already exists. Skipping initialization...');
      return;
    }

    console.log('🚀 Initializing RALPHIO agent structure...');

    // Create .agent directory
    fs.mkdirSync(agentDir, { recursive: true });
    console.log('✅ Created .agent/ directory');

    // Create subdirectories
    fs.mkdirSync(path.join(agentDir, 'artifacts', 'loops'), { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'logs'), { recursive: true });
    console.log('✅ Created subdirectories: artifacts/loops, logs');

    // Create agent.config.json
    const configContent = {
      "paths": {
        "agentDir": "./.agent",
        "memoryFile": "./.agent/memory.md",
        "planFile": "./.agent/planning.md",
        "promptFile": "./.agent/prompt.md",
        "artifactsDir": "./.agent/artifacts/loops",
        "logsDir": "./.agent/logs"
      }
    };
    fs.writeFileSync(
      path.join(agentDir, 'agent.config.json'),
      JSON.stringify(configContent, null, 2)
    );
    console.log('✅ Created agent.config.json with default paths');

    // Create memory.md template
    const memoryTemplate = `# MEMORY

## Stack Discovery
- **Stack**: [To be discovered on first run]
- **Build Command**: [To be discovered]
- **Type Check**: [To be discovered]

## Learnings

[Loop results and learnings will be recorded here automatically]
`;
    fs.writeFileSync(
      path.join(agentDir, 'memory.md'),
      memoryTemplate
    );
    console.log('✅ Created memory.md template');

    // Create planning.md template (main task file)
    const planTemplate = `# Planning - Sample Tasks

## Getting Started
- [ ] Run npm run build to verify project setup
- [ ] Create a simple hello.txt file with greeting message
- [ ] Add a test comment to demonstrate edit functionality

## Notes
- Each task should be 1-2 story points (simple, focused changes)
- Tasks are processed one at a time by RALPHIO
- Mark tasks with \`- [ ]\` for unchecked, \`- [x]\` when complete
- Parent tasks can have child subtasks with same indentation
`;
    fs.writeFileSync(
      path.join(agentDir, 'planning.md'),
      planTemplate
    );
    console.log('✅ Created planning.md with sample tasks');

    // Create prompt.md by reading from the external file
    // Try multiple possible locations for the prompt file
    const possiblePaths = [
      path.join(__dirname, 'src', 'prompts', 'system_prompt_tdd.md'),
      path.join(process.cwd(), 'node_modules', 'ralphio', 'src', 'prompts', 'system_prompt_tdd.md')
    ];

    // Try to find via require.resolve if this is an installed package
    try {
      const ralphioPath = require.resolve('ralphio');
      possiblePaths.push(path.join(path.dirname(ralphioPath), 'src', 'prompts', 'system_prompt_tdd.md'));
    } catch (e) {
      // Not installed as package, that's ok
    }

    let promptTemplate = '';
    let foundPath = null;

    for (const promptPath of possiblePaths) {
      try {
        if (fs.existsSync(promptPath)) {
          promptTemplate = fs.readFileSync(promptPath, 'utf8');
          foundPath = promptPath;
          console.log(`✅ Read prompt template from: ${path.relative(process.cwd(), promptPath)}`);
          break;
        }
      } catch (e) {
        // Try next path
      }
    }

    if (!foundPath) {
      // Fallback to a minimal but functional template if file doesn't exist
      console.warn('⚠️  system_prompt_tdd.md not found in any expected location');
      console.warn('   Searched paths:', possiblePaths.map(p => path.relative(process.cwd(), p)).join(', '));
      // Use the embedded prompt template from src/prompts/system_prompt_tdd.md
      promptTemplate = `# RALPHIO - ONE TASK PER LOOP WITH TDD SUPPORT - STRICT RULES
## 🛑 STOP AND READ THIS FIRST
IMPLEMENTATION PLAN: .agent/planning.md

You get ONE task per loop. Not two. Not three. ONE.
If you do multiple tasks, you have FAILED.

## THE ONLY PROCESS YOU FOLLOW:
### Step 0: ALWAYS READ MEMORY FIRST (CRITICAL!)
- Read .agent/memory.md
- This contains learnings from previous loops - don't repeat mistakes!

### Step 1: Read the plan AND EVALUATE TASK SIZE
- Find the FIRST task in .agent/planning.md marked with \`- [ ]\`
- Remember the EXACT text of this task
- That is your ONLY task for this loop

### Step 2: DETERMINE APPROACH - TDD OR REGULAR
**Decision: Does this task create/modify functionality that should have tests?**
- **YES** → Features, APIs, business logic → Go to Step 2A (TDD Mode)
- **NO** → Config, dependencies, CSS, docs → Go to Step 2B (Regular Mode)

#### Step 2A: TDD MODE
**If task lacks [TEST] or [IMPLEMENT] marker:**
1. Write tests that will FAIL
2. Run tests - confirm they FAIL
3. Commit tests: \`git commit -m "test: {task}"\`
4. Mark task complete and add [IMPLEMENT] task
5. STOP - Do NOT implement yet

**If task has [IMPLEMENT] marker:**
1. Write code to pass tests
2. Run tests until ALL pass
3. Run \`npm run build\` to verify
4. Commit: \`git commit -m "feat: {task}"\`
5. Mark task complete
6. STOP

#### Step 2B: REGULAR MODE
1. Implement the task
2. Run \`npm run build\` to verify
3. Commit: \`git commit -m "chore: {task}"\`
4. Continue to Step 3

### Step 3: Update the plan
Use Edit tool to mark task complete in .agent/planning.md

### Step 4: Report and exit
- Update memory.md if you learned something important
- Your job is done for this loop

[Note: Full prompt template not embedded - please ensure ralphio is properly installed]`;
    }

    fs.writeFileSync(
      path.join(agentDir, 'prompt.md'),
      promptTemplate
    );
    console.log('✅ Created prompt.md with RALPHIO instructions');

    console.log('\n🎉 RALPHIO initialization complete!');
    console.log('📝 Next steps:');
    console.log('   1. Edit {projectFolder}/.agent/planning.md to add your tasks');
    console.log('   2. Run: ralphio --once (single task)');
    console.log('   3. Or run: ralphio --until-success (all tasks)');

  } catch (error) {
    console.error('❌ Failed to initialize agent structure:', error.message);
    process.exit(1);
  }
}


// Parse PRD and generate tasks
async function parsePRD(prdFile) {
  try {
    // Check if PRD file exists
    if (!fs.existsSync(prdFile)) {
      console.error(`❌ PRD file not found: ${prdFile}`);
      return false;
    }

    // Ensure .agent structure exists
    if (!fs.existsSync('.agent/planning.md')) {
      console.error('❌ No .agent/planning.md found. Run "ralphio init" first.');
      return false;
    }

    // Read PRD content
    const prdContent = fs.readFileSync(prdFile, 'utf8');
    console.log(`📖 Reading PRD from ${prdFile}...`);

    // Read current planning.md to check existing tasks
    const currentPlanning = fs.readFileSync('.agent/planning.md', 'utf8');

    // Read the parse PRD prompt
    // Try multiple possible locations for the prompt file
    const possiblePrdPaths = [
      path.join(__dirname, 'src', 'prompts', 'parse_prd_tdd_prompt.md'),
      path.join(process.cwd(), 'node_modules', 'ralphio', 'src', 'prompts', 'parse_prd_tdd_prompt.md')
    ];

    // Try to find via require.resolve if this is an installed package
    try {
      const ralphioPath = require.resolve('ralphio');
      possiblePrdPaths.push(path.join(path.dirname(ralphioPath), 'src', 'prompts', 'parse_prd_tdd_prompt.md'));
    } catch (e) {
      // Not installed as package, that's ok
    }

    let parsePrompt = '';
    let foundPrdPath = null;

    for (const promptPath of possiblePrdPaths) {
      try {
        if (fs.existsSync(promptPath)) {
          parsePrompt = fs.readFileSync(promptPath, 'utf8');
          foundPrdPath = promptPath;
          console.log(`✅ Read PRD prompt from: ${path.relative(process.cwd(), promptPath)}`);
          break;
        }
      } catch (e) {
        // Try next path
      }
    }

    if (!foundPrdPath) {
      // Fallback inline prompt if file doesn't exist
      console.warn('⚠️  parse_prd_tdd_prompt.md not found in any expected location');
      console.warn('   Searched paths:', possiblePrdPaths.map(p => path.relative(process.cwd(), p)).join(', '));
      parsePrompt = `Analyze this PRD and generate development tasks. Each task should:
- Be a single checkbox item: "- [ ] Task description"
- Be atomic and focused (roughly 2 story points)
- Follow KISS/DRY/YAGNI principles
- Be actionable and specific

Current planning.md content for context (avoid duplicates):
${currentPlanning}

PRD Content:
${prdContent}

Generate only the task list in markdown format, nothing else.`;
    }

    // Build the full prompt - ensure it asks for ONLY the task list
    const fullPrompt = parsePrompt + '\n\nPRD Content:\n' + prdContent + '\n\nCurrent planning.md (for context - avoid duplicates):\n' + currentPlanning + '\n\nIMPORTANT: Output ONLY the task list in markdown format with story points. No explanations, no preamble, no tool calls.';

    console.log('🧠 Analyzing PRD and generating tasks...');

    // Call Claude to parse PRD
    let generatedTasks = '';
    for await (const message of query({
      prompt: fullPrompt,
      options: {
        permissionMode: 'bypassPermissions',
        maxTurns: 1,
        pathToClaudeCodeExecutable: CLAUDE_EXEC
      }
    })) {
      if (message.type === "assistant" && message.message.content) {
        for (const block of message.message.content) {
          if (block.type === "text") {
            generatedTasks += block.text;
          }
        }
      } else if (message.type === "result") {
        // Final result
        if (message.result) {
          generatedTasks = message.result;
        }
      }
    }

    if (!generatedTasks) {
      console.error('❌ Failed to generate tasks from PRD');
      return false;
    }

    // Append tasks to planning.md
    const separator = '\n\n## Tasks from PRD (' + new Date().toISOString().split('T')[0] + ')\n';
    fs.appendFileSync('.agent/planning.md', separator + generatedTasks + '\n');

    console.log('✅ Tasks successfully added to .agent/planning.md');
    console.log('📝 Review the tasks and run "ralphio --once" or "ralphio --until-success" to start implementation');

    return true;
  } catch (error) {
    console.error('❌ Error parsing PRD:', error.message);
    logToFile(`PRD parsing error: ${error.message}`, 'ERROR');
    return false;
  }
}

// Simple auto-commit with task info
function autoCommitChanges(taskDescription, sessionId) {
  let commitMsg = ''; // Define in function scope for error handler

  try {
    const { execSync } = require('child_process');

    // Check if there are changes to commit
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      console.log('\n✅ No uncommitted changes (agent may have already committed)');
      logToFile('No changes to commit - agent likely already committed', 'INFO');
      return true;
    }

    // Build safe commit message
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS
    const session = sessionId ? sessionId.slice(-6) : 'nosess';

    // Sanitize task - keep it simple and safe for shell, but smart truncation
    let task = (taskDescription || 'task')
      .replace(/[^a-zA-Z0-9 \-_]/g, '') // Only safe chars first
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Smart truncation - don't cut words
    if (task.length > 50) {
      task = task.substring(0, 50);
      const lastSpace = task.lastIndexOf(' ');
      if (lastSpace > 30) {
        task = task.substring(0, lastSpace); // Cut at word boundary
      }
    }
    task = task.trim() || 'task';

    // Simple format that always works
    commitMsg = `RALPHIO: ${task} [${session}-${timestamp}]`;

    // Debug logging
    console.log(`\n📝 Attempting auto-commit:`);
    console.log(`   Task: "${taskDescription}" -> "${task}"`);
    console.log(`   Session: ${sessionId || 'none'} -> ${session}`);
    console.log(`   Message: "${commitMsg}"`);
    logToFile(`Commit attempt - Original: "${taskDescription}", Sanitized: "${task}", Full: "${commitMsg}"`, 'DEBUG');

    // Stage changes and verify something is actually staged
    execSync('git add -A', { encoding: 'utf8' });

    // Double-check: are there actually staged changes?
    const stagedChanges = execSync('git diff --cached --stat', { encoding: 'utf8' });
    if (!stagedChanges.trim()) {
      // This can happen if files were modified then reverted, or if agent committed
      console.log('\n✅ No changes to commit after staging (likely already committed)');
      logToFile('No staged changes - agent likely committed or changes were reverted', 'INFO');
      return true;
    }

    // Now commit
    execSync(`git commit -m "${commitMsg}"`, { encoding: 'utf8' });

    console.log(`✅ AUTO-COMMIT SUCCESS: ${commitMsg}`);
    logToFile(`Auto-committed: ${commitMsg}`, 'SUCCESS');

    return true;
  } catch (error) {
    // If it's just "nothing to commit", that's fine
    if (error.message.includes('nothing to commit')) {
      logToFile('Nothing to commit', 'INFO');
      return true;
    }

    // Detailed error debugging
    console.error(`\n⚠️ Auto-commit failed!`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stderr: ${error.stderr || 'none'}`);
    console.error(`   Status: ${error.status || 'unknown'}`);
    console.error(`   Command: git commit -m "${commitMsg}"`);

    logToFile(`Auto-commit failed: ${error.message}`, 'ERROR');
    logToFile(`Error details - stderr: ${error.stderr}, status: ${error.status}`, 'DEBUG');

    // Try to show git status for debugging
    try {
      const debugStatus = execSync('git status --short', { encoding: 'utf8' });
      console.error(`   Git status:\n${debugStatus.split('\n').map(l => '     ' + l).join('\n')}`);
    } catch (e) {
      // Ignore if this fails too
    }

    return false;
  }
}

async function runTask() {
  const timeoutMs = getTimeout(); // Move to function scope
  let sessionId = null; // Track session for this loop

  try {
    // Read all critical files to ensure full context
    const promptContent = fs.readFileSync('.agent/prompt.md', 'utf8');
    const memoryContent = fs.readFileSync('.agent/memory.md', 'utf8');
    const planningContent = fs.readFileSync('.agent/planning.md', 'utf8');

    // Extract current task for commit message
    const taskMatch = planningContent.match(/^[ \t]*- \[ \] (.+)$/m);
    const currentTask = taskMatch ? taskMatch[1] : 'task';

    // Inject content for immediate context, but agent still edits the actual files
    const fullPrompt = `

=== CURRENT STATE OF .agent/prompt.md (you don't have to re-read with edit tool) ===
${promptContent}
=== END OF .agent/prompt.md ===

=== CURRENT STATE OF .agent/memory.md (you don't have to re-read with edit tool) ===
${memoryContent}
=== END OF .agent/memory.md ===

=== CURRENT STATE OF .agent/planning.md (you don't have to re-read with edit tool) ===
${planningContent}
=== END OF agent/planning.md ===

Follow the ./.agent/prompt.md instructions EXACTLY step by step. Step 0: Read ./.agent/memory.md first. Step 1: Read ./.agent/planning.md and find FIRST unchecked task. Step 2: Go into plan mode using exit_plan_mode tool, implement task, run npm run build to verify. Step 3: Mark task complete with Edit tool ONLY if build succeeded. Step 4: You have to commit your work. ONE task per loop only.

IMPORTANT: You must still use Edit tool on the actual files:
- To mark task complete: Edit {projectFolder}/.agent/planning.md
- To update memory: Edit {projectFolder}/.agent/memory.md
Do NOT try to edit the content shown above - edit the actual files.`;

    const message = '🔄 Starting task execution...';
    console.log(message);
    logToFile(message, 'INFO');

    const queryPromise = (async () => {
      let result = '';
      for await (const message of query({
        prompt: fullPrompt,
        options: {
          permissionMode: 'bypassPermissions',
          maxTurns: 200,
          pathToClaudeCodeExecutable: CLAUDE_EXEC
        }
      })) {
        // Capture session ID from init message
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
          logToFile(`Session started: ${sessionId}`, 'INFO');
          console.log(`📍 Session ID: ${sessionId}`);
        } else if (message.type === "assistant") {
          // Stream assistant responses in real-time, line by line
          if (message.message.content) {
            for (const block of message.message.content) {
              if (block.type === "text") {
                const text = block.text;

                // Split into lines and output each line separately
                const lines = text.split('\n');
                for (const line of lines) {
                  if (line.trim()) {
                    logOutput(line);
                  }
                }
              } else if (block.type === "tool_use") {
                // Log tool calls for visibility
                const toolCall = `🪚 TOOL CALL: ${block.name}`;
                const toolParams = block.input ? ` | Params: ${JSON.stringify(block.input, null, 2)}` : '';
                logOutput(toolCall + toolParams);
              }
            }
          }
        } else if (message.type === "tool_result") {
          // Log tool results
          const toolResult = `📋 TOOL RESULT: ${message.tool_name || 'unknown'} | ${message.is_error ? 'ERROR' : 'SUCCESS'}`;
          logOutput(toolResult);
          if (message.content && message.content.length < 500) {
            logOutput(`   Result: ${JSON.stringify(message.content).substring(0, 200)}...`);
          }
        } else if (message.type === "result") {
          result = message.result;
          const completionMessage = `\n✅ Task execution completed. Session: ${sessionId}`;
          console.log(completionMessage);
          logToFile(`Task completed in session: ${sessionId}`, 'INFO');

          // Save session ID to memory for potential resume
          if (sessionId) {
            fs.appendFileSync('.agent/memory.md', `\n<!-- Last session: ${sessionId} -->\n`);
          }
        } else {
          // Log any other message types for debugging
          logToFile(`DEBUG: Unknown message type: ${message.type}`, 'DEBUG');
        }
      }
      return result;
    })();

    const result = await withTimeout(queryPromise, timeoutMs);

    // Simple auto-commit: just commit if there are changes
    const committed = autoCommitChanges(currentTask, sessionId);
    if (!committed) {
      console.warn('⚠️ Auto-commit failed, but task completed successfully');
      logToFile('Warning: Auto-commit failed but continuing', 'WARNING');
    }

    return result;
  } catch (error) {
    let errorMessage;
    if (error.message.includes('timed out')) {
      errorMessage = `❌ RALPHIO timed out after ${getTimeout()}ms. Try setting LOOP_TIMEOUT_MS environment variable.`;
    } else {
      errorMessage = `❌ RALPHIO failed: ${error.message}`;
    }
    console.error(errorMessage);
    logToFile(errorMessage, 'ERROR');
    throw error;
  }
}

async function runUntilSuccess() {
  let iteration = 1;
  let consecutiveFailures = 0;
  const maxIterations = 50;
  const maxConsecutiveFailures = 3;

  // Initial check - if no tasks, don't start
  if (!hasUnfinishedTasks()) {
    const noTasksMessage = '🎉 ALL TASKS ALREADY COMPLETED! Nothing to do.';
    console.log(noTasksMessage);
    logToFile('ALL TASKS ALREADY COMPLETED - NO WORK NEEDED', 'COMPLETE');
    process.exit(0);
  }

  while (iteration <= maxIterations) {
    // Check if there are any tasks left to do
    if (!hasUnfinishedTasks()) {
      const completionMessage = `\n🎉 ALL TASKS COMPLETED! No unchecked tasks found in planning.md`;
      console.log(completionMessage);
      logToFile('ALL TASKS COMPLETED - TERMINATING SUCCESSFULLY', 'COMPLETE');
      process.exit(0);
    }

    const separator = `${'='.repeat(60)}`;
    const iterationMessage = `🔄 ITERATION ${iteration}/${maxIterations} - Starting task execution...`;

    console.log(`\n${separator}`);
    console.log(iterationMessage);
    console.log(`${separator}\n`);

    logToFile(`ITERATION ${iteration}/${maxIterations} - Starting task execution...`, 'INFO');

    try {
      await runTask();
      const successMessage = `\n✅ ITERATION ${iteration} COMPLETED SUCCESSFULLY`;
      const resetMessage = `   Consecutive failures: 0 (reset)`;
      console.log(successMessage);
      console.log(resetMessage);

      logToFile(`ITERATION ${iteration} COMPLETED SUCCESSFULLY`, 'SUCCESS');
      logToFile('Consecutive failures: 0 (reset)', 'INFO');
      consecutiveFailures = 0; // Reset on success
      iteration++;

      // Small delay between iterations for readability
      if (iteration <= maxIterations) {
        console.log('\n⏳ Preparing next iteration...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      consecutiveFailures++;
      const failMessage = `\n❌ ITERATION ${iteration} FAILED`;
      const failureCount = `   Consecutive failures: ${consecutiveFailures}/${maxConsecutiveFailures}`;
      const errorDetail = `   Error: ${error.message}`;

      console.log(failMessage);
      console.log(failureCount);
      console.log(errorDetail);

      logToFile(`ITERATION ${iteration} FAILED`, 'FAILURE');
      logToFile(`Consecutive failures: ${consecutiveFailures}/${maxConsecutiveFailures}`, 'INFO');
      logToFile(`Error: ${error.message}`, 'ERROR');

      if (consecutiveFailures >= maxConsecutiveFailures) {
        const terminationMessage = '\n💥 TERMINATION: 3 consecutive failures reached. System appears unstable.';
        console.log(terminationMessage);
        logToFile(terminationMessage.trim(), 'TERMINATION');
        process.exit(1);
      }
      iteration++;

      // Small delay before retry
      if (iteration <= maxIterations) {
        console.log('\n⏳ Retrying next iteration...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  const maxIterationsMessage = `🛑 TERMINATION: Reached maximum ${maxIterations} iterations`;
  console.log(maxIterationsMessage);
  logToFile(maxIterationsMessage, 'TERMINATION');
  process.exit(2);
}

// Parse arguments
if (args.length === 0 || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--version')) {
  printVersion();
  process.exit(0);
}

if (args.includes('init')) {
  initializeAgentStructure()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
  return;
}

if (args.includes('--parse-prd')) {
  const prdIndex = args.indexOf('--parse-prd');
  const prdFile = args[prdIndex + 1];

  if (!prdFile) {
    console.error('❌ Please provide a PRD file: ralphio --parse-prd <file>');
    process.exit(1);
  }

  parsePRD(prdFile)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
  return;
}

if (args.includes('--once')) {
  const startMessage = '🧠 RALPHIO starting single iteration...';
  console.log(startMessage);
  logToFile(startMessage, 'START');

  runTask()
    .then(() => {
      logToFile('RALPHIO single iteration completed successfully', 'COMPLETE');
      process.exit(0);
    })
    .catch(() => {
      logToFile('RALPHIO single iteration failed', 'COMPLETE');
      process.exit(1);
    });
  return;
}

if (args.includes('--until-success')) {
  const multiStartMessage = '🧠 RALPHIO starting multi-loop execution until success...';
  console.log(multiStartMessage);
  logToFile(multiStartMessage, 'START');

  runUntilSuccess();
  return;
}

console.log('❌ Unknown command. Use --help for usage information.');
process.exit(1);
