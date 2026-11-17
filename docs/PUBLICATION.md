# Static presentation on Vercel

This release is the AIPH3 synthetic-data demonstration, without accounts, a shared database or public AI. Persona selection is a simulation. Each browser owns its scenario. HTTPS and the Web Locks API are required for editing; unsupported browsers can read and export. Do not expose the loopback companion, add an API proxy, configure provider secrets in Vercel or upload the instructor repository as a participant packet.

## Outstanding operator decisions

Hosting: Vercel, selected by the user. The project/account, public URL, release operator, support contact, expected audience, transfer budget, acceptable interruption and acceptable loss of local work have not been supplied. The operator must fill these in before opening the presentation to an audience. No deployment, paid service, alert recipient or human acceptance is implied by this document.

## Prepare a known version

1. Use Node 24 and `npm ci` from a reviewed commit. Run `./scripts/verify`. Do not publish with a failing gate. Local browser tests use two workers and retain the 30-second test limit; failures are not hidden by retries outside CI.
2. The gate builds `dist/`. Its `version.json` identifies the source revision and build time; the same identity appears on the recovery screen. Review `git status` and keep the reviewed source commit together with the artifact. A `-dirty` build is for rehearsal, not an approved release.
3. Run `npm run release:prepare -- /absolute/path/outside/repository` into a new empty directory. This archives only `dist/`, with a SHA-256 file manifest in `release.json`. Run `npm run release:check -- /the/same/directory` to verify integrity. Keep this archive and the previous known working archive; neither contains the instructor source/history.
4. Export any demonstration scenario worth keeping through `/#/app/settings`. The export contains all synthetic personas and notes. Store it privately with the demonstration materials. An export is not automatically created or backed up by hosting.

## Configure and publish on Vercel

The operator with Vercel access performs these steps after the local gate and review. See [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) and [project configuration](https://vercel.com/docs/project-configuration/vercel-json), checked 2026-11-17.

1. Create or select the intended Vercel project and import the reviewed Git repository/branch with the appropriate access. Confirm that the repository remains private if it contains instructor materials; the served output is only `dist/`.
2. Set the project root to this app and Node.js to 24.x. The committed `vercel.json` specifies Vite, `npm ci`, `npm run build` and `dist`. There are no application environment variables or secrets required for the static presentation. Do not add `OPENAI_API_KEY` or `VITE_` secrets.
3. Verify deployment access settings against the intended public audience; Vercel dashboard protection is separate from application login. Hash routes require no rewrite. Leave API routes unconfigured; missing generation must recover through manual configuration or candidate failure-skip.
4. Publish the reviewed commit. Record deployment ID, exact URL, source commit, `version.json`, configuration revision and the operator. A Vercel rebuild has a different build timestamp from a local archive; do not claim they are byte-identical. Retrieve and record the deployed identity.
5. Check HTTPS and the actual response headers. Configuration includes a same-origin content policy, no framing of application pages, no referrer and no MIME sniffing. Inline styles remain necessary for existing React/Base UI positioning. Policy configuration alone is not evidence that deployed PDF previews, portals and interactions work.

## Smoke test before admitting the audience

Use a fresh browser profile and synthetic data. Record the operator, date, URL and deployed version. Check at desktop and 320/390px, including keyboard navigation.

- Open `/version.json`, the home page and a copied `/#/oferty/ai-product-manager` URL; verify assets, fonts, illustration and local PDF.
- Select an employer, publish a synthetic offer, select a candidate, save a draft, reload and submit; switch to the employer and record a stage, then reload.
- Verify that static AI fails recoverably, manual aspect configuration works and the candidate can submit without generation after the initial failure. No external AI request or charge should occur.
- Open a second tab; it may read and export, but cannot reset/import/edit the scenario. Close the first tab and reload the second to acquire editing. Test an unsupported browser only for the documented read-only recovery behavior.
- Export the completed scenario, reset, import into a separate same-version browser profile and compare the offer/application/stage. Do not overwrite the only copy. Confirm the original unreadable save can still be downloaded before an explicit reset.
- Exercise labels/focus, mobile reflow and recovery actions. Never trigger a production failure affecting viewers. Rehearse failure recovery in an isolated local or preview instance using synthetic data.

Stop admission or roll back if the app cannot load, the main journey cannot finish, saved data cannot be read, recovery fails, PDF/assets break or unexpected external requests occur. Do not treat a successful upload/build alone as acceptance.

## Diagnose, recover and roll back

1. Ask for the fixed error code and build identity, browser and reproduction steps. Do not request CVs, free text, a scenario export or URLs containing entered filters. The render fallback offers a private raw-save download, reload and selectable diagnostics; it does not reset data or log the caught error text.
2. Check the deployed `/version.json`, Vercel deployment/build result and request errors for the affected static assets. Browser `localStorage` is not in Vercel backups. For a storage warning, export before closing or resetting; close the other editing tab before reloading.
3. Use [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback) to select the recorded known working deployment, subject to project access and availability. This changes hosted files, not browser storage. Do not reset browser data automatically. Check compatibility of old UI and newer saves in an isolated profile first; preserve raw saves and JSON exports.
4. If the old version cannot read the save, retain the original and use the tested matching version to export/recover; use baseline reset only after explicit human confirmation. Repeat the smoke checklist and record the restored deployment/version and outcome.
5. Rehearse the archived files locally before release: verify the archive, serve its `dist` in an isolated loopback instance, perform smoke/import and then serve the previous archive at that same test origin. Confirm the restored identity and saved data. No actual production rollback has been executed by preparing this runbook.
6. Notify the audience through the operator's agreed channel and record the incident, affected version, recovery time and next action. A named operator, delivered test alert and actual recovery evidence remain release requirements.

## Availability and real-use follow-up

After URL and recipient selection, configure an availability check for the actual home page and a version/asset check appropriate to a static SPA; a 200 response alone does not prove the UI works. Verify delivery of a safe test notification to the operator. Do not add analytics or transmit scenario text to monitoring. Confirm Vercel transfer/resource limits and alerts within the approved budget. Observe an agreed sample of audience use, loading failures and scenario completion before claiming operational success. Update `docs/production-readiness.html` with actual deployment evidence.

The framing exception is restricted to the two committed synthetic CV PDFs: same-origin embedding preserves their existing native preview. Application HTML and every other asset retain DENY and frame-ancestors none. No arbitrary upload or private CV endpoint is covered by this exception.
