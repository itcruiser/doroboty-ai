# Deepening form design proposals

## Intent and scope

The user requested implementation of `docs/specs/2026-11-15-tryb-poglebienia.md`, preceded by three visual alternatives for the employer job editor and three for the candidate application form. This phase prepares reviewable interactive proposals and waits for the user's layout choice before changing product behavior.

## Acceptance criteria

- Present three meaningfully different employer compositions and three candidate compositions in Polish, using the immutable local Poster People palette, bundled Geist Serif Regular, sans working text, single ink contours and 10/18/24px radii.
- Retain the existing job title, private brief, summary, public description, terms and human approval roles. Show later deepening configuration separately from saving an existing job; demonstrate a once-after-publication dialog for new publication.
- Candidate alternatives retain offer context, CV, answer, consent and explicit step-1 draft action. Separate two application steps; explain complete loss of unfinished progress on exit/refresh before step 2. Show answers/refusals, backward navigation, undecided regeneration and a recoverable initial-generation failure.
- Use synthetic data and local presentation interactions. The proposals must not call OpenAI, transmit text, or mutate prototype browser state.
- Keep `docs/design-system/agent-kit` immutable. These are proposed host compositions, not new source-kit variants or completed React integrations.

## Context reviewed

Read BRIEF.md, CASE_PROTOCOL.md, TODO.md, the specification, relevant CAN/EMP/OPS entries in FEATURES.md, GUI.md, project design-system guide, agent entry point, component API, relevant human control/dialog references, host implementation/catalog, acceptance checklist and status. Inspected EmployerJobEditor and ApplyPage. Required source families: C01–C04, C07/C08, C13, C18/C19 and C22; source editing, multi-step generation and question decisions are host extensions.

## Implementation handoff

The invoked `mattpocock-skills:implement-spec` requires tracker tickets and isolated implementer/merger worktrees. No tracker configuration or ticket graph was found in local project metadata. A read-only `gh issue list` query reported that `itcruiser/doroboty-ai` has disabled issues. The skill directs the user to `/setup-matt-pocock-skills` when a tracker has not been provided; resolve that context before executing its ticket workflow. Do not let multiple agents write this checkout.

## Verification and behavior register

Delivered two conversation previews, each with three named layouts. The employer alternatives are Sections and preview, Staged editor and Editing in the advertisement; candidate alternatives are Offer beside form, One writing sheet and Question by question. Preview sources live in this chat's durable visualization directory, outside the product bundle. They embed the local font and contain no runtime network dependencies or persistent product writes.

Executed local Chromium checks for each alternative at 1280/850/390/320px: controls remain within the product surface, local heading font loads, manual aspect editing changes authorship, reordering works, the fourth aspect is blocked and enabling requires a supporting excerpt. Candidate checks exercised consent validation, step transitions, decided-question retention after step-1 changes, refusal retention, decision-gated final send and success. Additional checks exercised initial-generation error/retry/failure skip, new-publication dialog once, ordinary saves without reopening, Escape/focus restoration, the real variant carousel and the 850px stack.

A separate visual/source review inspected rendered desktop/mobile examples and the local reference catalog. It found an inline editor title that clipped long content and cramped sidebar selects. The final proposals use a growing multiline title and single-column sidebar fields; the affected employer checks were rerun successfully. Browser automation initially needed sandbox escalation, and one candidate audit locator was narrowed to the visible Back button before the audit passed. These are ad-hoc proposal checks, not new product regression tests or a complete accessibility audit.

`./scripts/verify` passed on Node 24.22.0: formatting, 67-file kit integrity and six kit tests, lint, types, 27 unit tests, baseline packet validation, static build and 34 Chromium journeys. Build warnings concern existing Zod annotations and a bundle above 500 kB. This gate verifies the unchanged application and task documentation, not an implementation of the deepening specification. No deployment, CI run, merge or human design approval is claimed.

FEATURES.md was reviewed and does not need updating in this phase: application runtime and domain behavior are unchanged. The user's layout choice, tracker setup and product implementation remain pending. After implementation, rerun the gate and perform a separate implementation review.
