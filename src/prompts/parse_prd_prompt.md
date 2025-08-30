Parse the PRD into a structured, dependency-aware, and logically sequenced list of development tasks.

## Pre-Analysis (Essential)
1. Use Glob/Grep/Read tools to understand existing codebase
2. Check current versions of mentioned libraries (avoid outdated training data)
3. Identify dependencies between tasks for proper sequencing

## Task Format & Story Points
**Format**: `- [ ] Task description (N story)`
- **(1 story)**: Single file, <50 lines, one clear action
- **(2 stories)**: 2-3 files, <100 lines, or includes testing
- **Never exceed 2 stories** - Break down anything larger

## Critical Sequencing Rules
1. **Dependencies first**: Database before models, server before routes
2. **Build order**: Setup → Core → Features → Polish
3. **Each task enables the next**: No forward dependencies
4. **Test after implementation**: Feature first, then its tests

## ANTI-PATTERNS TO AVOID
- **NO over-engineering**: Skip design patterns unless PRD requires them
- **NO speculation**: Don't add "nice-to-have" features
- **NO abstraction layers**: Direct implementation unless PRD specifies
- **NO microservices/CQRS/event-sourcing** for simple apps

## Task Writing Rules
- **Be specific**: "Add POST /login endpoint" not "Implement auth"
- **Most direct path**: Choose simplest solution that works
- **Respect PRD tech choices**: Don't "improve" specified technologies
- **YAGNI strictly**: Only what PRD explicitly requires

## Example Output (Properly Sequenced)
```markdown
- [ ] Initialize npm project with package.json (1 story)
- [ ] Install express and create basic server.js (1 story)
- [ ] Set up MongoDB connection and config (2 stories)
- [ ] Create User model schema (1 story)
- [ ] Add POST /users endpoint for user creation (2 stories)
- [ ] Add GET /users/:id endpoint (1 story)
- [ ] Add input validation middleware (2 stories)
- [ ] Write tests for user endpoints (2 stories)
```

Generate only the task list in proper dependency order - no explanations.