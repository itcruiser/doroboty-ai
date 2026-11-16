# Deepening final review fixes

## Intent and acceptance criteria

Address the final specification and standards review findings without expanding the approved deepening flow.

- The pre-agreed public import seam, `parseState`, rejects enabled deepening with configuration revision zero before it can block candidate entry. Valid enabled imports remain capturable; disabled initial and migrated jobs retain revision zero.
- Independent form, domain, snapshot and HTTP boundaries use one plain exact-public-excerpt policy from `deepening/schema.ts`.
- `ApplicationOfferPreview` composes the same facts/summary once, retaining their placement outside the disclosure by default and inside it for compact previews. No styles, source-family anatomy, route or state behavior changes.
- CAN-19, EMP-11 and SYS-12 remain stable IDs in the main behavior table, and current limits describe the optional generation-only companion accurately.

The local Poster People guide, implementation rules, design/API, relevant C07/C08/C20–C22 reference families and verification checklist were reviewed. Existing keyboard disclosure, local fonts, full content and responsive styles are preserved. The immutable kit is untouched. The parent integration owns the final full verification gate and separate review record.

## Validation

- RED: `npm test -- src/features/prototype/storage.test.ts` failed the new public import regression (one failed, ten passed): enabled configuration revision zero was accepted instead of rejected.
- GREEN: `npm test -- src/features/prototype/storage.test.ts src/features/prototype/model.test.ts src/features/deepening/schema.test.ts` passed all 25 tests after conditional positive-revision validation. The employer form validates its prospective next revision so first-time enable remains valid. Existing initial-state and version-1 migration tests cover disabled revision zero.
- After the review refactors, `npm test` passed all 79 tests in eight files, including client/HTTP boundaries. Two sandbox-restricted full-suite attempts stalled at local HTTP setup and were interrupted; the approved loopback-access rerun passed. No provider requests were made.
- `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` and `git diff --check` passed. Build retained existing third-party annotation and bundle-size warnings.
- `npm run test:e2e -- tests/e2e/deepening-employer.spec.ts tests/e2e/deepening-candidate.spec.ts --grep 'approved AI and manual aspects|focused application and long deepening questions' --workers=2` passed four Chromium journeys: employer first enable/approval/edit/order and candidate keyboard/long-content/reflow at 1280, 390 and 320px. Port 3106 was released after the run.
- Manual diff review confirmed all boundaries still validate independently, the excerpt policy preserves exact matching and field separators, and both preview modes preserve the original rendered content/placement. FEATURES.md was reviewed and updated for the import invariant, stable deepening rows and companion limitations. The behavior-neutral helper/JSX extractions need no additional behavior entries.
- The integration owner will repeat `./scripts/verify` after merge and owns the separate final review record. These focused checks do not establish deployment, CI, actual model quality or human approval.
