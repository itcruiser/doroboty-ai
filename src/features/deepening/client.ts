import type { Job } from "../jobs/types";
import type { DeepeningRevision } from "./schema";
import { prepareProfessionalFacts } from "./privacy";
import {
  CLIENT_TIMEOUT_MS,
  MAX_REQUEST_BYTES,
  publicJobSchema,
  questionRequestSchema,
  readBoundedJson,
  validateQuestions,
  validateSuggestions,
} from "./protocol";

const unavailable =
  "Nie udało się wygenerować pogłębienia. Spróbuj ponownie lub wyślij bez pogłębienia.";
async function request(route: string, body: unknown, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, CLIENT_TIMEOUT_MS);
  try {
    const serialized = JSON.stringify(body);
    if (new TextEncoder().encode(serialized).byteLength > MAX_REQUEST_BYTES)
      throw new Error(unavailable);
    const response = await fetch(`/api/deepening/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
      signal: controller.signal,
      credentials: "omit",
      redirect: "error",
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.toLowerCase().includes("application/json")
    )
      throw new Error(unavailable);
    return await readBoundedJson(response);
  } catch {
    throw new Error(unavailable);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
export async function suggestAspects(
  job: Pick<Job, "title" | "summary" | "description">,
  signal?: AbortSignal,
): Promise<{ aspects: Array<{ title: string; explanation: string; excerpt: string }> }> {
  const approved = publicJobSchema.parse({
    title: job.title,
    summary: job.summary,
    description: job.description,
  });
  try {
    return validateSuggestions(await request("aspects", approved, signal), approved);
  } catch {
    throw new Error(unavailable);
  }
}
export async function generateQuestions(
  input: { revision: DeepeningRevision; answer: string; cv: string; aspectIds: string[] },
  signal?: AbortSignal,
): Promise<{ questions: Array<{ aspectId: string; question: string }> }> {
  const answerFacts = prepareProfessionalFacts(input.answer);
  if (!answerFacts.length)
    throw new Error(
      "Nie można bezpiecznie przygotować odpowiedzi do pogłębienia. Edytuj odpowiedź lub wyślij bez pogłębienia.",
    );
  const cvFacts = prepareProfessionalFacts(input.cv);
  const prepared = questionRequestSchema.parse({
    revision: input.revision,
    aspectIds: input.aspectIds,
    answerFacts,
    ...(cvFacts.length ? { cvFacts } : {}),
  });
  try {
    return validateQuestions(await request("questions", prepared, signal), prepared.aspectIds);
  } catch {
    throw new Error(unavailable);
  }
}
