/**
 * Unified local dev launcher: starts engine-service (8000), local mock core
 * API (8080, skip with --no-mock when the Java backend is running), and Vite
 * frontend (5173).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const noMock = process.argv.includes("--no-mock");

function ensureEnv(dir) {
  const target = path.join(dir, ".env");
  const example = path.join(dir, ".env.example");
  if (!fs.existsSync(target) && fs.existsSync(example)) {
    fs.copyFileSync(example, target);
  }
}

const engineDir = path.join(ROOT, "engine-service");
const frontendDir = path.join(ROOT, "frontend");
ensureEnv(engineDir);
ensureEnv(frontendDir);

const venvUvicorn = path.join(
  engineDir,
  ".venv",
  isWin ? "Scripts" : "bin",
  isWin ? "uvicorn.exe" : "uvicorn",
);
const uvicornCmd = fs.existsSync(venvUvicorn) ? venvUvicorn : "uvicorn";

const children = [];

function start(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: isWin && cmd === "npm" });
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  children.push(child);
  return child;
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start("engine", uvicornCmd, ["main:app", "--reload", "--port", "8000"], engineDir);
if (!noMock) {
  start("mock-core", process.execPath, [path.join(ROOT, "scripts", "mock-core.mjs")], ROOT);
}
start("frontend", "npm", ["run", "dev"], frontendDir);
