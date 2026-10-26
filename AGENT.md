# AI Presentation Agent

## Objective

Create an editable draw.io presentation for the project named in the request, from its approved plan `.draft/<project>/plan.md` (for example `.draft/ai-development-evolution/plan.md`, nine slide units). Source material lives in the project's `sources/`, `images/` and `references/` folders.

Do not replace the presentation with rasterized slides or an image-based PowerPoint.

## Platform and commands

All repository tooling is Bun + TypeScript, so every command is identical in bash (Linux, macOS, WSL, Git Bash) and PowerShell (Windows). Do not add `.ps1` or `.sh` scripts; write new tooling in `scripts/*.ts` and expose it through `package.json`.

| Task | Command |
|---|---|
| Set up (creates `.draft/`, `bun install`, runs doctor) | `bun run setup` |
| Check the workspace | `bun run doctor` |
| Export diagrams | `bun run export --input .draft/<project>/diagrams/<name>.drawio --format png` |
| Start the draw.io MCP server | `bun run mcp` |

`bun run export` writes `<name>-pNN.<fmt>` per page to `.draft/<project>/exports/` (`--out`, `--page`, `--scale`, `--border`, `--no-embed`; PDF is one file). Inputs and outputs must stay under `.draft/`, and the script fails if the source diagram changes during export. Use forward slashes in paths and `path.join` in scripts; the draw.io Desktop location is found per OS (override with `DRAWIO_EXE`). On a headless Linux host export runs through `xvfb-run` when it is installed.

## Available capabilities

| Capability | Use |
|---|---|
| draw.io MCP (`drawio` server, `.vscode/mcp.json`, `.mcp.json`) | Preferred for creating, previewing, and reading diagrams: `open_drawio_xml`, `open_drawio_mermaid`, `search_shapes`, `get_drawio_reference`, `list_pages`, `get_page`, `set_page`. |
| draw.io Desktop | Fallback for opening, validating, and exporting editable `.drawio` slides when the MCP server is unavailable or cannot do the step (PNG/SVG/PDF export via `bun run export`). |
| Node.js, npm, npx | Run supporting JavaScript tooling. |
| Bun + TypeScript | Run every repository script (`scripts/*.ts`) and the Baoyu TypeScript scripts. |
| Codex CLI/Desktop | Coordinate research, generation, file creation, and validation. |
| Native Codex `imagegen` | Generate comic illustrations without external provider configuration. |
| `baoyu-comic` | Design Webtoon-style characters, panels, expressions, and narrative scenes. |
| `baoyu-xhs-images` | Apply the `notion` visual style: clean composition, whitespace, and simple labels. |
| `baoyu-image-gen` | Optional provider-based image generation; use only when native `imagegen` is unsuitable. |

## Visual system

- Combine Notion-style layouts with Webtoon comic storytelling.
- Use consistent typography, generous whitespace, expressive characters, panels, and speech bubbles.
- Choose one theme per deck (light is the default) and record it in `plan.md`; never mix light and dark pages.
- Every slide, main and detail, uses only the selected theme's palette below: backgrounds, text, outlines, fills, connectors, charts, tables, and comic panels. Do not introduce other hex values; projects pick a theme but may not redefine its colors. Authentic third-party logos and brand marks are the only exception.
- Apply roles consistently across all slides: a concept keeps its Accent and a stage keeps its Stage color on every slide.
- Color roles: Accent 1–4 mark concepts (ordered outermost to innermost), Stage 1–4 mark process maturity, Warning marks failures only. Never reuse one role for another.
- Fonts: Kalam bold for headings, Inter for body and labels.

### Light theme (default)

- Rendering: rough marker (`sketch=1;curveFitting=1;jiggle=1.5;fillStyle=solid`), stroke 3 (rings 4), ink text, sparse tinted fills.
- Paper `#FAF8F2`, Surface `#FFFFFF`, Ink `#222B35`, Text 2 `#5B6672`, Muted/pill border `#9CA3AF`, Border `#CBC5B5`.
- Accent 1–4 (stroke / fill): terracotta `#B4533C` / `#F6E3DC`; stone dashed `#6B5E4B` / `#FFFDF7`; steel blue `#2F6F8F` / `#DCEBF1`; ochre `#B8860B` / `#F5E6B8`.
- Stage 1–4 (stroke / fill): slate `#64748B` / `#E2E8F0`; blue `#0284C7` / `#E0F2FE`; amber `#D97706` / `#FEF3C7`; green `#059669` / `#D1FAE5`.
- Warning only: red `#EF4444` on `#FDE9E9`.

