import { captureDeepeningRevision } from "@/features/deepening/schema";
import { describe, expect, it } from "vitest";
import { initialState, transition, stateSchema, type State } from "./model";
const time = "2026-11-03T10:00:00.000Z";
function as(state: State, id: string) {
  return transition(state, { type: "select_person", id });
}
function submitted() {
  const s = as(initialState(), "candidate-anna");
  return transition(
    s,
    {
      type: "submit",
      jobId: s.jobs[0].id,
      notes: "Original notes",
      generated: "Generated copy",
      answer: "Approved application with sufficient context.",
      consent: true,
    },
    time,
    "application-anna",
  );
}
describe("coherent browser scenario", () => {
  it("requires approval and prevents duplicate applications", () => {
    const s = as(initialState(), "candidate-anna");
    const input = {
      type: "submit" as const,
      jobId: s.jobs[0].id,
      notes: "",
      generated: "",
      answer: "Approved application with sufficient context.",
      consent: false,
    };
    expect(() => transition(s, input, time)).toThrow("Zatwierdź");
    expect(() => transition(submitted(), { ...input, consent: true }, time)).toThrow("już wysłana");
    expect(s.applications).toHaveLength(1);
  });
  it("preserves approved sources while profile and notes evolve", () => {
    const s = submitted();
    const app = s.applications.at(-1)!;
    const changed = transition(s, {
      type: "profile",
      value: {
        name: "Updated Name",
        headline: "Updated Headline",
        bio: "Changed",
        location: "Wrocław",
      },
    });
    expect(changed.applications.at(-1)).toEqual(app);
    expect(app.candidateName).toBe("Anna Kowalska");
    expect(app.sourceNotes).toBe("Original notes");
    expect(app.generatedAnswer).toBe("Generated copy");
  });
  it("supports employer review through conversation and continuation without skipping stages", () => {
    let s = as(submitted(), "employer-brightlabs");
    expect(() =>
      transition(
        s,
        { type: "stage", applicationId: "application-anna", stage: "continued", note: "" },
        time,
      ),
    ).toThrow();
    for (const stage of [
      "reviewed",
      "interview_invited",
      "first_conversation_held",
      "continued",
      "hired",
    ] as const)
      s = transition(
        s,
        { type: "stage", applicationId: "application-anna", stage, note: "Employer note" },
        time,
      );
    expect(s.applications.at(-1)?.stage).toBe("hired");
    expect(s.applications.at(-1)?.events).toHaveLength(6);
  });
  it("rejects another employer’s stage writes and another candidate’s withdrawal", () => {
    expect(() =>
      transition(
        as(submitted(), "employer-northstar"),
        { type: "stage", applicationId: "application-anna", stage: "reviewed", note: "" },
        time,
      ),
    ).toThrow();
    expect(() =>
      transition(
        as(submitted(), "candidate-marek"),
        { type: "withdraw", applicationId: "application-anna" },
        time,
      ),
    ).toThrow();
  });
  it("makes withdrawal terminal and keeps drafts and saved jobs person-specific", () => {
    let s = submitted();
    s = transition(s, { type: "withdraw", applicationId: "application-anna" }, time);
    expect(() =>
      transition(
        as(s, "employer-brightlabs"),
        { type: "stage", applicationId: "application-anna", stage: "reviewed", note: "" },
        time,
      ),
    ).toThrow();
    s = transition(s, {
      type: "draft",
      jobId: s.jobs[1].id,
      notes: "Notes",
      generated: "Output",
      answer: "Edited",
    });
    s = transition(s, { type: "toggle_saved", jobId: s.jobs[1].id });
    expect(s.drafts[0].candidateId).toBe("candidate-anna");
    expect(s.saved[0].candidateId).toBe("candidate-anna");
  });
  it("validates broken references, duplicate submissions and invalid histories on import", () => {
    const s = submitted();
    s.applications.push({ ...s.applications.at(-1)!, id: "another-id" });
    expect(stateSchema.safeParse(s).success).toBe(false);
    const broken = submitted();
    broken.applications.at(-1)!.events.push({ stage: "hired", at: time, note: "" });
    broken.applications.at(-1)!.stage = "hired";
    expect(stateSchema.safeParse(broken).success).toBe(false);
    const unknown = initialState();
    unknown.jobs[0].companyId = "missing";
    expect(stateSchema.safeParse(unknown).success).toBe(false);
  });
  it("only publishes own-company jobs and keeps submitted job snapshots unchanged", () => {
    const state = as(submitted(), "employer-brightlabs");
    const updated = { ...state.jobs[0], title: "Updated public role" };
    const result = transition(state, { type: "publish", job: updated });
    expect(result.jobs[0].title).toBe("Updated public role");
    expect(result.applications.at(-1)?.jobTitle).toBe("AI Product Manager");
    expect(() =>
      transition(as(state, "employer-northstar"), { type: "publish", job: updated }),
    ).toThrow();
    expect(() =>
      transition(state, { type: "publish", job: { ...updated, salaryMin: 500, salaryMax: 1 } }),
    ).toThrow();
  });
});

