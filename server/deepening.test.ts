import { afterEach, expect, test } from "vitest";
import type { Server } from "node:http";
import { createDeepeningServer } from "./deepening.ts";

const running: Server[] = [];
afterEach(async () => {
  await Promise.all(
    running
      .splice(0)
      .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});
async function start(options: Parameters<typeof createDeepeningServer>[0]) {
  const server = createDeepeningServer(options);
  running.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  return `http://127.0.0.1:${address.port}`;
}
const publicJob = {
  title: "Product Manager",
  summary: "Badania z użytkownikami",
  description: "Badania i automatyzacja",
};
const suggestion = {
  aspects: [
    { title: "Badania", explanation: "Chcemy poznać wkład", excerpt: "Badania z użytkownikami" },
  ],
};
function modelResponse(result: unknown) {
  return Response.json({
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(result) }] }],
  });
}
function post(url: string, body: unknown) {
  return fetch(`${url}/api/deepening/aspects`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:3001" },
    body: JSON.stringify(body),
  });
}

test("HTTP aspects accepts approved public content and returns validated structured suggestions", async () => {
  let outbound: Record<string, unknown> = {};
  const url = await start({
    apiKey: "server-only-secret",
    fetch: async (_url, init) => {
      outbound = JSON.parse(String(init?.body));
      return modelResponse(suggestion);
    },
  });
  const response = await post(url, publicJob);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(suggestion);
  expect(outbound).toMatchObject({
    store: false,
    model: "gpt-5.4-mini",
    text: { format: { type: "json_schema", strict: true } },
  });
  expect(JSON.stringify(outbound)).not.toContain("server-only-secret");
});

const revision = {
  jobId: "job-1",
  jobRevision: 2,
  aspectRevision: 1,
  ...publicJob,
  aspects: [
    {
      id: "research",
      title: "Badania",
      explanation: "Własny wkład",
      excerpt: "Badania z użytkownikami",
      author: "employer",
      order: 0,
    },
    {
      id: "automation",
      title: "Automatyzacja",
      explanation: "Efekt",
      excerpt: "automatyzacja",
      author: "ai",
      order: 1,
    },
  ],
};
const prepared = {
  revision,
  aspectIds: ["research", "automation"],
  answerFacts: ["user_research"],
  cvFacts: ["automation_delivery"],
};
const generated = {
  questions: [
    { aspectId: "research", question: "Jeśli chcesz rozwinąć badania, jaką decyzję podjęłaś?" },
    { aspectId: "automation", question: "Jaki był efekt?" },
  ],
};
function questionPost(url: string, body: unknown) {
  return fetch(`${url}/api/deepening/questions`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:3001" },
    body: JSON.stringify(body),
  });
}

