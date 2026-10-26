# Brand: theme palette and rendering

Copy of the AGENT.md "Visual system" section; AGENT.md is authoritative, so on a difference follow AGENT.md and fix this file. `scripts/check-page.ts` parses the hex values, role rows and `Allowed font families` line below.

Reference pages: `Brand light` and `Brand dark` in `.draft/ai-development-evolution/ai-workshop.drawio` (generator `.draft/ai-development-evolution/gen/brand-book.ts`).

## Shared rules

- One theme per deck; light is the default; record it in `plan.md`.
- Use only the selected theme's hex values for backgrounds, text, outlines, fills, connectors, charts, tables and comic panels. Authentic third-party logos and brand marks are the only exception.
- Roles: Accent 1–4 mark concepts (ordered outermost to innermost); Stage 1–4 mark process maturity; Warning marks failures only. A concept keeps its Accent and a stage keeps its Stage color on every slide. Never reuse one role for another.
- Allowed font families: Kalam, Inter
- Kalam bold for headings, Inter for body and labels. Set `fontFamily` on every text cell and edge label, plus `fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DKalam` (or `...%3DInter`) on headings and body text.
- Set `background` on `mxGraphModel` to the theme Paper (light) or Background (dark).
- Keep text as editable draw.io text; embed raster images only for comic illustrations.

## Light theme

Rendering: rough marker `sketch=1;curveFitting=1;jiggle=1.5;fillStyle=solid`, stroke 3 (rings 4), ink text, sparse tinted fills.

| Role | Stroke | Fill |
|---|---|---|
| Paper (background) | `#FAF8F2` | `#FAF8F2` |
| Surface | `#FFFFFF` | `#FFFFFF` |
| Ink (text) | `#222B35` | |
| Text 2 | `#5B6672` | |
| Muted, pill border | `#9CA3AF` | |
| Border | `#CBC5B5` | |
| Accent 1 terracotta | `#B4533C` | `#F6E3DC` |
| Accent 2 stone, dashed | `#6B5E4B` | `#FFFDF7` |
| Accent 3 steel blue | `#2F6F8F` | `#DCEBF1` |
| Accent 4 ochre | `#B8860B` | `#F5E6B8` |
| Stage 1 slate | `#64748B` | `#E2E8F0` |
| Stage 2 blue | `#0284C7` | `#E0F2FE` |
| Stage 3 amber | `#D97706` | `#FEF3C7` |
| Stage 4 green | `#059669` | `#D1FAE5` |
| Warning red | `#EF4444` | `#FDE9E9` |

## Dark theme

Rendering: clean vector (no `sketch`), `arcSize=12`, stroke 3 (rings 5), white text, near-black surface fills with bright outlines. Accent 1 red is a concept color here, so a warning carries a label such as FAIL or ⚠. Set `adaptiveColors="none"` on `mxGraphModel`, or draw.io's dark UI inverts the white text to dark.

| Role | Stroke | Fill |
|---|---|---|
| Background | `#0B0B0F` | `#0B0B0F` |
| Surface | `#111418` | `#111418` |
| Ink (text) | `#FFFFFF` | |
| Text 2 | `#D1D5DB` | |
| Muted | `#9CA3AF` | |
| Border | `#374151` | |
| Pill border | `#4B5563` | |
| Accent 1 red | `#F0141E` | `#111418` |
| Accent 2 white, dashed | `#FFFFFF` | `#111418` |
| Accent 3 blue | `#2D9CFF` | `#111418` |
| Accent 4 amber | `#F5B000` | `#111418` |
| Stage 1 slate | `#94A3B8` | `#111418` |
| Stage 2 sky | `#38BDF8` | `#111418` |
| Stage 3 amber | `#FBBF24` | `#111418` |
| Stage 4 green | `#34D399` | `#111418` |
| Warning red | `#EF4444` | `#111418` |
