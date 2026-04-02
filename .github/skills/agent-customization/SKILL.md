---
name: agent-customization-workflow
description: |
  Workspace skill to initialize agents for short, precise responses and minimal explanations when working on React frontend tasks. By default, agents should provide concise, to-the-point guidance and ask clarifying questions only when necessary.
applyTo:
  - "**/*.{ts,tsx,js,jsx,html}"
---

# Agent Customization — Workspace Skill

## Purpose
Provide a reusable, workspace-scoped skill that configures agents to: produce short, precise explanations; avoid explaining rationale unless requested; and prompt for clarifying questions only when required to complete the task.

## Defaults (Initializations)
- `concise: true` — Answers are short and actionable.
- `explain_why: false` — Do not explain reasons by default.
- `ask_clarifying_questions: when_needed` — Ask only if missing critical inputs.
- `scope`: React frontend files matching `applyTo` above.

## When To Use
- Creating or modifying React components, pages, or tests under the frontend globs.
- Drafting small config snippets that follow project conventions.
- Writing or updating workspace-level customization files related to frontend work.

## Step-by-step Workflow (for creating/updating a skill or instruction)
1. Confirm scope and location (`workspace` vs `user`).
2. Choose primitive: Instruction vs Skill vs Prompt vs Agent.
3. Draft frontmatter (name, description, applyTo, defaults).
4. Add short usage examples and acceptance criteria.
5. Validate YAML frontmatter and file placement.
6. Save to `.github/skills/<name>/SKILL.md` and notify the team.

## Decision Points
- Use an Instruction when content should be always-present and broad.
- Use a Skill when the workflow is multi-step or bundles assets.
- Use a Prompt for single-shot parameterized tasks.

## Quality Criteria / Acceptance Checks
- Frontmatter YAML is syntactically valid and includes `name` and `description`.
- `applyTo` globs correctly target the intended files.
- Defaults are concise and documented.
- Examples demonstrate common requests and expected outputs.

## Example Prompts (to invoke this skill)
- "Create a concise React component under src/components following project defaults."
- "Draft a Playwright test for the login flow; keep the explanation minimal and ask only if you need more data."

## Next Steps / Questions
- If you want this skill to apply to additional file types or broader scope, tell me which globs to add.
- If you prefer agents to include brief rationale by default, set `explain_why: true`.

---

<!-- Workspace SKILL created by agent. Update or adjust defaults as needed. -->
