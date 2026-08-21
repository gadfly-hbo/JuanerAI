# Permission Model

| Artifact | Controller | Spec Author | Test Author | Worker | Validator |
|---|---|---|---|---|---|
| product intent and priorities | approve | propose | read | read | read |
| CONTEXT.md and shared architecture | write | propose | read | read | read |
| approved OpenSpec | approve | write before gate | read | read | read |
| tests | approve scope | read | write | read by default | read and run |
| production source | approve scope | no write | no write | scoped write | no write |
| shared contracts and schemas | approve | propose | read | no unapproved write | verify |
| verification verdict | accept | no | no | no | write evidence only |

External messages, deployments, production data access, dependency installation, destructive operations, and cross-repository writes require explicit authority beyond a Change's ordinary source scope.

