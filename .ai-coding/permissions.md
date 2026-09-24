# Permission Model

| Artifact | Product Manager | Engineering Controller | Spec Author | Test Author | Worker | Validator | User |
|---|---|---|---|---|---|---|---|
| product intent, UI, priorities, and acceptance criteria | freeze | read and detect conflict | propose during product phase | read | read | read | approve |
| CONTEXT.md and product terminology | write | read | propose | read | read | read | decide conflict |
| engineering architecture inside approved boundaries | read | approve | propose | read | read | verify | decide boundary expansion |
| approved OpenSpec | read | approve | write before Gate | read | read | read | decide product ambiguity |
| tests | read | approve scope and Gate | read | write | read by default | read and run | accept risk only |
| production source | read | approve scope | no write | no write | scoped write | no write | grant exceptional permission |
| internal or compatible shared contracts and schemas | read | approve | propose | read | no unapproved write | verify | decide boundary expansion |
| engineering verification verdict | read | accept | no | no | no | write evidence only | accept risk only |
| Product Acceptance | prepare/explain evidence | record, never infer | no | no | no | no | approve |

External messages, deployments, production data access, dependency installation,
destructive operations, and cross-repository writes require explicit user
authority beyond a Change's ordinary source scope.
