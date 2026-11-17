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

Changes survive reload in this browser. Settings can export a JSON file, import a scenario or reset to fixtures. Import/reset asks before replacing state. If a save is incompatible, download the original before resetting. Storage failure is shown explicitly; export before closing the tab. Only one tab can edit a scenario at a time, using the browser Web Locks API. Other tabs can read and export; close the editing tab and reload to take over. An unexpected external save pauses editing until reload. HTTPS (or local loopback) and a current browser with Web Locks are required for editing; unsupported browsers remain read-only.

A URL shares the interface, not your local changes. To transfer a scenario, share the exported file and import it in the other browser. Exports include all personas, applications and notes; never enter real personal data.

## Static build

Run npm run build. Serve dist/ through any static HTTP host. No provider account is needed for local development. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.

## Optional deepening generation

`npm run dev` also starts the local companion on `127.0.0.1:3002`; no key is required for ordinary use. To try actual OpenAI generation, set `OPENAI_API_KEY` in the server environment or an ignored `.env.server.local` file, and restart. `OPENAI_MODEL` optionally overrides the default `gpt-5.4-mini`. Never use `VITE_` for secrets, share a key, or include `.env.server.local` in a participant package. API usage can incur charges.

Use synthetic data only. Before HTTP, local preparation removes recognized identity/contact patterns, known candidate-name tokens and lines with recognized sensitive information. Ordinary professional prose, negation and uncertainty remain text. Inspect the exact prepared application/CV preview before generating. An empty prepared application makes no request; an empty prepared CV is omitted. The local server sends prepared prose with public job content and approved aspect titles/explanations to the provider. PDFs, profile/contact metadata and recruiter notes are not sent. This heuristic can miss private information or remove valid content; it does not anonymize real CVs. Provider retention and account access are separate from local storage.

With static preview/hosting or a missing key/server, generation shows a recoverable unavailable state. A candidate can retry or submit one application without deepening after initial generation fails. Employer manual configuration remains available. Do not expose the development companion as a public recruitment API.

For a hosted presentation on Vercel, follow [the publication and recovery runbook](PUBLICATION.md). It covers the static variant, build identity, release archives, smoke checks and rollback; it does not publish anything automatically.
