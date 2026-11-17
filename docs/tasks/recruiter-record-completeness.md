# Submitted application completeness and section boundaries

## Intent and acceptance

The user reports missing application-form information in the recruiter record, duplicate horizontal dividers, and the last deepening response running into the recruiter-note heading. Preserve the existing Answer/CV tabs, immutable snapshots, role scoping and recruiter operations.

- Compare saved application/form fields with the shared read view: retain original answer and CV, restore the original application-question label and approved aspect explanations, and clearly show aspect order, AI question and candidate answer/refusal from the submitted snapshot. Do not substitute current job/profile text or expose legacy source/generated drafts.
- Give deepening and the recruiter note independent semantic sections, one separator per boundary and intentional vertical spacing. Avoid changing the immutable kit or unrelated controls.
- Keep both role views consistent for submitted material; the note remains employer-only and survives tab switching. Keep ordinary/skip/terminal records working.
- Add browser regressions for complete submitted content, snapshot immutability, separators/spacing, responsive wrapping, keyboard notes/tabs and role boundaries. Run ./scripts/verify and a separate source review; record actual evidence.

## Diagnosis, implementation and review

`CI=1 npx playwright test tests/e2e/recruiter-record.spec.ts --workers=1 --max-failures=1` reproduced missing original-question context on the unmodified view (including its configured retry). Source comparison also confirmed that the saved aspect explanation was not rendered. RecordSheet wrapped all supporting content in a bordered record-section while submitted-deepening added another margin/border/padding; the note followed deepening inside that same wrapper without its own boundary. These account for the screenshot's redundant separator and touching headings.

RecordSheet now lets each supporting child own its section. ApplicationRecord uses a single record-section for deepening, renders saved aspect ordinal/title/explanation, original AI question and full candidate answer/refusal, and labels the original application answer with its question. The employer controller owns a separate named record-section for its note. Existing outlined surfaces, text roles and controls are reused; no immutable-kit changes. Original answer/CV remain snapshots and legacy source/generated copy stays hidden. No persistence schema, data migration or AI transport change is needed.

The targeted regression then passed at 1280/390/320px (3/3, no retries). It seeds a submitted snapshot while the current job's configuration is disabled, verifies explanations and all response content, measures a >=40px response-to-note heading gap and one note border, rejects nested section dividers, checks note retention across tabs, Axe and overflow, and confirms that the candidate sees the same submitted explanation without the employer note. Screenshots are in `artifacts/recruiter-record/`; visual inspection of desktop/mobile confirms complete wrapping, one divider per boundary and a distinct recruiter-note section. Existing records/CV/stage journeys supply the ordinary/terminal/skip coverage in the full gate.

A separate root source review checked all RecordSheet consumers (ApplicationRecord is its only owner), both role controllers, snapshot data selection, heading/label IDs, empty/skip/terminal cases, note state across panel mounts, and CSS separator ownership. No remaining findings in this scope. This was a separate pass by the implementing agent, not an independent review. Source kit integrity and the historical unrelated company-page findings remain separate.

## Final verification

`CI=1 ./scripts/verify` passed on the final source: formatting, 67-file kit integrity and six renderer checks, lint, TypeScript, 93 unit tests, 120-journey baseline packet, static build and 62 Chromium journeys (two workers, no retries). The existing note/stage/terminal, custom/PDF CV, candidate ownership/withdrawal, skip and immutable-snapshot journeys passed alongside the three new recruiter regressions. Final documentation formatting and git diff --check passed. Participant packaging to `/tmp/doroboty-recruiter-record-20261116` passed pristine manifest/baseline verification and excluded instructor source, Git history and environment files. Existing build notices about Zod annotations and bundle size remain non-blocking. No provider call or API credit was needed. These results verify local checks only, not hosted CI, publishing, privacy for real data or human design/course approval.
