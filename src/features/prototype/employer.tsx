import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/form-select";
import {
  categoryLabels,
  functionLabels,
  remoteLabels,
  seniorityLabels,
  contractLabels,
} from "@/features/jobs/presentation";
import { currentPerson, jobSchema } from "./model";
import { usePrototype } from "./store";
import { Field } from "./workspace";
import {
  configurationSchema,
  hasSupportingExcerpts,
  type DeepeningConfiguration,
} from "@/features/deepening/schema";
import { EmployerDeepeningConfiguration } from "@/features/deepening/employer-configuration";
import { Empty, NotFound, PageTitle } from "./shell";

export function EmployerJobs() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const jobs = state.jobs.filter((x) => x.companyId === person.companyId);
  return (
    <>
      <PageTitle
        action={
          <Link to="/app/oferty/nowa" className={buttonVariants()}>
            Dodaj ofertę
          </Link>
        }
      >
        Moje oferty
      </PageTitle>
      <div className="space-y-4">
        {jobs.length ? (
          jobs.map((job) => (
            <article key={job.id} className="prototype-panel">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <Link
                    className="text-xl font-semibold text-[var(--gui-link)]"
                    to={`/app/oferty/${job.id}`}
                  >
                    {job.title}
                  </Link>
                  <p className="mt-3 text-muted-foreground">
                    {state.applications.filter((x) => x.jobId === job.id).length} aplikacji ·{" "}
                    {job.publicationStatus === "published" ? "Opublikowana" : "Szkic"}
                  </p>
                </div>
                <Link
                  to={`/oferty/${job.slug}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Zobacz ofertę
                </Link>
              </div>
            </article>
          ))
        ) : (
          <Empty>Nie masz jeszcze ofert. Dodaj pierwszą ofertę.</Empty>
        )}
      </div>
    </>
  );
}
export function EmployerJobEditor() {
  const { id } = useParams();
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const existing = state.jobs.find((x) => x.id === id && x.companyId === person.companyId);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [source, setSource] = useState(existing?.sourceBrief ?? "");
  const [generated, setGenerated] = useState(existing?.generatedDescription ?? "");
  const [terms, setTerms] = useState({
    category: existing?.category ?? "build",
    function: existing?.function ?? "engineering",
    remoteStatus: existing?.remoteStatus ?? "hybrid",
    seniority: existing?.seniority ?? "mid",
    contract: existing?.contract ?? "employment",
    location: existing?.locations.join(" / ") ?? "Warszawa",
    salaryMin: existing?.salaryMin?.toString() ?? "",
    salaryMax: existing?.salaryMax?.toString() ?? "",
  });
  const [approved, setApproved] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [deepening, setDeepening] = useState<DeepeningConfiguration>(
    existing?.deepening ?? { enabled: false, revision: 0, aspects: [] },
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const stages = ["Kogo szukasz", "Treść oferty", "Warunki", "Pogłębienie", "Zatwierdzenie"];
  const errorRef = useRef<HTMLParagraphElement>(null);
  function preparedConfiguration() {
    const parsed = configurationSchema.safeParse({
      ...deepening,
      revision: (existing?.deepening.revision ?? 0) + 1,
      aspects: deepening.enabled
        ? deepening.aspects.map((aspect, order) => ({ ...aspect, order }))
        : (existing?.deepening.aspects ?? []),
    });
    if (!parsed.success) {
      setError(
        "Włączając pogłębienie, uzupełnij i zatwierdź od 1 do 3 aspektów: nazwę, wyjaśnienie i fragment oferty.",
      );
    } else if (
      parsed.data.enabled &&
      !hasSupportingExcerpts({ title, summary, description }, parsed.data.aspects)
    ) {
      setError(
        "Każdy aspekt musi zawierać dokładny, niezmieniony fragment bieżącej treści oferty. Popraw fragment lub wyłącz pogłębienie.",
      );
    } else return parsed.data;
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  if (id !== "nowa" && !existing) return <NotFound />;
  function move(next: number) {
    setError("");
    setStage(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next() {
    if (stage === 0 && title.trim().length < 3) {
      setError("Podaj nazwę stanowiska (co najmniej 3 znaki).");
      return;
    }
    if (stage === 1 && (summary.trim().length < 10 || description.trim().length < 30)) {
      setError("Uzupełnij podsumowanie (co najmniej 10 znaków) i opis (co najmniej 30 znaków).");
      return;
    }
    if (
      stage === 2 &&
      (!terms.location.trim() ||
        (terms.salaryMin && terms.salaryMax && Number(terms.salaryMin) > Number(terms.salaryMax)))
    ) {
      setError("Podaj lokalizację i sprawdź kolejność widełek wynagrodzenia.");
      return;
    }
    if (stage === 3 && !preparedConfiguration()) return;
    move(stage + 1);
  }
  function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (stage < 4) {
      next();
      return;
    }
    setError("");
    if (!approved) {
      setError("Zatwierdź opis przed publikacją.");
      return;
    }
    const configuration = preparedConfiguration();
    if (!configuration) {
      setStage(3);
      return;
    }
    const newId = existing?.id ?? crypto.randomUUID();
    const parsed = jobSchema.safeParse({
      ...existing,
      id: newId,
      deepening: configuration,
      slug: existing?.slug ?? `oferta-${newId}`,
      companyId: person.companyId,
      title,
      summary,
      description,
      sourceBrief: source,
      generatedDescription: generated,
      category: terms.category,
      function: terms.function,
      remoteStatus: terms.remoteStatus,
      seniority: terms.seniority,
      contract: terms.contract,
      locations: [terms.location.trim()],
      salaryMin: terms.salaryMin ? Number(terms.salaryMin) : undefined,
      salaryMax: terms.salaryMax ? Number(terms.salaryMax) : undefined,
      salaryCurrency: existing?.salaryCurrency ?? "PLN",
      salaryPeriod: existing?.salaryPeriod ?? "month",
      salaryKind: existing?.salaryKind ?? "gross",
      coordinates: (
        {
          warszawa: { latitude: 52.2297, longitude: 21.0122 },
          kraków: { latitude: 50.0647, longitude: 19.945 },
          wrocław: { latitude: 51.1079, longitude: 17.0385 },
          gdańsk: { latitude: 54.352, longitude: 18.6466 },
          poznań: { latitude: 52.4064, longitude: 16.9252 },
        } as Record<string, { latitude: number; longitude: number }>
      )[terms.location.trim().toLocaleLowerCase("pl")],
      publicationStatus: "published",
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
      expiryAt: existing?.expiryAt ?? "2099-12-31T23:59:59.000Z",
      verificationStatus: "employer_verified",
    });
    if (!parsed.success) {
      setError(
        "Sprawdź długość i poprawność wszystkich pól oraz widełki wynagrodzenia. Wróć do odpowiedniego kroku, aby je poprawić.",
      );
      return;
    }
    if (run({ type: "publish", job: parsed.data })) navigate("/app/oferty");
  }

  return (
    <div className="employer-editor">
      <PageTitle>{existing ? "Edytuj ofertę" : "Nowa oferta"}</PageTitle>
      <div className="employer-editor-layout">
        <aside className="employer-editor-guide">
          <p className="employer-eyebrow">Twoja oferta, krok po kroku</p>
          <ol aria-label="Etapy tworzenia oferty">
            {stages.map((label, index) => (
              <li key={label} aria-current={index === stage ? "step" : undefined}>
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <p>Najpierw przygotuj treść i warunki. Publikacja wymaga Twojego zatwierdzenia.</p>
        </aside>
        <form className="prototype-panel prototype-form employer-editor-sheet" onSubmit={publish}>
          <header>
            <p className="employer-eyebrow">
              Krok {stage + 1} z {stages.length}
            </p>
            <h2 ref={heading} tabIndex={-1}>
              {stages[stage]}
            </h2>
          </header>
          {stage === 0 && (
            <>
              <Field label="Nazwa stanowiska">
                <Input
                  required
                  minLength={3}
                  maxLength={200}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setApproved(false);
                  }}
                />
              </Field>
              <Field label="Brief — kogo szukasz i do jakiego zadania?">
                <Textarea
                  aria-label="Brief — kogo szukasz i do jakiego zadania?"
                  maxLength={12000}
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setGenerated("");
                    setApproved(false);
                  }}
                />
              </Field>
              <p className="employer-hint">
                Brief jest materiałem roboczym. Nie jest publikowany ani wysyłany do generatora
                pogłębienia.
              </p>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={source.trim().length < 20 || title.trim().length < 3}
                  onClick={() => {
                    setGenerated(
                      `${title}\n\nO roli\n${source.trim().slice(0, 10000)}\n\nJak pracujemy\nŁączymy potrzeby użytkowników, odpowiedzialne wykorzystanie AI i mierzalne efekty.\n\nProces rekrutacji\nPrześlij aplikację i opowiedz o projekcie, w którym Twoje decyzje wpłynęły na wynik.`,
                    );
                    setApproved(false);
                  }}
                >
                  Przygotuj opis z AI
                </Button>
                <p className="employer-hint">
                  Lokalny szablon demonstracyjny. Przejrzyj tekst przed użyciem.
                </p>
              </div>
              {generated && (
                <section className="employer-template">
                  <h3>Propozycja opisu</h3>
                  <p className="whitespace-pre-wrap">{generated}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDescription(generated);
                      if (!summary) setSummary(source.slice(0, 180));
                      setApproved(false);
                    }}
                  >
                    Użyj propozycji
                  </Button>
                </section>
              )}
            </>
          )}
          {stage === 1 && (
            <>
              <p>To treść, którą zobaczą kandydaci. Możesz ją swobodnie zmienić.</p>
              <Field label="Krótkie podsumowanie">
                <Textarea
                  aria-label="Krótkie podsumowanie"
                  required
                  minLength={10}
                  maxLength={12000}
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    setApproved(false);
                  }}
                />
              </Field>
              <Field label="Opis oferty">
                <Textarea
                  aria-label="Opis oferty"
                  required
                  minLength={30}
                  maxLength={12000}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setApproved(false);
                  }}
                />
              </Field>
            </>
          )}
          {stage === 2 && (
            <div className="employer-terms-grid">
              {(
                [
                  ["category", "Kategoria", categoryLabels],
                  ["function", "Funkcja", functionLabels],
                  ["remoteStatus", "Tryb pracy", remoteLabels],
                  ["seniority", "Poziom", seniorityLabels],
                  ["contract", "Umowa", contractLabels],
                ] as const
              ).map(([name, label, values]) => (
                <Field key={name} label={label}>
                  <FormSelect
                    name={name}
                    ariaLabel={label}
                    value={terms[name]}
                    onValueChange={(value) => {
                      setTerms((current) => ({ ...current, [name]: value }));
                      setApproved(false);
                    }}
                    options={Object.entries(values).map(([value, label]) => ({ value, label }))}
                  />
                </Field>
              ))}
              <Field label="Lokalizacja">
                <Input
                  required
                  maxLength={200}
                  value={terms.location}
                  onChange={(e) => {
                    setTerms({ ...terms, location: e.target.value });
                    setApproved(false);
                  }}
                />
              </Field>
              <Field label="Wynagrodzenie od (PLN brutto / mies.)">
                <Input
                  type="number"
                  min="0"
                  value={terms.salaryMin}
                  onChange={(e) => {
                    setTerms({ ...terms, salaryMin: e.target.value });
                    setApproved(false);
                  }}
                />
              </Field>
              <Field label="Wynagrodzenie do (PLN brutto / mies.)">
                <Input
                  type="number"
                  min="0"
                  value={terms.salaryMax}
                  onChange={(e) => {
                    setTerms({ ...terms, salaryMax: e.target.value });
                    setApproved(false);
                  }}
                />
              </Field>
            </div>
          )}
          {stage === 3 && (
            <EmployerDeepeningConfiguration
              job={{ title, summary, description }}
              enabled={deepening.enabled}
              aspects={deepening.aspects}
              onEnabledChange={(enabled) => {
                setDeepening((current) => ({ ...current, enabled }));
                setApproved(false);
              }}
              onAspectsChange={(aspects) => {
                setDeepening((current) => ({ ...current, aspects }));
                setApproved(false);
              }}
            />
          )}
          {stage === 4 && (
            <>
              <section className="employer-preview" aria-label="Podgląd publikacji">
                <h3>{title}</h3>
                <p>{summary}</p>
                <p className="whitespace-pre-wrap">{description}</p>
                <dl>
                  <div>
                    <dt>Kategoria</dt>
                    <dd>{categoryLabels[terms.category]}</dd>
                  </div>
                  <div>
                    <dt>Funkcja</dt>
                    <dd>{functionLabels[terms.function]}</dd>
                  </div>
                  <div>
                    <dt>Warunki</dt>
                    <dd>
                      {terms.location} · {remoteLabels[terms.remoteStatus]} ·{" "}
                      {seniorityLabels[terms.seniority]} · {contractLabels[terms.contract]}
                    </dd>
                  </div>
                  <div>
                    <dt>Wynagrodzenie</dt>
                    <dd>
                      {terms.salaryMin || terms.salaryMax
                        ? `${terms.salaryMin || "—"}–${terms.salaryMax || "—"} ${existing?.salaryCurrency ?? "PLN"} ${existing?.salaryKind === "net" ? "netto" : "brutto"} / ${existing?.salaryPeriod === "year" ? "rok" : "mies."}`
                        : "Nie podano wynagrodzenia"}
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                aria-label="Podgląd pogłębienia"
                className="employer-preview employer-deepening-preview"
              >
                <h3>Pogłębienie: {deepening.enabled ? "włączone" : "wyłączone"}</h3>
                {deepening.enabled && (
                  <div className="employer-deepening-summary">
                    {deepening.aspects.map((aspect, index) => (
                      <article key={aspect.id}>
                        <h4>
                          {index + 1}. {aspect.title}
                        </h4>
                        <p>{aspect.explanation}</p>
                        <div className="employer-deepening-citation">
                          <p className="employer-hint">Fragment oferty</p>
                          <blockquote>{aspect.excerpt}</blockquote>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={approved}
                  onCheckedChange={setApproved}
                  aria-label="Zatwierdzam treść oferty"
                />
                <span>Zatwierdzam treść oferty i ustawienia pogłębienia do publikacji.</span>
              </label>
            </>
          )}
          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className="error-message">
              {error}
            </p>
          )}
          <footer className="employer-editor-actions">
            {stage > 0 && (
              <Button type="button" variant="outline" onClick={() => move(stage - 1)}>
                Wstecz
              </Button>
            )}
            {stage < 4 ? (
              <Button type="submit">
                {
                  [
                    "Dalej: treść oferty",
                    "Dalej: warunki",
                    "Dalej: pogłębienie",
                    "Dalej: zatwierdzenie",
                  ][stage]
                }
              </Button>
            ) : (
              <Button type="submit" disabled={!approved}>
                {existing ? "Zapisz i opublikuj zmiany" : "Opublikuj ofertę"}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}
export function CompanyEditor() {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const company = state.companies.find((x) => x.id === person.companyId)!;
  const [message, setMessage] = useState("");
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      run({
        type: "company",
        name: String(data.get("name")),
        description: String(data.get("description")),
      })
    )
      setMessage("Dane firmy zostały zapisane.");
  }
  return (
    <>
      <PageTitle>Twoja organizacja</PageTitle>
      <form className="prototype-panel prototype-form" onSubmit={save}>
        <Field label="Nazwa firmy">
          <Input name="name" required maxLength={200} defaultValue={company.name} />
        </Field>
        <Field label="Opis firmy">
          <Textarea name="description" maxLength={12000} defaultValue={company.description} />
        </Field>
        <Button type="submit">Zapisz dane firmy</Button>
        {message && <p role="status">{message}</p>}
        <Link className="text-[var(--gui-link)]" to={`/firmy/${company.slug}`}>
          Zobacz profil firmy
        </Link>
      </form>
    </>
  );
}
