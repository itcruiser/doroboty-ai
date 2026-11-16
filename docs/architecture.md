# Architecture

One React/TypeScript application is built by Vite into static files. HashRouter renders routes under /#/; route parameters created in the browser require no hosting rewrites. The running app currently uses local CSS tokens, Timeless font and Base UI primitives. New and changed UI must follow the accepted Poster People [design system](design-system/README.md), adapted into the existing stack; installing its reference did not convert runtime styles. The browser remains the scenario data owner. An optional loopback companion generates deepening proposals/questions without storing application data.

## Data flow

JSON marketplace/person fixtures → initialState → PrototypeProvider → feature views. Local operations go through transition with shared Zod schemas and explicit role/ownership/transition checks for coherent simulation. All roles still have access to the same browser data; these checks are not security.

Candidate source notes, generated draft and approved application are distinct fields. Submission snapshots CV, candidate name, job title, scenario score and summary. Employer stage events are appended, with private-in-the-UI notes. Profile/job edits do not rewrite submitted records.

Storage uses one versioned localStorage key. Import validates schema/version, unique IDs, cross-references and stage history before replacing state. Unreadable/incompatible saves are protected against automatic overwrite; settings can download the original raw save, import a valid file or explicitly reset. Failed/quota-limited persistence leaves the in-memory app usable and offers export. Import/export is capped at 2 MB; no binary CV storage.

## Features

src/features/prototype owns model/storage/state and page compositions. src/features/jobs retains reusable presentation/filter/description logic; src/components/ui owns Base UI controls. Keep changes small.

LocalStorage is origin-specific. Reload preserves state; another browser/device/port starts separately. No cross-tab live synchronization is provided; close other tabs before editing/importing. Hash links reference records in the receiving browser, not transferred records.

## Evidence and distribution

The baseline historical CSV and JSON are separate from interactive state. Future evidence must arrive in a separately reviewed package. package:participant copies only explicit allowed files/directories, including the complete docs/design-system guide/kit, and omits docs/source, historical task notes, agent run history and .git. A packet verifier checks the baseline data; packaging also verifies a pristine file/hash manifest. Ordinary checks permit participants to edit code and generate build/test output without invalidating a distribution fingerprint. Instructor repository history is never participant-safe.

## Checks

npm run check and ./scripts/verify run formatting, design-system reference integrity/example checks, lint, types, unit tests, build and Playwright against the static preview. Playwright checks external requests, complete workflows, error/recovery behavior, keyboard controls and mobile layout. No test starts system services. npm run dev starts Vite and the companion; static preview starts only Vite preview.

## Deepening transport

`npm run dev` runs `scripts/dev.mjs`: Node 24 directly executes `server/main.ts` on `127.0.0.1:3002`, while Vite runs on `127.0.0.1:3001` and proxies only `/api/deepening`. `.env.server.local` is loaded only by the companion process; the frontend imports neither the server nor its key. No extra runtime package or transpilation step is needed. `npm run build` remains static; preview/hosting has no generation service.

The public browser module `src/features/deepening/client.ts` exposes `suggestAspects(job, signal?)` and `generateQuestions({revision, answer, cv, aspectIds}, signal?)`. Suggestions send only saved public title/summary/description. Question preparation uses the finite vocabulary in `privacy.ts` before fetch: whole affirmative clauses become canonical professional fact IDs; unsupported context fails closed. The request has `revision`, requested `aspectIds`, `answerFacts` and optionally `cvFacts`, never raw answer/CV/name/profile/notes. A name-bearing or otherwise unrecognized CV is omitted completely. No keywords or negated/uncertain claims become positive evidence.

POST `/api/deepening/aspects` and POST `/api/deepening/questions` independently validate strict shared Zod protocol schemas. The server reconstructs provider input from approved aspect title/explanation/excerpt and fixed professional fact phrases; it does not forward the opaque request, job/candidate identifiers or revision metadata. The Responses endpoint uses `text.format.type=json_schema`, `strict: true`, bounded output and `store: false`. Model suggestions must cite exact public excerpts, and questions must have exactly the requested unique aspect ID set. Invalid output and refusals are unavailable results, never trusted markup or application records.

Requests are limited to 100,000 UTF-8 bytes and five seconds to receive the body. Provider JSON is limited to 64,000 bytes and 20 seconds; the browser allows 25 seconds and the same bounded response size. Two requests at most run concurrently. Origin/Host/content-type checks limit this development boundary to the local app; no CORS access is enabled. There is no real authentication, persistent server store, body logging or API retry. Human approval, immutable final application storage and skip/retry remain client/domain responsibilities.

HTTP tests use real ephemeral loopback listeners and inject only the external provider fetch; client tests substitute the HTTP fetch boundary. Native Node loading is verified separately. No automated test spends API credit or establishes model quality. Participant packaging includes `server/`, the startup script and shared protocol/client, excluding environment files, instructor materials and Git history.
