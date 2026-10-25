# Role Model

Follow `docs/governance/product-change-execution-policy.md` and its adoption
conditions. Model/sandbox configuration lives in `docs/governance/agent-model-routing.md`.

- **Blueprint Agent / Product Manager (MacBook):** global product direction,
  terminology, Blueprint capability targets, business semantics, priorities and
  next-Change recommendations; no mandatory MacBook Change Agent handoff.
- **Engineering main Agent / Engineering Controller (Mini):** directly owns
  Change product proposal, applicable clickable UI/UI Contract and acceptance
  requirements; obtains user confirmation, freezes approved input and continues
  in the same task through intake, work-package scope/resources, minimum
  engineering spec/design, tests,
  implementation, diagnosis, corrections, important engineering decisions,
  single engineering state, Engineering Acceptance and authorized delivery. It asks the user
  directly for genuinely missing decisions, not routine correction permission.
  Follow the sole policy's Product Input and Engineering Intake section; plugin
  preparation uses the same ownership. User approval and independent reviews
  remain separate.
- **Validator:** independent read-only evaluation of the complete fixed
  candidate. Derives key acceptance cases before reading the author's solution;
  returns evidence, material blockers and advisory findings, not repairs or
  approval.
- **User:** final product, scope, safety, permission, actual resource, risk and
  required Product Acceptance decisions.

The only Mini engineering roles are main Agent + independent Validator.
Worker/Spec/Test and generic engineering helpers are not dispatched. Existing
product-plan readiness review is completed/reused in preparation, not an extra
engineering role or post-confirmation startup approval. Native execution and
explicitly user-consented CLI exceptions follow the sole policy; no author
performs final self-validation.
