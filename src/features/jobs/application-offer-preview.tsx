import { ChevronDown, MapPin } from "lucide-react";
import { CompanyLogo } from "./company-logo";
import { JobDescription } from "./job-description";
import { SalaryFact } from "./salary-fact";
import { categoryLabels, remoteLabels, seniorityLabels } from "./presentation";
import type { JobWithCompany } from "./types";

export function ApplicationOfferPreview({
  job,
  compact = false,
}: {
  job: JobWithCompany;
  compact?: boolean;
}) {
  const factsAndSummary = (
    <>
      <dl className="application-offer-facts">
        <div>
          <dt>Tryb pracy</dt>
          <dd>{remoteLabels[job.remoteStatus]}</dd>
        </div>
        <div>
          <dt>Doświadczenie</dt>
          <dd>{seniorityLabels[job.seniority]}</dd>
        </div>
        <div>
          <dt>Kategoria</dt>
          <dd>{categoryLabels[job.category]}</dd>
        </div>
      </dl>
      <p className="application-offer-summary">{job.summary}</p>
    </>
  );
  return (
    <aside
      className={`record-sheet application-offer${compact ? " application-offer-compact" : ""}`}
      aria-labelledby="application-offer-title"
    >
      {compact && <p className="application-help">Oferta, na którą aplikujesz</p>}
      {!compact && <p className="application-eyebrow">Oferta, na którą aplikujesz</p>}
      <div className="application-company">
        <CompanyLogo company={job.company} />
        <span>{job.company.name}</span>
      </div>
      <h2 id="application-offer-title">{job.title}</h2>
      <p className="application-location">
        <MapPin size={16} aria-hidden="true" />
        {job.locations.join(" / ")}
        {compact && ` · ${remoteLabels[job.remoteStatus]}`}
      </p>
      <div className="application-pay">
        <SalaryFact job={job} />
      </div>
      {!compact && factsAndSummary}
      <details className="application-description">
        <summary>
          Pełny opis oferty
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        {compact && factsAndSummary}
        <JobDescription description={job.description} compact />
      </details>
    </aside>
  );
}
