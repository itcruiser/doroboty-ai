import { describe, expect, it } from "vitest";
import { captureDeepeningRevision } from "@/features/deepening/schema";
import { initialState, transition } from "./model";
import {
  MAX_IMPORT_BYTES,
  enterDeepeningState,
  parseState,
  readState,
  saveState,
  serializeState,
  STORAGE_KEY,
} from "./storage";
function memory(raw: string | null = null) {
  const values = new Map(raw === null ? [] : [[STORAGE_KEY, raw]]);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("browser persistence and recovery", () => {
  it("round-trips a complete valid scenario", () => {
    const storage = memory();
    const s = initialState();
    saveState(storage, s);
    expect(readState(storage).state).toEqual(s);
    expect(parseState(serializeState(s))).toEqual(s);
  });
  it("rejects an enabled revision-zero import before candidate deepening entry", () => {
    const state = transition(initialState(), {
      type: "select_person",
      id: "employer-brightlabs",
    });
    const job = state.jobs[0];
    const configured = transition(state, {
      type: "configure_deepening",
      jobId: job.id,
      configuration: {
        enabled: true,
        revision: 0,
        aspects: [
          {
            id: "aspect-research",
            title: "Badania",
            explanation: "Opowiedz o swoim wkładzie.",
            excerpt: job.summary,
            author: "employer",
            order: 0,
          },
        ],
      },
    });
    const imported = parseState(serializeState(configured));
    expect(captureDeepeningRevision(imported.jobs[0]).aspectRevision).toBe(1);
    configured.jobs[0].deepening.revision = 0;
    expect(() => parseState(JSON.stringify(configured))).toThrow("Dotychczasowy stan");
  });
  it("migrates version-1 jobs and preserves applications and legacy draft metadata", () => {
    const legacy = JSON.parse(serializeState(initialState()));
    legacy.version = 1;
    for (const job of legacy.jobs) {
      delete job.revision;
      delete job.deepening;
    }
    legacy.drafts = [
      {
        candidateId: "candidate-anna",
        jobId: legacy.jobs[0].id,
        notes: "Original source",
        generated: "Unapproved proposal",
        answer: "Edited answer",
      },
    ];
    const migrated = parseState(JSON.stringify(legacy));
    expect(migrated.version).toBe(2);
    expect(migrated.jobs[0]).toMatchObject({
      revision: 1,
      deepening: { enabled: false, revision: 0, aspects: [] },
    });
    expect(migrated.applications).toEqual(legacy.applications);
    expect(migrated.applications[0].deepening).toBeUndefined();
    expect(migrated.drafts).toEqual(legacy.drafts);
    expect(parseState(serializeState(migrated))).toEqual(migrated);
  });
  it("protects incompatible/corrupt original saves", () => {
    for (const raw of ["{", JSON.stringify({ ...initialState(), version: 3 })]) {
      const storage = memory(raw);
      const loaded = readState(storage);
      expect(loaded.blocked).toBe(true);
      expect(loaded.original).toBe(raw);
      expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    }
  });
  it("does not fail startup when storage access is denied", () => {
    expect(readState(null).state.jobs.length).toBeGreaterThan(0);
    expect(
      readState({
        getItem() {
          throw new Error("Denied");
        },
        setItem() {},
      }).blocked,
    ).toBe(true);
  });
  it("reports quota/write failure without altering the original", () => {
    const old = "old";
    const storage = {
      getItem: () => old,
      setItem() {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => saveState(storage, initialState())).toThrow("Wyeksportuj");
    expect(storage.getItem()).toBe(old);
  });
  it("rejects invalid references and oversized files", () => {
    const s = initialState();
    s.saved = [{ candidateId: "missing", jobId: s.jobs[0].id }];
    expect(() => parseState(JSON.stringify(s))).toThrow("Dotychczasowy stan");
    expect(() => parseState(" ".repeat(MAX_IMPORT_BYTES + 1))).toThrow("za duży");
  });
  it("accepts legacy appearance preferences without changing scenario data", () => {
    const state = initialState();
    for (const theme of ["dark", "system", "light"]) {
      expect(parseState(JSON.stringify({ ...state, theme }))).toEqual(state);
    }
  });
});

function draftState() {
  const state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
  return transition(state, {
    type: "draft",
    jobId: state.jobs[0].id,
    notes: "Legacy source",
    generated: "Legacy proposal",
    answer: "Persisted answer",
  });
}
describe("durable entry into session-only deepening", () => {
  it("removes the saved draft before returning a state eligible for step two", () => {
    const state = draftState();
    const storage = memory(serializeState(state));
    const { state: next } = enterDeepeningState(storage, state, state.jobs[0].id);
    expect(next.drafts).toEqual([]);
    expect(readState(storage).state.drafts).toEqual([]);
    expect(readState(storage).state.applications).toEqual(state.applications);
  });
  it("blocks entry when deletion fails or original data is unreadable", () => {
    const state = draftState();
    const raw = serializeState(state);
    const storage = {
      getItem: () => raw,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    };
    expect(() => enterDeepeningState(storage, state, state.jobs[0].id)).toThrow("Wyeksportuj");
    expect(readState(storage).state.drafts[0].answer).toBe("Persisted answer");
    expect(state.drafts[0].answer).toBe("Persisted answer");
    const unreadable = memory("{");
    expect(() => enterDeepeningState(unreadable, state, state.jobs[0].id)).toThrow("ustawieniach");
    expect(unreadable.getItem(STORAGE_KEY)).toBe("{");
    expect(() => enterDeepeningState(memory(), state, state.jobs[0].id, { blocked: true })).toThrow(
      "nieczytelnego",
    );
    expect(() =>
      enterDeepeningState(null, state, state.jobs[0].id, { persistedDraft: true }),
    ).toThrow("szkicu");
  });
  it("allows memory-only drafts when no persisted draft can survive the session", () => {
    const state = draftState();
    expect(enterDeepeningState(null, state, state.jobs[0].id).state.drafts).toEqual([]);
    const noWriteStorage = {
      getItem: () => serializeState(initialState()),
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    };
    expect(enterDeepeningState(noWriteStorage, state, state.jobs[0].id).state.drafts).toEqual([]);
  });
});
