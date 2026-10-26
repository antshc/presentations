import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { draftRoot, drawioInstallHint, findDrawio, green, isDir, isFile, isUnder, repoRoot } from "./lib.ts";

const usage = `Usage: bun run export --input <file-or-folder.drawio> --format <png|svg|pdf> [options]

Options:
  -i, --input <path>    .drawio file or folder (must be under .draft/)
  -f, --format <fmt>    png, svg or pdf
  -o, --out <dir>       output folder under .draft/ (default: <project>/exports)
  -p, --page <n>        1-based page to export (default: every page)
      --scale <n>       scale factor, 0.1-20 (default: 1)
      --border <n>      border in pixels, 0-1000 (default: 0)
      --no-embed        do not embed the diagram XML in the export
  -h, --help`;

const { values } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    format: { type: "string", short: "f" },
    out: { type: "string", short: "o" },
    page: { type: "string", short: "p" },
    scale: { type: "string", default: "1" },
    border: { type: "string", default: "0" },
    "no-embed": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (values.help) {
  console.log(usage);
  process.exit(0);
}
if (!values.input || !values.format) fail(usage);

const format = values.format;
if (!["png", "svg", "pdf"].includes(format)) fail("--format must be png, svg or pdf.");
const scale = Number(values.scale);
const border = Number(values.border);
if (!(scale >= 0.1 && scale <= 20)) fail("--scale must be between 0.1 and 20.");
if (!(Number.isInteger(border) && border >= 0 && border <= 1000)) fail("--border must be an integer between 0 and 1000.");
const page = values.page === undefined ? undefined : Number(values.page);
if (page !== undefined && !(Number.isInteger(page) && page >= 1)) fail("--page must be a positive integer.");

const input = resolve(repoRoot, values.input);
if (!isUnder(input, draftRoot)) fail(`Input must be under ${draftRoot}`);
if (!existsInput(input)) fail(`Input does not exist: ${input}`);

function existsInput(path: string): boolean {
  return isFile(path) || isDir(path);
}

function listDrawio(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? listDrawio(full) : e.name.endsWith(".drawio") ? [full] : [];
  });
}

const sources = isDir(input) ? listDrawio(input) : [input];
if (sources.length === 0) fail(`No .drawio source files found under ${input}`);
if (isFile(input) && !input.endsWith(".drawio")) fail("File input must have the .drawio extension.");

function projectRootOf(file: string): string {
  const rel = relative(draftRoot, file).split(/[\\/]/);
  return join(draftRoot, rel[0] ?? "");
}

const drawio = findDrawio();
if (!drawio) fail(`draw.io Desktop was not found. ${drawioInstallHint}`);

const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const before = new Map(sources.map((s) => [s, hash(s)]));

function pageCount(file: string): number {
  return Math.max(1, (readFileSync(file, "utf8").match(/<diagram[\s>]/g) ?? []).length);
}

function exportOne(source: string, outFile: string, pageIndex?: number, allPages = false): void {
  const args = ["--export", "--format", format, "--output", outFile, "--scale", String(scale), "--border", String(border)];
  if (!values["no-embed"]) args.push("--embed-diagram");
  if (pageIndex) args.push("--page-index", String(pageIndex));
  if (allPages) args.push("--all-pages");
  args.push(source);
  const needsDisplay = process.platform === "linux" && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
  const xvfb = needsDisplay ? Bun.which("xvfb-run") : null;
  const cmd = xvfb ? [xvfb, "-a", drawio!, ...args] : [drawio!, ...args];
  const p = Bun.spawnSync(cmd, { stdout: "ignore", stderr: "pipe" });
  if (p.exitCode !== 0) {
    const hint = needsDisplay && !xvfb ? " No display found; install xvfb and rerun." : "";
    fail(`draw.io export failed with exit code ${p.exitCode} for ${source}.${hint}\n${p.stderr.toString().trim()}`);
  }
  console.log(`  ${relative(repoRoot, outFile)}`);
}

for (const source of sources) {
  const outDir = values.out ? resolve(repoRoot, values.out) : join(projectRootOf(source), "exports");
  if (!isUnder(outDir, draftRoot)) fail(`Output must be under ${draftRoot}`);
  mkdirSync(outDir, { recursive: true });
  const name = basename(source, ".drawio");
  if (format === "pdf" && page === undefined) {
    exportOne(source, join(outDir, `${name}.pdf`), undefined, true);
    continue;
  }
  const pages = page !== undefined ? [page] : Array.from({ length: pageCount(source) }, (_, i) => i + 1);
  for (const n of pages) {
    const suffix = `p${String(n).padStart(2, "0")}`;
    exportOne(source, join(outDir, `${name}-${suffix}.${format}`), n);
  }
}

for (const [source, original] of before) {
  if (hash(source) !== original) fail(`Source diagram changed during export: ${source}`);
}
console.log(green(`Export completed for ${sources.length} diagram(s).`));
