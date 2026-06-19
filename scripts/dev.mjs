import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vite = path.join(root, "node_modules", "vite", "bin", "vite.js");
const children = [
  spawn(process.execPath, [path.join(root, "server", "index.mjs")], { cwd: root, stdio: "inherit" }),
  spawn(process.execPath, [vite], { cwd: root, stdio: "inherit" }),
];

const stop = () => children.forEach((child) => child.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((child) => child.on("exit", (code) => code && process.exit(code)));
