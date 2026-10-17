# Security Policy

- Classify selected data and bind its approved effect scope before model,
  network, plugin, extension or tool access; reuse valid authorization and check it before
  each effect, rather than asking the user for each call or ordinary edit.
- Default enterprise data handling to local-only and no egress until policy explicitly allows it.
- Keep credentials and secrets in approved secret stores and redact them from prompts, events, logs, traces, tests, and artifacts.
- Treat local Pi execution as operating with the user's OS authority. Enterprise execution requires an isolated runtime and policy enforcement outside the agent process.
- Tools, Domain Packs, and Model Packs declare capabilities and receive least privilege.
- Action execution requires authorization, idempotency, audit, timeout, cancellation, and recovery semantics.
- Automated Decision behavior requires a separate high-risk specification and human approval.
- Security uncertainty fails closed and returns directly to the user through
  the current Engineering Controller task; it is not resolved by MacBook
  technical approval.

For current personal/local trials, apply the sole execution policy's Personal
Trial Data and Effect Boundaries. Engineering development permission is not
product data permission. Keep present protections; enterprise-only identity,
multitenancy and centralized governance/operations without a consumer are deferred.
Missing authority or unsafe effects block the affected path, not safe independent
work. Explicit stops, original-data preservation and unknown effects remain binding.
