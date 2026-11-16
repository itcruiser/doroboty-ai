import { z } from "zod";
import { aspectSchema, hasSupportingExcerpts, revisionSchema } from "./schema.ts";
import { professionalFacts } from "./privacy.ts";

export const MAX_REQUEST_BYTES = 100_000;
export const MAX_RESPONSE_BYTES = 64_000;
export const GENERATION_TIMEOUT_MS = 20_000;
export const CLIENT_TIMEOUT_MS = 25_000;
export const publicJobSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(12000),
    description: z.string().trim().min(1).max(12000),
  })
  .strict();
export const aspectSuggestionsSchema = z
  .object({
    aspects: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(120),
            explanation: z.string().trim().min(1).max(1000),
            excerpt: z
              .string()
              .min(1)
              .max(12000)
              .refine((value) => !!value.trim()),
          })
          .strict(),
      )
      .min(1)
      .max(3),
  })
  .strict();
const factSchema = z.enum(
  Object.keys(professionalFacts) as [
    keyof typeof professionalFacts,
    ...Array<keyof typeof professionalFacts>,
  ],
);
const factsSchema = z
  .array(factSchema)
  .min(1)
  .max(9)
  .refine((facts) => new Set(facts).size === facts.length);
const strictRevisionSchema = revisionSchema
  .safeExtend({ aspects: z.array(aspectSchema.strict()).min(1).max(3) })
  .strict()
  .refine((revision) => revisionSchema.safeParse(revision).success, {
    message: "Invalid approved aspect ordering or identifiers",
  });
export const questionRequestSchema = z
  .object({
    revision: strictRevisionSchema,
    aspectIds: z.array(z.string().min(1).max(100)).min(1).max(3),
    answerFacts: factsSchema,
    cvFacts: factsSchema.optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (
      new Set(input.aspectIds).size !== input.aspectIds.length ||
      input.aspectIds.some((id) => !input.revision.aspects.some((aspect) => aspect.id === id))
    )
      ctx.addIssue({
        code: "custom",
        path: ["aspectIds"],
        message: "Request only unique approved aspect IDs",
      });
  });
export type QuestionRequest = z.infer<typeof questionRequestSchema>;
export const questionsSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            aspectId: z.string().min(1).max(100),
            question: z.string().trim().min(1).max(2000),
          })
          .strict(),
      )
      .min(1)
      .max(3),
  })
  .strict();
export function validateSuggestions(value: unknown, job: z.infer<typeof publicJobSchema>) {
  const result = aspectSuggestionsSchema.parse(value);
  if (!hasSupportingExcerpts(job, result.aspects)) throw new Error("Invalid supporting excerpt");
  return result;
}
export function validateQuestions(value: unknown, aspectIds: string[]) {
  const result = questionsSchema.parse(value);
  const returned = result.questions.map((question) => question.aspectId);
  if (
    returned.length !== aspectIds.length ||
    new Set(returned).size !== returned.length ||
    returned.some((id) => !aspectIds.includes(id))
  )
    throw new Error("Invalid question identifiers");
  return {
    questions: aspectIds.map((id) =>
      result.questions.find((question) => question.aspectId === id)!,
    ),
  };
}

/** Bound responses before JSON parsing, including chunked bodies without Content-Length. */
export async function readBoundedJson(
  response: Response,
  limit = MAX_RESPONSE_BYTES,
): Promise<unknown> {
  if (!response.body) throw new Error("Missing response body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) throw new Error("Response too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(joined));
}