describe("approved deepening configuration", () => {
  it("requires own-company approval, versions configuration and preserves it on publication", () => {
    const state = as(initialState(), "employer-brightlabs");
    const job = state.jobs[0];
    const configuration = {
      enabled: true,
      revision: 0,
      aspects: [
        {
          id: "aspect-one",
          title: "Ownership",
          explanation: "Describe your contribution",
          excerpt: job.summary,
          author: "employer" as const,
          order: 0,
        },
      ],
    };
    const configured = transition(state, {
      type: "configure_deepening",
      jobId: job.id,
      configuration,
    });
    expect(configured.jobs[0].deepening).toEqual({ ...configuration, revision: 1 });
    expect(configured.jobs[0].revision).toBe(1);
    expect(() =>
      transition(as(state, "employer-northstar"), {
        type: "configure_deepening",
        jobId: job.id,
        configuration,
      }),
    ).toThrow();
    expect(() =>
      transition(state, {
        type: "configure_deepening",
        jobId: job.id,
        configuration: {
          ...configuration,
          aspects: [{ ...configuration.aspects[0], excerpt: "Not in the job" }],
        },
      }),
    ).toThrow();
    const republished = transition(configured, {
      type: "publish",
      job: { ...job, title: "Updated role" },
    });
    expect(republished.jobs[0].revision).toBe(2);
    expect(republished.jobs[0].deepening).toEqual(configured.jobs[0].deepening);
    expect(() =>
      transition(configured, {
        type: "publish",
        job: { ...job, summary: "Removed all cited context" },
      }),
    ).toThrow("pogłębienia");
    const disabled = transition(configured, {
      type: "configure_deepening",
      jobId: job.id,
      configuration: { ...configuration, enabled: false },
    });
    expect(disabled.jobs[0].deepening.revision).toBe(2);
    expect(
      transition(disabled, {
        type: "publish",
        job: { ...job, summary: "Removed all cited context" },
      }).jobs[0].deepening.enabled,
    ).toBe(false);
  });
});

