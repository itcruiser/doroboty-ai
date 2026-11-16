import { afterEach, expect, test, vi } from "vitest";
import { generateQuestions } from "./client";
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
      excerpt: "Badania z użytkownikami",
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
      "Anna Prywatna, anna@example.test. Prowadziłam badania z użytkownikami i wdrożyłam automatyzację. Czas obsługi skrócił się o 30%.",
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
