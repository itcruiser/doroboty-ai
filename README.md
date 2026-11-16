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

Candidate text is prepared **before any HTTP request**. A finite allowlist recognizes complete affirmative Polish professional clauses, such as `Prowadziłam badania z użytkownikami.` and `Wdrożyłem automatyzację.`; only canonical fact IDs cross the browser boundary. Keywords alone are not evidence. Any unknown clause, identifier, negation, uncertainty or quoted text prevents preparation of that whole input. If the answer cannot be safely prepared, no generation request is made automatically. Step 2 offers an unselected finite checklist: the candidate can select professional facts consistent with the answer and explicitly confirm generation, return to edit, or submit without deepening. Confirmation supplies canonical facts only; the original answer is neither rewritten nor sent. Merely selecting facts or returning to step 2 does not approve them. Editing step-1 text invalidates previous confirmation; all selections stay session-only. Unsafe CV text is omitted. Prepared name-bearing example CVs are therefore omitted as a whole; there is no PDF parser. The full recognized vocabulary is in [privacy.ts](src/features/deepening/privacy.ts). This conservative synthetic-only filter can reject valid wording and does not guarantee anonymization of real data.

A static build/preview has no companion proxy. Ordinary flows still work; deepening generation is recoverably unavailable and the candidate can submit without it. Public deployment of generation needs its own authenticated, authorized server and privacy design; exposing this development companion is outside scope.

## Build and verify

```sh
npm run build
npm run preview
./scripts/verify
```

The static output is dist/. Browser checks require an already provisioned Playwright Chromium; starting the app never installs it. See [participant guide](docs/PARTICIPANT_GUIDE.md), [architecture](docs/architecture.md), [current features](FEATURES.md) and [case protocol](docs/case/CASE_PROTOCOL.md).

To distribute a baseline participant package, run npm run package:participant -- /absolute/output/directory. This excludes Git history and instructor source material. Never distribute this repository’s history as a stage-safe packet.
