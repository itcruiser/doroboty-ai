# Switch the proposed deepening provider to OpenRouter

## Intent

Update the proposed deepening integration from OpenAI to the OpenRouter API without changing the agreed candidate and employer flows.

## Acceptance criteria

- The specification and architectural decision name OpenRouter as the API gateway and remove OpenAI-specific key and endpoint instructions.
- The server-side key, model configuration, structured-output requirements, privacy boundary and unavailable-service behavior remain explicit.
- The behavior register is reviewed. This documentation-only edit does not change running product behavior.
- Check formatting and the repository verification gate; record actual results and review the diff.

## Change and verification

- Updated the feature spec and the local-companion ADR to use OpenRouter. The spec now names OPENROUTER_API_KEY, a server-side model setting, the OpenRouter chat completions API, a structured-output-capable route, and independent response validation. The candidate and employer flows are unchanged.
- Reviewed `FEATURES.md`: it describes current running behavior, and this documentation-only provider switch has no behavioral impact, so the register was not changed.
- `./scripts/verify` passed: formatting, design-system integrity and 6 kit tests, lint, typecheck, 27 unit tests, baseline packet verification, build, and 34 Chromium journeys. The build emitted existing dependency-annotation and large-chunk warnings.

## Separate review

Checked that the spec and ADR use OpenRouter consistently, contain no OpenAI key/endpoint instructions, keep candidate material on the local-server boundary, and retain the agreed failure path. No product code or runtime provider integration changed. `git diff --check` passed.
