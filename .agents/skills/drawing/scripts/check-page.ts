import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Cell, type Page, isImageCell, loadDrawio, parseStyle, plainText, selectPage } from "./drawio.ts";

const usage = `Usage: bun check-page.ts <file.drawio> <page> [options]

Static checks for one page: xml, pages, images, hex, fonts, text, connectors, stage-colors, rendering.
Palette, roles and fonts are read from ../references/brand.md.

Options:
  --theme <light|dark>   theme to check against (default: light)
  --pages <n>            expected page count in the file (check is SKIP without it)
  --images <n>           expected image-cell count on the page (check is SKIP without it)
  --allow <#hex,...>     extra hex values for authentic third-party logos or brand marks
  -h, --help

Exit code 1 when any check FAILs.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    theme: { type: "string" },
    pages: { type: "string" },
    images: { type: "string" },
    allow: { type: "string" },
    help: { type: "boolean", short: "h", default: false },
  },
});
if (values.help || positionals.length < 2) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}
const theme = values.theme ?? "light";
if (theme !== "light" && theme !== "dark") {
  console.error('--theme must be "light" or "dark".');
  process.exit(1);
}
const file = resolve(positionals[0]!);
if (!existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

interface Brand {
  palette: Set<string>;
  roles: Map<string, { stroke: string; fill: string }>;
  fonts: Set<string>;
}

const hexRe = /(?<![&\w])#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
const normHex = (h: string) => {
  const x = h.toUpperCase();
  return x.length === 4 ? `#${x[1]}${x[1]}${x[2]}${x[2]}${x[3]}${x[3]}` : x;
};

function loadBrand(): Brand {
  const md = readFileSync(join(import.meta.dir, "..", "references", "brand.md"), "utf8");
  const heading = theme === "light" ? "## Light theme" : "## Dark theme";
  const start = md.indexOf(heading);
  if (start === -1) throw new Error(`brand.md has no "${heading}" section`);
  const next = md.indexOf("\n## ", start + heading.length);
  const section = md.slice(start, next === -1 ? undefined : next);
  const palette = new Set<string>();
  const roles = new Map<string, { stroke: string; fill: string }>();
  for (const line of section.split("\n")) {
    const hexes = [...line.matchAll(hexRe)].map((m) => normHex(m[0]));
    hexes.forEach((h) => palette.add(h));
    const cells = line.split("|").map((c) => c.trim());
    const role = /^(Accent \d|Stage \d|Warning)/.exec(cells[1] ?? "")?.[1];
    if (role && cells.length >= 4) {
      const [stroke, fill] = [cells[2]!, cells[3]!].map((c) => (c.match(hexRe) ?? [""])[0]!).map((h) => (h ? normHex(h) : ""));
      roles.set(role, { stroke: stroke!, fill: fill! });
    }
  }
  const family = /^- Allowed font families:\s*(.+)$/m.exec(md)?.[1];
  if (!family || palette.size === 0 || roles.size === 0) throw new Error("brand.md is missing palette rows, role rows or the allowed font families line");
  return { palette, roles, fonts: new Set(family.split(",").map((f) => f.trim().toLowerCase())) };
}

type Status = "PASS" | "FAIL" | "SKIP";
const results: { name: string; status: Status; detail: string }[] = [];
const report = (name: string, status: Status, detail: string) => results.push({ name, status, detail });
const list = (items: string[], max = 6) => (items.length > max ? `${items.slice(0, max).join(", ")} (+${items.length - max} more)` : items.join(", "));
const finish = (): never => {
  for (const r of results) console.log(`${r.status}  ${r.name.padEnd(13)} ${r.detail}`);
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`${results.length} checks, ${failed} failed (theme ${theme}${values.theme === undefined ? ", defaulted" : ""}).`);
  process.exit(failed ? 1 : 0);
};

let brand: Brand;
let pages: Page[];
let page: Page;
try {
  brand = loadBrand();
} catch (error) {
  console.error(`Cannot load brand rules: ${(error as Error).message}`);
  process.exit(1);
}
try {
  const doc = loadDrawio(file);
  pages = doc.pages;
  page = selectPage(pages, positionals[1]!);
} catch (error) {
  report("xml", "FAIL", `${(error as Error).message}`);
  finish();
}
for (const extra of (values.allow ?? "").split(",").filter(Boolean)) brand.palette.add(normHex(extra.trim()));

