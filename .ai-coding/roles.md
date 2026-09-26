# Role Model

Follow `docs/governance/product-change-execution-policy.md` and its adoption
conditions. Model/sandbox configuration lives in `docs/governance/agent-model-routing.md`.

- **Product Manager (MacBook):** product intent, terminology, scope, UI,
  business semantics, acceptance criteria, prohibitions and product planning.
- **Engineering Controller (Mini):** intake, work-package scope/resources,
  important engineering decisions, progress diagnosis, single engineering
  state, Engineering Acceptance and authorized delivery. It asks the user
  directly for genuinely missing decisions, not routine correction permission.
- **Engineering agent (`juaner_worker`):** minimum engineering spec/design,
  tests, implementation and debugging within its approved package. Executes
  behavior spec -> causal RED -> minimal GREEN -> necessary refactor; may update
  private design/fixtures without weakening approved acceptance.
- **Spec specialist (`juaner_spec`):** optional bounded engineering-spec/design
  assistance; does not implement product code, write tests or approve Gates.
- **Test specialist (`juaner_test`):** optional bounded test design/coverage/
  causal-RED assistance; does not implement product code or redefine behavior.
- **Validator:** independent read-only evaluation of the complete fixed
  candidate. Derives key acceptance cases before reading the author's solution;
  returns evidence, material blockers and advisory findings, not repairs or
  approval.
- **User:** final product, scope, safety, permission, actual resource, risk and
  required Product Acceptance decisions.

The default execution pair is engineering agent + independent Validator.
Specialists do not create extra stages. No candidate author, including a
contributing specialist, performs that candidate's final validation.
