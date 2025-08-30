# RALPHIO - Minimal AI Agent Orchestrator

RALPHIO is a minimal AI-driven development orchestrator inspired by the [Ralph Wiggum Technique](https://ghuntley.com/ralph/) and [repomirror](https://github.com/repomirrorhq/repomirror/blob/main/repomirror.md?ref=ghuntley.com). It embodies the philosophy that "less is more" - focusing on the engine rather than the scaffolding. By running AI in a continuous loop with strict constraints ("one task per loop"), RALPHIO achieves remarkable development automation with just ~800 lines of Node.js code.

## Philosophy

RALPHIO follows three core principles:

1. **One Task Per Loop** - Borrowed from the Ralph Wiggum Technique, each loop handles exactly one task (1-2 story points) to manage context effectively
2. **Minimal Scaffolding** - Inspired by repomirror's approach, we focus on the core engine rather than complex orchestration
3. **Continuous Iteration** - Tasks are processed sequentially with automatic commits, memory updates, and learnings

The result is a tool that can autonomously handle development tasks, from simple file creation to complex feature implementation with Test-Driven Development (TDD) support.

## Features

- 🎯 **One Task Per Loop** - Processes exactly one task per execution, maintaining focus and context
- 🧪 **TDD Support** - Built-in Test-Driven Development workflow (write tests → implement → verify)
- 📝 **PRD Parsing** - Convert Product Requirements Documents into actionable tasks
- 🔄 **Multi-Loop Execution** - Run continuously until all tasks complete
- 💾 **Auto-Commit** - Automatic git commits with descriptive messages
- 🧠 **Memory System** - Persistent learnings across loops to avoid repeated mistakes
- 📊 **Rich Logging** - Detailed logs for debugging and progress tracking
- ⏱️ **Timeout Protection** - Configurable timeouts with graceful failure handling

## Installation

### Global Installation (Recommended)

```bash
npm install -g ralphio
```

### Local Development

```bash
git clone https://github.com/onorbumbum/ralphio.git
cd ralphio
npm install
```

## Quick Start

### 1. Initialize Your Project

```bash
ralphio init
```

This creates the `.agent/` directory structure:
- `.agent/planning.md` - Task list with checkboxes
- `.agent/memory.md` - Persistent memory and learnings
- `.agent/prompt.md` - System prompt (customizable)
- `.agent/agent.config.json` - Configuration file

### 2. Add Tasks to Planning

Edit `.agent/planning.md` with your tasks:

```markdown
# Project Tasks

## Feature Development
- [ ] Create user authentication system
- [ ] Add database models for users
- [ ] Implement login API endpoint
- [ ] Create login UI component
- [ ] Add session management
```

### 3. Run RALPHIO

**Single task execution:**
```bash
ralphio --once
```

**Run until all tasks complete:**
```bash
ralphio --until-success
```

**Parse a PRD into tasks:**
```bash
ralphio --parse-prd requirements.md
```

## How It Works

RALPHIO operates in a simple loop:

1. **Read** - Reads the first unchecked task from `.agent/planning.md`
2. **Plan** - Uses AI to create an implementation plan
3. **Execute** - Implements the task following the plan
4. **Verify** - Runs `npm run build` or tests to verify the implementation
5. **Update** - Marks task complete and updates memory with learnings
6. **Commit** - Auto-commits changes with descriptive message

Each loop is self-contained and atomic, ensuring clean state management and traceable progress.

## TDD Workflow

RALPHIO supports Test-Driven Development with a two-phase approach:

### Phase 1: Write Tests
When encountering a task without `[TEST]` or `[IMPLEMENT]` markers:
1. Writes failing tests based on requirements
2. Commits tests with `test: <task>` message
3. Marks task complete and adds `[IMPLEMENT]` task

### Phase 2: Implementation
When encountering `[IMPLEMENT]` task:
1. Implements code to pass the tests
2. Iterates until all tests pass
3. Commits implementation with `feat: <task>` message

## Configuration

### Environment Variables

- `LOOP_TIMEOUT_MS` - Set loop timeout (default: 600000ms = 10 minutes)

```bash
LOOP_TIMEOUT_MS=180000 ralphio --once  # 3 minute timeout
```

### Memory System

RALPHIO maintains learnings in `.agent/memory.md`:

```markdown
## Stack Discovery
- **Stack**: TypeScript, Next.js 14, React
- **Build Command**: npm run build
- **Type Check**: npm run typecheck

## Learnings
- Next.js 15.4: Route params are Promise<{id: string}> - must await
- Chakra v3: Button doesn't support leftIcon - use children instead
```

These learnings persist across loops, preventing repeated mistakes.

## Advanced Usage

### Custom Prompts

Edit `.agent/prompt.md` to customize RALPHIO's behavior. The default prompt enforces:
- One task per loop
- Read before edit
- Build verification
- Memory updates for key learnings

### Task Breakdown

RALPHIO automatically breaks down large tasks (>2 story points):

```markdown
Original task:
- [ ] Create calendar with Google integration

Becomes:
- [x] Create calendar with Google integration (broken down)
  - [ ] Install calendar dependencies
  - [ ] Create basic calendar component
  - [ ] Add Google Calendar API setup
  - [ ] Wire up calendar to main page
```

### Failure Handling

- **3 consecutive failures** - Stops execution to prevent infinite loops
- **50 iteration limit** - Safety limit for long-running sessions
- **Timeout protection** - Graceful handling of stuck operations

## CLI Commands

```bash
ralphio init              # Initialize .agent/ structure
ralphio --once            # Run single task
ralphio --until-success   # Run until all tasks complete
ralphio --parse-prd <file> # Parse PRD into tasks
ralphio --version         # Show version
ralphio --help            # Show help
```

## Project Structure

```
your-project/
├── .agent/
│   ├── agent.config.json  # Configuration
│   ├── planning.md        # Task list
│   ├── memory.md          # Persistent learnings
│   ├── prompt.md          # System prompt
│   ├── artifacts/         # Loop artifacts
│   └── logs/              # Daily logs
└── your-code/
```

## Troubleshooting

### Common Issues

**"No unchecked tasks found"**
- Add tasks with `- [ ]` format to `.agent/planning.md`

**Build failures**
- Ensure your project has a working `npm run build` command
- Check `.agent/memory.md` for stack discovery

**Git commit failures**
- Configure git with user.name and user.email
- Ensure you have a git repository initialized

**Timeout issues**
- Increase `LOOP_TIMEOUT_MS` for complex tasks
- Break down large tasks into smaller subtasks

### Debug Information

Check these locations for debugging:
- `.agent/logs/ralphio_YYYY-MM-DD.log` - Human-readable activity log
- `.agent/memory.md` - Persistent learnings and stack info
- Git history - Each task creates descriptive commits

## Why RALPHIO?

Traditional AI coding assistants require constant human intervention. RALPHIO changes this by:

1. **Autonomous Operation** - Runs without human intervention for hours
2. **Context Management** - "One task per loop" prevents context overflow
3. **Self-Correction** - Learns from failures and updates approach
4. **Traceable Progress** - Every change is committed with context
5. **Minimal Complexity** - ~800 lines of code vs thousands in alternatives

## Contributing

RALPHIO embraces simplicity. When contributing:

1. Follow the "one task per loop" principle
2. Maintain the minimal philosophy (KISS/DRY/YAGNI)
3. Resist adding complex features
4. Focus on reliability over features

## License

MIT

## Credits

RALPHIO stands on the shoulders of giants:

- [Ralph Wiggum Technique](https://ghuntley.com/ralph/) - For the "one task per loop" philosophy and continuous AI iteration approach
- [repomirror](https://github.com/repomirrorhq/repomirror) - For proving that "less is more" in AI orchestration
- [Claude Task Master](https://github.com/eyaltoledano/claude-task-master) - For the successful PRD parsing approach that inspired our implementation
- [Claude Code SDK](https://www.anthropic.com) - For providing the AI engine that powers RALPHIO

## Support

- Issues: [GitHub Issues](https://github.com/onorbumbum/ralphio/issues)
- Documentation: This README and `.agent/prompt.md`
- Philosophy: Keep it simple, one task at a time

---

*"Any problem created by AI can be resolved through a different series of prompts" - The Ralph Wiggum Technique*