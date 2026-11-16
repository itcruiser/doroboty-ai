import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
        <h2 id="application-form-title" tabIndex={-1}>
          Pogłębienie Twojej aplikacji
        </h2>
        <p>
          Rozwiń swój wkład lub zaznacz, że nie chcesz odpowiadać. Pytania przygotowała AI na
          podstawie aspektów zatwierdzonych przez pracodawcę.
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
      {!pending && error && !session?.responses.length && (
        <Button type="button" variant="outline" onClick={() => deepening.regenerate(answer)}>
          Spróbuj ponownie
        </Button>
      )}
      {session?.responses.map((response, index) => {
        const aspect = session.revision.aspects.find((item) => item.id === response.aspectId)!;
        return (
          <section
            key={aspect.id}
            className="application-form-section deepening-question"
            aria-labelledby={`deepening-aspect-${index}`}
          >
            <p className="application-eyebrow">
              Aspekt {index + 1} z {session.revision.aspects.length}
            </p>
            <h3 id={`deepening-aspect-${index}`}>{aspect.title}</h3>
            <p className="application-help">{aspect.explanation}</p>
            <details className="deepening-excerpt">
              <summary>Fragment oferty</summary>
              <blockquote>{aspect.excerpt}</blockquote>
            </details>
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
            <label className="application-consent deepening-refusal">
              <Checkbox
                checked={response.refused}
                disabled={locked || pending}
                onCheckedChange={(refused) =>
                  deepening.decide(aspect.id, { refused, ...(refused ? { answer: "" } : {}) })
                }
              />
              <span>Nie chcę odpowiadać</span>
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={locked || pending || response.refused || !!response.answer.trim()}
              onClick={() => deepening.regenerate(answer, aspect.id)}
            >
              Wygeneruj inne pytanie
            </Button>
          </section>
        );
      })}
    </div>
  );
}
