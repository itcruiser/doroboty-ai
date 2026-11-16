import { useEffect, useRef, useState } from "react";
import { generateQuestions } from "./client";
import { captureDeepeningRevision, type DeepeningRevision, type DeepeningSnapshot } from "./schema";
import type { JobWithCompany } from "../jobs/types";

type Decision = { aspectId: string; question: string; answer: string; refused: boolean };
type Session = {
  revision: DeepeningRevision;
  identity: { name: string; cv: string };
  responses: Decision[];
  generatedFrom: string;
};

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
        { revision: captured.revision, cv: captured.identity.cv, answer, aspectIds },
        controller.signal,
      );
      if (token !== sequence.current || controller.signal.aborted) return;
      // The client validates the complete replacement before any question changes.
      const previous = current.current!;
      const responses = previous.revision.aspects.map((aspect) => {
        const replacement = result.questions.find((question) => question.aspectId === aspect.id);
        const existing = previous.responses.find((response) => response.aspectId === aspect.id);
        return replacement ? { ...replacement, answer: "", refused: false } : existing!;
      });
      update({ ...previous, responses, generatedFrom: answer });
    } catch (cause) {
      if (token === sequence.current && !controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : "Nie udało się wygenerować pytań.");
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
      // Durable deletion must succeed before capturing the session or sending a request.
      if (!removeDraft()) return;
      update({
        revision: structuredClone(captureDeepeningRevision(job)),
        identity: structuredClone(identity),
        responses: [],
        generatedFrom: "",
      });
    }
    setActive(true);
    const captured = current.current!;
    if (!captured.responses.length || captured.generatedFrom !== answer) {
      const undecided = captured.revision.aspects
        .filter((aspect) => {
          const response = captured.responses.find((item) => item.aspectId === aspect.id);
          return !response || (!response.answer.trim() && !response.refused);
        })
        .map((aspect) => aspect.id);
      if (undecided.length) void generate(answer, undecided);
      else update({ ...captured, generatedFrom: answer });
    }
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
      if (!request.current) setActive(false);
    },
    regenerate: (answer: string, aspectId?: string) => {
      const captured = current.current;
      if (!captured) return;
      const ids = captured.revision.aspects
        .filter((aspect) => {
          const response = captured.responses.find((item) => item.aspectId === aspect.id);
          return (
            (!aspectId || aspect.id === aspectId) &&
            (!response || (!response.answer.trim() && !response.refused))
          );
        })
        .map((aspect) => aspect.id);
      void generate(answer, ids);
    },
  };
}
