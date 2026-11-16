import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/features/prototype/workspace";
import { usePrototype } from "@/features/prototype/store";
import type { State } from "@/features/prototype/model";
import { suggestAspects } from "./client";
import { configurationSchema, hasSupportingExcerpts, type ApprovedAspect } from "./schema";

type Suggestion = { title: string; explanation: string; excerpt: string };
export function EmployerDeepeningConfiguration({
  job,
  newPublication = false,
  onClose,
}: {
  job: State["jobs"][number];
  newPublication?: boolean;
  onClose: () => void;
}) {
  const { run } = usePrototype();
  const [aspects, setAspects] = useState<ApprovedAspect[]>(job.deepening?.aspects ?? []);
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
          "Nie udało się przygotować propozycji. Spróbuj ponownie lub dodaj aspekt ręcznie. Oferta pozostaje opublikowana.",
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
  function save(enabled: boolean) {
    const configuration = {
      enabled,
      revision: (job.deepening?.revision ?? 0) + 1,
      aspects: enabled
        ? aspects.map((item, order) => ({ ...item, order }))
        : (job.deepening?.aspects ?? []),
    };
    const parsed = configurationSchema.safeParse(configuration);
    if (!parsed.success) {
      report(
        "Włączając pogłębienie, zatwierdź od 1 do 3 aspektów. Uzupełnij nazwę, wyjaśnienie i fragment oferty w każdym aspekcie.",
      );
      return;
    }
    if (enabled && !hasSupportingExcerpts(job, parsed.data.aspects)) {
      report(
        "Każdy aspekt musi zawierać dokładny, niezmieniony fragment zapisanej oferty. Skopiuj go z treści poniżej.",
      );
      return;
    }
    if (run({ type: "configure_deepening", jobId: job.id, configuration: parsed.data })) onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="employer-deepening-dialog">
        <header>
          <p className="employer-eyebrow">Dodatkowe pytania w aplikacji</p>
          <DialogTitle>Tryb pogłębienia</DialogTitle>
          <DialogDescription>
            {newPublication
              ? "Oferta jest już opublikowana."
              : "Konfiguracja dotyczy przyszłych formularzy. Wysłane aplikacje zachowują wcześniejsze dane."}
          </DialogDescription>
        </header>
        <div className="employer-deepening-body">
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
          {loading && <p role="status">Pobieramy propozycje na podstawie opublikowanej oferty.</p>}
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
        </div>
        <footer className="employer-deepening-footer">
          <Button type="button" variant="outline" onClick={onClose}>
            {newPublication ? "Pomiń" : "Anuluj"}
          </Button>
          {!newPublication && job.deepening?.enabled && (
            <Button type="button" variant="outline" onClick={() => save(false)}>
              Wyłącz pogłębienie
            </Button>
          )}
          <Button type="button" onClick={() => save(true)}>
            {job.deepening?.enabled ? "Zapisz pogłębienie" : "Włącz pogłębienie"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
