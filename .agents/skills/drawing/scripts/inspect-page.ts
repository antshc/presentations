import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Cell, isImageCell, loadDrawio, plainText, selectPage, stripStyle } from "./drawio.ts";

const usage = `Usage: bun inspect-page.ts <file.drawio> [page] [--full]

Lists the pages of a .drawio file, or inventories one page (number, id or name fragment).
Embedded base64 images are replaced by <IMG n bytes mime sha:xxxxxxxx>; the sha identifies the payload.
  --full   do not truncate styles and text`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { full: { type: "boolean", default: false }, help: { type: "boolean", short: "h", default: false } },
});
if (values.help || positionals.length < 1) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

const file = resolve(positionals[0]!);
if (!existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const cut = (s: string, n: number) => (values.full || s.length <= n ? s : `${s.slice(0, n - 1)}…`);
const num = (n: number) => String(Math.round(n * 100) / 100);

try {
  const doc = loadDrawio(file);
  if (positionals.length < 2) {
    console.log(`${file}  (${doc.pages.length} pages)`);
    for (const p of doc.pages) {
      const images = p.cells.filter(isImageCell).length;
      console.log(`${String(p.number).padStart(2)}  ${p.id}  ${p.name}  cells=${p.cells.length} images=${images}`);
    }
    process.exit(0);
  }

  const page = selectPage(doc.pages, positionals[1]!);
  const model = page.model.attrs;
  const cells = page.cells;
  const images = cells.filter(isImageCell);
  const embedded = cells.filter((c) => c.image);
  const layers = cells.filter((c) => c.kind === "layer");
  console.log(`page ${page.number} id=${page.id} name="${page.name}"`);
  console.log(
    `canvas ${model.pageWidth ?? "?"}x${model.pageHeight ?? "?"} background=${model.background ?? "none"} cells=${cells.length} ` +
      `vertices=${cells.filter((c) => c.kind === "vertex").length} edges=${cells.filter((c) => c.kind === "edge").length} ` +
      `images=${images.length} (embedded=${embedded.length}, ${embedded.reduce((n, c) => n + c.image!.bytes, 0)} bytes)`,
  );
  console.log("layers:");
  for (const l of layers) console.log(`  ${l.id} "${l.value}" children=${cells.filter((c) => c.parent === l.id).length}`);

  console.log("cells (id | parent | kind | x,y wxh or source>target | style | text); IMAGE = keep untouched:");
  for (const c of cells) {
    if (c.kind === "root" || c.kind === "layer") continue;
    const where = c.kind === "edge" ? `${c.source || "?"}>${c.target || "?"}` : geometry(c);
    const tag = isImageCell(c) ? "IMAGE " : "";
    const text = plainText(c.value);
    console.log(`${c.id} | ${c.parent} | ${tag}${c.kind} | ${where} | ${cut(stripStyle(c.style), 160)} | ${text ? JSON.stringify(cut(text, 100)) : ""}`);
  }
} catch (error) {
  console.error(`Cannot inspect ${file}: ${(error as Error).message}`);
  process.exit(1);
}

function geometry(c: Cell): string {
  return c.geo ? `${num(c.geo.x)},${num(c.geo.y)} ${num(c.geo.width)}x${num(c.geo.height)}` : "-";
}
