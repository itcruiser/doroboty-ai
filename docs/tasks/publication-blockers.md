# Static presentation publication fixes

## Intent and authorization

The user approved fixing publication blockers on 2026-11-17 and requested a commit before implementation. Existing application and audit work was committed as `4cd9315`. Preserve the teaching prototype, synthetic data, persona selection, hash routes and optional loopback-only AI. The user selected Vercel and then explicitly requested a saved sequential repair plan. Do not deploy or choose a paid service. Operator/contact, actual Vercel project/URL, audience and budget remain unknown.

## Execution plan

Follow this order. `Implemented; verification pending` does not mean complete. Record actual results below and update each row when its acceptance criterion is met. Preserve the pre-fix commit and keep implementation changes separate from it.

| Step | Work                                                                        | Acceptance / evidence                                                                                                                                                                     | Status                                                                                               |
| ---- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | Commit the existing application and audit before repairs                    | Commit exists and precedes repair edits                                                                                                                                                   | Complete: `4cd9315`                                                                                  |
| 2    | Correct privacy UI and participant guidance for static demo versus local AI | Exact prepared prose/optional CV flow documented; synthetic-only, preview and human approval preserved; types/build and browser flows checked                                             | Complete: source review and final gate                                                               |
| 3    | Permit only one editing tab and retain read/export recovery                 | Real multi-page browser tests reject second-tab reset/write, preserve storage, allow takeover after close/reload and fail safely without Web Locks; unexpected external saves stop writes | Complete: multi-page and unsupported-lock browser tests                                              |
| 4    | Add render recovery and build identity                                      | At 1280/390/320px: raw save preserved/downloaded, fixed diagnostics match version.json, keyboard/reflow/axe pass, no caught exception text in UI/logs                                     | Complete: 1280/390/320px, keyboard/reflow/axe and private recovery                                   |
| 5    | Repair development dependency findings and diagnose timeouts                | Fresh npm audit; verify ts-morph glob API after targeted override; cap browser workers without raising timeouts/removing assertions; final full gate passes                               | Complete: zero npm findings; final gate passed with two workers                                      |
| 6    | Prepare Vercel configuration and release/recovery procedure                 | Static output only; no public companion/secrets; archive/manifest integrity and isolated smoke/restore rehearsal; production-only checks remain open                                      | Complete locally: archive, integrity, header/PDF, restore and rollback rehearsal; Vercel checks open |
| 7    | Run the full gate and a separate review pass                                | ./scripts/verify actual exit/result; review final diff for correctness, boundaries, data preservation and tests; fix findings and rerun affected checks                                   | Complete: final gate exit 0; separate review findings fixed                                          |
| 8    | Refresh HTML audit and hand off remaining human decisions                   | Current source/environment evidence, prior history retained, browser/mobile/print checks, clear next step and honest unresolved hosting/operator items                                    | Current HTML audit phase and evidence are the completion record                                      |

## Results and review log

- Step 1: committed all pre-existing application and audit changes before implementation. No push or deployment.
- Step 5: compatible tool update reduced npm findings from 10 to 4. A scoped `@ts-morph/common` → `minimatch ^11.0.1` override removed the remaining advisory chain; fresh npm audit reported zero vulnerabilities. A standalone in-memory ts-morph glob-selection check passed for matching and nonmatching paths. The final full gate subsequently passed.
- Step 5 diagnosis: the prior trace reached the final screenshot in the main end-to-end journey before the global 30-second limit. Two earlier mobile journeys passed in isolation. These observations support reducing default browser workers from host-dependent six to two; they do not establish a functional defect or authorize hiding timeouts.
- Separate review findings addressed: persona selection now respects a rejected store transition instead of navigating anyway; the recovery diagnostics use the shared Textarea primitive rather than a bare browser control; startup normalization is deferred until writer ownership; HTML framing protection remains DENY with same-origin exceptions only for the two synthetic sample PDFs used by the existing preview.
- Initial focused tests exposed incorrect test selectors (AlertDialog uses `alertdialog`) and a reset-success assertion that did not account for the shell remount after clearing the active persona. The tests now assert the durable reset and preserved data; assertions for rejected writes remain. These test corrections do not change product behavior.

