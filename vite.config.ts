import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
let revision = "source-package";
try {
  revision = execFileSync("git", ["describe", "--always", "--dirty"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  /* Participant packages intentionally have no Git history. */
}
const build = { revision, builtAt: new Date().toISOString() };
const buildId = `${build.revision} ${build.builtAt}`;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "build-identity",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ id: buildId, ...build }) + "\n",
        });
      },
    },
  ],
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  base: "./",
  server: {
    proxy: { "/api/deepening": { target: "http://127.0.0.1:3002" } },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
