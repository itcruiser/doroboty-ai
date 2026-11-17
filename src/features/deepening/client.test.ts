import { afterEach, expect, test, vi } from "vitest";
import { generateQuestions, suggestAspects } from "./client";
import {
  isPreparedProfessionalText,
  prepareCandidateContext,
  prepareProfessionalText,
} from "./privacy";
import type { DeepeningRevision } from "./schema";

const revision: DeepeningRevision = {
  jobId: "job-1",
  jobRevision: 1,
  aspectRevision: 1,
  title: "Product Manager",
  summary: "Badania z użytkownikami",
  description: "Badania z użytkownikami i automatyzacja.",
  aspects: [
    { id: "research", title: "Badania", explanation: "Opisz wkład", author: "employer", order: 0 },
  ],
};
const original =
  "Mam doświadczenie w badaniu potrzeb. Samodzielnie przeprowadziłam 12 rozmów i skróciłam czas obsługi o 30%.";
const generated = {
  questions: [{ aspectId: "research", question: "Jak wybrałaś uczestników tych 12 rozmów?" }],
};
afterEach(() => vi.unstubAllGlobals());

test("ordinary professional prose and CV context cross HTTP without identity or contact metadata", async () => {
  let body = "";
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    body = String(init.body);
    return Response.json(generated);
  });
  const answer = `${original}\nNazywam się Anna Prywatna, anna@example.test, +48 500 600 700.\nChoruję na cukrzycę.`;
  const cv =
    "Anna Prywatna — Product Manager\nTelefon: 500600700\nProwadziłam wdrożenie automatyzacji obsługi klientów.";
  await expect(
    generateQuestions({ revision, aspectIds: ["research"], answer, cv, name: "Anna Prywatna" }),
  ).resolves.toEqual(generated);
  const input = JSON.parse(body);
  expect(input.applicationText).toContain(original);
  expect(input.cvText).toContain("Product Manager");
  expect(input.cvText).toContain("Prowadziłam wdrożenie automatyzacji obsługi klientów.");
  expect(body).not.toMatch(/Anna|Prywatna|example.test|500|cukrzyc|answerFacts|cvFacts/);
  expect(answer).toContain("Anna Prywatna");
  expect(input.revision).toEqual(revision);
});

test("local preview uses exactly the same prepared context as generation", async () => {
  const input = { answer: original, cv: "Analizowałam dane o obsłudze.", name: "Anna Kowalska" };
  let sent: unknown;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    sent = JSON.parse(String(init.body));
    return Response.json(generated);
  });
  await generateQuestions({ ...input, revision, aspectIds: ["research"] });
  expect(sent).toEqual({ revision, aspectIds: ["research"], ...prepareCandidateContext(input) });
});

for (const privateText of [
  "Nazywam się Anna Kowalska. anna@example.test, telefon +48 123 456 789.",
  "anna@example.test",
  "+48 500 600 700",
  "500.600.700",
  "PESEL: 90010112345",
  "Adres: ul. Kwiatowa 12",
  "Data urodzenia: 1990-01-01",
  "Choruję na cukrzycę.",
  "Moje wyznanie to religia przykładowa.",
  "Anna Kowalska",
  "",
])
  test(`only private or empty material makes no model request: ${privateText}`, async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateQuestions({
        revision,
        aspectIds: ["research"],
        answer: privateText,
        cv: "",
        name: "Anna Kowalska",
      }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

for (const privateText of [
  "anna@example.test",
  "500600700",
  "Choruję na cukrzycę.",
  "Anna Kowalska",
]) {
  test(`HTTP prepared-text predicate rejects recognized private content: ${privateText}`, () => {
    expect(isPreparedProfessionalText(privateText)).toBe(false);
    expect(prepareProfessionalText(`${original}\n${privateText}`, "Anna Kowalska")).toContain(
      original,
    );
  });
}

test("unknown professional prose, negation and uncertainty remain faithful context, not positive fact IDs", () => {
  const text =
    "Nie prowadziłam badań samodzielnie. Być może warto opisać mój wkład w analizę danych.";
  expect(prepareProfessionalText(text)).toBe(text);
  expect(isPreparedProfessionalText(text)).toBe(true);
});

test("unusable CV is omitted and overlong application is blocked before HTTP", async () => {
  let sent: Record<string, unknown> = {};
  const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
    sent = JSON.parse(String(init.body));
    return Response.json(generated);
  });
  vi.stubGlobal("fetch", fetcher);
  await generateQuestions({
    revision,
    aspectIds: ["research"],
    answer: original,
    cv: "Anna Kowalska\nTelefon: 500600700",
    name: "Anna Kowalska",
  });
  expect(sent).not.toHaveProperty("cvText");
  await expect(
    generateQuestions({
      revision,
      aspectIds: ["research"],
      answer: "x".repeat(12001),
      cv: "",
      name: "",
    }),
  ).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test("malformed aspect ordering is blocked before HTTP", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    generateQuestions({
      revision: { ...revision, aspects: [{ ...revision.aspects[0], order: 2 }] },
      aspectIds: ["research"],
      answer: original,
      cv: "",
      name: "",
    }),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

for (const result of [
  { questions: [{ aspectId: "other", question: "Pytanie" }] },
  {
    questions: [
      { aspectId: "research", question: "A" },
      { aspectId: "research", question: "B" },
    ],
  },
])
  test("invalid question identifiers preserve the unavailable boundary", async () => {
    vi.stubGlobal("fetch", async () => Response.json(result));
    await expect(
      generateQuestions({ revision, aspectIds: ["research"], answer: original, cv: "", name: "" }),
    ).rejects.toThrow(/Nie udało/);
  });

test("client rejects an oversized model response", async () => {
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response("x".repeat(70000), { headers: { "Content-Type": "application/json" } }),
  );
  await expect(
    generateQuestions({ revision, aspectIds: ["research"], answer: original, cv: "", name: "" }),
  ).rejects.toThrow(/Nie udało/);
});

test("aspect suggestions still omit private employer metadata and reject retired fields", async () => {
  let body: unknown;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return Response.json({
      aspects: [{ title: "Badania", explanation: "Wkład", excerpt: "retired" }],
    });
  });
  await expect(
    suggestAspects({ ...revision, sourceBrief: "private" } as typeof revision),
  ).rejects.toThrow();
  expect(body).toEqual({
    title: revision.title,
    summary: revision.summary,
    description: revision.description,
  });
});

test("client accepts title/explanation-only aspect suggestions", async () => {
  const suggestion = { aspects: [{ title: "Badania", explanation: "Opisz własny wkład." }] };
  vi.stubGlobal("fetch", async () => Response.json(suggestion));
  await expect(suggestAspects(revision)).resolves.toEqual(suggestion);
});
