# Presentation Generation Guide

## 1. Prepare the workspace

Open PowerShell in `D:\_projects\presentations`:

```powershell
cd D:\_projects\presentations
.\scripts\setup.ps1
.\scripts\doctor.ps1
```

Start Codex from the same directory so it can read the repository instructions and local skills:

```powershell
codex
```

## 2. Create a presentation plan

Give Codex the topic, audience, source material, slide count, visual style, and output name. Ask it to use the local `planning` skill.

Example:

```text
Use the local planning skill to plan a seven-slide presentation.

Topic: AI development evolution
Audience: software engineers and technical leaders
Sources:
- https://github.com/antshc/brain/blob/main/docs/research/ai-development-evolution-presentation-plan-2026-10-26.md
- https://github.com/antshc/brain/tree/main/docs/research/ai-development-evolution-presentation-plan-2026-10-26
Visual direction: Notion layouts combined with Webtoon storytelling
Project name: ai-development-evolution

Create the project structure and plan only. Do not generate slides yet.
```

Review the generated file:

```text
.draft/<project-name>/plan.md
```

Resolve factual, licensing, attribution, and visual decisions before requesting generation.

## 3. Generate the editable draw.io presentation

After approving the plan, ask Codex to follow `AGENT.md` and generate native draw.io content.

```text
Follow AGENT.md and the approved plan at
.draft/ai-development-evolution/plan.md.

Generate the editable draw.io presentation now.
Use baoyu-comic for Webtoon illustration planning, baoyu-xhs-images with
the notion style for layout guidance, and native Codex imagegen only for
comic artwork. Keep all text, shapes, charts, and connectors editable.
Save native files under .draft/ai-development-evolution/diagrams/.
Do not make paid API calls.
```

Expected locations:

| Content | Location |
|---|---|
| Approved plan | `.draft/<project-name>/plan.md` |
| Editable diagrams | `.draft/<project-name>/diagrams/*.drawio` |
| Generated illustrations | `.draft/<project-name>/images/` |
| Sources and references | `.draft/<project-name>/sources/` and `references/` |
| PNG, SVG, or PDF exports | `.draft/<project-name>/exports/` |
| Review notes | `.draft/<project-name>/notes/` |

## 4. Review and revise

Open the native file:

```powershell
draw.io .draft\ai-development-evolution\diagrams\presentation.drawio
```

Request revisions against the native `.drawio` file, not an exported image:

```text
Revise .draft/ai-development-evolution/diagrams/presentation.drawio.
Keep existing editable content. On slide 3, simplify the chart labels and
increase whitespace. Preserve all stage colors and factual caveats.
```

## 5. Export

Export one file:

```powershell
.\scripts\export-drawio.ps1 `
  -Input ".draft/ai-development-evolution/diagrams/presentation.drawio" `
  -Format png `
  -Output ".draft/ai-development-evolution/exports" `
  -AllPages
```

Replace `png` with `svg` or `pdf` when needed. Exports are delivery artifacts; the `.drawio` file remains the editable source of truth.

## 6. Final checks

Ask Codex to verify:

- slide count and order;
- plan coverage and factual accuracy;
- editable text, shapes, charts, and connectors;
- consistent colors, typography, margins, and screen dimensions;
- working image embeds and source attribution;
- absence of secrets and unapproved paid API usage;
- successful draw.io open and export.

Run the environment check again if generation or export fails:

```powershell
.\scripts\doctor.ps1
```

## 7. Run a retrospective

After delivery:

```text
Use the local retro skill to review the ai-development-evolution
presentation run. Write the report under the project's notes folder.
Do not change workspace tooling without my approval.
```

