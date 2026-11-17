import { useEffect, useRef, useState } from "react";
import { generateQuestions } from "./client";
import { captureDeepeningRevision, type DeepeningRevision, type DeepeningSnapshot } from "./schema";
import type { JobWithCompany } from "../jobs/types";

type Decision = { aspectId: string; question: string; answer: string; refused: boolean };
type Session = {
  revision: DeepeningRevision;
  identity: { name: string; cv: string };
  responses: Decision[];
};

function missingAspectIds(session: Session) {
  return session.revision.aspects
    .filter((aspect) => !session.responses.some((response) => response.aspectId === aspect.id))
    .map((aspect) => aspect.id);
}

/** Unfinished deepening belongs only to this mounted form, never browser storage. */
export function useCandidateDeepening() {
  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<Session | null>(null);
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<{ controller: AbortController; token: number } | null>(null);
  const sequence = useRef(0);
  useEffect(
    () => () => {
      sequence.current++;
      request.current?.controller.abort();
    },
    [],
  );
  function update(next: Session) {
    current.current = next;
    setSession(next);
  }
  async function generate(answer: string, aspectIds: string[]) {
    const captured = current.current;
    if (!captured || request.current || !aspectIds.length) return;
    const controller = new AbortController();
    const token = ++sequence.current;
    request.current = { controller, token };
    setPending(true);
    setError("");
    try {
      const result = await generateQuestions(
        {
          revision: captured.revision,
          cv: captured.identity.cv,
          answer,
          aspectIds,
          name: captured.identity.name,
        },
        controller.signal,
      );
      if (token !== sequence.current || controller.signal.aborted) return;
      // Validate all missing questions before merging them with preserved decisions.
      const previous = current.current!;
      const responses = previous.revision.aspects.map((aspect) => {
        const replacement = result.questions.find((question) => question.aspectId === aspect.id);
        const existing = previous.responses.find((response) => response.aspectId === aspect.id);
        return replacement ? { ...replacement, answer: "", refused: false } : existing!;
      });
      update({ ...previous, responses });
    } catch (cause) {
      if (token === sequence.current && !controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Nie udało się wygenerować pytań.");
      }
    } finally {
      if (token === sequence.current) {
        request.current = null;
        setPending(false);
      }
    }
  }
  function enter(
    job: JobWithCompany,
    identity: { name: string; cv: string },
    answer: string,
    removeDraft: () => boolean,
  ) {
    if (request.current) return;
    if (!current.current) {
      let revision: DeepeningRevision;
      try {
        revision = structuredClone(captureDeepeningRevision(job));
      } catch {
        setError(
          "Nie można przygotować pogłębienia tej oferty. Wróć do oferty i sprawdź jej konfigurację.",
        );
        return;
      }
      // Validate first; durable deletion must then succeed before entering or requesting.
      if (!removeDraft()) return;
      update({
        revision,
        identity: structuredClone(identity),
        responses: [],
      });
    }
    setActive(true);
    const captured = current.current!;
    const missing = missingAspectIds(captured);
    if (missing.length) void generate(answer, missing);
  }

  function decide(aspectId: string, change: Partial<Pick<Decision, "answer" | "refused">>) {
    if (!current.current || request.current) return;
    update({
      ...current.current,
      responses: current.current.responses.map((response) =>
        response.aspectId === aspectId ? { ...response, ...change } : response,
      ),
    });
  }
  function retryMissing(answer: string) {
    const captured = current.current;
    if (!captured || !error) return;
    const missing = missingAspectIds(captured);
    void generate(answer, missing);
  }
  const complete =
    !!session?.responses.length &&
    session.responses.length === session.revision.aspects.length &&
    session.responses.every((response) => response.refused || !!response.answer.trim());
  function snapshot(skip = false): DeepeningSnapshot | undefined {
    if (!current.current || request.current) return;
    const { revision, responses } = current.current;
    if (skip && !responses.length && error)
      return { status: "skipped", reason: "generation_failed", revision };
    if (!skip && complete)
      return {
        status: "completed",
        revision,
        responses: responses.map((response, order) => ({ ...response, order })),
      };
  }
  return {
    session,
    active,
    pending,
    error,
    complete,
    enter,
    decide,
    snapshot,
    back: () => {
      if (!request.current) {
        if (current.current)
          update({
            ...current.current,
            responses: current.current.responses.filter(
              (response) => response.refused || !!response.answer.trim(),
            ),
          });
        setActive(false);
        setError("");
      }
    },
    retryMissing,
  };
}
