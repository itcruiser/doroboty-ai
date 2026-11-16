# Prototype data boundary

This browser-local prototype has no real authentication. Role-specific UI and local transition checks organize the scenario; anyone using the browser can inspect all stored data. Use synthetic data only.

No API keys, credentials, real CVs or private material belong in frontend source, JSON, localStorage or exports. Exports include private-in-the-UI source/recruiter notes.

Render imported text through React text nodes, validate imports with shared Zod schemas, reject unsupported versions, duplicate IDs, broken references and oversized files. Never overwrite an unreadable save automatically.

The optional deepening companion is a development loopback service, not an access-control boundary for a public deployment. It binds to `127.0.0.1:3002`, accepts JSON POST only from `http://127.0.0.1:3001` or `http://localhost:3001`, rejects unsuitable Host/Origin/content type and provides no CORS grant. A local process can call it; do not expose it through a tunnel or public proxy.

Only `server/main.ts` reads `OPENAI_API_KEY`/`OPENAI_MODEL`. The development launcher loads ignored `.env.server.local` only in that server child. Do not prefix credentials with `VITE_`, put them in browser code or include environment files in participant packages. The companion logs fixed startup/failure messages only; it does not log request/response bodies, free text, provider errors or credentials, and persists no application data.

Candidate preparation occurs locally before the first fetch. Complete clauses from a positive professional allowlist become finite fact IDs. Unknown text, identity/contact strings, quoted claims, uncertainty and negation reject the whole input. An unsafe answer causes no request; unsafe CV is omitted. The name-bearing prepared CV fixtures are omitted as a whole. There is no raw CV/PDF upload or remote redaction call. The server accepts canonical IDs only and reconstructs fixed fact phrases, requested approved aspects and their public excerpts for OpenAI. It rejects extra candidate/name/profile/raw/legacy fields independently. Public employer text is deliberately public and still treated as untrusted model input.

This intentionally restrictive synthetic-only preparation can discard valid experience and does not prove anonymity of arbitrary real data. `store: false` disables response storage requested by this application; it is not a guarantee of zero provider retention. Provider policies/account settings and real recruitment privacy/authentication need separate review. Timeouts, size limits and two in-flight calls bound local usage, but are not per-user billing quotas or production rate limits.
