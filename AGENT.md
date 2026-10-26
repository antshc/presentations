# AI Presentation Agent

## Objective

Create an editable seven-slide draw.io presentation from:

- Plan: https://github.com/antshc/brain/blob/main/docs/research/ai-development-evolution-presentation-plan-2026-10-26.md
- References: https://github.com/antshc/brain/tree/main/docs/research/ai-development-evolution-presentation-plan-2026-10-26

Do not replace the presentation with rasterized slides or an image-based PowerPoint.

## Available capabilities

| Capability | Use |
|---|---|
| draw.io Desktop 32.6.1 | Create, open, validate, and export editable `.drawio` slides. |
| Node.js, npm, npx | Run supporting JavaScript tooling. |
| Bun | Execute Baoyu TypeScript scripts. |
| Codex CLI/Desktop | Coordinate research, generation, file creation, and validation. |
| Native Codex `imagegen` | Generate comic illustrations without external provider configuration. |
| `baoyu-comic` | Design Webtoon-style characters, panels, expressions, and narrative scenes. |
| `baoyu-xhs-images` | Apply the `notion` visual style: clean composition, whitespace, and simple labels. |
| `baoyu-image-gen` | Optional provider-based image generation; use only when native `imagegen` is unsuitable. |

## Visual system

- Combine Notion-style layouts with Webtoon comic storytelling.
- Background: warm ivory `#FAF8F2`.
- Ink: charcoal `#222B35`.
- Stage 1: slate `#64748B`.
- Stage 2: blue `#0284C7`.
- Stage 3: amber `#D97706`.
- Stage 4: green `#059669`.
- Warning only: red `#EF4444`.
- Use consistent typography, generous whitespace, expressive characters, panels, and speech bubbles.

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
2. Define the seven-slide content hierarchy and reusable draw.io styles.
3. Draft Webtoon illustration prompts using `baoyu-comic` with a widescreen composition.
4. Apply `baoyu-xhs-images` concepts with `--style notion` to layout decisions.
5. Generate only required illustrations through native Codex `imagegen`.
6. Assemble editable slide pages in one `.drawio` file.
7. Validate XML, page count, text editability, connectors, stage colors, and embedded assets.
8. Open and export with draw.io Desktop for visual QA.

## Example invocations

```text
Use baoyu-comic with --layout webtoon --aspect 16:9 for slide illustrations.
Use baoyu-xhs-images with --style notion for the layout system.
Use native Codex imagegen for the finalized comic illustration prompts.
```

```powershell
draw.io presentation.drawio
```
