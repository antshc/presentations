import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { drawioInstallHint, findDrawio, isDir, isFile, repoRoot, yellow } from "./lib.ts";

const draft = join(repoRoot, ".draft");
if (isDir(draft)) {
  console.log(".draft workspace already exists.");
} else {
  mkdirSync(draft, { recursive: true });
  console.log("Created .draft workspace.");
}

for (const cmd of ["node", "npm", "npx"]) {
  if (!Bun.which(cmd)) {
    console.error(`${cmd} is required. Install Node.js LTS from https://nodejs.org/ and rerun setup.`);
    process.exit(1);
  }
}

const installArgs = isFile(join(repoRoot, "bun.lock")) ? ["install", "--frozen-lockfile"] : ["install"];
const install = Bun.spawnSync([process.execPath, ...installArgs], { cwd: repoRoot, stdout: "inherit", stderr: "inherit" });
if (install.exitCode !== 0) {
  console.error(`Bun dependency installation failed with exit code ${install.exitCode}.`);
  process.exit(install.exitCode ?? 1);
}

if (!Bun.which("codex")) console.warn(yellow("Codex was not found. Install Codex before using the repository-local skill."));
if (!findDrawio()) console.warn(yellow(`draw.io Desktop was not found. ${drawioInstallHint}`));

const doctor = Bun.spawnSync([process.execPath, join(import.meta.dir, "doctor.ts")], { cwd: repoRoot, stdout: "inherit", stderr: "inherit" });
process.exit(doctor.exitCode ?? 1);
