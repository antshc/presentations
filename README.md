# Presentation Crafting Workspace

This repository is a reusable workspace for planning and producing editable draw.io presentations with AI assistance. Shared instructions, skills, templates, and tooling are tracked. Each project's `plan.md` and native `.drawio` diagrams under `.draft/` are tracked too. Project assets (sources, images, video, references, exports, and notes) live under `.draft/` and are ignored by Git.

## User guides

- [Presentation generation guide](USAGE.md)
- [Copy-paste prompt examples](PROMPTS.md)
- [AI presentation capabilities and rules](AGENT.md)

## Quick start

From the repository root:

```sh
bun run setup
```

The setup is safe to run repeatedly. It creates `.draft/`, installs the pinned repository-local dependency with Bun, reports missing system tools, and runs the workspace doctor. All commands are Bun + TypeScript and behave the same in bash (Linux, macOS, WSL, Git Bash) and PowerShell (Windows).

To check the workspace without installing anything:

```sh
bun run doctor
```

## Prerequisites

The following tools are system-level and are not bundled in this repository:

- Node.js LTS with npm and npx, used for skill management and compatibility tooling.
- [Bun](https://bun.sh/) 1.1 or later.
- Codex CLI (required; the `codex` command must be on `PATH`). Install with `npm i -g @openai/codex@latest`, then run `codex login` and sign in with ChatGPT. The Codex desktop application alone is not sufficient for image generation.
- [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases) for automatic layout and PNG, SVG, or PDF export.

The browser editor at [app.diagrams.net](https://app.diagrams.net/) can open native `.drawio` files without Desktop. Native `.drawio` generation and browser links do not require Desktop.

The scripts find draw.io Desktop from `DRAWIO_EXE`, then `PATH` (`drawio`), then the default install location of the OS (Windows: `%LOCALAPPDATA%\Programs\draw.io` and `C:\Program Files\draw.io`; macOS: `/Applications/draw.io.app`; Linux: `/usr/bin/drawio`). On a headless Linux host, install `xvfb` so export can run through `xvfb-run`. Override discovery when needed:

```sh
# bash
export DRAWIO_EXE=/path/to/drawio
```

```powershell
# PowerShell
$env:DRAWIO_EXE = "C:\path\to\draw.io.exe"
```

### Codex draw.io integration

Install the official draw.io Codex plugin outside the repository:

```sh
codex plugin marketplace add jgraph/drawio-mcp
codex plugin add drawio@drawio
```

The repository pins `@drawio/mcp` locally. Start its browser-opening MCP tool server with:

```sh
bun run mcp
```

The same local server is preconfigured for other hosts (run `bun install` first):

| Host | Config |
|---|---|
| VS Code (GitHub Copilot) | [.vscode/mcp.json](.vscode/mcp.json) — start the `drawio` server from the MCP Servers view |
| GitHub Copilot CLI | [.mcp.json](.mcp.json) — run `copilot` from the repo root and check `/mcp` |

Alternatively, register it with Codex globally:

```sh
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

Use the repository-local `planning` skill when starting or revising a presentation. It interviews the user, inspects existing project assets, creates the project structure, and writes `.draft/<project-name>/plan.md` from the tracked template.

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

This workspace generates images with the `codex-cli` provider of `baoyu-image-gen`, which uses the logged-in Codex (ChatGPT) subscription and needs no API key. Codex CLI must be installed and logged in (see Prerequisites); verify with `codex --version` and `codex login status`. Pin the provider explicitly, because `codex-cli` is never auto-selected:

```sh
bun .agents/skills/baoyu-image-gen/scripts/main.ts --prompt "<prompt>" --image <out.png> --provider codex-cli --ar 16:9
```

Never print or commit credentials, and treat Codex/ChatGPT login and an OpenAI API key as different mechanisms. The `codex-cli` provider launches an unrestricted `danger-full-access` subprocess, so confirm with the user before the first use in a session. Do not make paid API calls solely to verify setup.

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

Every slide in a deck uses the palette of the selected theme below. Projects choose the theme in their `plan.md` but do not redefine its colors.

Choose one theme per deck (light is the default) and do not mix light and dark pages. Use only the theme's colors on all slides, main and detail, including diagrams, tables, charts, and comic panels; a concept keeps its Accent and a stage keeps its Stage color on every slide. Authentic third-party logos are the only exception. Colors identify concepts; they are not decoration. Use Kalam (or Patrick Hand) for short headings and Inter for body labels.

Color roles are separate: **Accent 1–4** mark concepts (outermost to innermost), **Stage 1–4** mark process maturity, and **Warning** marks failures, blockers, and caveats only.

#### Light theme (default)

Rough marker outlines, sketch-style arrows, ink text, sparse tinted fills.

| Role | Stroke / value | Fill | Usage |
|---|---|---|---|
| Paper | `#FAF8F2` | | Page background |
| Surface | `#FFFFFF` | | Panels, bubbles, table body |
| Ink | `#222B35` | | Titles, outlines, connectors |
| Text 2 / Muted / Border | `#5B6672` / `#9CA3AF` / `#CBC5B5` | | Secondary text, pill borders, dividers |
| Accent 1 | `#B4533C` terracotta | `#F6E3DC` | Concept 1 |
| Accent 2 | `#6B5E4B` stone, dashed | `#FFFDF7` | Concept 2 |
| Accent 3 | `#2F6F8F` steel blue | `#DCEBF1` | Concept 3 |
| Accent 4 | `#B8860B` ochre | `#F5E6B8` | Concept 4 |
| Stage 1–4 | `#64748B` `#0284C7` `#D97706` `#059669` | `#E2E8F0` `#E0F2FE` `#FEF3C7` `#D1FAE5` | Process maturity |
| Warning | `#EF4444` | `#FDE9E9` | Failures only |

#### Dark theme

Clean vector outlines (no sketch), rounded corners, white text, near-black fills with bright outlines.

| Role | Stroke / value | Fill | Usage |
|---|---|---|---|
| Background | `#0B0B0F` | | Page background |
| Surface | `#111418` | | Cards, panels, bubbles |
| Ink | `#FFFFFF` | | Titles, text, connectors |
| Text 2 / Muted / Border | `#D1D5DB` / `#9CA3AF` / `#374151` | | Secondary text, dividers (pill border `#4B5563`) |
| Accent 1 | `#F0141E` red | Surface | Concept 1 |
| Accent 2 | `#FFFFFF` white, dashed | Surface | Concept 2 |
| Accent 3 | `#2D9CFF` blue | Surface | Concept 3 |
| Accent 4 | `#F5B000` amber | Surface | Concept 4 |
| Stage 1–4 | `#94A3B8` `#38BDF8` `#FBBF24` `#34D399` | Surface | Process maturity |
| Warning | `#EF4444` | Surface | Failures only; always add a label (FAIL, ⚠) because Accent 1 is also red |

### Graphics and resources

- Prefer authentic logos and project marks when their use is permitted.
- Build mechanisms and architecture with editable draw.io shapes.
- Use real images only when they add evidence or necessary context.
- Avoid unrelated stock imagery and flattened screenshots of diagrams.
- Record each resource's source, intended use, attribution or license, and status in `plan.md`.
- Use these resource states: `discovered`, `selected`, `downloaded`, `verified`, `licensed/approved`, and `needs review`.

## Export diagrams

Export a file or a diagram folder with the wrapper script (the same command works in bash and PowerShell):

```sh
bun run export --input .draft/demo/diagrams/slide-01.drawio --format png
```

Output goes to `.draft/<project>/exports/` as `<name>-pNN.<format>` (one file per page; PDF is a single file). Optional parameters: `--out <dir>`, `--page <n>` (1-based), `--scale`, `--border`, and `--no-embed`. Inputs and outputs must remain under `.draft/`. The script checks that source diagrams are unchanged by export.

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