const cells = page!.cells;
const content = cells.filter((c) => c.kind === "vertex" || c.kind === "edge");
const label = (c: Cell) => c.id;

// xml: well-formed (already parsed), unique ids, resolvable parents
{
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const c of cells) {
    if (seen.has(c.id)) dup.push(c.id);
    seen.add(c.id);
  }
  const ids = seen;
  const orphans = cells.filter((c) => c.parent && !ids.has(c.parent)).map(label);
  const problems = [dup.length ? `duplicate ids ${list(dup)}` : "", orphans.length ? `missing parent for ${list(orphans)}` : ""].filter(Boolean);
  report("xml", problems.length ? "FAIL" : "PASS", problems.join("; ") || `well-formed, ${cells.length} cells in page ${page!.number} "${page!.id}"`);
}

// pages
{
  const ids = pages!.map((p) => p.id);
  const dupIds = ids.filter((id, i) => !id || ids.indexOf(id) !== i);
  const expected = values.pages === undefined ? undefined : Number(values.pages);
  if (dupIds.length) report("pages", "FAIL", `empty or duplicate page ids: ${list(dupIds)}`);
  else if (expected === undefined) report("pages", "SKIP", `file has ${pages!.length} pages; pass --pages ${pages!.length} to pin`);
  else report("pages", pages!.length === expected ? "PASS" : "FAIL", `file has ${pages!.length} pages, expected ${expected}`);
}

// images
{
  const count = cells.filter(isImageCell).length;
  const expected = values.images === undefined ? undefined : Number(values.images);
  if (expected === undefined) report("images", "SKIP", `page has ${count} image cells; pass --images ${count} to pin`);
  else report("images", count === expected ? "PASS" : "FAIL", `page has ${count} image cells, expected ${expected}`);
}

