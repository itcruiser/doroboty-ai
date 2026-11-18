# Presentation on Netlify

This release is the AIPH3 synthetic-data demonstration, without accounts or a shared database, with optional server-side AI generation. Persona selection is a simulation. Each browser owns its scenario. HTTPS and the Web Locks API are required for editing; unsupported browsers can read and export. Keep the loopback companion local. Provider secrets belong only in the Netlify Functions environment; never upload environment files or the instructor repository as a participant packet.

## Outstanding operator decisions

Hosting: Netlify, selected by the user. Team: `krzysztof-jaros`; project: `doroboty-ai-prototyp-a039` (`758c5df3-e427-4cde-8666-f4aa7d6be3e9`). Public presentation: [doroboty-ai-prototyp-a039.netlify.app](https://doroboty-ai-prototyp-a039.netlify.app). The user approved creating, publishing and disabling password/team-login protection for this project. Actual deployment and verification evidence belongs in [the task record](tasks/netlify-connection.md). Support contact, expected audience, transfer budget and operational acceptance remain operator decisions, separate from publishing this demonstration.

## Prepare a known version

1. Use Node 24 and `npm ci` from a reviewed commit. Run `./scripts/verify`. Do not publish with a failing gate. Local browser tests use two workers and retain the 30-second test limit; failures are not hidden by retries outside CI.
2. The gate builds `dist/`. Its `version.json` identifies the source revision and build time; the same identity appears on the recovery screen. Review `git status` and keep the reviewed source commit together with the artifact. A `-dirty` build is for rehearsal, not an approved release.
3. Run `npm run release:prepare -- /absolute/path/outside/repository` into a new empty directory. This archives only `dist/`, with a SHA-256 file manifest in `release.json`. Run `npm run release:check -- /the/same/directory` to verify integrity. Keep this archive and the previous known working archive; neither contains the instructor source/history.
4. Export any demonstration scenario worth keeping through `/#/app/settings`. The export contains all synthetic personas and notes. Store it privately with the demonstration materials. An export is not automatically created or backed up by hosting.

## Configure and publish on Netlify

The committed `netlify.toml` uses Node.js 24, `npm run build` and `dist`. Hash routes need no rewrite. The existing Vercel configuration remains an alternative; it does not configure Netlify. See [Netlify file configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/) and [custom headers](https://docs.netlify.com/manage/routing/headers/).

1. Link the intended project from the repository root: `npx netlify-cli link --id 758c5df3-e427-4cde-8666-f4aa7d6be3e9`. `.netlify/` is ignored and must never enter source control or participant packages.
2. For a manual deployment, run the validation gate and deploy the reviewed static build with `npx netlify-cli deploy --prod --build`. A connector-assisted source upload can instead build on Netlify from a baseline participant source package containing `netlify.toml`; exclude `.env*`, Git history and instructor documents. Neither manual path configures Git continuous deployment.
3. For automatic deployment on push, connect `https://github.com/itcruiser/doroboty-ai` in the project's continuous deployment settings using an authorized GitHub account/app, select the intended production branch and retain the committed build settings. Do not make instructor source/history public to enable hosting. Once Git deployment is connected, a production-branch push replaces any manually published build.
4. Ordinary static flows require no application environment variables. For hosted generation, configure production `OPENAI_API_KEY` (secret) and optional `OPENAI_MODEL` in the project environment with Functions scope, then deploy the source including `netlify/functions/deepening.mts`. The existing project already has both production secrets. Never use a browser-prefixed secret or put keys in netlify.toml. The function routes both generation APIs directly and imports the shared server operation; the loopback development companion is not deployed.
5. Check project visibility after the first successful production deploy. New projects may be private by default. For a public presentation, choose Public under Project configuration > General > Visitor access > Project visibility. This is separate from persona selection.
6. Record deployment ID, exact HTTPS URL, source revision, deployed `version.json` and operator. A remote rebuild has a different timestamp from a local archive. Check actual security/cache headers, native PDF previews, portals and browser journeys; configuration alone is not evidence of these outcomes.

## Hosted generation controls

`netlify/functions/deepening.mts` reads runtime secrets using `Netlify.env.get()` and routes `/api/deepening/aspects` and `/api/deepening/questions`. The function sets its own no-store/security headers because static header rules do not apply to Functions responses. Production requests must be HTTPS JSON POSTs with the canonical site Origin. Both transports share strict Zod input/output validation, 100,000-byte input, 64,000-byte provider JSON, a five-second body deadline and a 20-second generation timeout. The browser retains its 25-second timeout.

The public synthetic-data demo has a code-based limit of 10 calls per IP/domain per 60 seconds shared across both routes, plus two calls per warm worker. Check the deployed rule in the post-processing logs and verify rate-limit enforcement separately; Netlify may take up to ten seconds to enforce an exceeded threshold. These limits and same-origin checks are not real user authentication or a guaranteed global spending cap. Configure provider account budgets for the intended audience; use no real CVs or candidate data. See [Netlify rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/). If runtime credentials are missing, the API returns a recoverable 503; invalid input is rejected before contacting the provider. Updating environment variables requires a new deploy. The production build configuration narrowly excludes OPENAI_MODEL from value-based secret scanning because this project had marked the public model identifier as secret. OPENAI_API_KEY and all other secret/smart scanning remain enabled; this build setting is not passed to Functions runtime.

## Smoke test before admitting the audience

Use a fresh browser profile and synthetic data. Record the operator, date, URL and deployed version. Check at desktop and 320/390px, including keyboard navigation.

- Open `/version.json`, the home page and a copied `/#/oferty/ai-product-manager` URL; verify assets, fonts, illustration and local PDF.
- Select an employer, publish a synthetic offer, select a candidate, save a draft, reload and submit; switch to the employer and record a stage, then reload.
- On Netlify, generate aspects from a synthetic public offer, accept/edit the proposals, publish and generate candidate questions from prepared synthetic text; verify human approval and immutable submission. These live checks incur provider usage. On a plain static preview, generation remains recoverably unavailable; verify manual configuration and failure-skip submission. Automated tests mock provider calls and spend no API credit.
- Open a second tab; it may read and export, but cannot reset/import/edit the scenario. Close the first tab and reload the second to acquire editing. Test an unsupported browser only for the documented read-only recovery behavior.
- Export the completed scenario, reset, import into a separate same-version browser profile and compare the offer/application/stage. Do not overwrite the only copy. Confirm the original unreadable save can still be downloaded before an explicit reset.
- Exercise labels/focus, mobile reflow and recovery actions. Never trigger a production failure affecting viewers. Rehearse failure recovery in an isolated local or preview instance using synthetic data.

Stop admission and fix forward if the app cannot load, the main journey cannot finish, saved data cannot be read, recovery fails, PDF/assets break or unexpected external requests occur. Do not treat a successful upload/build alone as acceptance.

## Diagnose and recover

1. Ask for the fixed error code and build identity, browser and reproduction steps. Do not request CVs, free text, a scenario export or URLs containing entered filters. The render fallback offers a private raw-save download, reload and selectable diagnostics; it does not reset data or log the caught error text.
2. Check the deployed `/version.json`, Netlify deployment/build result and request errors for the affected static assets. Browser `localStorage` is not in Netlify backups. For a storage warning, export before closing or resetting; close the other editing tab before reloading.
3. Fix forward: revert the faulty source change or implement a correction, rerun verification and publish a new deployment. A failed Netlify deployment leaves the previous published version live. Do not restore an older deploy through the dashboard/API. Hosting changes static files, not browser storage; preserve raw saves and JSON exports before investigating compatibility.
4. If the old version cannot read the save, retain the original and use the tested matching version to export/recover; use baseline reset only after explicit human confirmation. Repeat the smoke checklist and record the restored deployment/version and outcome.
5. Rehearse the archived files locally before release: verify the archive, serve its `dist` in an isolated loopback instance, perform smoke/import and then serve the previous archive at that same test origin. Confirm the restored identity and saved data. This local rehearsal is not evidence of hosted recovery.
6. Notify the audience through the operator's agreed channel and record the incident, affected version, recovery time and next action. A named operator, delivered test alert and actual recovery evidence remain release requirements.

## Availability and real-use follow-up

After URL and recipient selection, configure an availability check for the actual home page and a version/asset check appropriate to a static SPA; a 200 response alone does not prove the UI works. Verify delivery of a safe test notification to the operator. Do not add analytics or transmit scenario text to monitoring. Confirm Netlify transfer/resource limits and alerts within the approved budget. Observe an agreed sample of audience use, loading failures and scenario completion before claiming operational success. Update `docs/production-readiness.html` with actual deployment evidence.

The framing exception is restricted to the two committed synthetic CV PDFs: same-origin embedding preserves their existing native preview. Application HTML and every other asset retain DENY and frame-ancestors none. No arbitrary upload or private CV endpoint is covered by this exception.