## Acceptance criteria

- Only one tab can mutate a browser-local scenario; another tab retains read/export access and cannot silently overwrite it. Unsupported lock environments fail safely with recovery guidance.
- Privacy UI and participant documentation accurately distinguish static hosting from optional local AI and disclose the prepared application/CV text sent to it.
- A render failure shows a keyboard-accessible recovery screen, version and safe reporting instructions, without deleting stored data or exposing/logging error text.
- Diagnose browser timeouts from traces and bound worker concurrency appropriately; do not hide failures with retries or arbitrary timeout increases.
- Resolve affected development dependencies with compatible updates; run a fresh audit.
- Prepare provider-independent release, smoke, restore and rollback instructions and an isolated rehearsal. Leave hosting, operator/contact, traffic/budget and production checks explicitly unverified.
- Update FEATURES.md; run ./scripts/verify, a separate review pass and refreshed HTML assessment with actual evidence.

## UI contract

Use existing Poster People recovery/panel, notice and C01 actions, local typography/tokens and Base UI render API. The fallback composes existing host classes without changing the immutable kit or other screens. Check 1280/390/320px, long labels, keyboard access, readable status, recovery and no sensitive error output.

## Final execution evidence

- `./scripts/verify`: exit 0 after the final UI correction and formatting, 93 unit tests and 69/69 Chromium journeys (3.3 minutes for browser tests), reference integrity (67 files and 6 renderer tests), lint, types, baseline packet and static build. The earlier 68-test pass preceded the shared Textarea correction and additional import-safety scenario; it is not substituted for this final run.
- `npm audit --json --ignore-scripts --fetch-retries=0 --fetch-timeout=15000`: zero findings after the lockfile update and scoped override. ts-morph matching/nonmatching in-memory glob selection passed.
- Release preparation/check: 36 static files verified in `/tmp/doroboty-publication-final-release-20261117`; tampering was rejected in a separate disposable copy, and preparing into an existing nonempty archive was rejected without replacing its manifest. The participant package was separately created and checked for excluded Git history, environment files, source/instructor documents and tasks.
- Isolated loopback rehearsal with locally applied Vercel header rules: source build `4cd9315-dirty 2026-11-17T13:35:24.257Z` to archived build `4cd9315-dirty 2026-11-17T13:23:52.416Z`, same storage schema and test origin. A profile edit and synthetic application survived export/reset/import and artifact rollback. This is a local rehearsal, not a Vercel deployment/rollback or a cross-schema guarantee.
- Framing: HTML remained DENY; only the two committed synthetic PDFs allowed same-origin embedding. The headless shell rendered a blank PDF frame, so it was not accepted as visual proof. The already-provisioned full Chromium successfully displayed the actual Anna PDF, visually inspected in the local header rehearsal. The viewer stayed network-active; its captured rendered page, not network-idle, is the visual evidence.
- Recovery screenshots were inspected at desktop/mobile, including the shared readonly Textarea; browser tests covered all 1280/390/320px variants, focus, raw-save preservation and absence of the synthetic private exception marker from console output.
- Bounded secret checks: 135 Git commits and 249 current text files yielded no matches for provider/GitHub/private-key-marker patterns; the configured provider key was absent from the built files. Values were never printed. This is a bounded check, not credential certification.
- Separate review covered store mutation entry points, lock acquisition/cleanup and normalization, readonly failure paths, caught-error privacy, build identity, Vercel header scope, archive integrity, package boundaries and the feature register. Findings listed above were corrected; no additional actionable local finding remained in that pass.

## Remaining external release requirements

The operator must still supply the Vercel project/public URL, responsible person and contact, audience/budget and acceptable disruption/loss of local work. Actual HTTPS/headers, production smoke, hosting log access, a delivered test alert and browser-save backup coverage under the deployed origin remain unverified. No source changes, accounts, hosted AI, provisioning or deployment are implied by these open items. The updated HTML distinguishes these from completed local repairs.
