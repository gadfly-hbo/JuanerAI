# Role Model

Follow `docs/governance/product-change-execution-policy.md` and its adoption
conditions. Model/sandbox configuration lives in `docs/governance/agent-model-routing.md`.

- **Product Manager (MacBook):** product intent, terminology, scope, UI,
  business semantics, acceptance criteria, prohibitions and product planning.
- **Engineering main Agent / Engineering Controller (Mini):** directly owns
  intake, work-package scope/resources, minimum engineering spec/design, tests,
  implementation, diagnosis, corrections, important engineering decisions,
  single engineering state, Engineering Acceptance and authorized delivery. It asks the user
  directly for genuinely missing decisions, not routine correction permission.
- **Validator:** independent read-only evaluation of the complete fixed
  candidate. Derives key acceptance cases before reading the author's solution;
  returns evidence, material blockers and advisory findings, not repairs or
  approval.
- **User:** final product, scope, safety, permission, actual resource, risk and
  required Product Acceptance decisions.

The only Mini engineering roles are main Agent + independent Validator.
Worker/Spec/Test and generic engineering helpers are not dispatched. MacBook
product support is unchanged. Native execution and explicitly user-consented
CLI exceptions follow the sole policy; no author performs final self-validation.
