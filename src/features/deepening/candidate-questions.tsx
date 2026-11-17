import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { useCandidateDeepening } from "./use-candidate-deepening";

type Deepening = ReturnType<typeof useCandidateDeepening>;
export function CandidateQuestions({
  deepening,
  answer,
  locked = false,
}: {
  deepening: Deepening;
  answer: string;
  locked?: boolean;
}) {
  const { session, pending, error } = deepening;
  return (
    <div className="candidate-questions" aria-busy={pending}>
      <header className="application-form-intro">
        <h2 id="application-deepening-title" tabIndex={-1}>
          Pogłębienie Twojej aplikacji
        </h2>
        <p>
          {session?.responses.length
            ? "Rozwiń swój wkład lub zaznacz, że nie chcesz odpowiadać. Pytania przygotowała AI na podstawie aspektów zatwierdzonych przez pracodawcę."
            : "AI przygotuje pytania na podstawie aspektów zatwierdzonych przez pracodawcę. Możesz na nie odpowiedzieć lub zaznaczyć, że nie chcesz odpowiadać."}
        </p>
      </header>
      {pending && (
        <p role="status" className="application-generation-status">
          Przygotowujemy pytania…
        </p>
      )}
      {error && (
        <p role="alert" className="error-message application-generation-status">
          {error}
        </p>
      )}
      {!pending &&
        error &&
        session &&
        session.responses.length < session.revision.aspects.length && (
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            onClick={() => deepening.retryMissing(answer)}
          >
            Spróbuj ponownie
          </Button>
        )}
      {session?.responses.map((response) => {
        const aspect = session.revision.aspects.find((item) => item.id === response.aspectId)!;
        return (
          <section
            key={aspect.id}
            className="application-form-section deepening-question"
            aria-labelledby={`deepening-aspect-${aspect.order}`}
          >
            <p className="application-eyebrow">
              Aspekt {aspect.order + 1} z {session.revision.aspects.length}
            </p>
            <h3 id={`deepening-aspect-${aspect.order}`}>{aspect.title}</h3>
            <p className="application-help">{aspect.explanation}</p>
            <p className="deepening-question-copy">
              <span>Pytanie przygotowane przez AI</span>
              {response.question}
            </p>
            <label className="field">
              <span>Twoja odpowiedź</span>
              <Textarea
                aria-label="Twoja odpowiedź"
                value={response.answer}
                maxLength={12000}
                disabled={locked || pending || response.refused}
                onChange={(event) => deepening.decide(aspect.id, { answer: event.target.value })}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              className="deepening-refusal"
              aria-pressed={response.refused}
              disabled={locked || pending}
              onClick={() =>
                deepening.decide(aspect.id, {
                  refused: !response.refused,
                  ...(!response.refused ? { answer: "" } : {}),
                })
              }
            >
              {response.refused ? "Odpowiem na to pytanie" : "Nie chcę odpowiadać"}
            </Button>
          </section>
        );
      })}
    </div>
  );
}
