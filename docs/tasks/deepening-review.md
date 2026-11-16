# Deepening integration review

Pinned base: `2013e95c3ccda22990226c42f7c665acdb5c757d`. Reviewed integration: `e70fbc0`. Commands: `git diff 2013e95c3ccda22990226c42f7c665acdb5c757d...HEAD` and `git log 2013e95c3ccda22990226c42f7c665acdb5c757d..HEAD --oneline`. Spec: `docs/specs/2026-11-15-tryb-poglebienia.md`. Separate fresh read-only reviewers used the invoked `mattpocock-skills:code-review` workflow. Neither reviewer ran tests or servers; root ran the integration gate separately.

## Standards

No substantive documented-standard breach found. Two judgment calls, not hard-rule violations:

- **P3, possible Duplicated Code:** public-content/excerpt construction and containment validation repeat in employer-configuration.tsx, model.ts, schema.ts and protocol.ts. Keep independent validation at each boundary, but share a plain helper to keep policy aligned.
- **P3, possible Duplicated Code:** application-offer-preview.tsx repeats the same facts/summary block inside and outside its disclosure. Extract a local composition while retaining both presentations.

The reviewer independently confirmed the known enabled-revision-zero correctness edge; that is tracked on the Spec axis rather than counted as another Standards finding.

## Spec

- **P2:** configurationSchema accepts enabled revision zero, while capture requires a positive aspect revision. Such an import passes validation but cannot enter deepening. Candidate defensive validation preserves the draft, yet blocks the flow. Require positive revisions when enabled, retain disabled initial/legacy zero, and add a public import regression. Spec requirements: capture the current revision and preserve validated import/export/reset.
- **P3:** FEATURES.md still claims no provider AI/backend in its limits, and three new rows follow prose outside the table. Correct the generation-only companion boundary and move rows into the existing register. Spec requirement: update the behavior register with stable IDs, boundaries and source/test references.

No additional substantive omissions or scope creep found. The complete staged employer editor and focused candidate sheet match accepted option 2.

Evidence limit: optional-expansion wording in the browser journey is supplied by a stub; the HTTP test checks the provider instruction. These establish UI/transport and prompt intent, not live model compliance or model quality. No real model call was made.

Review summary: Standards 2 findings, worst P3 judgment call; Spec 2 findings, worst P2 import invariant. All four are assigned to one fresh isolated fix implementer; closure is pending independent merge review and the final gate.
