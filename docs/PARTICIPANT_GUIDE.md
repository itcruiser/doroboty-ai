# Participant guide

## Start

Use the prepared baseline package and Node.js 24 with npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. If Node or registry access is blocked by your organization, ask your instructor/IT rather than bypassing the policy.

## Try a complete flow

1. Choose Anna Kowalska and browse offers.
2. Save an offer, edit the profile and submit an approved application. Write the answer directly; legacy source notes/generated copy are not the approved answer.
3. Choose Karolina Wiśniewska for BrightLabs and review its candidates.
4. Record review, invitation, conversation and the next decision.
5. Return to Anna and inspect the application history.

Karolina and Tomasz see their respective companies in the interface; this is role simulation. All data is local and synthetic. CVs are prepared text examples, not real uploads. Description templates and scores simulate the scenario. Optional deepening suggestions/questions use OpenAI if the local companion has a key.

## Save, share and recover

Changes survive reload in this browser. Settings can export a JSON file, import a scenario or reset to fixtures. Import/reset asks before replacing state. If a save is incompatible, download the original before resetting. Storage failure is shown explicitly; export before closing the tab. Use one editing tab at a time.

A URL shares the interface, not your local changes. To transfer a scenario, share the exported file and import it in the other browser. Exports include all personas, applications and notes; never enter real personal data.

## Static build

Run npm run build. Serve dist/ through any static HTTP host. No provider account is needed for local development. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.

## Optional deepening generation

`npm run dev` also starts the local companion on `127.0.0.1:3002`; no key is required for ordinary use. To try actual OpenAI generation, set `OPENAI_API_KEY` in the server environment or an ignored `.env.server.local` file, and restart. `OPENAI_MODEL` optionally overrides the default `gpt-5.4-mini`. Never use `VITE_` for secrets, share a key, or include `.env.server.local` in a participant package. API usage can incur charges.

Use synthetic data only. A conservative local allowlist recognizes whole affirmative professional sentences, for example `Prowadziłam badania z użytkownikami. Wdrożyłam automatyzację.`. Unrecognized wording, identity, uncertainty or negation blocks preparation; retry after editing or use submission without deepening. Unsafe CVs, including the name-bearing prepared examples, are omitted from generation. The full answer/CV stays in the ordinary browser-local application snapshot; it is never sent to the generation server. This does not establish privacy for real CVs.

With static preview/hosting or a missing key/server, generation shows a recoverable unavailable state. A candidate can retry or submit one application without deepening after initial generation fails. Employer manual configuration remains available. Do not expose the development companion as a public recruitment API.
