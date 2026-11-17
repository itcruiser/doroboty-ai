# Place the description helper beside its target fields

## Intent and acceptance

Move the employer's “Przygotuj opis z AI” action from step 1 to step 2, because it prepares the public summary/description edited in step 2. Keep title/private brief in step 1 and retain their values across navigation. Move the proposal preview and explicit Use proposal action with the helper, preserving human editing, existing enablement rules and local-template behavior. No new provider call or automatic overwrite/publication. Update existing employer browser journeys and EMP-06, run ./scripts/verify and a separate source review. Preserve the interrupted demonstration's broader goal and current viewport.

## Implementation and separate review

Moved the action, preparation hint, proposal preview and explicit Use proposal button together into step 2, immediately before the public summary/description fields. The private brief remains in step 1. Generation still uses the existing local template; it introduces no provider request or automatic publication. Updated EMP-06 and both existing employer browser journeys to assert the action is absent in step 1 and usable in step 2.

A separate root source review checked step visibility, retained title/brief state, button types, enablement, explicit proposal acceptance and final approval. No remaining findings. This was a separate pass by the implementing agent, not an independent review.

The implementation previously passed `CI=1 ./scripts/verify`: formatting, source-kit integrity and examples, lint, types, 93 unit tests, baseline packet, static build and 62 Chromium journeys. A fresh full gate is being run before the requested commit/push; its final result will be recorded below. Demonstrations also exercised unchanged proposal acceptance, publication with two accepted AI aspects and one manual aspect, combined candidate submission with two answers and one refusal, and the recruiter snapshot. Generated media remains outside the repository.
