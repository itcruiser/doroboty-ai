import { describe, expect, it } from "vitest";
import { captureDeepeningRevision, configurationSchema, snapshotSchema } from "./schema";

const aspect = {
  id: "aspect-research",
  title: "Badania",
  explanation: "Opowiedz o badaniach.",
  excerpt: "Prowadzenie badań",
  author: "employer" as const,
  order: 0,
};
const job = {
  id: "job-example",
  title: "Projektant",
  summary: "Prowadzenie badań",
  description: "Samodzielna praca przy produkcie.",
  revision: 2,
  sourceBrief: "Private brief",
  generatedDescription: "Unapproved copy",
  deepening: { enabled: true, revision: 1, aspects: [aspect] },
};

describe("approved application deepening", () => {
  it("captures only approved public content and rejects invalid aspect configurations", () => {
    expect(captureDeepeningRevision(job)).toEqual({
      jobId: "job-example",
      jobRevision: 2,
      aspectRevision: 1,
      title: "Projektant",
      summary: "Prowadzenie badań",
      description: "Samodzielna praca przy produkcie.",
      aspects: [aspect],
    });
    for (const aspects of [
      [],
      [aspect, aspect],
      [{ ...aspect, order: 1 }],
      [{ ...aspect, id: "../bad" }],
    ]) {
      expect(configurationSchema.safeParse({ enabled: true, revision: 1, aspects }).success).toBe(
        false,
      );
    }
    expect(() =>
      captureDeepeningRevision({ ...job, summary: "Different public summary" }),
    ).toThrow();
  });
});

describe("completed deepening snapshots", () => {
  it("requires one ordered answer or explicit refusal for every approved aspect", () => {
    const revision = captureDeepeningRevision(job);
    const response = {
      aspectId: aspect.id,
      question: "Co zrobiłeś osobiście?",
      answer: "Zaprojektowałem badanie.",
      refused: false,
      order: 0,
    };
    expect(snapshotSchema.parse({ status: "completed", revision, responses: [response] })).toEqual({
      status: "completed",
      revision,
      responses: [response],
    });
    const declined = { ...response, answer: "", refused: true };
    expect(
      snapshotSchema.safeParse({ status: "completed", revision, responses: [declined] }).success,
    ).toBe(true);
    for (const responses of [
      [],
      [response, response],
      [{ ...response, aspectId: "unknown" }],
      [{ ...response, refused: true }],
      [{ ...response, answer: " " }],
      [{ ...response, order: 1 }],
    ]) {
      expect(snapshotSchema.safeParse({ status: "completed", revision, responses }).success).toBe(
        false,
      );
    }
    expect(
      snapshotSchema.parse({ status: "skipped", reason: "generation_failed", revision }),
    ).toEqual({ status: "skipped", reason: "generation_failed", revision });
  });
});
