import { z } from "zod";

const safeId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const publicText = z.string().trim().min(1).max(12000);
export const aspectSchema = z.object({
  id: safeId,
  title: z.string().trim().min(1).max(120),
  explanation: z.string().trim().min(1).max(1000),
  excerpt: z
    .string()
    .min(1)
    .max(12000)
    .refine((value) => value.trim().length > 0),
  author: z.enum(["ai", "employer"]),
  order: z.number().int().nonnegative(),
});
const aspectsSchema = z
  .array(aspectSchema)
  .max(3)
  .superRefine((aspects, ctx) => {
    if (new Set(aspects.map((aspect) => aspect.id)).size !== aspects.length)
      ctx.addIssue({ code: "custom", message: "Duplicate aspect identifiers" });
    if (aspects.some((aspect, index) => aspect.order !== index))
      ctx.addIssue({ code: "custom", message: "Aspects must have contiguous array order" });
  });
export const configurationSchema = z
  .object({
    enabled: z.boolean(),
    revision: z.number().int().nonnegative(),
    aspects: aspectsSchema,
  })
  .refine((configuration) => !configuration.enabled || configuration.aspects.length > 0, {
    path: ["aspects"],
    message: "Enabled deepening requires one to three aspects",
  })
  .refine((configuration) => !configuration.enabled || configuration.revision > 0, {
    path: ["revision"],
    message: "Enabled deepening requires a positive configuration revision",
  });
export const revisionSchema = z
  .object({
    jobId: safeId,
    jobRevision: z.number().int().positive(),
    aspectRevision: z.number().int().positive(),
    title: z.string().trim().min(1).max(200),
    summary: publicText,
    description: publicText,
    aspects: aspectsSchema.refine((aspects) => aspects.length > 0),
  })
  .superRefine((revision, ctx) => {
    const publicContent = [revision.title, revision.summary, revision.description].join("\n\n");
    if (revision.aspects.some((aspect) => !publicContent.includes(aspect.excerpt)))
      ctx.addIssue({
        code: "custom",
        path: ["aspects"],
        message: "Each aspect must cite saved public content",
      });
  });

export type ApprovedAspect = z.infer<typeof aspectSchema>;
export type DeepeningConfiguration = z.infer<typeof configurationSchema>;
export type DeepeningRevision = z.infer<typeof revisionSchema>;

export function captureDeepeningRevision(job: {
  id: string;
  revision?: number;
  title: string;
  summary: string;
  description: string;
  deepening?: DeepeningConfiguration;
}): DeepeningRevision {
  const configuration = configurationSchema.parse(job.deepening);
  if (!configuration.enabled) throw new Error("Tryb pogłębienia nie jest włączony.");
  return revisionSchema.parse({
    jobId: job.id,
    jobRevision: job.revision ?? 1,
    aspectRevision: configuration.revision,
    title: job.title,
    summary: job.summary,
    description: job.description,
    aspects: configuration.aspects,
  });
}

export const responseSchema = z
  .object({
    aspectId: safeId,
    question: z.string().trim().min(1).max(2000),
    answer: z.string().trim().max(12000),
    refused: z.boolean(),
    order: z.number().int().nonnegative(),
  })
  .refine(
    (response) => (response.refused ? response.answer.length === 0 : response.answer.length > 0),
    {
      path: ["answer"],
      message: "Answer the question or explicitly decline it",
    },
  );
export const snapshotSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("completed"),
      revision: revisionSchema,
      responses: z.array(responseSchema).min(1).max(3),
    })
    .superRefine((snapshot, ctx) => {
      if (
        snapshot.responses.length !== snapshot.revision.aspects.length ||
        snapshot.responses.some(
          (response, index) =>
            response.aspectId !== snapshot.revision.aspects[index]?.id || response.order !== index,
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["responses"],
          message: "Exactly one ordered response per approved aspect is required",
        });
    }),
  z.object({
    status: z.literal("skipped"),
    reason: z.literal("generation_failed"),
    revision: revisionSchema,
  }),
]);
export type DeepeningResponse = z.infer<typeof responseSchema>;
export type DeepeningSnapshot = z.infer<typeof snapshotSchema>;
