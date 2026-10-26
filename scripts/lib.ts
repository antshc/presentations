import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

export const repoRoot = resolve(import.meta.dir, "..");
export const draftRoot = join(repoRoot, ".draft");

const useColor = process.stdout.isTTY === true;
const paint = (code: number, text: string) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
export const green = (t: string) => paint(32, t);
export const yellow = (t: string) => paint(33, t);
export const red = (t: string) => paint(31, t);

export function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

export function isDir(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

export function isUnder(path: string, root: string): boolean {
  const base = resolve(root).replace(/[\\/]+$/, "") + sep;
  const target = resolve(path);
  const [a, b] = process.platform === "win32" ? [target.toLowerCase(), base.toLowerCase()] : [target, base];
  return a.startsWith(b);
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

// Resolves the command through PATH first so .cmd shims (npm, npx) work on Windows.
export function run(cmd: string, args: string[], cwd = repoRoot): RunResult {
  const exe = Bun.which(cmd) ?? cmd;
  try {
    const p = Bun.spawnSync([exe, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
    return { code: p.exitCode ?? 1, stdout: p.stdout.toString(), stderr: p.stderr.toString() };
  } catch (error) {
    return { code: 127, stdout: "", stderr: String(error) };
  }
}

export function findDrawio(): string | undefined {
  const candidates: (string | undefined)[] = [process.env.DRAWIO_EXE, Bun.which("drawio") ?? undefined, Bun.which("draw.io") ?? undefined];
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA;
    const programFiles = process.env.ProgramFiles;
    if (local) candidates.push(join(local, "Programs", "draw.io", "draw.io.exe"));
    if (programFiles) candidates.push(join(programFiles, "draw.io", "draw.io.exe"));
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/draw.io.app/Contents/MacOS/draw.io", join(homedir(), "Applications/draw.io.app/Contents/MacOS/draw.io"));
  } else {
    candidates.push("/usr/bin/drawio", "/opt/drawio/drawio", "/opt/draw.io/drawio", "/snap/bin/drawio");
  }
  return candidates.find((c): c is string => !!c && isFile(c));
}

export const drawioInstallHint = "Install draw.io Desktop from https://github.com/jgraph/drawio-desktop/releases or set DRAWIO_EXE to the executable path.";
