# Security Policy

- Classify data before external model, network, plugin, extension, or tool access.
- Default enterprise data handling to local-only and no egress until policy explicitly allows it.
- Keep credentials and secrets in approved secret stores and redact them from prompts, events, logs, traces, tests, and artifacts.
- Treat local Pi execution as operating with the user's OS authority. Enterprise execution requires an isolated runtime and policy enforcement outside the agent process.
- Tools, Domain Packs, and Model Packs declare capabilities and receive least privilege.
- Action execution requires authorization, idempotency, audit, timeout, cancellation, and recovery semantics.
- Automated Decision behavior requires a separate high-risk specification and human approval.
- Security uncertainty fails closed and returns to the Controller.

