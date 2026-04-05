---
name: react-frontend-instructions
description: |
  Project-wide React frontend development guidelines and preferences. Use when authoring React components, pages, and frontend tests in this repository.
applyTo: "**/*.{ts,tsx,js,jsx,html}" # applies repository-wide for frontend-relevant files
---

# React Frontend — Instructions (Draft)

## Purpose
Provide consistent, team-friendly conventions for React frontend development in this repository. These are enforced rules (must) plus a few configurable preferences (should).

## Where to Apply
- Applies to all files matching the `applyTo` globs above.

## Enforced Rules (Hard)
- Use functional components and React hooks; do not add new class components.
- Use TypeScript for new modules; prefer `.tsx` for components and `.ts` for utilities.
- Export React components as named exports. Default exports allowed only for very small utilities.
- TypeScript `strict` mode: enable full `strict` compiler settings for the repository. Avoid `any` unless explicitly justified in a comment with a clear reason.
- Run lint and format on save: ESLint (with React/TS rules) + Prettier. Fix lint errors before opening PRs.
- Accessibility: interactive elements must have accessible names, use semantic HTML, and include ARIA only when necessary.
 - Use Vite as the project build/dev toolchain and dev server for all frontend work.
 - Test strategy: use Playwright as the primary test runner for end-to-end, integration, and component tests; all critical flows must have Playwright coverage and Playwright tests must run in CI on PRs.
 - Dependency maintenance: keep packages up to date using automated tooling (Dependabot, Renovate, or scheduled scripts). Open PRs for upgrades, run tests, and merge after verification.

## Preferences (Soft)
- Folder structure: `src/components/`, `src/features/`, `src/pages/`, `src/lib/`, `src/hooks/`, `src/styles/`.
- State: prefer local component state and `useContext`/`useReducer` for feature-level state. Use Redux Toolkit as the default global state library for cross-cutting/global state.
- Styling: use Tailwind CSS as the project styling system. Avoid inline styles except for dynamic style objects.
- Tests: Playwright is the primary testing tool for the project; ensure unit/component/flow coverage via Playwright tests.
- Types: prefer small, explicit interfaces over large `Record<string, unknown>` structures.

## Component Patterns
- Keep components focused and small. If a component exceeds ~200 lines or handles multiple responsibilities, split it.
- Use `useEffect` only for side effects; keep effects minimal and well-typed.
- Prefer derived data from props/state rather than duplicating state.
- Use memoization (`useMemo`/`useCallback`) only when needed for performance.

## Performance and Best Practices
- Avoid unnecessary re-renders: pass stable props and avoid recreating functions in render unless memoized.
- Lazy-load routes and heavy components using `React.lazy` + `Suspense`.
- Bundle-safety: keep dependencies minimal and prefer tree-shakeable libraries.

## Testing
- Unit tests for components and hooks; integration tests for critical flows.
- Aim for readable tests that assert behavior, not implementation details.

## Example Prompts (to use this instruction)
- "Create a new TypeScript React component under src/components that follows project conventions."
- "Refactor `MyWidget` to use hooks and add RTL unit tests following the instructions."

## Decisions (answered)
- Scope: repository-wide (applies to all frontend-relevant files).
- Styling: Tailwind CSS is the chosen styling system.
- Global state: Redux Toolkit is accepted as the default global state library.
- TypeScript strictness: full `strict` settings enabled for the repo; exceptions require explicit justification.

## Next Steps
1. Finalized based on provided answers. This instruction file will not include configuration snippets; create or update dedicated config files (`tsconfig.json`, ESLint, Tailwind, Playwright`, etc.) in the repo to enforce rules.

---

<!-- Finalized: React frontend instructions. Config snippets omitted per request. -->

---

<!-- Draft created by the agent. Update or approve to finalize. -->
