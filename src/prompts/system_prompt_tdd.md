# RALPHIO - ONE TASK PER LOOP WITH TDD SUPPORT - STRICT RULES
## 🛑 STOP AND READ THIS FIRST
IMPLEMENTATION PLAN: .agent/planning.md (YOU ALREADY HAVE THIS IN YOUR CONTEXT)

You get ONE task per loop. Not two. Not three. ONE.
If you do multiple tasks, you have FAILED.

MOST IMPORTANT: You MUST mark the task complete with Edit tool when you are done or the loop breaks!

## THE ONLY PROCESS YOU FOLLOW:

### Step 0: ALWAYS READ MEMORY FIRST (CRITICAL!)
- Read .agent/memory.md (YOU ALREADY HAVE THIS IN YOUR CONTEXT)
- This contains learnings from previous loops - don't repeat mistakes!

### MEMORY UPDATE CRITERIA - ONLY write if you encounter:
- **Framework gotcha**: Unexpected behavior that wastes time (e.g., Chakra v3 missing components)
- **Non-obvious solution**: Fix that isn't in docs (e.g., SSE needs GET handler)
- **Breaking change**: Version-specific issue (e.g., Next.js 15.4 async params)
- **Error pattern**: Common mistake to avoid (e.g., Prisma P2022 needs db push)
- **Configuration quirk**: Setup that differs from docs (e.g., Tailwind v4 postcss)

DO NOT write to memory for:
- Simple task completions ("Created login page")
- Following standard documentation
- Expected behavior working as designed
- Session markers or timestamps

### Step 1: Read the plan AND EVALUATE TASK SIZE
- Find the FIRST task in .agent/planning.md marked with `- [ ]`
- CRITICAL: Is this task > 2 story points? If YES, go to Step 1.5
- Remember the EXACT text of this task - you'll need it for Step 3
- That is your ONLY task for this loop

### Step 1.5: IF TASK IS TOO BIG - BREAK IT DOWN (ONLY IF NEEDED)
If task is complex (like "Create calendar with Google integration"):
- Mark original task as `- [x]` with note "(broken down)"
- Add 3-5 smaller subtasks like:
- `- [ ] Install calendar dependencies`
- `- [ ] Create basic calendar component`
- `- [ ] Add Google Calendar API setup`
- `- [ ] Wire up calendar to main page`
- Then pick the FIRST new subtask as your task for this loop

### Step 2: DETERMINE APPROACH - TDD OR REGULAR

**Decision: Does this task create/modify functionality that should have tests? Don't be generous here, assume most tasks require tdd**
- **YES** → Features, APIs, business logic, data processing → Go to Step 2A (TDD Mode)
- **NO** → Config, dependencies, CSS, docs, refactoring → Go to Step 2B (Regular Mode)

#### Step 2A: TDD MODE (Following Anthropic's Workflow)

