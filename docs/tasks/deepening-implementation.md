# Application deepening implementation

## Intent and accepted direction

Implement `docs/specs/2026-11-15-tryb-poglebienia.md` end to end. The user selected option 2 and explicitly requested implementation after the visual proposal phase. Use the staged employer editor and the focused single writing sheet for candidates, with complete editable fields, not merely a wizard preview. Preserve the local Poster People kit, hash routes, Base UI composition, synthetic data and all ordinary one-step application flows.

Integration branch: `codex/tryb-poglebienia`. Fixed review base: `2013e95c3ccda22990226c42f7c665acdb5c757d`.

## Local ticket graph

GitHub Issues are disabled. The user's instruction to proceed is implemented using this local ticket graph rather than waiting for tracker provisioning. Each implementation ticket uses an isolated worktree; no two agents write the integration checkout. Tickets are resolved by their integration commits and evidence below. No external issue, review or message is posted.

| Ticket | Scope                                                                                                                          | Depends on                           | Status                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------ |
| D1     | Plain shared schemas, revisions/snapshots, domain operations, v1 migration and safe persisted-draft removal                    | —                                    | Ready                          |
| D2     | Loopback companion, structured OpenAI boundary, positive-allowlist privacy preparation, validated client, startup/package docs | —; shared D1 contract at integration | Ready                          |
| D3     | Complete staged employer editor and aspect approval dialog, manual/error/reorder/disable states                                | D1, D2 contracts                     | Ready for isolated preparation |
| D4     | Focused candidate form, session-only deepening, submitted candidate/employer views, browser acceptance                         | D1, D2, D3                           | Blocked                        |
| D5     | Full gate, independent Standards/Spec review and fixes, documentation/evidence                                                 | D1–D4                                | Blocked                        |

## Public verification seams

The specification explicitly requests browser acceptance scenarios and shared Zod/persistence validation. Test those existing public seams: `transition` and import/export for immutable domain data and migration; the loopback HTTP generation endpoint for validation, privacy and recoverability; browser routes for the ten acceptance scenarios in section 5. These are the seams agreed by the supplied specification; no tests of private React internals are required. Use red/green vertical slices and substitute only the external model boundary in automated tests.

## Acceptance and evidence

The ten scenarios in the specification are the acceptance criteria, including one final application only, decided-question preservation, complete unfinished-form loss after entering step 2, generation-failure skip, revision isolation, sanitised outbound input, v1 import/recovery, fixed scenario scores and participant package boundaries. Verify desktop/mobile/long content/keyboard/error states against the local source. Run `./scripts/verify`, record actual failures and fixes, then perform a separate Standards and Spec review against the fixed base. Update FEATURES.md in the implementation change. Local checks are not CI, publishing, real-data privacy or course approval.

Progress and executed evidence will be appended as tickets integrate.
