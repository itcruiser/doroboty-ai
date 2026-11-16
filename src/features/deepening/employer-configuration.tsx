import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/prototype/workspace";
import { suggestAspects } from "./client";
import type { ApprovedAspect } from "./schema";

type Suggestion = { title: string; explanation: string; excerpt: string };
export function EmployerDeepeningConfiguration({
  job,
  enabled,
  aspects,
  onEnabledChange,
  onAspectsChange: setAspects,
}: {
  job: { title: string; summary: string; description: string };
  enabled: boolean;
  aspects: ApprovedAspect[];
  onEnabledChange: (enabled: boolean) => void;
  onAspectsChange: (aspects: ApprovedAspect[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function generate() {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setGenerationError("");
    try {
      // Construct the public projection here; the private brief never crosses this boundary.
      const response = await suggestAspects(
        { title: job.title, summary: job.summary, description: job.description },
        request.signal,
      );
      if (!request.signal.aborted) setSuggestions(response.aspects);
    } catch {
      if (!request.signal.aborted)
        setGenerationError(
          "Nie udało się przygotować propozycji. Spróbuj ponownie, dodaj aspekt ręcznie lub wyłącz pogłębienie i przejdź dalej.",
        );
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }
  function report(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  function add(suggestion?: Suggestion) {
    if (aspects.length >= 3) {
      report("Możesz zatwierdzić maksymalnie 3 aspekty. Usuń jeden, aby dodać kolejny.");
      return;
    }
    setError("");
    setAspects([
      ...aspects,
      {
        id: crypto.randomUUID(),
        title: suggestion?.title ?? "",
        explanation: suggestion?.explanation ?? "",
        excerpt: suggestion?.excerpt ?? "",
        author: suggestion ? "ai" : "employer",
        order: aspects.length,
      },
    ]);
    if (suggestion) setSuggestions(suggestions.filter((item) => item !== suggestion));
  }
  function edit(id: string, field: "title" | "explanation" | "excerpt", value: string) {
    setAspects(
      aspects.map((item) =>
        item.id === id ? { ...item, [field]: value, author: "employer" } : item,
      ),
    );
  }
  function move(index: number, offset: number) {
    const next = [...aspects];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setAspects(next.map((item, order) => ({ ...item, order })));
  }
  return (
    <section className="employer-deepening-body" aria-label="Konfiguracja pogłębienia">
      <p>
        Opcjonalny krok: wybierz, o co dopytamy kandydatów podczas aplikowania. Konfigurację
        zapiszemy razem z ofertą po Twoim końcowym zatwierdzeniu. Wysłane aplikacje zachowają
        wcześniejsze dane.
      </p>
      <label className="employer-deepening-toggle">
        <Checkbox checked={enabled} onCheckedChange={onEnabledChange} />
        <span>Włącz pogłębienie</span>
      </label>
      {!enabled && <p>Pogłębienie jest wyłączone. Możesz przejść do zatwierdzenia oferty.</p>}
      {enabled && (
        <>
          <p>
            Wybierz od 1 do 3 aspektów, o które zapytamy kandydatów. Propozycje AI wymagają Twojej
            akceptacji. Każdy aspekt musi mieć oparcie w publicznej treści oferty.
          </p>
          <div className="employer-inline-actions">
            <Button type="button" variant="outline" disabled={loading} onClick={generate}>
              {loading
                ? "Przygotowujemy propozycje…"
                : generationError
                  ? "Spróbuj ponownie"
                  : "Zaproponuj aspekty z AI"}
            </Button>
            <Button type="button" variant="outline" onClick={() => add()}>
              Dodaj aspekt ręcznie
            </Button>
          </div>
          {loading && (
            <p role="status">Pobieramy propozycje na podstawie bieżącej treści oferty.</p>
          )}
          {generationError && (
            <p role="alert" className="error-message">
              {generationError}
            </p>
          )}
          {suggestions.length > 0 && (
            <section aria-label="Propozycje AI" className="employer-proposals">
              <h3>Propozycje AI — jeszcze niezatwierdzone</h3>
              {suggestions.map((suggestion, index) => (
                <article key={index}>
                  <h4>{suggestion.title}</h4>
                  <p>{suggestion.explanation}</p>
                  <blockquote>{suggestion.excerpt}</blockquote>
                  <div className="employer-inline-actions">
                    <Button type="button" variant="outline" onClick={() => add(suggestion)}>
                      Akceptuj propozycję {index + 1}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setSuggestions(suggestions.filter((item) => item !== suggestion))
                      }
                    >
                      Odrzuć propozycję {index + 1}
                    </Button>
                  </div>
                </article>
              ))}
            </section>
          )}
          <section aria-label="Zatwierdzone aspekty" className="employer-approved">
            <h3>Aspekty do zapisania ({aspects.length}/3)</h3>
            {aspects.length === 0 && (
              <p>Nie wybrano aspektów. Możesz dodać własny lub zaakceptować propozycję.</p>
            )}
            {aspects.map((aspect, index) => (
              <fieldset key={aspect.id} className="employer-aspect">
                <legend>Aspekt {index + 1}</legend>
                <p className="employer-hint">
                  Autor końcowej treści:{" "}
                  {aspect.author === "ai" ? "AI · zaakceptowana propozycja" : "pracodawca"}
                </p>
                <Field label={`Nazwa aspektu ${index + 1}`}>
                  <Input
                    maxLength={120}
                    value={aspect.title}
                    onChange={(e) => edit(aspect.id, "title", e.target.value)}
                  />
                </Field>
                <Field label={`Wyjaśnienie aspektu ${index + 1}`}>
                  <Textarea
                    aria-label={`Wyjaśnienie aspektu ${index + 1}`}
                    maxLength={1000}
                    value={aspect.explanation}
                    onChange={(e) => edit(aspect.id, "explanation", e.target.value)}
                  />
                </Field>
                <Field label={`Fragment oferty dla aspektu ${index + 1}`}>
                  <Textarea
                    aria-label={`Fragment oferty dla aspektu ${index + 1}`}
                    maxLength={12000}
                    value={aspect.excerpt}
                    onChange={(e) => edit(aspect.id, "excerpt", e.target.value)}
                  />
                </Field>
                <div className="employer-inline-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Przesuń aspekt {index + 1} w górę
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === aspects.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Przesuń aspekt {index + 1} w dół
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAspects(aspects.filter((item) => item.id !== aspect.id))}
                  >
                    Usuń aspekt {index + 1}
                  </Button>
                </div>
              </fieldset>
            ))}
          </section>
          <details className="employer-public-source">
            <summary>Publiczna treść oferty — skopiuj fragment</summary>
            <h3>{job.title}</h3>
            <p>{job.summary}</p>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </details>
          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className="error-message">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