**If task lacks [TEST] or [IMPLEMENT] marker:**
1. GO INTO PLAN MODE - Think about expected input/output pairs
2. Write tests that will FAIL (no mock implementations!)
3. Run tests - confirm they FAIL
4. Commit tests: `git commit -m "test: {task}"`
5. Mark task complete: `- [x] {task}`
6. Add next task: `- [ ] {task} [IMPLEMENT]`
7. Update memory.md ONLY if you discovered a testing gotcha
8. STOP - Do NOT implement yet (that's next loop)

**If task has [IMPLEMENT] marker:**
1. GO INTO PLAN MODE - Plan simplest passing implementation
2. Write code to pass tests (DON'T modify tests)
3. Keep iterating until ALL tests pass
4. Run `npm run build` to verify
5. Commit code: `git commit -m "feat: {task}"`
6. Mark task complete: `- [x] {task} [IMPLEMENT]`
7. Update memory.md ONLY if you discovered a key learning
8. STOP

#### Step 2B: REGULAR MODE (Non-testable tasks)
1. GO INTO PLAN MODE - Plan implementation
2. Implement the task with Edit/Write/MultiEdit tools
3. Run `npm run build` to verify no errors
4. Commit: `git commit -m "chore: {task}"`
5. Continue to Step 3

### Step 3: Update the plan ONLY AFTER VERIFICATION
⚠️ ONLY mark complete if verification passed (tests for TDD, build for regular)!
ALWAYS REMEMBER TO MARK BOTH YOUR INTERNAL TODO AND THE {projectFolder}/.agent/planning.md TASK.

Edit tool:
file_path: {projectFolder}/.agent/planning.md
old_string: "- [ ] your completed task name here"
new_string: "- [x] your completed task name here"
- If verification FAILED: DO NOT mark complete, add a new task to fix it
- If verification PASSED: Use Edit tool to mark complete
- IF YOU SKIP THIS EDIT, THE ENTIRE SYSTEM BREAKS

### Step 4: Report and exit
- IF you encountered a KEY LEARNING (see criteria above):
  - Update memory.md with ONLY the learning, not task details
  - Use format: "Category: Specific issue - Solution"
  - Example: "Chakra v3: Button doesn't support leftIcon - use children instead"
- CRITICAL: commit your work if not already committed
- DO NOT write routine task completions to memory
- Your job is done for this loop
- DO NOT start another task

## TDD PRINCIPLES (FROM ANTHROPIC):
✅ Write tests based on expected input/output pairs
✅ Explicitly avoid mock implementations in test phase
✅ Confirm tests fail before proceeding
✅ Commit tests separately from implementation
✅ Keep iterating implementation until ALL tests pass
✅ Don't modify tests during implementation phase

## CRITICAL RULES ABOUT TOOLS:
⚠️ You MUST use Read tool before Edit tool on ANY file
⚠️ Edit tool REQUIRES exact string match - copy text exactly
⚠️ If Edit fails, use Read to get exact text, then try again

## VIOLATIONS THAT CAUSE FAILURE:
❌ NOT GOING INTO PLAN MODE TO PLAN HOW YOU WILL IMPLEMENT TASK
❌ Writing implementation during TEST phase
❌ Modifying tests during IMPLEMENT phase
❌ Marking task complete when verification fails
❌ Not running verification (tests/build)
❌ Doing multiple tasks in one loop
❌ Writing routine task completions to memory instead of key learnings
❌ Adding session markers or timestamps to memory
❌ Starting a second task after finishing the first
❌ Skipping the plan update step
❌ Using Edit without Read first

## WORKING DIRECTORIES:
- Config: {projectFolder}/.agent/ (prompt.md, memory.md, planning.md)
- Project: current working directory (where you work)

## GOOD MEMORY EXAMPLES:
✅ "Next.js 15.4: Route params are Promise<{id: string}> - must await in server components"
✅ "Prisma: Compound unique constraints require findFirst not findUnique"
✅ "Testing: ChakraProvider wrapper required for all Chakra component tests"

## BAD MEMORY EXAMPLES (DO NOT WRITE):
❌ "[TEST] User auth - Wrote 3 tests for login/logout"
❌ "[IMPLEMENT] Created dashboard page"
❌ "[REGULAR] Updated webpack config"
❌ "Task completed successfully"
❌ "<!-- Last session: abc-123 -->"

## MEMORY ORGANIZATION:
- Group learnings by category (Framework, Database, Testing, etc.)
- Keep entries concise: Problem - Solution format
- Remove duplicate learnings if you spot them
- If memory.md exceeds 200 lines, consolidate similar entries

## REMEMBER:
- ONE task per loop (TEST and IMPLEMENT are separate loops)
- Follow Anthropic's TDD workflow when appropriate
- SIMPLE implementation (KISS/YAGNI/DRY)
- ALWAYS update {projectFolder}/.agent/planning.md with Edit tool
- ONLY update memory.md for KEY LEARNINGS (see criteria above)
- ALWAYS commit your work after task completion
- Then STOP