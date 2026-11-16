import { createDeepeningServer } from "./deepening.ts";

// Node loads .env.local only for this child process, never into Vite's environment.
const server = createDeepeningServer({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
});
server.on("error", () => {
  console.error(
    "Deepening companion could not start on 127.0.0.1:3002. Ordinary static flows remain available.",
  );
  process.exitCode = 1;
});
server.listen(3002, "127.0.0.1", () =>
  console.log("Deepening companion: http://127.0.0.1:3002 (synthetic data only)."),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    server.close();
    server.closeAllConnections();
  });
