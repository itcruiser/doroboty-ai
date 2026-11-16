import { afterEach, expect, test, vi } from "vitest";
import { AnswerPreparationError, generateQuestions } from "./client";
import type { ProfessionalFact } from "./privacy";
import type { DeepeningRevision } from "./schema";

const revision: DeepeningRevision = {
  jobId: "job-1",
  jobRevision: 1,
  aspectRevision: 1,
  title: "Product Manager",
  summary: "Badania z użytkownikami",
  description: "Badania z użytkownikami",
  aspects: [
    {
      id: "research",
      title: "Badania",
      explanation: "Opisz wkład",

      author: "employer",
      order: 0,
    },
  ],
};
afterEach(() => vi.unstubAllGlobals());

test("question generation sends only canonical professional facts before the HTTP boundary", async () => {
  let body = "";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, init: RequestInit) => {
      body = String(init.body);
      return Response.json({
        questions: [
          { aspectId: "research", question: "Jeśli chcesz rozwinąć badania, jaki był Twój wkład?" },
        ],
      });
    }),
  );
  const result = await generateQuestions({
    revision,
    aspectIds: ["research"],
    answer:
      "Prowadziłam badania z użytkownikami i wdrożyłam automatyzację. Czas obsługi skrócił się o 30%.",
    cv: "Anna Prywatna — Product Manager\nTelefon 500600700\nProwadziłam badania z użytkownikami.",
  });
  expect(result.questions).toHaveLength(1);
  expect(JSON.parse(body)).toEqual({
    revision,
    aspectIds: ["research"],
    answerFacts: ["user_research", "automation_delivery", "service_time_reduction"],
  });
  expect(body).not.toMatch(/Anna|example|500600700|Prowadziłam|cv/i);
});

for (const answer of [
  "React, badania, automatyzacja",
  "Anna Prywatna, anna@example.test. Prowadziłam badania z użytkownikami.",
  "Prowadziłam badania z użytkownikami. To kłamstwo.",
  "Nie prowadziłam badań z użytkownikami.",
  "Nie wiem. Prowadziłam badania z użytkownikami.",
  "Chyba prowadziłam badania z użytkownikami.",
  "Anna Prywatna anna@example.test 500600700",
  'Powiedział: "Prowadziłam badania z użytkownikami".',
  "Być może. Prowadziłam badania z użytkownikami.",
  "Nie wdrożyłam automatyzacji, ale znam React.",
])
  test(`unsafe or unsupported answer is blocked before fetch: ${answer}`, async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateQuestions({
        revision,
        aspectIds: ["research"],
        answer,
        cv: "Prowadziłam badania z użytkownikami.",
      }),
    ).rejects.toBeInstanceOf(AnswerPreparationError);
    expect(fetcher).not.toHaveBeenCalled();
  });

test("client rejects duplicate or unrelated question IDs", async () => {
  vi.stubGlobal("fetch", async () =>
    Response.json({ questions: [{ aspectId: "other", question: "Pytanie" }] }),
  );
  await expect(
    generateQuestions({
      revision,
      aspectIds: ["research"],
      answer: "Prowadziłam badania z użytkownikami.",
      cv: "",
    }),
  ).rejects.toThrow(/Nie udało/);
});

test("client rejects malformed aspect ordering before HTTP", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    generateQuestions({
      revision: { ...revision, aspects: [{ ...revision.aspects[0], order: 2 }] },
      aspectIds: ["research"],
      answer: "Prowadziłam badania z użytkownikami.",
      cv: "",
    }),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

test("client sends a recognized CV only as finite professional fact IDs", async () => {
  let body: unknown;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return Response.json({ questions: [{ aspectId: "research", question: "Jaki był wkład?" }] });
  });
  await generateQuestions({
    revision,
    aspectIds: ["research"],
    answer: "Prowadziłam badania z użytkownikami.",
    cv: "Wdrożyłam automatyzację.",
  });
  expect(body).toEqual({
    revision,
    aspectIds: ["research"],
    answerFacts: ["user_research"],
    cvFacts: ["automation_delivery"],
  });
});

test("client rejects retired suggestion fields and drops nonpublic job metadata", async () => {
  const { suggestAspects } = await import("./client");
  let body: unknown;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return Response.json({
      aspects: [{ title: "Badania", explanation: "Wkład", excerpt: "not in public content" }],
    });
  });
  const job = {
    title: revision.title,
    summary: revision.summary,
    description: revision.description,
    sourceBrief: "private source",
    employerNotes: "private notes",
  };
  await expect(suggestAspects(job)).rejects.toThrow(/Nie udało/);
  expect(body).toEqual({
    title: revision.title,
    summary: revision.summary,
    description: revision.description,
  });
});

test("client accepts title and explanation without an offer excerpt", async () => {
  const { suggestAspects } = await import("./client");
  const suggestion = { aspects: [{ title: "Badania", explanation: "Opisz własny wkład." }] };
  vi.stubGlobal("fetch", async () => Response.json(suggestion));
  await expect(suggestAspects(revision)).resolves.toEqual(suggestion);
});

test("client refuses an oversized HTTP response", async () => {
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response("x".repeat(70_000), { headers: { "Content-Type": "application/json" } }),
  );
  await expect(
    generateQuestions({
      revision,
      aspectIds: ["research"],
      answer: "Prowadziłam badania z użytkownikami.",
      cv: "",
    }),
  ).rejects.toThrow(/Nie udało/);
});

test("explicitly approved professional facts recover unsupported prose without transmitting it", async () => {
  let body = "";
  const fetcher = vi.fn(async (_url, init: RequestInit) => {
    body = String(init.body);
    return Response.json({
      questions: [{ aspectId: "research", question: "Jaki był Twój wkład w badania?" }],
    });
  });
  vi.stubGlobal("fetch", fetcher);
  await generateQuestions({
    revision,
    aspectIds: ["research"],
    answer: "Anna Prywatna — mam doświadczenie w badaniu potrzeb i automatyzacji procesów.",
    cv: "Anna Prywatna, telefon 500600700",
    approvedAnswerFacts: ["user_research", "automation_delivery"],
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.parse(body)).toEqual({
    revision,
    aspectIds: ["research"],
    answerFacts: ["user_research", "automation_delivery"],
  });
  expect(body).not.toMatch(/Anna|Prywatna|500600700|doświadczenie|cvFacts/);
});

for (const facts of [[], ["user_research", "user_research"], ["unknown-private-value"]])
  test(`invalid approved facts never cross HTTP: ${JSON.stringify(facts)}`, async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateQuestions({
        revision,
        aspectIds: ["research"],
        answer: "Dowolny opis doświadczenia zawodowego.",
        cv: "",
        approvedAnswerFacts: facts as ProfessionalFact[],
      }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
