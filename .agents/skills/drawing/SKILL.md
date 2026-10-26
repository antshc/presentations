---
name: drawing
description: >-
  Draw slides. Write, update or verify a .drawio slide page (draw.io page, build page, update page, P4, verify, export, QA) from an approved plan row, then keep the verified PNG export. Not for planning or illustration generation.
---

# Drawing

Owns one loop on one slide page: write or update, verify, export. Writable surface: the target page in `.draft/<project>/diagrams/<name>.drawio`, `.draft/<project>/exports/<name>-pNN.png`, `.draft/<project>/notes/slide-NN-notes.md`, and a saved image prompt. Planning belongs to the `planning` skill; image generation to the `baoyu-*` skills.

Run every script from the repository root with `bun`; paths below are relative to it.

## Inputs

Derive from the repository; ask only when missing or ambiguous.

- Project folder: the only, named or open `.draft/<project>/`. Required.
- `.drawio` file and target page: match by name, id or number (`bun .agents/skills/drawing/scripts/inspect-page.ts <file>` lists pages). Required for update and verify. For write, add an empty `<diagram>` page first, named like its siblings (`sNN-page`, `PN <title> (NN)`), with the siblings' layers and canvas size.
- Plan row: the page's row in `plan.md`. Required for write, optional for update. If no approved plan exists, stop and point to *`planning` skill (plan or revise a multi-screen draw.io presentation)*.
- Theme: the `Theme:` line in `plan.md`; default light, and say so in the report when defaulted.
- Change request: the user message. Required for update; ask once when missing.
- Images: keep every existing image cell untouched. New rasters come from step 4 only.

## Constraints

- **MUST** write the page through `get_page` and `set_page`. Fallback: edit the `.drawio` directly with the edit tool, replacing only the changed cell spans, when the MCP is unavailable, the page has embedded base64 images that would round-trip through the model, or the page is new. State the fallback and reason in the report. Steps 6 and 7 always run.
- **MUST** re-read the page right before every write and merge user edits made between turns.
- **MUST** change only the requested cells. Existing images, other layers, other pages and the existing grid stay untouched; re-layout only on request.
- **MUST** use only the selected theme's hex values and fonts from `references/brand.md`, with all text, labels and connectors as editable draw.io objects. Preserve the plan's facts and caveats.
- **MUST** export at `--scale 1`; `--scale 2` truncates image-heavy pages.
- Follow the AGENT.md Authoring rules: no paid API calls without approval, never enable the Baoyu `codex-cli` provider, write files only with the edit and create tools. If a rule blocks a step, report the blocker and stop that step.

Freedom: fixed are palette, fonts, color roles, page ids and order, existing images, plan facts, editable text and verify-before-done. Free are shape choice, wording within the plan's facts, and the layout of new content inside the existing grid.

## Workflow

1. Resolve the target. *Done when* file path, page id and theme are known.
2. Read the current state (update and verify): `bun .agents/skills/drawing/scripts/inspect-page.ts <file> <page>`. It strips base64 to `<IMG n bytes mime sha:xxxxxxxx>`. Keep the output as the before-state. *Done when* every cell is inventoried and every `IMAGE` row is marked keep.
3. Load brand rules: read `references/brand.md`, then call `get_drawio_reference` once (format `xml`). *Done when* palette, fonts and rendering style of the theme are stated.
4. Illustrations, only when the plan needs a new raster; otherwise skip and say so. Save the prompt under `.draft/<project>/prompts/`, then generate through *`baoyu-comic` skill (knowledge comic, webtoon layout)* or *`baoyu-xhs-images` skill (infographic cards, `--style notion`)* and place the image. *Done when* the prompt file exists and the image cell is placed.
5. Write: prototype with `open_drawio_xml`, then write with `set_page` (fallback per Constraints). Re-run `inspect-page.ts` after writing. *Done when* the page is written and every image row of the before-state shows the same bytes and sha.
6. Static checks: `bun .agents/skills/drawing/scripts/check-page.ts <file> <page> --theme <light|dark> --pages <n> --images <n>`, pinning counts to the before-state plus intended additions. Fix failures in touched cells and rerun. *Done when* every check is PASS (no SKIP once pinned), or each remaining FAIL is listed with its cause. Report failures only in cells outside the request as pre-existing and leave them untouched.
7. Visual QA: `bun run export --input <file> --format png --page <n> --scale 1`, then view `.draft/<project>/exports/<name>-pNN.png` with the view tool. On a defect, fix and rerun steps 5 to 7. If export is impossible, report the blocker and mark incomplete. *Done when* the render shows no overflow, overlap or clipping; a serif font in the render is not a defect.
8. Sync notes and report. When page content changed, update `.draft/<project>/notes/slide-NN-notes.md` (NN is the two-digit page number) so talk track and caveats match the page; keep its headings and touch no other notes file. If the notes file is missing, report that instead of creating it. *Done when* notes match the page and the Output report is given.

## Output

Report in this layout:

```text
Page: <name> (<id>), theme <light|dark>[, defaulted]
Changed: <cells added, changed, removed>
Write path: set_page | fallback (<reason>)
Checks: xml <PASS|FAIL> | pages ... | images ... | hex ... | fonts ... | text ... | connectors ... | stage-colors ... | rendering ...
Visual QA: <png path>; <defects fixed or none>
Notes: <synced path | unchanged | missing>
Untouched: <n> images (sha identical), other layers, other pages
Status: complete | incomplete
```

- No result: report "no change"; leave the file unwritten.
- Incomplete: keep the edit, list each failing check with its cause, and never say "done".

## Gotchas

- Pages with embedded images carry megabytes of base64. Read them through `inspect-page.ts`; never view the raw file or call `get_page` on them.
- Cell `value` text is HTML-escaped inside XML attributes (`&lt;b&gt;`, `&amp;`); escape new text the same way.
- Whole-file rewrites turn LF and CRLF differences into noisy diffs; replace only the changed cells and keep the file's line endings.
- Exports render text in serif: Kalam and Inter are web fonts that draw.io Desktop lacks offline. Check fonts in the browser editor.
- Speech bubbles use `shape=callout;perimeter=calloutPerimeter` with `base`, `size`, `position`, `position2`; add the tail `size` to the shape height. `wedgeRoundRectCallout` and `mxgraph.basic.roundRectCallout` export badly.
- Edge labels do not inherit shape styles; set `fontSize`, `fontFamily`, `fontColor` and `labelBackgroundColor` on the edge.
- Sketch fills look hatched without `fillStyle=solid`.
- `set_page` cannot add pages; add empty `<diagram>` elements to the file first.
- Save `.drawio` sources in `.draft/<project>/diagrams/`; files elsewhere in `.draft/<project>/` are untracked and `bun run doctor` warns about them.
- Python `%` formatting and shell heredocs break URL-encoded font strings (`fontSource=...`); use the edit tool or TypeScript template strings.
- `check-page.ts` reports free arrows (connectors with no endpoint) as a note, not a failure; confirm each is intended.

## Completion criteria

- The page is written, every static check is PASS, the `--scale 1` export was viewed with no overflow, overlap or clipping, and the PNG is kept at `.draft/<project>/exports/<name>-pNN.png`.
- Slide notes are synced and the report is given.
- Completeness sweep (last): re-read the request and the plan row, then compare the before and after `inspect-page.ts` inventories. Only the requested cells changed; image shas, other layers and other pages are identical; the user's mid-session edits survive; each plan fact and caveat is on the page. Resolve any gap by editing or report it as deferred.
