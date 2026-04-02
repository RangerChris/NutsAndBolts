AGENT INDEX — Nuts and Bolts
============================

Purpose
-------

This file maps the repository's `.github` artifacts to clear roles and suggested next actions for both humans and automated agents.

Files and roles
---------------

- `PRD.md` — Product requirements and acceptance criteria. Human-first description; see `Agent Integration` section for usage.
- `prd_index.json` — Machine-readable manifest (file roles, priorities, recommended automated actions).
- `skills/` — Workspace skills and instructions for agents. Read relevant `SKILL.md` before modifying files.
- `agents/` — Agent helper scripts and templates (if present). Use for automation scaffolding.
- `instructions/` — Contributor-facing guidelines. Humans should read before implementing UI or tests.
- `references/` — Design references, palettes, and assets.
- `ISSUE_TEMPLATE/` and `PULL_REQUEST_TEMPLATE.md` — Optional planning/review templates if present.

Suggested next actions (by priority)
----------------------------------

1. Validate PRD acceptance tests exist as unit/integration tasks (generator, move rules, persistence), and execute them using TDD (Red-Green-Refactor).
2. Implement seeded generator scaffolding using `prd_index.json` as a source of parameters.
3. Create initial React engine prototypes for move rules and win detection.
4. Add test seeds and sample playthroughs to `references/` for QA.

How agents should consume these files
-----------------------------------

- Machines: read `.github/prd_index.json` for structured tasks, then open files referenced for details.
- Humans: read `PRD.md` + `AGENT_INDEX.md` for context, then inspect `skills/` for workflow constraints.

Current repository note: if issue/PR template files are missing, rely on `references/tasks.md` and `PRD.md` acceptance criteria to structure work items.

When in doubt, open `skills/agent-customization/SKILL.md` to follow workspace agent conventions.
