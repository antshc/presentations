# Presentation Crafting Workspace

This repository is a reusable workspace for planning and producing editable draw.io presentations with AI assistance. Shared instructions, skills, templates, and tooling are tracked. Each project's `plan.md` and native `.drawio` diagrams under `.draft/` are tracked too. Project assets (sources, images, video, references, exports, and notes) live under `.draft/` and are ignored by Git.

## User guides

- [Presentation generation guide](USAGE.md)
- [Copy-paste prompt examples](PROMPTS.md)
- [AI presentation capabilities and rules](AGENT.md)

## Quick start

From the repository root:

```powershell
.\scripts\setup.ps1
```

The setup is safe to run repeatedly. It creates `.draft/`, installs the pinned repository-local dependency with Bun, reports missing system tools, and runs the workspace doctor.

To check the workspace without installing anything:

```powershell
.\scripts\doctor.ps1
```

Equivalent Bun commands are available when PowerShell 7 is installed:

```powershell
bun run setup
bun run doctor
```

## Prerequisites

The following tools are system-level and are not bundled in this repository:

- Node.js LTS with npm and npx, used for skill management and compatibility tooling.
- [Bun](https://bun.sh/) 1.1 or later.
- Codex CLI or the Codex desktop application.
- [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases) for automatic layout and PNG, SVG, or PDF export.

The browser editor at [app.diagrams.net](https://app.diagrams.net/) can open native `.drawio` files without Desktop. Native `.drawio` generation and browser links do not require Desktop.

On Windows, the scripts discover `draw.io.exe` from `PATH`, `%LOCALAPPDATA%\Programs\draw.io`, and `C:\Program Files\draw.io`. Override discovery when needed:

```powershell
$env:DRAWIO_EXE = "C:\path\to\draw.io.exe"
```

### Codex draw.io integration

Install the official draw.io Codex plugin outside the repository:

```powershell
codex plugin marketplace add jgraph/drawio-mcp
codex plugin add drawio@drawio
```

The repository pins `@drawio/mcp` locally. Start its browser-opening MCP tool server with:

```powershell
bun run mcp
```

Alternatively, register it with Codex globally:

```powershell
codex mcp add drawio -- bunx --bun @drawio/mcp
```

See the [official draw.io AI assistant documentation](https://www.drawio.com/docs/manual/generate/drawio-mcp-server/) for integration behavior.

## Project workspace

Create one folder per presentation. The planning skill can create this structure automatically:

```text
.draft/
  <project-name>/
    plan.md
    sources/
    images/
    video/
    references/
    diagrams/
    exports/
    notes/
```

`.draft/` holds the project content, but only part of it is committed:

| Path | Git |
|---|---|
| `plan.md` | tracked |
| `diagrams/*.drawio` (native source diagrams) | tracked |
| `sources/`, `images/`, `video/`, `references/`, `exports/`, `notes/` | ignored |
| Non-`.drawio` files in `diagrams/` (previews, temp files) | ignored |

Do not place reusable skills, templates, or repository tooling there. Do not store secrets or unlicensed assets in draft folders; they are not committed, so `plan.md` must record where each asset comes from so it can be re-fetched.

## Planning skill

Use the repository-local `presentation-planning` skill when starting or revising a presentation. It interviews the user, inspects existing project assets, creates the project structure, and writes `.draft/<project-name>/plan.md` from the tracked template.

The plan uses one row per slide unit and three columns:

| Main slide information | Detail screen shown horizontally beside it | Resources |
|---|---|---|
| Audience-facing message, title, and main visual | Supporting explanation, evidence, real image, or detailed diagram | Images, videos, sources, sites, documents, attribution, and status |

Each row becomes two adjacent 16:9 draw.io screens:

- Left: the primary audience-facing slide.
- Right: horizontally adjacent explanation, evidence, real imagery, or a more detailed diagram.

Planning does not create final diagrams unless the user explicitly requests generation after approving the plan.

## Illustration skills

The workspace vendors only these Baoyu skills under `.agents/skills/`:

- `baoyu-comic` for Webtoon-style storyboards, characters, panels, and prompts;
- `baoyu-xhs-images` for clean `notion`-style composition;
- `baoyu-image-gen` as an optional provider-based image backend.

Use the AI client's native image-generation capability when available. Otherwise, select a supported Baoyu provider and ask for any required provider choice or credentials. Never print or commit credentials, treat Codex/ChatGPT login and an OpenAI API key as different mechanisms, and do not use the `codex-cli` provider without explicit approval because it launches an unrestricted `danger-full-access` subprocess. Do not make paid API calls solely to verify setup.

For a Webtoon + Notion presentation, use comic imagery only for illustrations; keep slide text, connectors, diagrams, tables, and charts editable in draw.io. Save prompts and generated images inside the applicable `.draft/<project-name>/` folders. The vendored versions are recorded in `skills-lock.json`.

## Retro skill

Use the repository-local `retro` skill after a presentation run, or when the workflow felt slow or error-prone. It reviews session history, the project folder, repository state, and tooling output, then reports issues with root causes and reasoned improvement proposals, including gotchas to document. It writes the report to `.draft/<project-name>/notes/` and edits skills, templates, scripts, or docs only after you approve the changes.

## Draw.io authoring rules

- Treat native `.drawio` XML as the source of truth.
- Keep text, charts, shapes, and connectors editable.
- Build each slide unit as two adjacent 16:9 screens of equal size.
- Use wide margins, one dominant visual per screen, and short audience-facing labels.
- Put supporting detail on the right screen instead of shrinking or overcrowding the main screen.
- Keep connectors away from text and make the left-to-right relationship obvious.
- Store source diagrams (committed) in `.draft/<project-name>/diagrams/` and generated files (ignored) in `.draft/<project-name>/exports/`.
- Preserve editable diagram data in exports whenever the format supports it.

### Default visual profile

Projects may override these defaults in their own `plan.md`.

| Role | Default | Usage |
|---|---|---|
| Paper | `#FAF8F2` | Warm neutral background |
| Ink | `#222B35` | Titles, labels, outlines, and connectors |
| Accent 1 | `#64748B` | Slate semantic category |
| Accent 2 | `#0284C7` | Blue semantic category |
| Accent 3 | `#D97706` | Amber semantic category |
| Accent 4 | `#059669` | Green semantic category |
| Warning | `#EF4444` | Failures, blockers, and caveats only |

Use rough marker-style outlines, sketch-style arrows, high contrast, neutral backgrounds, and sparse accent fills. Colors identify concepts; they are not decoration. Prefer Kalam or Patrick Hand for short headings and Inter or another legible sans-serif for body labels.

### Graphics and resources

- Prefer authentic logos and project marks when their use is permitted.
- Build mechanisms and architecture with editable draw.io shapes.
- Use real images only when they add evidence or necessary context.
- Avoid unrelated stock imagery and flattened screenshots of diagrams.
- Record each resource's source, intended use, attribution or license, and status in `plan.md`.
- Use these resource states: `discovered`, `selected`, `downloaded`, `verified`, `licensed/approved`, and `needs review`.

## Export diagrams

Export a file or a diagram folder with the wrapper script:

```powershell
.\scripts\export-drawio.ps1 `
  -Input ".draft/demo/diagrams/slide-01.drawio" `
  -Format png `
  -Output ".draft/demo/exports"
```

Optional parameters include `-Page`, `-AllPages`, `-Scale`, `-Border`, and `-NoEmbed`. Inputs and outputs must remain under `.draft/`. The script checks that source diagrams are unchanged by export.

## Validation and handoff

Before delivery, verify:

- every plan row has one clear main message;
- every left screen has a purposeful right-screen companion;
- claims and external assets have traceable resources;
- licenses and attribution are resolved;
- diagrams and labels remain editable;
- previews match the native source;
- unresolved decisions are visible in the project plan;
- final exports are stored separately from native diagrams.
