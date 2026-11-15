# Refine the application deepening specification

## Intent

Turn the initial deepening prompt into an implementable specification for the current teaching prototype. Capture the interview decisions, remove contradictory submission and resume rules, and keep the proposal aligned with the prototype's storage, role, distribution, and design contracts. This task changes documentation only.

## Acceptance criteria

- The specification defines offer configuration, the two-step pre-submission form, AI boundaries, local persistence, error paths, role views, and observable acceptance scenarios without contradictions.
- The application is submitted only after the final action in step 2; prior form state is session-only after entering that step and is discarded on reload or exit.
- The document distinguishes simulated role visibility from authentication and specifies safe handling of synthetic CV and answer text sent to OpenAI.
- Existing version-1 saves/imports and participant packaging constraints have an explicit migration and validation plan.
- Domain terms and the architectural trade-off are recorded. `FEATURES.md` is reviewed; no behavior register update is needed for documentation-only work.
- Run `./scripts/verify`, report actual results, and perform a separate documentation review.

## Documentation and verification

- Rewrote the proposed specification around final submission after step 2, with only in-session back navigation, no unfinished-form recovery, and a send-without-deepening path after AI failure. Added the local-server boundary, fail-closed synthetic-text handling, version-1 migration requirements, UI integration rules, and browser acceptance scenarios.
- Added the domain glossary and an ADR for the local AI companion. Reviewed `FEATURES.md` entries CAN-09/10/13-17 and EMP-03-08. The register describes running behavior; this documentation-only change does not alter it, so no register entry changed.
- The first `./scripts/verify` run passed formatting and stopped in `design-system:check` because the sandbox denied a Node child process (`spawnSync ... EPERM`). The authorized rerun passed formatting, design-system integrity and 6 kit tests, lint, typecheck, 27 unit tests, baseline packet verification, build, and 34 Chromium journeys. The build reported dependency annotation and large-chunk warnings. A final `npm run format:check` passed after the last edit.

## Separate review

Reviewed the spec against the interview decisions, current application submission and storage contracts, and the behavior register. Clarified that an open form keeps its captured aspect revision and that raw candidate text cannot be sent to OpenAI for redaction. Confirmed that no post-submission editing or step-2 resume path remains and that API failure does not create duplicate applications. `git diff --check` passed. This review covers the proposed documents, not an implemented feature or deployment.
