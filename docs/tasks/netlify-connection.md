# Connect the static prototype to Netlify

## Intent

Connect this repository to the user's Netlify team and publish the static teaching prototype. The user explicitly approved creating a new project and publishing it. The requested name was unavailable; Netlify created `doroboty-ai-prototyp-a039` (`758c5df3-e427-4cde-8666-f4aa7d6be3e9`).

## Acceptance criteria

- Configure Node.js 24, `npm run build` and the `dist` publish directory in `netlify.toml`.
- Preserve hash links, security/cache headers and same-origin previews of the two synthetic CV PDFs.
- Ignore local `.netlify` linking metadata. Publish only static output; exclude secrets, instructor sources and Git history from uploaded source packages.
- Update publication guidance and the hosting entry in FEATURES.md, without changing application flows or exposing the loopback AI companion.
- Run `./scripts/verify`, separately review the diff and verify the deployed HTTPS response, identity, assets and browser navigation.
- Record whether continuous Git deployment was configured; a manual deploy does not establish it.

## Validation and deployment

- Node.js v24.22.0: `./scripts/verify` passed formatting, source-kit integrity/examples, lint, types, 93 unit tests, baseline packet validation, static build and all 69 Chromium journeys (4.4 minutes). Build retains the existing large-chunk warning.
- `netlify.toml` parsed with Python TOML support and validated against the official Netlify JSON schema. `git diff --check` passed.
- Separate review checked static-only publishing, absence of API rewrites/secrets, CV framing exceptions, local link exclusion and source-package boundaries. Corrected the remaining Vercel backup reference in the publication runbook.
- A baseline source package was generated at `/tmp/doroboty-netlify-source-20261117` and inspected for excluded environment files, Git history and instructor/source/task directories. It includes the new Netlify configuration. No instructor repository was uploaded.
- Local `.netlify/state.json` links site `758c5df3-e427-4cde-8666-f4aa7d6be3e9`; `git check-ignore` confirms it is excluded.
- Netlify production build/deploy `6afc70a5ebd7c79f53c5ef4e` is ready; published at 2026-11-17 16:20:30 Europe/Warsaw. The service reports Vite, seven header rules, no redirects and no functions/edge functions.
- Source package was prepared from local changes based on `3f02094836e4e408da7a0bef253c19fc51859a5c`. No source commit or Git push was created. The remote build has its own identity; it is not claimed byte-identical to the local build.
- Git continuous deployment is not connected. The connector supports source uploads but no repository connection operation; the available dashboard browser session requires login. Automatic deployment on push remains a separate setup step documented in docs/PUBLICATION.md.
- Automatic approval review initially blocked the single-site public-visibility change. The user then explicitly approved disabling password/team-login protection only for this project. The update succeeded; both requirements are false. No other project or team defaults were changed.
- Public URL: https://doroboty-ai-prototyp-a039.netlify.app. Deployed identity: `945d855 2026-11-17T15:20:25.962Z` (Netlify's generated source-upload revision, not the local Git commit).
- Public Chromium smoke completed on 2026-11-17 at 16:26 Europe/Warsaw: HTTPS, actual security/cache headers, both PDF signatures and same-origin framing headers, hash deep link, keyboard focus, 390px reflow, draft/reload, candidate submission, employer stage/reload and PDF iframe presence passed. Source/history/environment probes and the unconfigured API returned 404. No application page errors or requests to external origins were observed.
- The first smoke assertion found an inline-script CSP violation. Inspection traced it to Netlify's injected HUD iframe (`about:srcdoc`, fixed script hash `sha256-BkKP2XO6WOEc3kXOiLr2ZoY83hamalKjPY9xBcbXVuw=`), not product code. The repeat smoke records that exact host warning separately; all other CSP violations still fail. The application's CSP remains unchanged; the Netlify badge/toolbar's inline behavior stays blocked.
- Report and inspected screenshots are stored locally in ignored `artifacts/netlify-publication/`. Desktop/mobile product UI and the employer CV tab were inspected. The automated browser showed a blank native PDF surface, so native PDF rendering is not claimed as verified; both delivered PDF files are byte-identical to the committed originals, with correct MIME and framing headers. These checks do not establish human acceptance, monitoring/alert delivery, Git continuous deployment or hosted AI generation.
