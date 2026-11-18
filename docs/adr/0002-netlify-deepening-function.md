# Hosted generation for the synthetic Netlify demo

The user requested that aspect generation work on the public Netlify presentation. The original static upload returned 404 for both generation routes even though production server-side secrets had been configured. The local-only deployment choice in ADR 0001 is superseded for this Netlify demo; its loopback transport remains unchanged for local development.

Deploy one modern TypeScript Netlify Function with both existing API paths. Extract the provider operation from the loopback transport so both use identical prompts, strict shared schemas, professional/public projection, output bounds and timeout behavior. The browser continues to own all scenario records and human approval. No database, real account system, frontend secret or UI change is introduced.

The hosted transport requires HTTPS, the canonical site Origin and bounded JSON POSTs, uses Functions-scoped production secrets, sets uncached security headers and logs no free text or credentials. The platform applies 10 requests per IP/domain per 60 seconds across both routes; each worker permits two in-flight calls. This is a public synthetic-data teaching demo, not real-user authentication or a guaranteed global spending cap. Real recruitment data and private audiences require a separate access-control and privacy decision. Plain static/Vercel previews preserve recoverable unavailability and manual/failure-skip flows.

Validation must cover the actual function entry with a mocked provider, the unchanged loopback contract, stage-safe source packaging, deployed paths and real synthetic generation. Local test success alone is not deployment evidence or model-quality validation.
