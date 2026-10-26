# Presentation Prompt Examples

Replace values in angle brackets before sending a prompt to Codex.

## Plan a new presentation

```text
Use the local presentation-planning skill.

Project name: <kebab-case-name>
Topic: <topic>
Audience: <audience>
Goal: <desired audience outcome>
Slide count: <count>
Sources: <URLs or local paths>
Visual direction: <style>

Create the project folders and plan.md only. Identify missing evidence,
licensing questions, and decisions that require my approval.
```

## Generate an approved presentation

```text
Follow AGENT.md and the approved plan at .draft/<project>/plan.md.
Generate native editable draw.io files under .draft/<project>/diagrams/.
Keep text, shapes, charts, and connectors editable. Rasterize only artwork.
Store generated images and prompts under the project folder. Validate the
result with draw.io Desktop and save previews under exports/. Do not use a
paid image provider without approval.
```

## Generate in Notion + Webtoon style

```text
Generate the approved presentation using clean Notion-style composition and
Webtoon narrative illustrations. Use baoyu-xhs-images with --style notion for
layout guidance and baoyu-comic with --layout webtoon --aspect 16:9 for comic
planning. Use native Codex imagegen for finalized raster illustrations.
Preserve the semantic color system from the plan.
```

## Revise an existing deck

```text
Edit .draft/<project>/diagrams/<file>.drawio directly.
Requested changes:
- <change 1>
- <change 2>

Preserve unaffected pages, editability, embedded assets, and semantic colors.
Export review previews after validation.
```

## Validate and export

```text
Validate .draft/<project>/diagrams/<file>.drawio against its plan. Check page
count, editable content, overflow, connectors, colors, image embeds, sources,
and attribution. Open it with draw.io Desktop and export all pages to
.draft/<project>/exports/ as <png|svg|pdf>. Report any unresolved issue.
```

## Continue an interrupted run

```text
Continue the presentation project at .draft/<project>/. Inspect the existing
plan, diagrams, prompts, images, exports, and notes first. Reuse valid work and
resume from the first incomplete step without regenerating completed assets.
```

## Run a retrospective

```text
Use the local retro skill for .draft/<project>/. Analyze the workflow,
failures, rework, and tooling gaps. Save the report under notes/. Propose
changes, but do not edit shared skills or scripts without approval.
```

