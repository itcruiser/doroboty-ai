# Production readiness audit

## Intent

Audit the current working tree for a real recruitment portal, as requested by the user on 2026-11-17. The repository currently implements a synthetic-data teaching prototype. Hosting, audience size, budget, incident owner and public AI availability are not established. Do not change application code, install dependencies, deploy or implement repairs before approval.

## Acceptance criteria

- Inspect repository context and implementation, preserving existing uncommitted work.
- Execute understood local checks and record actual outcomes and limitations.
- Create `docs/production-readiness.html` using the production-readiness skill renderer, including versioned evidence and separate preparation, deployment and observation stages.
- Evaluate every baseline requirement; add portal-specific blockers and distinguish failures from unavailable evidence.
- Propose a concrete repair package and wait for user approval.
- Review the generated report and record whether FEATURES.md needs updating.

## Behavior register

FEATURES.md was reviewed. This audit changes no application behavior; no register update is required.

## Scope decision

The user confirmed that the intended release serves real users and real data. This does not authorize replacing the teaching contract or implementing production features. That scope change needs an approved design and repair package first.

## Revised scope: hosted presentation

The user's subsequent instruction supersedes the real-user portal scope: assess a hosted presentation without login. Evaluate the existing synthetic-data, browser-local teaching application. Treat static hosting without a public AI service as the assessed release variant, explicitly stated in the report. Keep optional loopback AI separate and do not expose it publicly. No application fixes, account system, database or deployment are authorized by this report revision.

Reassess applicability, retain prior audit history, and replace the proposed portal architecture package with a small demonstration-release package. Hosting, public URL, expected audience, operator and outage tolerance remain unconfirmed. Record the remaining applicable release requirements rather than claiming that absence of accounts alone establishes readiness. Recheck the unresolved verification gate and report actual outcomes. FEATURES.md was reviewed again; report-only changes do not change its behavior contract.
