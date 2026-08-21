# Contract Index

This directory documents approved cross-domain contracts and their owners. Executable schemas and shared types will live under packages/contracts/ after Structure and Spec Gates.

No product contract is frozen during cold start.

Every future contract records:

- business meaning and grain;
- identity and lifecycle;
- producer and consumer;
- closed input and output shape;
- provenance and time semantics;
- authorization and data boundary;
- error, degradation, retry, cancellation, and idempotency behavior;
- compatibility, migration, activation, rollback, and retirement;
- positive, negative, and contract-test evidence.

Contract changes are Controller-owned and use docs/templates/CONTRACT_CHANGE_REQUEST.template.md.

