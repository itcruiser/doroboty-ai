# Inline employer deepening step

## Intent and acceptance

The user corrected the employer form interaction: deepening must be a full step between Terms and Approval, with no popup. This supersedes the original specification's post-publication dialog. Keep the accepted Poster People composition, complete existing form fields and human approval.

- Five steps: role, public content, terms, deepening, approval. Preserve local values when moving back and forward.
- Optional deepening starts disabled; manual entry and explicit AI suggestions use current unsaved public title/summary/description only, never the private brief. Suggestions require acceptance and the existing one-to-three/exact-excerpt validation.
- Save the job and its configuration atomically only after final approval. No publication or configuration mutation occurs when entering/leaving the step. AI failure permits manual fallback or continuing with deepening disabled.
- Existing jobs use the same inline editor; edits/disable affect future forms, not submitted snapshots. Validate citations against the final public text, including after returning to earlier steps. Preserve stable aspect IDs/authorship/order and monotonic revisions.
- Remove the configuration popup and obsolete entry/footer styles. Reuse Base UI controls, C01/C02/C04 and C22 reading anatomy in the existing white sheet; no immutable kit edits or new visual family. Step labels wrap at narrow widths, heading focus follows navigation and error focus permits recovery.
- Update FEATURES and active design/architecture guidance. Run focused domain/browser checks, desktop/mobile visual inspection and ./scripts/verify, then a separate review pass. Report actual evidence, not deployment.

## Implementation and focused evidence

EmployerDeepeningConfiguration is now a controlled inline field section. The parent retains enabled/aspects state and final approval includes the configuration preview. AI requests use current unsaved public content and are aborted when the section unmounts; private source text remains excluded. Accepted facts/aspects are distinct from temporary AI proposals. Disabling keeps local edits while navigating but final disabled publication retains only previously saved valid aspects (or none for a new job), so unfinished optional fields cannot block publication.

The publish transition now validates and saves the proposed job/configuration together, derives monotonic configuration revisions itself and preserves the revision when enabled/aspects are unchanged. Existing domain configuration operations remain available; the UI uses only final publication. Stable IDs and immutable submitted snapshots are preserved.

Focused execution: all 13 model tests passed, including new atomic-publication, invalid-citation, unchanged-revision and cross-company assertions. All ten employer browser journeys passed, including AI/manual author/order, no persisted mutation before final approval, disabled publication, existing draft/review/published/hidden/archived jobs and recovery at 1280/390/320px. The final gate additionally covers the subsequent mobile step-label layout adjustment. Initial mobile capture inspection found labels breaking within words; the narrow step list now uses two columns with inline number/label rows. The local reference catalog was started at 8952. The immutable kit was not changed.

## Separate review pass

After implementation, a separate root diff review traced the controlled form → shared configuration/job schemas → publish transition and inspected the relevant browser assertions. Checked: no hidden publication/configuration call before approval, domain-owned revisions, citation validation against final public text, abort on step exit, no private brief in the generation projection, stable authors/IDs/order, no nested form/dialog and preserved candidate snapshots. Active behavior/design guidance and the specification correction now match the five-step interaction. No additional blocking findings were found. This was a separate review pass by the implementing agent, not an independent reviewer or deployment approval.

## Validation runs

The first full gate passed formatting, design-system integrity, lint, types, 84 unit tests, the 120-journey baseline packet and production build. Browser result: 56/57 passed; the existing candidate missing-companion scenario failed in the step-1 consent checkbox click, before deepening entry (`locator.check: Clicking the checkbox did not change its state`, with stability/viewport retries). Its standalone three-repeat run then passed 3/3 without source or test changes. This is an observed intermittent interaction failure, not a demonstrated regression in the employer change; no candidate interaction workaround was introduced. The complete gate was rerun below.

Inspected final 1280/390/320px inline captures against the local reference typography, single contours and paper/white/action hierarchy. Narrow step labels now remain complete in two columns. Keyboard toggle, heading/error focus, Axe and no-overflow assertions passed in the employer journeys. The reference catalog started for this task was stopped; user-owned development servers were left running. AI calls in these UI checks were stubbed; they establish interaction/payload contracts, not live model quality.

Final `./scripts/verify` completed successfully: formatting, 67-file immutable-kit integrity and six renderer checks, lint, types, 84 unit tests, baseline packet verification, production build and all 57 Chromium journeys. The build retains existing upstream Zod annotation and bundle-size warnings. The rerun passed the previously intermittent consent scenario without source/test changes. These are local checks; no deployment, merge or live model quality assessment was performed.
