# Parse PRD into TDD-Aware Development Tasks

Parse the PRD into a structured, dependency-aware, and logically sequenced list of development tasks.

## Pre-Analysis (Essential)
1. Use Glob/Grep/Read tools to understand existing codebase
2. Check current versions of mentioned libraries (avoid outdated training data)
3. Identify dependencies between tasks for proper sequencing
4. Determine which features need tests (business logic, APIs, data processing)

## Task Format & Story Points
**Format**: `- [ ] Task description (N story)`
- **(1 story)**: Single file, <50 lines, one clear action
- **(2 stories)**: 2-3 files, <100 lines, or includes testing
- **Never exceed 2 stories** - Break down anything larger

## TDD Task Recognition
For tasks that create/modify testable functionality:
- Mark them clearly so RALPHIO knows to use TDD approach
- Examples of TDD candidates:
- API endpoints (POST /login, GET /users/:id)
- Business logic (calculateDiscount, validateInput)
- Data processing (parseCSV, transformData)
- State management (user sessions, cart operations)

For tasks that DON'T need TDD:
- Configuration changes (webpack, eslint, package.json)
- CSS/styling updates
- Documentation updates
- Dependency installation
- Simple refactoring without behavior changes

## Critical Sequencing Rules
1. **Dependencies first**: Database before models, server before routes
2. **Build order**: Setup → Core → Features → Polish
3. **Each task enables the next**: No forward dependencies
4. **TDD Flow**: When applicable, tests will be written in one loop, implementation in the next

## ANTI-PATTERNS TO AVOID
- **NO over-engineering**: Skip design patterns unless PRD requires them
- **NO speculation**: Don't add "nice-to-have" features
- **NO abstraction layers**: Direct implementation unless PRD specifies
- **NO microservices/CQRS/event-sourcing** for simple apps
- **NO forcing TDD**: Only for testable features, not config/styling

## Task Writing Rules
- **Be specific**: "Add POST /login endpoint with JWT auth" not "Implement auth"
- **Most direct path**: Choose simplest solution that works
- **Respect PRD tech choices**: Don't "improve" specified technologies
- **YAGNI strictly**: Only what PRD explicitly requires
- **TDD hints**: Include "(needs tests)" for TDD candidates

## Example Output (TDD-Aware)
```markdown
## Setup & Configuration
- [ ] Initialize npm project with package.json (1 story)
- [ ] Install express and create basic server.js (1 story)
- [ ] Set up MongoDB connection and config (2 stories)
- [ ] Configure Jest testing framework (1 story)

## Core Features (TDD Candidates)
- [ ] Create User model schema (1 story)
- [ ] Add user registration logic with validation (2 stories) # TDD candidate
- [ ] Add user authentication with JWT (2 stories) # TDD candidate
- [ ] Add POST /users endpoint for user creation (2 stories) # TDD candidate
- [ ] Add GET /users/:id endpoint (1 story) # TDD candidate
- [ ] Add password hashing utility (1 story) # TDD candidate

## Supporting Features
- [ ] Add input validation middleware (2 stories) # TDD candidate
- [ ] Add error handling middleware (1 story)
- [ ] Add request logging middleware (1 story)
- [ ] Configure CORS settings (1 story)

Output Instructions

- Generate only the task list in proper dependency order
- Add comments like "# TDD candidate" for tasks that should use TDD
- No explanations outside of the task list
- Ensure each task is actionable and specific
- Break down any task over 2 story points

Remember: RALPHIO will process these ONE TASK PER LOOP. When it encounters a TDD candidate, it will:
1. First loop: Write failing tests and commit
2. Second loop: Implement code to pass tests and commit

This ensures Anthropic's TDD best practices while maintaining RALPHIO's simplicity.

This enhanced PRD parsing prompt:

1. **Identifies TDD candidates** - Marks which tasks should use test-driven development
2. **Maintains simplicity** - Doesn't force TDD on config/styling tasks
3. **Provides clear examples** - Shows what is and isn't a TDD candidate
4. **Respects RALPHIO's flow** - Each task stays under 2 story points
5. **Follows Anthropic's principles** - TDD for features, direct implementation for simple tasks
6. **Adds helpful comments** - "# TDD candidate" helps RALPHIO make decisions