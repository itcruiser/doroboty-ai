import { afterEach, expect, test, vi } from "vitest";
import type { Context } from "@netlify/functions";
import handler, { config } from "../netlify/functions/deepening.mts";
import { createHostedDeepeningHandler } from "./hosted-deepening.ts";

const origin = "https://example.netlify.app";
const context = { site: { url: origin } } as Context;
const job = {
  title: "Product Manager",
  summary: "Badania",
  description: "Badania i automatyzacja",
};
const suggestions = { aspects: [{ title: "Badania", explanation: "Opisz własny wkład." }] };
const revision = {
  jobId: "job-1",
  jobRevision: 1,
  aspectRevision: 1,
  ...job,
  aspects: [{ id: "research", order: 0, author: "employer", ...suggestions.aspects[0] }],
};
const questionInput = {
  revision,
  aspectIds: ["research"],
  applicationText: "Prowadziłam badania użytkowników i wdrażałam automatyzację.",
};
function request(path = "aspects", body: unknown = job, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/deepening/${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
function provider(result: unknown = suggestions) {
  vi.stubGlobal("Netlify", {
    env: { get: (key: string) => (key === "OPENAI_API_KEY" ? "server-only-secret" : undefined) },
  });
  const fetch = vi.fn(async () =>
    Response.json({
      status: "completed",
      output: [
        { type: "message", content: [{ type: "output_text", text: JSON.stringify(result) }] },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("the deployed entry routes both existing APIs and limits public demo calls per IP", () => {
  expect(config.path).toEqual(["/api/deepening/aspects", "/api/deepening/questions"]);
  expect(config.rateLimit).toMatchObject({
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  });
});

test("the actual Netlify entry generates aspects using server-only secrets and shared validation", async () => {
  const fetch = provider();
  const response = await handler(request(), context);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(suggestions);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("access-control-allow-origin")).toBeNull();
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("https://api.openai.com/v1/responses");
  expect(init.headers).toMatchObject({ Authorization: "Bearer server-only-secret" });
  const outbound = JSON.parse(String(init.body));
  expect(outbound).toMatchObject({ store: false, model: "gpt-5.4-mini" });
  expect(JSON.parse(outbound.input)).toEqual(job);
  expect(JSON.stringify(outbound)).not.toContain("server-only-secret");
});

test("hosted questions use only the professional projection and validate aspect IDs", async () => {
  const questions = {
    questions: [{ aspectId: "research", question: "Jak podejmowałaś decyzje?" }],
  };
  const fetch = provider(questions);
  const response = await handler(request("questions", questionInput), context);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(questions);
  const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
  const input = JSON.parse(JSON.parse(String(init.body)).input);
  expect(input).toEqual({
    job,
    aspects: [{ aspectId: "research", ...suggestions.aspects[0] }],
    applicationText: questionInput.applicationText,
  });
  expect(JSON.stringify(input)).not.toMatch(/jobId|jobRevision|aspectRevision|author|order/);
});

test.each([
  ["foreign origin", () => request("aspects", job, { origin: "https://other.example" }), 403],
  [
    "missing origin",
    () => {
      const r = request();
      r.headers.delete("origin");
      return r;
    },
    403,
  ],
  ["cross-site fetch", () => request("aspects", job, { "sec-fetch-site": "cross-site" }), 403],
  [
    "untrusted host",
    () =>
      new Request("https://other.example/api/deepening/aspects", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify(job),
      }),
    403,
  ],
  [
    "unsupported content type",
    () => request("aspects", job, { "content-type": "text/plain" }),
    415,
  ],
  ["encoded body", () => request("aspects", job, { "content-encoding": "gzip" }), 415],
  [
    "private extra input",
    () => request("aspects", { ...job, privateBrief: "Do not forward" }),
    400,
  ],
  [
    "invalid aspect ID",
    () => request("questions", { ...questionInput, aspectIds: ["unknown"] }),
    400,
  ],
  ["oversized declared body", () => request("aspects", job, { "content-length": "100001" }), 413],
  [
    "oversized actual body",
    () => request("aspects", { ...job, description: "x".repeat(100001) }),
    413,
  ],
  [
    "wrong method",
    () => new Request(`${origin}/api/deepening/aspects`, { headers: { origin } }),
    405,
  ],
  ["unknown route", () => request("unknown"), 404],
] as const)(
  "hosted boundary rejects %s before any provider call",
  async (_name, makeRequest, status) => {
    const fetch = provider();
    const response = await handler(makeRequest(), context);
    expect(response.status).toBe(status);
    expect(fetch).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("server-only-secret");
  },
);

test("missing hosted key and provider failure remain generic recoverable errors", async () => {
  const fetch = provider();
  vi.stubGlobal("Netlify", { env: { get: () => undefined } });
  expect((await handler(request(), context)).status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();
  provider();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("private provider error", { status: 401 })),
  );
  const response = await handler(request(), context);
  expect(response.status).toBe(502);
  expect(await response.text()).not.toMatch(/private provider error|server-only-secret/);
});

test("missing trusted site metadata fails closed before any provider request", async () => {
  const fetch = provider();
  expect((await handler(request(), { site: {} } as Context)).status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();
});

test("invalid provider output is never accepted by the hosted entry", async () => {
  provider({ aspects: [{ title: "Badania", explanation: "Opis", extra: "unexpected" }] });
  expect((await handler(request(), context)).status).toBe(502);
});

test("HTTPS accepts Netlify metadata with an http site URL without trusting HTTP requests", async () => {
  provider();
  expect(
    (await handler(request(), { site: { url: origin.replace("https:", "http:") } } as Context))
      .status,
  ).toBe(200);
  expect(
    (
      await handler(
        new Request(origin.replace("https:", "http:") + "/api/deepening/aspects", {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify(job),
        }),
        context,
      )
    ).status,
  ).toBe(403);
});

test("hosted bodies reject malformed JSON and stop slow streams before provider calls", async () => {
  const fetch = provider();
  const malformed = new Request(`${origin}/api/deepening/aspects`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: "{",
  });
  expect((await handler(malformed, context)).status).toBe(400);
  const cancelled = vi.fn();
  const body = new ReadableStream({ cancel: cancelled });
  const slow = new Request(`${origin}/api/deepening/aspects`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body,
    duplex: "half",
  } as RequestInit);
  const handle = createHostedDeepeningHandler(() => ({ apiKey: "server-only-secret" }), 10);
  expect((await handle(slow, origin)).status).toBe(408);
  expect(cancelled).toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

test("hosted generation times out and releases capacity for retry", async () => {
  const fetch = vi.fn(async () => new Promise<Response>(() => {}));
  const handle = createHostedDeepeningHandler(() => ({
    apiKey: "server-only-secret",
    fetch,
    timeoutMs: 10,
  }));
  expect((await handle(request(), origin)).status).toBe(504);
  expect((await handle(request(), origin)).status).toBe(504);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("one hosted worker bounds simultaneous calls and recovers after they finish", async () => {
  const release: Array<(response: Response) => void> = [];
  const fetch = vi.fn(() => new Promise<Response>((resolve) => release.push(resolve)));
  const handle = createHostedDeepeningHandler(() => ({ apiKey: "server-only-secret", fetch }));
  const first = handle(request(), origin);
  const second = handle(request(), origin);
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect((await handle(request(), origin)).status).toBe(429);
  const response = () =>
    Response.json({
      status: "completed",
      output: [
        { type: "message", content: [{ type: "output_text", text: JSON.stringify(suggestions) }] },
      ],
    });
  release.forEach((resolve) => resolve(response()));
  expect((await first).status).toBe(200);
  expect((await second).status).toBe(200);
});
