# Aspect generation runtime failure

## Intent and acceptance

Diagnose the user's failure after configuring the API key, preserve secrets/free text, and fix the demonstrated cause if it is in this application. A successful synthetic aspect generation through the same public HTTP boundary is the recovery criterion; if the provider/account is the blocker, report only the safe classification and required external change. Do not claim model quality or change production deployment boundaries.

## Reproduction

The ignored .env.server.local exists and declares a nonempty OPENAI_API_KEY; no value was displayed. Application port 3001 responds, and companion port 3002 responds. A POST of the existing synthetic three-field public job fixture to /api/deepening/aspects through 3001 returned HTTP 502 with no aspects. Repeating the same request directly at 3002 returned HTTP 502. Both probes assert HTTP 200 with a nonempty aspects array, so they fail on this symptom. No candidate data was used.

## Ranked hypotheses

1. Provider rejects the loaded key/project/quota: an isolated provider-boundary probe will return an authentication/account/rate status.
2. Provider rejects the model or structured-output request: the same probe will return a request/schema/model classification.
3. Provider succeeds but local parsing/validation rejects output: provider HTTP 200 will precede local 502.
4. Network/TLS failure: no upstream HTTP response, with a safe transport classification.

The next probe wraps only provider fetch, reads credentials in process and prints allowlisted status/code classifications only. It does not log key values, bodies, messages or headers.

## Finding and boundary

The isolated companion used the current server-only environment file and the real provider boundary, wrapping fetch only to classify failures. OpenAI returned HTTP 429, classified as insufficient_quota; local transport converted that response to generic HTTP 502. This confirms a provider billing/usage/quota blocker for the current credential. No provider HTTP 200 or successful generated output was obtained, so schema/output/model-quality behavior is not established by this run. Further retries were stopped.

Official OpenAI documentation says billing/quota failures require checking the applicable credit balance and organization/project/approved usage limits; retries do not restore access. The broad insufficient_quota classification does not itself distinguish the account balance from the specific applicable spending/usage limit. References: https://developers.openai.com/api/docs/guides/error-codes and https://developers.openai.com/api/docs/guides/spend-limits.

No source behavior or credential was changed; FEATURES.md was reviewed and needs no update. The running user services were not restarted. The isolated listener was closed and no debug instrumentation or raw payload/header artifact was persisted. No regression code change is appropriate for an external account-limit failure; the real HTTP reproduction remains red until that external condition changes. This diagnosis does not claim the generation flow has been repaired. Documentation formatting/diff checks are the only new repository checks needed for this record; the previous source verification remains historical evidence.