// hex: only the selected theme's palette
{
  const found = new Map<string, Set<string>>();
  const note = (hex: string, id: string) => {
    const h = normHex(hex);
    if (!brand.palette.has(h)) (found.get(h) ?? found.set(h, new Set()).get(h)!).add(id);
  };
  const bg = page!.model.attrs.background;
  if (bg && /^#/.test(bg)) note(bg, "mxGraphModel.background");
  else if (!bg) found.set("(no background)", new Set(["mxGraphModel"]));
  for (const c of content) {
    for (const m of (isImageCell(c) ? c.style.replace(/image=[^;]*/, "") : c.style).matchAll(hexRe)) note(m[0], c.id);
    for (const m of c.value.matchAll(hexRe)) note(m[0], c.id);
  }
  const bad = [...found].map(([hex, ids]) => `${hex} in ${list([...ids], 3)}`);
  report("hex", bad.length ? "FAIL" : "PASS", bad.length ? `off-palette: ${list(bad, 8)}` : `all hex values belong to the ${theme} palette`);
}

// fonts
{
  const bad: string[] = [];
  const family = (f: string) => f.split(",")[0]!.replace(/["']/g, "").trim().toLowerCase();
  for (const c of content) {
    if (isImageCell(c) || !plainText(c.value)) continue;
    const f = parseStyle(c.style).get("fontFamily");
    if (!f) bad.push(`${c.id} (no fontFamily)`);
    else if (!brand.fonts.has(family(f))) bad.push(`${c.id} (${f})`);
    for (const m of c.value.matchAll(/font-family:\s*([^;"']+)|face="([^"]+)"/gi)) {
      const inline = m[1] ?? m[2]!;
      if (!brand.fonts.has(family(inline))) bad.push(`${c.id} (inline ${inline.trim()})`);
    }
  }
  report("fonts", bad.length ? "FAIL" : "PASS", bad.length ? list(bad, 8) : `text cells use ${[...brand.fonts].join(" or ")} only`);
}

// text: editable text, raster-only images
{
  const problems: string[] = [];
  if (!content.some((c) => !isImageCell(c) && plainText(c.value))) problems.push("page has no editable text cell");
  for (const c of cells.filter((x) => x.image)) {
    const mime = c.image!.mime;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(mime) && mime !== "image/svg+xml") problems.push(`${c.id} has unsupported image type ${mime}`);
    if (mime === "image/svg+xml") {
      const payload = /image=data:[^,]*,([^;]*)/.exec(c.style)?.[1] ?? "";
      if (/<text[\s>]/.test(Buffer.from(payload, "base64").toString("utf8"))) problems.push(`${c.id} embeds text inside an SVG image`);
    }
  }
  report("text", problems.length ? "FAIL" : "PASS", problems.join("; ") || "text is editable; embedded images are raster or text-free");
}

// connectors: attached to existing shapes; free arrows are reported
{
  const ids = new Set(cells.map((c) => c.id));
  const half: string[] = [];
  const missing: string[] = [];
  const free: string[] = [];
  for (const e of content.filter((c) => c.kind === "edge")) {
    if (!e.source && !e.target) free.push(e.id);
    else if (!e.source || !e.target) half.push(e.id);
    else if (!ids.has(e.source) || !ids.has(e.target)) missing.push(e.id);
  }
  const problems = [half.length ? `one end unattached: ${list(half)}` : "", missing.length ? `endpoint id not found: ${list(missing)}` : ""].filter(Boolean);
  const note = free.length ? `; free arrows (confirm intended): ${list(free)}` : "";
  report("connectors", problems.length ? "FAIL" : "PASS", `${problems.join("; ") || "every connector with an endpoint is attached"}${note}`);
}

// stage-colors: a role's stroke never pairs with another role's tint; Stage N titles keep Stage N stroke
{
  const strokeRole = new Map<string, string>();
  const fillRoles = new Map<string, Set<string>>();
  for (const [role, { stroke, fill }] of brand.roles) {
    if (stroke) strokeRole.set(stroke, role);
    if (fill) (fillRoles.get(fill) ?? fillRoles.set(fill, new Set()).get(fill)!).add(role);
  }
  const problems: string[] = [];
  for (const c of content.filter((x) => x.kind === "vertex" && !isImageCell(x))) {
    const st = parseStyle(c.style);
    const stroke = st.get("strokeColor") ? strokeRole.get(normHex(st.get("strokeColor")!)) : undefined;
    const fillHex = st.get("fillColor");
    const tint = fillHex ? fillRoles.get(normHex(fillHex)) : undefined;
    if (stroke && tint && tint.size === 1 && !tint.has(stroke)) problems.push(`${c.id} (${stroke} stroke with ${[...tint][0]} fill)`);
    const stage = /^stage\s*([1-4])\b(?!\s*(?:[-–→&]|to\b|and\b))/i.exec(plainText(c.value))?.[1];
    if (stage && stroke?.startsWith("Stage") && stroke !== `Stage ${stage}`) problems.push(`${c.id} (text "Stage ${stage}" with ${stroke} stroke)`);
  }
  report("stage-colors", problems.length ? "FAIL" : "PASS", problems.length ? list(problems, 8) : "roles are paired consistently");
}

// rendering: theme style and the known export gotchas
{
  const problems: string[] = [];
  for (const c of content) {
    const st = parseStyle(c.style);
    if (theme === "dark" && st.get("sketch") === "1") problems.push(`${c.id} (sketch in dark theme)`);
    const fill = st.get("fillColor");
    if (theme === "light" && st.get("sketch") === "1" && fill && fill !== "none" && st.get("fillStyle") !== "solid") problems.push(`${c.id} (sketch fill needs fillStyle=solid)`);
    if (/wedgeRoundRectCallout|roundRectCallout/.test(c.style)) problems.push(`${c.id} (use shape=callout;perimeter=calloutPerimeter)`);
    if (c.kind === "edge" && plainText(c.value)) {
      const lacking = ["fontSize", "fontFamily", "fontColor", "labelBackgroundColor"].filter((k) => !st.has(k));
      if (lacking.length) problems.push(`${c.id} (edge label lacks ${lacking.join(",")})`);
    }
  }
  report("rendering", problems.length ? "FAIL" : "PASS", problems.length ? list(problems, 8) : `${theme} rendering rules hold`);
}

finish();
