# DoRoboty.ai — AIPH3 prototype

A browser-local job marketplace for participants to extend and test. Built with React, TypeScript and Vite, using Base UI components. The required visual direction for new and changed screens is the accepted Poster People design system.

## Design system — start here for UI work

Read [project integration instructions](docs/design-system/README.md), [host implementation rules](docs/design-system/IMPLEMENTATION.md) and [application acceptance checklist](docs/design-system/VERIFICATION.md), then [design.md](docs/design-system/agent-kit/design.md), [component API](docs/design-system/agent-kit/components/API.md) and the relevant [human documentation](docs/design-system/agent-kit/reference/index.html). The complete 67-file kit is stored under docs/design-system/agent-kit, including reusable CSS/JS, component states, listing/offer examples, screenshots, Geist Serif with license and illustration. No other chat or global skill is required.

```sh
npm run design-system:check
npm run design-system:dev
```

With Node 24, the first command verifies the preserved kit and examples; the second serves a separate local preview at http://127.0.0.1:8952/. No kit installation is needed. The main app uses port 3001 as below.

Build UI from this system, adapting its anatomy and visual roles into the existing React/Base UI components and host tokens. Preserve application behavior and hash routing; do not replace product state with the standalone demo fixtures/controllers. The application has a host adaptation. For every UI task, compare the affected anatomy, type roles, state and keyboard behavior with the reference; passing kit checks alone does not establish visual acceptance. See the integration guide for exact reading order, assets, React mapping, responsive rules and verification. AGENTS.md and CLAUDE.md enforce the same direction.

## Run

Requirements: **Node.js 24 and npm**.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. Ordinary flows need no environment file, account or database. This command starts Vite on port 3001 and a loopback deepening companion on 127.0.0.1:3002. Missing credentials leave ordinary flows usable. Package installation requires access to the npm registry.

Select Anna or Marek as a candidate, Karolina or Tomasz as an employer, or the instructor. Publish a job, apply, switch person and record the employer decision. Changes survive reload in this browser; settings provide export, import and reset. Description templates and scores simulate prepared scenarios. Optional deepening suggestions/questions use OpenAI through the companion; they do not assess hiring suitability. Use synthetic answers and example CVs only.

## Optional OpenAI deepening

Set `OPENAI_API_KEY` in the server environment, or create an ignored `.env.server.local` containing `OPENAI_API_KEY=` and fill the value locally. Optionally set `OPENAI_MODEL=gpt-5.4-mini`; this is the default. Restart `npm run dev` after changing it. Never use a `VITE_` prefix for secrets, put a key in browser settings or commit/distribute `.env.server.local`. Only the companion child loads this file. Generation incurs provider usage; the automated tests replace the provider fetch and spend no API credit.

Generation uses the Responses API with strict structured output and `store: false`; provider retention and account access are separate from application storage. [Official Structured Outputs guidance](https://developers.openai.com/api/docs/guides/structured-outputs) and the [default model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini) describe the API contract. No live model-quality evaluation is bundled.

Candidate application and CV text are prepared locally before HTTP. The filter removes recognized identity/contact patterns, known candidate-name tokens and lines containing recognized sensitive information; the candidate can inspect the exact prepared professional text before generation. Ordinary professional prose, uncertainty and negation remain text, not invented positive facts. An empty prepared application causes no request; an empty prepared CV is omitted. This bounded heuristic can miss private information or remove valid professional content, so use synthetic data only: it is not real-data anonymization. No PDF, profile object, contact metadata, employer notes or legacy candidate notes/generated text is sent. The strict shared schema independently checks prepared text at the HTTP boundary; the server reconstructs provider input from public job content, requested approved aspect titles/explanations and prepared application/CV text. No request/response bodies or credentials are logged.

A plain static build/preview has no companion proxy. Ordinary flows still work; deepening generation is recoverably unavailable and the candidate can submit without it. On Netlify, `netlify/functions/deepening.mts` serves both existing generation routes using production `OPENAI_API_KEY` and optional `OPENAI_MODEL` environment variables scoped to Functions. Secrets are never part of the static output. The hosted synthetic-data demo checks same-origin requests and limits calls to 10 per IP/domain per minute; it has no real user authentication or global spending cap. Real candidate data requires a separate access-control and privacy design. The local companion remains loopback-only. See [publication guidance](docs/PUBLICATION.md).

## Build and verify

```sh
npm run build
npm run preview
./scripts/verify
```

The static output is dist/. Browser checks require an already provisioned Playwright Chromium; starting the app never installs it. See [participant guide](docs/PARTICIPANT_GUIDE.md), [architecture](docs/architecture.md), [current features](FEATURES.md) and [case protocol](docs/case/CASE_PROTOCOL.md).

To distribute a baseline participant package, run npm run package:participant -- /absolute/output/directory. This excludes Git history and instructor source material. Never distribute this repository’s history as a stage-safe packet.

## Publish the static presentation

Netlify is the selected hosting target. Follow [publication and recovery](docs/PUBLICATION.md): `netlify.toml` selects Node.js 24, `npm run build` and `dist/`, and bundles the generation function separately, with provider secrets only in the Functions environment. The existing `vercel.json` remains an alternative host configuration. The build emits `version.json` and a matching recovery-screen identity. `npm run release:prepare -- /absolute/archive/path` archives an existing build outside the repo; `npm run release:check -- /absolute/archive/path` verifies file hashes. Local checks are not deployment verification; actual publication evidence is recorded in [the Netlify task](docs/tasks/netlify-connection.md).

One tab per browser scenario holds an exclusive Web Lock for editing; other tabs retain read/export access. Close the editing tab and reload to take over. HTTPS or loopback and Web Locks support are required. External storage changes pause edits. A render failure offers a raw-save download and reload without resetting data or logging caught error text.
