# Candidate question navigation and final approval

## Intent and acceptance

The user requests removing manual question regeneration and the approval checkbox from the first step. Returning to the first step deletes unanswered questions; entering deepening again generates fresh questions for those aspects even when the application text is unchanged. Preserve answered and explicitly declined questions. This supersedes prior in-place regeneration and atomic retention of unanswered questions after navigation.

- Remove per-question regeneration controls. Retry after generation failure requests missing questions only; it cannot replace an existing question. Returning to the application and entering deepening also retries missing questions.
- Enabled deepening validates the application answer before step 2 without requiring or showing consent in step 1. Keep explicit consent at final submission in step 2. Ordinary disabled-deepening forms retain their single-step final approval.
- On either Back or the application tab, remove whitespace-only unanswered/non-refused questions from the in-memory session. No HTTP call on return. Entering deepening generates only missing questions, using current application context, irrespective of text edits. Preserve approved revision, identity, decisions and ordering.
- Submit only after every aspect has a response or refusal and final consent is checked. Keep one combined immutable application and existing failure-skip semantics.
- Update current behavior/spec/host guidance and relevant browser journeys; run ./scripts/verify and a separate review pass. Preserve previous uncommitted form/context work.

## Implementation and separate review

The hook now stores only current response decisions; it no longer retains a generated-from answer string or exposes an existing-question regeneration operation. Back filters out answers whose trimmed value is empty unless explicitly refused. Both initial entry and reentry compute missing aspect IDs from the frozen revision. Generation validates the full missing set before merging in revision order with preserved decisions. Failure retry is limited to missing aspects and disabled after final submission. Aspect numbering/label IDs use the frozen aspect order even when a failed request leaves only a subset visible.

The form hides consent in enabled step 1 and validates only the application answer there. Entering step 2 resets final approval and clears validation-attempt feedback. Step 2 and ordinary one-step forms still require consent. Failed final validation focuses the visible consent control; it no longer navigates to a step where that control is absent. No generation or navigation submits an application. Removed the per-question regeneration button without introducing new styles or changing the immutable kit.

A separate root review pass checked both Back paths, missing-only generation/retry, whitespace/decline handling, all-decided reentry, stable ordering, pending/submit guards and ordinary disabled-mode consent. It caught and fixed the failure-retry action remaining interactive during the success delay; that control is now locked after submission. This was a source review by the implementing agent, not an independent review. Browser regressions cover the actual navigation and combined-submission boundary. No server protocol/prompt/key changes were needed in this follow-up.

Participant packaging passed at `/tmp/doroboty-candidate-navigation-20261116`, including pristine manifest/baseline verification and exclusion of Git history, instructor source and environment files. A preliminary verification was deliberately interrupted during browser tests after the review fix; the final gate was started again against the final source. Its actual result is recorded below when complete. Existing bundle-size/Zod annotation notices remain non-blocking.

## Final verification result

`CI=1 ./scripts/verify` completed successfully against the final source: formatting, 67-file kit integrity/six renderer checks, lint, TypeScript, 93 unit tests, 120 baseline journeys, static build and 59 Chromium journeys (two workers, no retries). All 15 candidate-deepening journeys passed, including both unchanged-text return paths, missing-only retry with preserved answer/refusal, no consent in enabled step 1, final consent gating, ordinary single-step approval, immutable combined submission, session loss and storage failure. Current captures under `artifacts/candidate-question-navigation/` cover 1280/390/320px, long content, initials and missing salary. Visual inspection confirmed the unchanged original columns/mobile stacking, absent step-1 checkbox and absent per-question regeneration action; existing text/field/control roles remain. Axe/keyboard/overflow checks passed in their browser journeys. No API credit was used by these stubbed tests. These are local results, not hosted CI, deployment, real-data anonymity or course approval.
