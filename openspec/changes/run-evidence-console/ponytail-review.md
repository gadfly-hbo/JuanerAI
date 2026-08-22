# Ponytail Review: pre-Spec-Gate draft

`design.md:L19: shrink: a reader-owned Core that refuses to import existing pure Run/Evidence validators would duplicate the frozen Artifact 1.0 admission logic. Reuse createLocalAnalysisDomain() validators unchanged and add only reader-specific contract, reference, checksum, and projection rules.`

`specs/run-evidence-console/spec.md:L15: shrink: eleven new stable reader error codes create a protocol larger than the first viewer needs. Merge selection/not-found, path/file-unsafety, and malformed/identity/incomplete-document cases while retaining distinct unsupported-version, reference, checksum, and sanitized-read outcomes.`

`specs/run-evidence-console/spec.md:L15: yagni: deterministic integrity entries populated with not_applicable for every reader response have no approved consumer. Return only the checks applicable to the selected Run status in stable contract order.`

`test-plan.md:L24: yagni: effect recorders for model, network, source, credential, and project-control capabilities that are absent from the public dependency graph would create unused test machinery. Prove absent capabilities through the public Port/Profile/import graph and keep before/after filesystem evidence for the actual local-read boundary.`

net: -18 lines possible.

## Final-pass applied findings

`test-plan.md:L12: shrink: remove AC-REC-005-04 HTML rendering from Core/unit coverage; retain hostile-content escaping only in TEST-REC-009 host E2E.`

`specs/run-evidence-console/spec.md:L57: shrink: assign controlled-workspace snapshot and nonexistent/unreadable source fixture only to TEST-REC-005; assign static filesystem-call/import closure only to TEST-REC-008.`

`test-plan.md:L24: yagni: remove the non-loopback/bind-option mutation; the entry exposes no bind option and TEST-REC-009 proves the actual loopback listener.`

net: -3 lines possible.

All final-pass findings were applied; the post-revision package is lean.

## Post-Validator repair audit

Lean already. Ship.
