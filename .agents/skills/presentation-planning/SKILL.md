---
name: presentation-planning
description: Plan or revise a multi-screen draw.io presentation in this repository by interviewing the user, organizing project resources, and producing a three-column Markdown slide plan. Use before generating presentation diagrams; do not use for direct slide generation when an approved plan already exists.
---

# Presentation Planning

Create a decision-complete plan for a presentation project under `.draft/<project-name>/`. Planning is separate from diagram generation.

## Establish intent

Inspect the repository and the selected project folder before asking questions. Ask only for choices that cannot be discovered. Resolve these inputs:

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

Record assumptions, unresolved decisions, project-specific style overrides, and output requirements. Validate:

- narrative completeness and timing;
- one clear main message per row;
- a purposeful relationship between main and detail screens;
- resource coverage and source verification;
- attribution, licensing, and accessibility needs;
- editable draw.io requirements;
- unresolved decisions that block generation.

Do not create final `.drawio` files or exported graphics during planning unless the user explicitly requests generation after reviewing the plan.
