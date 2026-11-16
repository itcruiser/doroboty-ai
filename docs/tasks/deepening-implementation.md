# Application deepening implementation

## Intent and accepted direction

Implement `docs/specs/2026-11-15-tryb-poglebienia.md` end to end. The user selected option 2 and explicitly requested implementation after the visual proposal phase. Use the staged employer editor and the focused single writing sheet for candidates, with complete editable fields, not merely a wizard preview. Preserve the local Poster People kit, hash routes, Base UI composition, synthetic data and all ordinary one-step application flows.

Integration branch: `codex/tryb-poglebienia`. Fixed review base: `2013e95c3ccda22990226c42f7c665acdb5c757d`.

## Local ticket graph

GitHub Issues are disabled. The user's instruction to proceed is implemented using this local ticket graph rather than waiting for tracker provisioning. Each implementation ticket uses an isolated worktree; no two agents write the integration checkout. Tickets are resolved by their integration commits and evidence below. No external issue, review or message is posted.

| Ticket | Scope                                                                                                                          | Depends on                           | Status                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------- |
| D1     | Plain shared schemas, revisions/snapshots, domain operations, v1 migration and safe persisted-draft removal                    | —                                    | Integrated and reviewed |
| D2     | Loopback companion, structured OpenAI boundary, positive-allowlist privacy preparation, validated client, startup/package docs | —; shared D1 contract at integration | Integrated and reviewed |
| D3     | Complete staged employer editor and aspect approval dialog, manual/error/reorder/disable states                                | D1, D2 contracts                     | Integrated and reviewed |
| D4     | Focused candidate form, session-only deepening, submitted candidate/employer views, browser acceptance                         | D1, D2, D3                           | Integrated and reviewed |
| D5     | Full gate, independent Standards/Spec review and fixes, documentation/evidence                                                 | D1–D4                                | In progress             |

## Public verification seams

The specification explicitly requests browser acceptance scenarios and shared Zod/persistence validation. Test those existing public seams: `transition` and import/export for immutable domain data and migration; the loopback HTTP generation endpoint for validation, privacy and recoverability; browser routes for the ten acceptance scenarios in section 5. These are the seams agreed by the supplied specification; no tests of private React internals are required. Use red/green vertical slices and substitute only the external model boundary in automated tests.

## Acceptance and evidence

The ten scenarios in the specification are the acceptance criteria, including one final application only, decided-question preservation, complete unfinished-form loss after entering step 2, generation-failure skip, revision isolation, sanitised outbound input, v1 import/recovery, fixed scenario scores and participant package boundaries. Verify desktop/mobile/long content/keyboard/error states against the local source. Run `./scripts/verify`, record actual failures and fixes, then perform a separate Standards and Spec review against the fixed base. Update FEATURES.md in the implementation change. Local checks are not CI, publishing, real-data privacy or course approval.

Progress and executed evidence will be appended as tickets integrate.

## Executed progress

- The initial candidate browser slice ran red on the absent `2. Pogłębienie` step. Existing acceptance tests are committed at `8026cf3`; this is not evidence that the feature passed.
- After interruption, uncommitted `/tmp` worktrees were unavailable. Only committed schema work survived. Durable contracts and worktrees now preserve subsequent progress; interrupted agent reports were not treated as saved implementation.
- D1 integrated with separate merger review at `293a839`: shared snapshots/configuration, explicit v1 migration under the existing storage key, revision/reference checks, captured identity and durable draft removal. The independent review found no substantive blocker. Focused schema/model/storage tests: 24 passed; typecheck passed.
- D3's own implementation commits are `16cc4ea` and `af5de16`. Its three employer Chromium journeys passed, including new publication/skip, proposal editing/authorship, manual aspects/reordering/max-three, later disable, unavailable generation, invalid excerpt and keyboard close/focus at 320px. Its worktree passed typecheck, 69 unit tests and source-kit checks. A partial full gate stopped at a D2-owned lint error before browser tests; it does not establish final verification. D3 is awaiting independent review and dependency integration.
- D2's provisional client and HTTP boundary commits are `12eb083` and `f03a36b`. Its native Node startup smoke exposed a TypeScript parameter-property unsupported by Node's type stripping; that is being corrected and rechecked before integration. No live model request is part of the automated gate.

- D2 independently reviewed and integrated at `3793b3f` (final implementation `d4da233`): strict structured generation, positive-fact preparation, native Node 24 startup and participant boundaries. Forty focused client/HTTP tests passed independently. The native Node loading defect noted above was fixed; missing-key startup/proxy smoke returned recoverable 503. No live model request was made.
- D3 independent review found first publication of existing draft/review jobs did not open configuration. `5aceb7e` fixed it with five status regressions; the reviewer closed the finding and integrated at `4c6baf4`. Typecheck passed after merge.
- D4 independently reviewed and integrated at `7e57cb0` (implementation `bbb5115`): focused complete candidate form, session-only lifecycle, durable draft deletion, atomic regeneration, immutable role views and success guard. Its 24 focused Chromium journeys passed; nine new deepening journeys passed again after final capture validation. Independent merger inspected code and desktop/mobile artifacts; it did not rerun the full gate.
- D5 known edge for final review/fix: enabled configuration revision zero is currently accepted by the import schema but cannot be captured. Candidate entry defensively validates before draft deletion; persistence schema still needs a regression and rejection. Full integration gate and two-axis review remain pending.
