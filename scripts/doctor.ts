import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { drawioInstallHint, findDrawio, green, isDir, isFile, red, repoRoot, run, yellow } from "./lib.ts";

const failures: string[] = [];
const warnings: string[] = [];

function check(passed: boolean, message: string, warning = false): void {
  if (passed) {
    console.log(`${green("[OK]  ")} ${message}`);
  } else if (warning) {
    console.log(`${yellow("[WARN]")} ${message}`);
    warnings.push(message);
  } else {
    console.log(`${red("[FAIL]")} ${message}`);
    failures.push(message);
  }
}

function version(cmd: string): string | undefined {
  const r = run(cmd, ["--version"]);
  return r.code === 0 ? r.stdout.trim() : undefined;
}

function listDrawioFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listDrawioFiles(full));
    else if (entry.name.endsWith(".drawio")) found.push(full);
  }
  return found;
}

const nodeVersion = version("node");
check(!!nodeVersion, "Node.js is available.");
if (nodeVersion) {
  const lts = run("node", ["-p", "process.release.lts || ''"]).stdout.trim();
  check(!!lts, `Node.js ${nodeVersion} is an LTS release.`);
}

for (const cmd of ["npm", "npx"]) {
  const v = version(cmd);
  check(!!v, `${cmd} is available.`);
  if (v) console.log(`       ${cmd} ${v}`);
}

const bunVersion = Bun.version;
const [major = 0, minor = 0] = bunVersion.split(".").map((n) => Number.parseInt(n, 10));
check(major > 1 || (major === 1 && minor >= 1), `Bun ${bunVersion} satisfies the >=1.1 requirement.`);

const codex = Bun.which("codex");
check(!!codex, "Codex is available.");

const drawio = findDrawio();
check(!!drawio, "draw.io Desktop is available for layout and export.", true);
if (drawio) console.log(`       ${drawio}`);
else console.log(`       ${drawioInstallHint}`);

check(isFile(join(repoRoot, "node_modules", "@drawio", "mcp", "package.json")), "The pinned @drawio/mcp package is installed locally.");

const skills = join(repoRoot, ".agents", "skills");
check(isFile(join(skills, "planning", "SKILL.md")), "The planning skill is present.");
check(isFile(join(skills, "planning", "templates", "presentation-plan.md")), "The presentation plan template is present.");

const baoyu: Record<string, string[]> = {
  "baoyu-comic": ["SKILL.md", "references/base-prompt.md", "scripts/merge-to-pdf.ts"],
  "baoyu-xhs-images": ["SKILL.md", "references/elements/canvas.md"],
  "baoyu-image-gen": ["SKILL.md", "scripts/main.ts", "references/usage-examples.md"],
};
for (const [name, files] of Object.entries(baoyu)) {
  const missing = files.filter((f) => !isFile(join(skills, name, ...f.split("/"))));
  check(missing.length === 0, `${name} and its required supporting files are present.`);
  if (missing.length > 0) console.log(`       Missing: ${missing.join(", ")}`);
}

check(isFile(join(repoRoot, "skills-lock.json")), "The project-local skill lock is present.");

const draft = join(repoRoot, ".draft");
check(isDir(draft), "The .draft workspace exists.");

if (Bun.which("git")) {
  const ignored = (p: string) => run("git", ["check-ignore", "--quiet", p]).code === 0;
  const assetsIgnored = ignored(".draft/probe/images/probe.png");
  const trackedIgnored = ignored(".draft/probe/plan.md") || ignored(".draft/probe/diagrams/probe.drawio");
  check(assetsIgnored && !trackedIgnored, ".draft/ assets are ignored; plan.md and diagrams/*.drawio are tracked.");
} else {
  check(false, "Git is unavailable; .draft ignore status could not be checked.", true);
}

if (isDir(draft)) {
  for (const project of readdirSync(draft, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const root = join(draft, project.name);
    for (const folder of ["sources", "images", "video", "references", "diagrams", "exports", "notes"]) {
      check(isDir(join(root, folder)), `${project.name}/${folder} exists.`, true);
    }
    check(isFile(join(root, "plan.md")), `${project.name}/plan.md exists.`, true);
    const diagramsDir = join(root, "diagrams");
    const misplaced = listDrawioFiles(root).filter((f) => !f.startsWith(diagramsDir + sep));
    check(misplaced.length === 0, `${project.name}: native .drawio files live under diagrams/.`, true);
    for (const f of misplaced) console.log(`       Outside diagrams/: ${relative(repoRoot, f)}`);
  }
}

if (codex) {
  const list = run("codex", ["plugin", "list"]);
  const installed = /^drawio@drawio\s+installed, enabled/m.test(list.stdout + list.stderr);
  check(installed, "The drawio@drawio Codex plugin is installed and enabled.", true);
  if (!installed) {
    console.log("       Install with:");
    console.log("       codex plugin marketplace add jgraph/drawio-mcp");
    console.log("       codex plugin add drawio@drawio");
  }
}

if (warnings.length > 0) console.log(yellow(`Doctor completed with ${warnings.length} warning(s).`));
if (failures.length > 0) {
  console.log(red(`Doctor failed with ${failures.length} required check(s).`));
  process.exit(1);
}
console.log(green("Doctor completed successfully."));