test("HTTP questions reconstructs professional facts and only the requested approved aspects", async () => {
  let sent = "";
  const url = await start({
    apiKey: "private-key",
    fetch: async (_url, init) => {
      sent = String(init?.body);
      return modelResponse(generated);
    },
  });
  const response = await questionPost(url, prepared);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(generated);
  const payload = JSON.parse(sent);
  expect(JSON.parse(payload.input)).toEqual({
    aspects: [
      {
        aspectId: "research",
        title: "Badania",
        explanation: "Własny wkład",
        excerpt: "Badania z użytkownikami",
      },
      {
        aspectId: "automation",
        title: "Automatyzacja",
        explanation: "Efekt",
        excerpt: "automatyzacja",
      },
    ],
    answerFacts: ["Kandydat deklaruje prowadzenie badań z użytkownikami."],
    cvFacts: ["Kandydat deklaruje wdrożenie automatyzacji."],
  });
  expect(payload.instructions).toContain("OPCJONALNEGO");
  expect(sent).not.toMatch(/job-1|jobRevision|private-key|cv"|profile/);
});

for (const body of [
  { ...prepared, answer: "Anna Prywatna" },
  { ...prepared, cv: "private CV" },
  { ...prepared, profile: { name: "Anna" } },
  { ...prepared, answerFacts: ["Prowadziłam badania z użytkownikami."] },
  { ...prepared, answerFacts: [] },
  { ...prepared, aspectIds: ["unknown"] },
  { ...prepared, aspectIds: ["research", "research"] },
  {
    ...prepared,
    revision: {
      ...revision,
      aspects: revision.aspects.map((aspect) => ({ ...aspect, id: "research" })),
    },
  },
  { ...prepared, revision: { ...revision, aspects: [{ ...revision.aspects[0], order: 2 }] } },
  {
    ...prepared,
    revision: { ...revision, aspects: [{ ...revision.aspects[0], excerpt: "invented excerpt" }] },
  },
  {
    ...prepared,
    revision: { ...revision, aspects: [{ ...revision.aspects[0], profile: "private" }] },
  },
])
  test("HTTP rejects unprepared input, invalid IDs/order or unsupported excerpts before OpenAI", async () => {
    let calls = 0;
    const url = await start({
      apiKey: "private-key",
      fetch: async () => {
        calls++;
        return modelResponse(generated);
      },
    });
    const response = await questionPost(url, body);
    expect(response.status).toBe(400);
    expect(calls).toBe(0);
    expect(JSON.stringify(await response.json())).not.toMatch(/Anna|private-key|private CV/);
  });

for (const result of [
  {
    questions: [
      { aspectId: "research", question: "A?" },
      { aspectId: "research", question: "B?" },
    ],
  },
  { questions: [{ aspectId: "research", question: "A?" }] },
  {
    questions: [
      { aspectId: "research", question: "A?" },
      { aspectId: "other", question: "B?" },
    ],
  },
  {
    questions: [
      { aspectId: "research", question: "A?" },
      { aspectId: "automation", question: "" },
    ],
  },
])
  test("HTTP rejects incomplete, duplicate or unrelated model questions", async () => {
    const url = await start({ apiKey: "private-key", fetch: async () => modelResponse(result) });
    const response = await questionPost(url, prepared);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

test("HTTP rejects invented aspect excerpts and model refusal", async () => {
  const url = await start({
    apiKey: "private-key",
    fetch: async () =>
      modelResponse({
        aspects: [{ ...suggestion.aspects[0], excerpt: "Not in approved content" }],
      }),
  });
  expect((await post(url, publicJob)).status).toBe(502);
  const refused = await start({
    apiKey: "private-key",
    fetch: async () =>
      Response.json({
        status: "completed",
        output: [{ type: "message", content: [{ type: "refusal", refusal: "NO" }] }],
      }),
  });
  expect((await post(refused, publicJob)).status).toBe(502);
});

test("missing key, upstream failure and timeout remain recoverably unavailable", async () => {
  let calls = 0;
  const absent = await start({
    fetch: async () => {
      calls++;
      return modelResponse(suggestion);
    },
  });
  expect((await post(absent, publicJob)).status).toBe(503);
  expect(calls).toBe(0);
  const failed = await start({
    apiKey: "secret",
    fetch: async () => new Response("secret diagnostic", { status: 429 }),
  });
  const response = await post(failed, publicJob);
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain("secret");
  const timeout = await start({
    apiKey: "secret",
    timeoutMs: 20,
    fetch: async () => new Promise(() => {}),
  });
  expect((await post(timeout, publicJob)).status).toBe(504);
});

test("HTTP rejects unsuitable origins/content types, private extra fields and oversized input", async () => {
  let calls = 0;
  const url = await start({
    apiKey: "secret",
    fetch: async () => {
      calls++;
      return modelResponse(suggestion);
    },
  });
  expect(
    (
      await fetch(`${url}/api/deepening/aspects`, {
        method: "POST",
        headers: { origin: "https://evil.example", "content-type": "application/json" },
        body: JSON.stringify(publicJob),
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await fetch(`${url}/api/deepening/aspects`, {
        method: "POST",
        headers: { origin: "http://127.0.0.1:3001", "content-type": "text/plain" },
        body: JSON.stringify(publicJob),
      })
    ).status,
  ).toBe(415);
  expect((await post(url, { ...publicJob, brief: "private source" })).status).toBe(400);
  expect((await post(url, { ...publicJob, description: "x".repeat(110_000) })).status).toBe(413);
  expect(calls).toBe(0);
});

test("Node 24 can load the companion without a TypeScript build or runtime dependency", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const result = await promisify(execFile)(process.execPath, [
    "--input-type=module",
    "-e",
    "import {createDeepeningServer} from './server/deepening.ts'; createDeepeningServer().close();",
  ]);
  expect(result.stderr).toBe("");
});

for (const response of [
  new Response("x".repeat(70_000)),
  Response.json({ status: "incomplete", output: [] }),
  Response.json({
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: "not JSON" }] }],
  }),
])
  test("HTTP rejects oversized, incomplete or malformed provider output", async () => {
    const url = await start({ apiKey: "secret", fetch: async () => response });
    expect((await post(url, publicJob)).status).toBe(502);
  });