### Dark theme

- Rendering: clean vector (no sketch), `arcSize=12`, stroke 3 (rings 5), white text, near-black surface fills with bright outlines.
- Background `#0B0B0F`, Surface `#111418`, Ink `#FFFFFF`, Text 2 `#D1D5DB`, Muted `#9CA3AF`, Border `#374151`, pill border `#4B5563`.
- Accent 1–4 (stroke, fill `#111418`): red `#F0141E`; white dashed `#FFFFFF`; blue `#2D9CFF`; amber `#F5B000`.
- Stage 1–4 stroke: slate `#94A3B8`; sky `#38BDF8`; amber `#FBBF24`; green `#34D399`.
- Warning only: red `#EF4444`. Accent 1 red is a concept color here, so warnings must carry a label such as FAIL or ⚠.
- Reference pages: `Brand light` and `Brand dark` pages in `.draft/ai-development-evolution/ai-workshop.drawio` (generator `gen/brand-book.ts`).

## Authoring rules

- Keep text, labels, connectors, shapes, diagrams, tables, and charts editable in draw.io.
- Embed raster images only for comic illustrations.
- Preserve the plan's factual content, caveats, slide order, and stage-color semantics.
- Use the reference images for conceptual guidance; remove phone chrome and unrelated UI.
- Store image prompts before generation for reproducibility.
- Do not expose or commit credentials.
- Do not make paid API calls without approval.
- Do not enable the Baoyu `codex-cli` provider without approval; it launches an unrestricted `danger-full-access` subprocess.

## Workflow

1. Read the plan and reference images.
2. Define the content hierarchy (one unit per plan row: main screen, detail screen, review-only reference screen) and reusable draw.io styles.
3. Draft Webtoon illustration prompts using `baoyu-comic` with a widescreen composition.
4. Apply `baoyu-xhs-images` concepts with `--style notion` to layout decisions.
5. Generate only required illustrations through native Codex `imagegen`.
6. Assemble editable slide pages in a `.drawio` file under `.draft/<project>/diagrams/`. For a single page, prefer the draw.io MCP: call `get_drawio_reference` (format `xml`) once, prototype with `open_drawio_xml` (or `open_drawio_mermaid` for flowcharts), inspect with `list_pages`/`get_page`, and write approved XML into an existing page with `set_page` (it cannot add pages, so add empty `<diagram>` pages to the file first). For multi-page or repeated layouts, a TypeScript generator run with Bun that writes valid native `.drawio` is allowed; keep it under `.draft/<project>/` (ignored) and treat the `.drawio` as the source of truth.
7. Validate XML, page count, text editability, connectors, stage colors, and embedded assets.
8. Preview with the draw.io MCP; use draw.io Desktop and `bun run export` for final visual QA and exports, then view the PNGs.

## Gotchas

- Text renders in a serif in exports -> Kalam and Inter are web fonts that draw.io Desktop does not have offline -> check the look in the browser editor or install the fonts before final export.
- Speech bubble renders as a plain box or with a bent tail -> `wedgeRoundRectCallout` and `mxgraph.basic.roundRectCallout` render poorly in export -> use `shape=callout;perimeter=calloutPerimeter` with `base`, `size`, `position`, `position2`, and add the tail `size` to the shape height.
- Edge label is tiny or in the wrong font -> labels do not inherit shape styles -> set `fontSize`, `fontFamily`, `fontColor` and `labelBackgroundColor` on the edge.
- Sketch shapes look hatched -> default sketch `fillStyle` is hachure -> add `fillStyle=solid`.
- `set_page` fails for a new page -> it cannot add pages -> add empty `<diagram>` elements to the file first, or write the file directly.
- Generated `.drawio` is not tracked or is missing from doctor checks -> it sits outside `diagrams/` (`.draft/*/*` is ignored) -> save sources in `.draft/<project>/diagrams/`; `bun run doctor` warns about strays.
- Python `%` formatting or shell heredocs break on URL-encoded font strings and PowerShell -> use TypeScript with template strings, and create files with the editor tools instead of shell redirection.

## Example invocations

```text
Use baoyu-comic with --layout webtoon --aspect 16:9 for slide illustrations.
Use baoyu-xhs-images with --style notion for the layout system.
Use native Codex imagegen for the finalized comic illustration prompts.
```

```text
# bash or PowerShell, same command
bun run export --input .draft/<project>/diagrams/<name>.drawio --format png
```
