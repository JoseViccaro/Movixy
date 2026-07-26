# Tasks: Sube todos los cambios pendientes al remoto

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | 3 (.gitignore only; remaining code already verified) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | .gitignore + stage cycles + push | single PR | `git status --porcelain \| wc -l` (expect 0) | N/A — pure git ops | `git reset HEAD~4 && git push --force-with-lease` |

## Phase 1: Gitignore Patch

- [ ] 1.1 **Edit `.gitignore`** — add `coverage/`, `android/app/build/`, `assets/` entries to root `.gitignore`
  - Deps: None — Effort: S — Verify: `grep` confirms 3 new entries in `.gitignore`
  - Files: `.gitignore`

- [ ] 1.2 **Stage and commit `.gitignore`** — `git add .gitignore && git commit -m "chore: add coverage/, android/app/build/, and assets/ to .gitignore"`
  - Deps: 1.1 — Effort: S — Verify: `git log -1 --oneline` shows the gitignore commit
  - Files: `.gitignore`

## Phase 2: Stage & Commit frontend-premium-ui Cycle

- [ ] 2.1 **Stage frontend-premium-ui files** — `git add` all modified/untracked files belonging to the frontend-premium-ui SDD cycle (presentation layer components, CSS modules, pages, hooks, new test files)
  - Deps: 1.2 — Effort: M — Verify: `git diff --cached --stat` shows correct scope (no architecture/backend files)
  - Files: `src/presentation/**/*`, `src/test/*.test.tsx`, `public/*`, `src/index.css`, etc.

- [ ] 2.2 **Commit frontend-premium-ui** — `git commit -m "feat: premium UI with glassmorphism, transitions, and spatial navigation"`
  - Deps: 2.1 — Effort: S — Verify: `git log -1 --oneline` shows the commit; `git status --short` shows remaining files
  - Files: N/A (git commit)

## Phase 3: Stage & Commit refactor-limpieza-arquitectura Cycle

- [ ] 3.1 **Stage refactor-limpieza-arquitectura files** — `git add` all remaining modified/deleted/untracked files (architecture refactoring, data layer, domain cleanup, test infrastructure, deleted artifacts, Android resources, config files)
  - Deps: 2.2 — Effort: M — Verify: `git diff --cached --stat` includes architecture/data/domain files; no staged files overlap with Phase 2
  - Files: `src/core/**/*`, `src/data/**/*`, `src/domain/**/*`, `android/**/*`, `docker-compose.yml`, `package*.json`, `tsconfig.app.json`, `vite.config.ts`, `vitest.config.ts`, `ARCHITECTURE.md`, deleted files

- [ ] 3.2 **Commit refactor-limpieza-arquitectura** — `git commit -m "refactor: clean architecture reorganization and code cleanup"`
  - Deps: 3.1 — Effort: S — Verify: `git status --short` is clean (no remaining changes)
  - Files: N/A (git commit)

## Phase 4: Push & Verify

- [ ] 4.1 **Push to origin/main** — `git push origin main`
  - Deps: 3.2 — Effort: S — Verify: `git push` succeeds with no errors
  - Files: N/A (git push)

- [ ] 4.2 **Verify working tree and remote** — `git status` (clean) + `git log origin/main --oneline -5` (all 4 commits present: HLS fix, .gitignore, frontend-premium-ui, refactor-limpieza-arquitectura)
  - Deps: 4.1 — Effort: S — Verify: `git status` empty; `origin/main` has expected commits
  - Files: N/A (verification)
