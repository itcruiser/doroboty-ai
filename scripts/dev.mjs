import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const children = [];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}
const companion = spawn(
  process.execPath,
  ["--env-file-if-exists=.env.server.local", "server/main.ts"],
  {
    cwd: root,
    stdio: "inherit",
  },
);
children.push(companion);
companion.on("error", () =>
  console.error("Deepening companion unavailable. Ordinary app flows remain available."),
);
const browserEnvironment = { ...process.env };
delete browserEnvironment.OPENAI_API_KEY;
delete browserEnvironment.OPENAI_MODEL;
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "3001",
    "--strictPort",
    ...process.argv.slice(2),
  ],
  { cwd: root, stdio: "inherit", env: browserEnvironment },
);
children.push(vite);
vite.on("error", () => {
  process.exitCode = 1;
  stop();
});
vite.on("exit", (code) => {
  process.exitCode = code ?? 0;
  stop();
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, stop);