function enabledState() {
  const state = as(initialState(), "employer-brightlabs");
  const job = state.jobs[0];
  return transition(state, {
    type: "configure_deepening",
    jobId: job.id,
    configuration: {
      enabled: true,
      revision: 0,
      aspects: [
        {
          id: "aspect-one",
          title: "Ownership",
          explanation: "Describe your contribution",
          excerpt: job.summary,
          author: "employer",
          order: 0,
        },
      ],
    },
  });
}
const submission = {
  type: "submit" as const,
  notes: "Legacy notes",
  generated: "Legacy output",
  answer: "I owned delivery and reduced response time by 25%.",
  consent: true,
};
describe("final deepening submission", () => {
  it("prevents bypassing enabled deepening before a final decision or explicit failure skip", () => {
    const state = as(enabledState(), "candidate-anna");
    expect(() => transition(state, { ...submission, jobId: state.jobs[0].id })).toThrow(
      "pogłębienia",
    );
    expect(state.applications).toHaveLength(1);
  });
  it("submits a captured older revision and identity once after configuration and profile changes", () => {
    let state = enabledState();
    const revision = captureDeepeningRevision(state.jobs[0]);
    const jobId = state.jobs[0].id;
    const identity = state.people.find((person) => person.id === "candidate-anna")!;
    state = transition(state, {
      type: "configure_deepening",
      jobId,
      configuration: { enabled: false, revision: 1, aspects: [] },
    });
    state = transition(state, { type: "publish", job: { ...state.jobs[0], title: "Later title" } });
    state = as(state, "candidate-anna");
    state = transition(state, {
      type: "profile",
      value: {
        name: "Changed name",
        headline: "Updated headline",
        bio: "Updated",
        location: "Kraków",
      },
    });
    state = transition(state, {
      type: "draft",
      jobId,
      notes: "Legacy notes",
      generated: "Legacy output",
      answer: "Original draft",
    });
    const deepening = {
      status: "completed" as const,
      revision,
      responses: [
        {
          aspectId: "aspect-one",
          question: "What did you contribute?",
          answer: "",
          refused: true,
          order: 0,
        },
      ],
    };
    const result = transition(
      state,
      {
        ...submission,
        jobId,
        deepening,
        submissionIdentity: { name: identity.name, cv: identity.cv },
      },
      time,
      "deepened-application",
    );
    const application = result.applications.at(-1)!;
    expect(application).toMatchObject({
      jobTitle: "AI Product Manager",
      candidateName: "Anna Kowalska",
      cv: identity.cv,
      deepening,
      sourceNotes: "Legacy notes",
      generatedAnswer: "Legacy output",
      score: 84,
      stage: "submitted",
    });
    expect(result.drafts).toHaveLength(0);
    expect(result.applications).toHaveLength(2);
    expect(() => transition(result, { ...submission, jobId, deepening })).toThrow("już wysłana");
    revision.title = "Mutated caller";
    expect(application.deepening?.revision.title).toBe("AI Product Manager");
  });

  it("rejects cross-job, future and undecided snapshots through submit and state import", () => {
    const state = as(enabledState(), "candidate-anna");
    const revision = captureDeepeningRevision(state.jobs[0]);
    const deepening = {
      status: "completed" as const,
      revision,
      responses: [
        {
          aspectId: "aspect-one",
          question: "What did you contribute?",
          answer: "Delivery",
          refused: false,
          order: 0,
        },
      ],
    };
    for (const invalid of [
      { ...deepening, revision: { ...revision, jobId: state.jobs[1].id } },
      { ...deepening, revision: { ...revision, jobRevision: 2 } },
      { ...deepening, revision: { ...revision, aspectRevision: 2 } },
      { ...deepening, responses: [{ ...deepening.responses[0], answer: "" }] },
      { ...deepening, responses: [{ ...deepening.responses[0], aspectId: "unknown" }] },
    ]) {
      expect(() =>
        transition(state, { ...submission, jobId: state.jobs[0].id, deepening: invalid }),
      ).toThrow();
      const valid = transition(state, { ...submission, jobId: state.jobs[0].id, deepening });
      valid.applications.at(-1)!.deepening = invalid;
      expect(stateSchema.safeParse(valid).success).toBe(false);
    }
    const skipped = transition(state, {
      ...submission,
      jobId: state.jobs[0].id,
      deepening: { status: "skipped", reason: "generation_failed", revision },
    });
    expect(skipped.applications.at(-1)?.deepening).toEqual({
      status: "skipped",
      reason: "generation_failed",
      revision,
    });
    expect(skipped.applications.at(-1)?.score).toBe(84);
  });
});

describe("session-only deepening entry", () => {
  it("drops only the selected candidate/job draft without creating an application", () => {
    let state = as(initialState(), "candidate-marek");
    const jobId = state.jobs[1].id;
    state = transition(state, {
      type: "draft",
      jobId,
      notes: "Marek notes",
      generated: "",
      answer: "Marek draft",
    });
    state = as(state, "candidate-anna");
    state = transition(state, {
      type: "draft",
      jobId,
      notes: "Anna notes",
      generated: "",
      answer: "Anna draft",
    });
    state = transition(state, {
      type: "draft",
      jobId: state.jobs[2].id,
      notes: "Other job",
      generated: "",
      answer: "Other draft",
    });
    const result = transition(state, { type: "drop_draft", jobId });
    expect(result.drafts.map((draft) => draft.answer)).toEqual(["Marek draft", "Other draft"]);
    expect(result.applications).toEqual(state.applications);
    expect(() =>
      transition(as(state, "employer-brightlabs"), { type: "drop_draft", jobId }),
    ).toThrow("kandydata");
  });
});
