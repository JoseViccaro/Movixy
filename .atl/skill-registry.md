# Skill Registry — movixy

**Generated**: 2026-05-04
**Project**: movixy
**Stack**: React 19 + TypeScript 6 + Vite 8 + Vitest

---

## User Skills

Skills installed at `~/.kiro/skills/`. Loaded by the orchestrator before each phase.

| Skill | Triggers (context) | Triggers (task) |
|-------|--------------------|-----------------|
| `branch-pr` | any | creating PR, opening PR, preparing changes for review |
| `chained-pr` | any | PR > 400 lines, chained PRs, stacked PRs, reviewable slices |
| `cognitive-doc-design` | `*.md`, docs | writing guides, READMEs, RFCs, onboarding docs, architecture docs |
| `comment-writer` | any | drafting PR feedback, review comments, GitHub comments, async messages |
| `go-testing` | `*.go`, `*_test.go` | writing Go tests, using teatest, Bubbletea TUI testing |
| `issue-creation` | any | creating GitHub issue, reporting bug, requesting feature |
| `judgment-day` | any | "judgment day", "dual review", "review adversarial", "juzgar" |
| `skill-creator` | any | creating new AI skills, adding agent instructions |
| `work-unit-commits` | any | implementing change, preparing commits, splitting PRs |

> SDD phase skills (`sdd-*`), `_shared`, and `skill-registry` are excluded — they are infrastructure, not project skills.

---

## Project Conventions

No `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, or `GEMINI.md` found in project root.
Conventions are derived from detected tooling below.

---

## Compact Rules

### TypeScript / React (applies to all `*.ts`, `*.tsx` files)

```
- Use TypeScript strict mode (tsconfig enforces it)
- Path aliases: @/ → src/, @domain/ → src/domain/, @data/ → src/data/, @presentation/ → src/presentation/, @core/ → src/core/
- CSS Modules for component styles (ComponentName.module.css alongside ComponentName.tsx)
- Clean Architecture layers: domain → data → presentation. Never import upward (presentation cannot be imported by data/domain)
- Repository pattern: domain defines interfaces, data implements them
- React 19 — use modern patterns (no class components, no legacy lifecycle methods)
- React Query (@tanstack/react-query v5) for server state — no useEffect for data fetching
```

### Testing (applies to `*.test.ts`, `*.test.tsx` files)

```
- Test runner: vitest (command: npm run test:run for single pass, npm run test:coverage for coverage)
- Testing Library: @testing-library/react for component tests
- Test files live in src/test/ (current convention)
- Setup file: src/test/setup.ts (imports @testing-library/jest-dom)
- Strict TDD Mode: ENABLED — RED → GREEN → REFACTOR cycle mandatory
- Coverage: npm run test:coverage (vitest --coverage via @vitest/coverage-v8)
```

### Linting / Formatting (applies to all `*.ts`, `*.tsx` files)

```
- ESLint with typescript-eslint + react-hooks + react-refresh plugins
- Lint command: npm run lint (eslint .)
- Husky pre-commit: runs eslint --fix on staged *.ts/*.tsx, runs vitest on staged test files
- No Prettier configured — ESLint handles style
```

---

## Testing Capabilities Cache

| Capability | Status | Tool / Command |
|------------|--------|----------------|
| Test Runner | ✅ | vitest — `npm run test:run` |
| Unit Tests | ✅ | vitest |
| Integration Tests | ✅ | @testing-library/react |
| E2E Tests | ❌ | Not installed |
| Coverage | ✅ | `npm run test:coverage` (@vitest/coverage-v8) |
| Linter | ✅ | `npm run lint` (eslint) |
| Type Checker | ✅ | `tsc -b` (via build) |
| Formatter | ❌ | Not configured (ESLint handles style) |

**Strict TDD Mode**: enabled ✅ (marker found in `~/.kiro/steering/gentle-ai.md`)
