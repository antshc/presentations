---
name: retro
description: Run a retrospective on a presentation project or recent agent sessions in this repository. Detects issues, problems, wasted effort, and recurring gotchas, explains the root cause, and proposes reasoned improvements to the repo skills, templates, scripts, and docs so future runs are faster and cleaner. Use when the user asks for a retro, lessons learned, or to tune skills and reduce gotchas; do not use to plan or generate slides.
---

# Retro

Review what happened, find what slowed or derailed the work, and turn it into small, justified changes to the tracked workspace. A retro analyzes and proposes; it edits shared files only after the user approves.

## Scope the review

Resolve the scope before gathering evidence. Ask only if it cannot be inferred:

- project folder under `.draft/<project-name>/`, or the whole repository;
- time window or sessions to cover (default: the current project and its latest sessions).

## Gather evidence

Use only observable evidence. Never invent problems or quote events that did not happen.

- Session history: query `session_store_sql` (time-bound, filtered by this repository) for user corrections, repeated questions, retried tool calls, failures, and abandoned approaches.
- Project files: `plan.md` (unresolved decisions, `needs review` resources, assumptions), `diagrams/`, `exports/`, `notes/`.
- Repository state: `git --no-pager log` and `git --no-pager status` for churn, reverted work, and uncommitted assets.
- Tooling: run `bun run doctor` and inspect failures of `bun run export` or `bun run setup`; check whether the `drawio` MCP server (`.vscode/mcp.json`, `.mcp.json`) was used or skipped in favor of manual XML or desktop tooling.
- Current skills, templates, and README, to see whether guidance already exists but was ignored or is wrong.

## Detect and classify

Record each finding with the evidence behind it. Look for:

| Category | Signals |
|---|---|
| Process | Questions asked twice, missing intake inputs, rework after plan approval, late discovery of constraints |
| Skill gaps | Behavior the skill did not describe, ambiguous or contradictory instructions, steps agents skipped |
| Tooling | Script or export failures, missing system tools, path or permission errors, non-reproducible setup |
| Resources | Unverified, unlicensed, missing, or ungitignored assets; claims without traceable sources |
| Output quality | Overcrowded screens, editability lost, previews differing from native `.drawio` |
| Repo hygiene | Wrong files committed or ignored, stale docs, duplicated guidance |

Mark each finding `confirmed` (direct evidence), `likely` (indirect evidence), or `hypothesis` (needs the user's confirmation). Group repeats into one finding with a count.

## Find root causes

For each finding ask why it happened until the cause is something a repo change could prevent. Distinguish a one-off mistake from a systemic cause. Do not propose changes for one-offs unless they are cheap and clearly useful.

## Propose improvements

Each proposal must state:

- **Change:** the exact file and edit (skill step, new gotcha, template field, script check, README line).
- **Reasoning:** the finding and root cause it addresses.
- **Expected effect:** which time, rework, or error it removes in future runs.
- **Cost and risk:** size of the change and what it could break.
- **Priority:** `high`, `medium`, or `low`, ranked by recurrence and impact.

Prefer, in order: removing ambiguity from an existing instruction, adding a gotcha, adding a script check, adding a template field, adding a new skill. Keep skills short; delete or merge guidance instead of only appending. Do not duplicate guidance across skills and README.

## Gotchas

Record recurring pitfalls in a `## Gotchas` section of the skill they affect. Each entry is one line in the form `symptom -> cause -> what to do`. Before adding one, check that it is not already covered, and merge or remove entries that are obsolete or fixed by a script check.

## Report

Write the report to `.draft/<project-name>/notes/retro-<YYYY-MM-DD>.md` (or `.draft/retros/retro-<YYYY-MM-DD>.md` for repository-wide scope; files placed directly in `.draft/` would not be ignored). The notes folder is ignored by Git, so do not store secrets there. Use this structure:

```markdown
# Retro: <scope> (<date>)

## Summary
Two to four sentences: what went well, what hurt most.

## Findings
| # | Category | Finding | Evidence | Confidence |
|---|---|---|---|---|

## Root causes
- Finding # -> cause

## Proposed improvements
| # | Priority | File | Change | Reasoning | Expected effect | Cost/risk |
|---|---|---|---|---|---|---|

## Gotchas to add or remove

## Open questions
```

## Apply changes

Present the summary and proposals, then ask the user which to apply. Apply only approved items with minimal, surgical edits to tracked files (skills, templates, scripts, README). After editing, re-run `bun run doctor` when scripts or workspace rules changed. Never edit `plan.md` content, diagrams, or assets as part of a retro unless the user asks for that specifically.
