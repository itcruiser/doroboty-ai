# Employer deepening approval summary styling

## Intent and acceptance

The user supplied a screenshot clarifying that the requested section is the read-only deepening summary in the final Approval step, not the aspect editor. The earlier uncommitted editor styling was reverted. Keep the five-step workflow and editable aspect controls unchanged.

- Present each approved aspect as a readable section with a clear title, explanation and separately labelled source excerpt, matching the existing approval/form reading hierarchy.
- Use standard Geist Serif headings, body text, spacing and simple separators inside the current sheet; no extra nested card family.
- Preserve the exact approved content/order, enabled/disabled status and explicit final approval. No state, validation, generation or persistence changes.
- Keep full wrapping and no overflow at 1280/390/320px. Use C22 reading blocks and existing host typography/contours from the local Poster People guide. The kit remains immutable.
- Review FEATURES, inspect desktop/mobile evidence and run ./scripts/verify; perform a separate diff review. A reversible presentation change needs no new implementation-mirroring tests.

## Scope correction and validation history

Before the screenshot clarification, a full gate for the mistakenly targeted editor styling passed all 84 units and 56/57 browser journeys, including all employer tests. An existing candidate consent click failed before deepening. A rerun under the repository's CI configuration passed that scenario, but was stopped after the user clarified the target. Neither run verifies the final summary change. No candidate workaround was introduced. The final validation below is against the corrected scope.

## Corrected implementation and review

The final change is restricted to the approval summary in employer.tsx and scoped employer CSS. Each aspect now has a numbered 24px/400 reading heading, a separate explanation paragraph and a labelled Fragment oferty quotation with a simple left rule. Aspects have ordinary vertical spacing and separators inside the existing sheet; the summary ends with the same separator treatment used by other approval content. Original aspect text/order, enabled status and final approval remain unchanged. The mistakenly targeted editor/control changes were reverted.

FEATURES.md was reviewed: EMP-03/EMP-11 describe the retained inline configuration, approval and exact excerpts. This presentation change needs no behavior-register update. A separate root diff review checked scope, h3/h4 hierarchy, safe React text rendering, full wrapping, unchanged state/handlers and the restored editor. No additional blocking findings were found. This was a separate pass by the implementing agent, not an independent review.

An isolated native Playwright harness seeded a fresh synthetic scenario, entered Approval through the real five steps and checked three aspect articles, three citation labels and no document overflow at 1280/390/320px. All three widths passed; the desktop/mobile section captures in artifacts/deepening-summary were inspected. The harness initially assumed initial state was persisted on first load; it was corrected to seed explicit synthetic fixtures. It created no application or published job and made no model request. The task-owned 3107 preview was stopped; user development servers remain running. The immutable reference kit was not changed.

Final corrected-scope validation: `CI=1 ./scripts/verify` completed successfully with 84 unit tests and all 57 Chromium journeys (two workers, no retry used), formatting, immutable-kit integrity/six renderer checks, lint, types, baseline packet verification and production build. Existing upstream Zod annotation and bundle-size warnings remain non-failing. These are local checks, not hosted CI, deployment or human visual approval.
