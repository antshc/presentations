---
name: planning
description: Plan or revise a multi-screen draw.io presentation in this repository by inspecting the repo for facts, running a one-question-at-a-time grilling interview, editing the plan directly after each answer, organizing project resources, and producing a three-column Markdown slide plan. Use before generating presentation diagrams; do not use for direct slide generation when an approved plan already exists.
---

# Presentation Planning

Create a decision-complete plan for a presentation project under `.draft/<project-name>/`. Planning is separate from diagram generation.

The workflow is: **Establish intent** (inspect facts) → **Prepare the project** → **Question phase** (ask, edit `plan.md`, ask again) → **Build the plan** → **Finish planning** (user ends the session).

## Establish intent

Inspect the repository and the selected project folder before asking questions. Ask only for choices that cannot be discovered. Facts to collect first:

- `AGENT.md`, `README.md`, `USAGE.md`, `PROMPTS.md` for objective, visual system, authoring rules, and approval constraints;
- `.draft/<project-name>/plan.md`, if present, plus `sources/`, `images/`, `references/`, `diagrams/`, and existing `.drawio` files;
- `.gitignore`, `templates/presentation-plan.md`, and available skills in `.agents/skills/` and tools in `scripts/` and `package.json`;
- linked source plans or research the user mentions (read them; do not ask the user to summarize them).

Resolve these inputs:

- project name and desired project-folder slug;
- purpose, audience, and intended outcome;
- presentation duration and target slide count;
- narrative or required sections;
- visual tone and examples;
- required sources, assets, brands, and attribution;
- accessibility and brand constraints;
- intended draw.io and export formats.

Ask follow-up questions when the narrative, evidence, main/detail split, or visual direction remains ambiguous. Do not invent project facts or imply that unverified resources are approved.

## Prepare the project

Use `.draft/<project-name>/` and ensure it contains:

```text
plan.md
sources/
images/
video/
references/
diagrams/
exports/
notes/
```

Inspect and reuse existing files. Never overwrite a populated `plan.md` without incorporating its useful content. Copy `templates/presentation-plan.md` as the starting structure for a new plan.

Git handling inside `.draft/<project-name>/`:

- Committed: `plan.md` and the native `.drawio` files in `diagrams/`.
- Ignored (assets): `sources/`, `images/`, `video/`, `references/`, `exports/`, `notes/`, and any non-`.drawio` file in `diagrams/`.

Because assets are not committed, record in `plan.md` the origin URL or location of every asset so it can be re-obtained. Never put secrets or unlicensed material in the asset folders.

## Question phase

Align with the user through an ordered interview. `plan.md` is the only record: every answer is written into it immediately, then questioning resumes.

### Loop

1. **Seed the plan** — create or open `plan.md` from the template. Fill every field the inspected facts settle and list everything else under *Open decisions*.
2. **Pick the next question** — choose one unresolved question whose prerequisites are settled. Typical order: purpose and audience → duration and slide count → narrative → per-slide main/detail split → visuals and style → resources and licensing → accessibility and outputs.
3. **Look up before asking** — if a fact can be found in the repo, the project folder, or a linked source, read it instead of asking. Never invent facts. If lookup is inconclusive, ask.
4. **Ask one question** — print the status line, then the question.
5. **Edit the plan** — after the answer, edit `plan.md` directly in the same turn (brief, slide rows, style, resources) and remove the answered item from *Open decisions*. Re-check affected rows.
6. **Return to questions** — end each turn on the next question or on the close offer. Never batch questions.

### Question format

Ask in ordinary conversation, one question at a time. Do not use form or question tools. Phrase each question so that **"yes" accepts the recommendation**; silence is never approval, and the user may pick another option or disagree.

```markdown
❓ **Q1** - **<title>**: <question phrased so yes accepts the recommendation>

- **A** (Recommended) <option>
- **B** <option>
- **C** <option>

➡️ <recommended answer and reason, grounded in the repo facts found>
```

Rules:

- Sequential IDs (`Q1`, `Q2`, …), never renumbered.
- A recommendation always comes with reasoning and, where possible, a source pointer (file link or URL) instead of restated content.
- Before every question print one status line, for example: `Plan: [plan.md](<link>) · Answered 5 · Open 4`.
- Do not repeat the plan in questions. Link to it and state only the new question or change.

### Probes

Re-check after every answer; a later answer can invalidate an earlier one.

- **Fuzzy language** — when a term (for example "workshop", "demo", "detail slide") is vague, propose a precise meaning and confirm it.
- **Concrete scenarios** — test asserted limits: does the slide count fit the duration, does the main screen hold only one message, can the detail screen stand alone.
- **Source cross-check** — when the user states a claim, check it against `sources/` and `references/`; surface contradictions with both locations, and label unverifiable claims `unverified`.
- **Resource coverage** — every claim and visual needs an origin, license, and status; ask when one is missing.
- **Repo conflict** — if an answer conflicts with `AGENT.md` rules (for example rasterized slides or paid API calls without approval), cite the rule and ask which applies.

### Ending the session

Only the user ends the session. When no unanswered questions or *Open decisions* remain, say so, then ask whether to end — for example: `❓ **Q<n>** - **Close**: All questions are answered and the plan is complete. End the planning session? (yes accepts)`. Do not close on your own because questions ran out. If the user declines or adds a thought, resume the loop.

On confirmation: run *Finish planning* and report any remaining open decisions that block generation.

## Build the plan

One table row represents one slide unit with two adjacent 16:9 screens:

- Main screen: audience-facing title, message, visual composition, and short labels.
- Detail screen: horizontally adjacent explanation, evidence, real image, or more detailed diagram.
- Resources: exact files or URLs, intended use, attribution/license, and status.

Use exactly these three table columns:

| Main slide information | Detail screen shown horizontally beside it | Resources |
|---|---|---|

For every row, state the slide number and purpose, the main message, the visual design, and what belongs on each screen. Keep the main screen concise. Put supporting depth on the detail screen rather than overcrowding the main screen.

Resource entries must say whether each item is evidence, inspiration, or intended slide content. Use these statuses where applicable: `discovered`, `selected`, `downloaded`, `verified`, `licensed/approved`, and `needs review`.

## Finish planning

Run only after the user agrees to end the question phase. Record unresolved decisions, project-specific style overrides, and output requirements. Validate:

- narrative completeness and timing;
- one clear main message per row;
- a purposeful relationship between main and detail screens;
- resource coverage and source verification;
- attribution, licensing, and accessibility needs;
- editable draw.io requirements;
- unresolved decisions that block generation.

Do not create final `.drawio` files or exported graphics during planning unless the user explicitly requests generation after reviewing the plan.

## Gotchas

Maintained through the `retro` skill. One line each: `symptom -> cause -> what to do`.

- Question asked that the repo already answered -> inspection skipped or incomplete -> read `AGENT.md`, the project folder, and linked sources first; ask only what remains.
- Answers captured only in chat -> `plan.md` not edited after the answer -> edit `plan.md` in the same turn, then ask the next question.
- Several questions in one message -> batching -> ask one question at a time.
- Session closed because questions ran out -> model ended it -> only the user ends the session; ask to close and wait.
- Assets missing on a fresh clone -> `sources/`, `images/`, `video/`, `references/`, `exports/`, and `notes/` are ignored by Git -> record each asset's origin in `plan.md` so it can be re-obtained.
