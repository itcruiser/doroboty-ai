# Remove aspect source excerpts

## Intent and acceptance

The user explicitly requested removing the aspect's offer-fragment field from stored data, prompts and the approval summary. This supersedes earlier specification requirements for supporting quotations. The prototype uses versioned local JSON, not a separate database.

- Remove excerpt from approved aspects, captured/submitted revisions, AI suggestion output and question-provider input. Retain aspect ID/title/explanation/author/order and one-to-three validation.
- Generate aspect suggestions from current public offer content; ask for title/explanation only. Generate candidate questions from approved aspect title/explanation and existing canonical professional facts. Preserve human approval and all privacy/transport limits.
- Remove excerpt inputs, suggestions/summary quotations, candidate disclosure and unused quote-only styles. Keep the accepted five-step employer flow and corrected reading-summary layout.
- Load/import existing version-2 records by dropping retired aspect properties while preserving IDs, versions, enabled configuration, questions, answers/refusals, CV/identity and recruiting data. Normalize valid persisted legacy records without resetting scenarios; write failure must preserve the original and usable in-memory state. Keep version-1 migration and invalid-save recovery.
- Update the current behavior register, prompts/API/storage/design guidance and spec correction. Do not change immutable design-kit files or historical instructor/task evidence.
- Verify migration/round-trip/failure, strict wire schemas, prompt projection, AI/manual publication and candidate submissions. Run ./scripts/verify, inspect summary/editor/candidate mobile/desktop and perform a separate review pass. Report actual evidence and limitations.

## Implementation and migration

The approved aspect schema now contains only id/title/explanation/author/order. Suggestions return title/explanation only; strict HTTP/model schemas reject retired extra fields. Both prompts were updated, and the question-provider projection contains approved titles/explanations plus the existing canonical professional facts. Citation checks, inputs, disclosures, source-copy helper and quote-only styles were removed. The approval reading layout retains numbered headings, descriptions and separators.

The existing version-2 object normalization drops old keys from job configurations and submitted revisions. readState normalizes valid durable legacy saves once; parseState/import/export use the same schemas. A write failure preserves the old save and normalized usable state with export guidance. Persisted-draft tracking now distinguishes blocked recovery from a readable save with a migration-write warning. IDs, revisions and remaining submitted data are preserved; the storage key/version-1 migration and invalid-save protection remain. There is no separate database/SQL migration in this local prototype.

## Executed evidence

- Regression RED: the new legacy-state test failed because parseState retained excerpt in jobs/submitted revisions. After the change, all 86 unit tests passed, including full-state migration equality, durable rewrite/export, failed-write preservation, valid title/explanation-only suggestions, strict retired-wire-field rejection and provider input/schema assertions.
- `CI=1 ./scripts/verify` passed on the final source: formatting, 67-file immutable-kit integrity/six renderer checks, lint, types, 86 units, the 120-journey baseline packet, build and all 57 Chromium journeys (two workers, no retries). Existing upstream Zod annotation and bundle-size warnings remain non-failing.
- Browser coverage was updated for AI/manual aspects, required title/explanation, publication after public-content edits, no fragment control/summary and no stored excerpt. A submitted-snapshot journey injects legacy fields into both a saved job and application, reloads, checks physical normalization and unchanged remaining submission, then exercises later configuration and export/reset/import.
- An isolated Playwright preview used synthetic fixtures with three legacy aspects at 1280/390/320px. Each width passed no retired editor/summary/persistence fields and no document overflow. The resulting approval/editor captures in artifacts/deepening-no-fragment were inspected; approved descriptions remain readable and the editor retains its accepted controls. No model calls or user-browser changes occurred in this probe.
- Participant packaging to /tmp/doroboty-no-excerpt-participant passed baseline verification and excluded Git history/instructor materials. The task-owned preview and reference catalog were stopped.
- The existing local AI companion was restarted from the updated source without restarting Vite or reloading the user's form. The replacement is tied to the original development launcher's lifetime through a temporary parent monitor. Server startup succeeded on 3002. No key/body was printed and no live model-quality assertion is made.

## Separate review

A separate root diff review traced schemas → local migration/store → client/server projection and prompts → employer/candidate UI. Checked strict wire versus tolerant legacy storage boundaries, failed-write recovery and draft tracking, stable IDs/revisions, remaining snapshots, private-text omission, required aspect fields/order/max-three, removal of all runtime excerpt readers and quote-only styles, behavior/design/spec documentation and package boundaries. No additional blocking findings were found. This was a separate pass by the implementing agent, not an independent reviewer, hosted CI or deployment approval.
