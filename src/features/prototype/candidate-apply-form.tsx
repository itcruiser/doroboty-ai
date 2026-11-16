import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { ConfettiBurst, type ConfettiOrigin } from "@/components/confetti-burst";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationOfferPreview } from "@/features/jobs/application-offer-preview";
import type { JobWithCompany } from "@/features/jobs/types";
import { useCandidateDeepening } from "@/features/deepening/use-candidate-deepening";
import { CandidateQuestions } from "@/features/deepening/candidate-questions";
import { usePrototype } from "./store";
import { currentPerson, MIN_APPLICATION_ANSWER_LENGTH } from "./model";
import { Notice } from "./shell";
import { CvAttachment } from "./cv-attachment";

export function CandidateApplyForm({ job }: { job: JobWithCompany }) {
  const { state, run, enterDeepening } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const draft = state.drafts.find((x) => x.jobId === job?.id && x.candidateId === person.id);
  const legacy = useRef({ notes: draft?.notes ?? "", generated: draft?.generated ?? "" });
  const { notes, generated } = legacy.current;
  const deepening = useCandidateDeepening();
  const enabled = !!job.deepening?.enabled || !!deepening.session;
  const identity = deepening.session?.identity ?? { name: person.name, cv: person.cv };
  const offer = deepening.session
    ? {
        ...job,
        title: deepening.session.revision.title,
        summary: deepening.session.revision.summary,
        description: deepening.session.revision.description,
      }
    : job;
  const [answer, setAnswer] = useState(draft?.answer ?? "");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const submittedOnce = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<ConfettiOrigin | null>(null);
  useEffect(() => {
    if (!submitted) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    const timeout = window.setTimeout(() => navigate("/app/aplikacje?wyslano=1"), delay);
    return () => window.clearTimeout(timeout);
  }, [submitted, navigate]);
  const entered = !!deepening.session;
  useLayoutEffect(() => {
    if (!entered) return;
    if (deepening.active) document.getElementById("application-form-title")?.focus();
    else answerInput.current?.focus();
  }, [deepening.active, entered]);
  const answerLength = answer.trim().length;
  const answerInvalid = attempted && answerLength < MIN_APPLICATION_ANSWER_LENGTH;
  const consentInvalid = attempted && !consent;
  const existing = state.applications.find(
    (x) => x.jobId === job.id && x.candidateId === person.id,
  );
  if (existing && !submitted)
    return (
      <section className="prototype-section">
        <Notice>Aplikacja na tę ofertę została już wysłana.</Notice>
        <Link to={`/app/aplikacje/${existing.id}`} className={buttonVariants()}>
          Zobacz aplikację
        </Link>
      </section>
    );
  function submit(e: FormEvent) {
    e.preventDefault();
    if (submittedOnce.current) return;
    setAttempted(true);
    if (answerLength < MIN_APPLICATION_ANSWER_LENGTH) {
      answerInput.current?.focus();
      return;
    }
    if (!consent) {
      document.getElementById("application-consent")?.focus();
      return;
    }
    if (enabled && !deepening.active) {
      setMessage("");
      deepening.enter(job, { name: person.name, cv: person.cv }, answer, () =>
        enterDeepening(job.id),
      );
      return;
    }
    send();
  }
  function send(skip = false) {
    if (submittedOnce.current || deepening.pending) return;
    setAttempted(true);
    if (answerLength < MIN_APPLICATION_ANSWER_LENGTH || !consent) {
      deepening.back();
      return;
    }
    const snapshot = enabled ? deepening.snapshot(skip) : undefined;
    if (enabled && !snapshot) return;
    submittedOnce.current = true;
    if (
      run({
        type: "submit",
        jobId: job.id,
        notes,
        generated,
        answer,
        consent,
        ...(snapshot
          ? { deepening: snapshot, submissionIdentity: deepening.session!.identity }
          : {}),
      })
    ) {
      setSubmitted(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = sendButton.current?.getBoundingClientRect();
        if (rect)
          setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    } else submittedOnce.current = false;
  }
  return (
    <section className="pp-container application-page">
      <BackLink to={`/oferty/${job.slug}`}>Wróć do oferty</BackLink>
      <header className="application-header">
        <h1>Aplikuj na ofertę</h1>
        <p>Sprawdź ofertę i opowiedz, dlaczego pasujesz do tej roli.</p>
      </header>
      <div className="application-layout application-focused-layout">
        <ApplicationOfferPreview job={offer} compact />
        {enabled && (
          <div className="application-step-context">
            <ol aria-label="Etapy aplikacji" className="application-steps">
              <li aria-current={!deepening.active ? "step" : undefined}>1. Zgłoszenie</li>
              <li aria-current={deepening.active ? "step" : undefined}>2. Pogłębienie</li>
            </ol>
            <p className="application-help">
              Przejście do pogłębienia usuwa zapisany szkic. Wyjście lub odświeżenie strony usunie
              całą niewysłaną aplikację. Wysyłasz ją dopiero na końcu.
            </p>
          </div>
        )}
        <form
          noValidate
          onSubmit={submit}
          className="record-sheet application-form"
          aria-labelledby="application-form-title"
        >
          {!deepening.active && deepening.error && (
            <p role="alert" className="error-message">
              {deepening.error}
            </p>
          )}
          {deepening.active ? (
            <CandidateQuestions deepening={deepening} answer={answer} locked={submitted} />
          ) : (
            <>
              <header className="application-form-intro">
                <h2 id="application-form-title">Twoja aplikacja</h2>
                <p>
                  Aplikujesz jako <strong>{identity.name}</strong>.
                </p>
              </header>
              <section className="application-form-section" aria-labelledby="application-cv-title">
                <h3 id="application-cv-title">Twoje CV</h3>
                <p className="application-help">Do aplikacji dołączymy CV z Twojego profilu.</p>
                <CvAttachment
                  candidateId={person.id}
                  fallbackText={identity.cv}
                  layout="row"
                  contextLabel="CV z Twojego profilu"
                />
              </section>
              <section
                className="application-form-section application-answer"
                aria-label="Odpowiedź do aplikacji"
              >
                <label className="field">
                  <span>Dlaczego pasujesz do tej roli?</span>
                  <Textarea
                    disabled={submitted}
                    ref={answerInput}
                    required
                    minLength={MIN_APPLICATION_ANSWER_LENGTH}
                    maxLength={12000}
                    aria-invalid={answerInvalid || undefined}
                    aria-describedby="application-answer-help"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setConsent(false);
                    }}
                  />
                </label>
                <p
                  id="application-answer-help"
                  role={answerInvalid ? "alert" : undefined}
                  className={answerInvalid ? "error-message" : "text-sm text-muted-foreground"}
                >
                  {answerInvalid
                    ? `Odpowiedź jest za krótka. Wpisz co najmniej ${MIN_APPLICATION_ANSWER_LENGTH} znaków (obecnie: ${answerLength}).`
                    : `Minimum ${MIN_APPLICATION_ANSWER_LENGTH} znaków. Obecnie: ${answerLength}.`}
                </p>
              </section>
            </>
          )}
          <div className="application-form-section application-submit">
            {!deepening.active && (
              <label className="application-consent">
                <Checkbox
                  id="application-consent"
                  disabled={submitted}
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v)}
                  aria-invalid={consentInvalid || undefined}
                  aria-describedby={consentInvalid ? "application-consent-error" : undefined}
                  aria-label="Zatwierdzam treść i przesłanie aplikacji"
                />
                <span>
                  Zatwierdzam treść aplikacji i przesłanie profilu oraz przykładowego CV pracodawcy.
                </span>
              </label>
            )}
            {consentInvalid && (
              <p id="application-consent-error" className="error-message" role="alert">
                Zatwierdź treść aplikacji i jej przesłanie pracodawcy.
              </p>
            )}
            <div className="application-actions">
              <Button
                ref={sendButton}
                type="submit"
                disabled={
                  submitted ||
                  deepening.pending ||
                  (deepening.active &&
                    (!deepening.complete ||
                      !consent ||
                      answerLength < MIN_APPLICATION_ANSWER_LENGTH))
                }
                className="application-send"
                data-submitted={submitted || undefined}
              >
                {submitted && <CheckCircle2 aria-hidden="true" />}
                {submitted
                  ? "Wysłano!"
                  : enabled && !deepening.active
                    ? "Dalej: pogłębienie"
                    : "Wyślij aplikację"}
              </Button>
              {!deepening.session && (
                <Button
                  type="button"
                  disabled={submitted}
                  variant="outline"
                  onClick={() => {
                    if (run({ type: "draft", jobId: job.id, notes, generated, answer }))
                      setMessage("Szkic został zapisany.");
                  }}
                >
                  Zapisz szkic
                </Button>
              )}
              {deepening.active && !deepening.session?.responses.length && !!deepening.error && (
                <Button
                  type="button"
                  variant={deepening.requiresPreparation ? "outline" : "default"}
                  disabled={submitted || deepening.pending}
                  onClick={() => send(true)}
                >
                  Wyślij bez pogłębienia
                </Button>
              )}
              {deepening.active && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitted || deepening.pending}
                  onClick={deepening.back}
                >
                  Wróć do zgłoszenia
                </Button>
              )}
            </div>
            <p
              role="status"
              className={submitted || !message ? "sr-only" : "application-save-status"}
            >
              {submitted ? "Wysłano aplikację. Otwieramy listę Twoich aplikacji." : message}
            </p>
            <p className="application-help">
              Prototyp: aplikacja zostaje w tym przeglądarkowym scenariuszu.
            </p>
          </div>
        </form>
      </div>
      <ConfettiBurst origin={confettiOrigin} />
    </section>
  );
}
