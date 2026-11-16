import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { useCandidateDeepening } from "./use-candidate-deepening";
import type { ProfessionalFact } from "./privacy";

type Deepening = ReturnType<typeof useCandidateDeepening>;
const factLabels: Record<ProfessionalFact, string> = {
  user_research: "Badania z użytkownikami",
  automation_delivery: "Wdrażanie automatyzacji",
  service_time_reduction: "Skracanie czasu obsługi",
  prototype_testing: "Testowanie prototypów",
  engineering_collaboration: "Współpraca z inżynierami",
  product_management: "Zarządzanie produktem",
  data_analysis: "Analiza danych",
  project_delivery: "Prowadzenie projektów",
  frontend_development: "Tworzenie interfejsów w React",
};
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
      {error && (!deepening.requiresPreparation || !deepening.complete) && (
        <p
          role={deepening.requiresPreparation ? "status" : "alert"}
          className={
            deepening.requiresPreparation
              ? "sr-only"
              : "error-message application-generation-status"
          }
        >
          {error}
        </p>
      )}
      {deepening.requiresPreparation && !deepening.complete && (
        <section
          className="application-form-section application-fact-preparation"
          aria-labelledby="fact-preparation-title"
        >
          <h3 id="fact-preparation-title">Przygotuj pytania do swojej aplikacji</h3>
          <p className="application-help" id="fact-preparation-help">
            Nie udało się automatycznie wybrać informacji z Twojego opisu. Zaznacz tylko te, które
            są zgodne z Twoją odpowiedzią i doświadczeniem. Do AI przekażemy wybrane informacje, a
            pełny tekst odpowiedzi pozostanie w tej przeglądarce.
          </p>
          <fieldset disabled={locked || pending} aria-describedby="fact-preparation-help">
            <legend>Informacje do pytań</legend>
            <div className="application-fact-options">
              {(Object.entries(factLabels) as [ProfessionalFact, string][]).map(([fact, label]) => (
                <label className="application-consent" key={fact}>
                  <Checkbox
                    checked={deepening.selectedFacts.includes(fact)}
                    disabled={locked || pending}
                    onCheckedChange={(selected) => deepening.selectFact(answer, fact, selected)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button
            type="button"
            disabled={locked || pending || !deepening.selectedFacts.length}
            onClick={() => {
              document.getElementById("application-form-title")?.focus();
              deepening.confirmFacts(answer);
            }}
          >
            Potwierdź i przygotuj pytania
          </Button>
          <p className="application-help">
            {session?.responses.length
              ? "Możesz też odpowiedzieć na wcześniejsze pytania lub wrócić do zgłoszenia."
              : "Jeśli żadna informacja nie pasuje, możesz wrócić do zgłoszenia lub wysłać aplikację bez pogłębienia."}
          </p>
        </section>
      )}
      {!pending && error && !deepening.requiresPreparation && !session?.responses.length && (
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
