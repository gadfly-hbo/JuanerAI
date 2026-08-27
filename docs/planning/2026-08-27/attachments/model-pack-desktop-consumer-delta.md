# Model Pack First-Scenario Desktop Consumer Delta

> Status: frozen product input; Model Pack start authority not granted
> Base contract: `../../2026-08-23/attachments/model-pack-first-scenario-contract.md`
> Scope: replaces the historical CLI/Personal Consumer wording and adds the revised authority-map relationship; all other explicitly re-adopted scenario semantics remain unchanged

## 1. Retained first scenario

The first Model Pack capability remains 28-day product-category demand forecasting for a planning analyst. The re-adopted base contract remains authoritative for:

- the business user, 28-day horizon, prohibited uses, and two real local data deliveries;
- the minimum 56-day daily category history, fields, uniqueness, continuity, completeness, currency, and cutoff rules;
- rolling-origin evaluation, seasonal-naive baseline, WAPE, interval coverage, key-category regression checks, non-negative outputs, and repeatability;
- the 5% overall `order_count` WAPE improvement, 10% overall `net_order_amount` WAPE improvement, and 5 percentage-point key-category regression limit;
- exact Model Pack inputs/outputs, provenance, fail-closed conditions, and Controller-held future actuals;
- the rule that independent Consumer success proves supply-side deliverability but not Xanthil product acceptance.

The historical base attachment is frozen and not edited. If this delta conflicts with its §6.2 CLI/Personal wording, this delta wins. All unmentioned CLI entry, path, terminal, or Profile assumptions are historical and not re-adopted.

## 2. Xanthil Desktop Consumer

### User journey

Inside a Xanthil Desktop Project, the analyst:

1. opens the Data preparation view and selects the approved local `history.csv` Data snapshot;
2. sees the installed Model Pack identity, semantic version, checksum, purpose, prohibited uses, model identity, input requirements, 28-day horizon, Runtime/permissions, limitations, and revocation status;
3. sees Data and Ontology compatibility checks and the exact fields/output location to be used;
4. explicitly confirms one immutable inference plan;
5. Application calls the scenario-specific `AnalyticalModelRuntime` once with the confirmed Pack and input snapshot;
6. the Desktop shows the 28-day overall/category predictions and intervals, baseline comparison, key-category checks, limitations, and complete Pack/model/input/Runtime provenance;
7. the result can become Evidence in the current analysis or report but remains a prediction, not a Decision, Root Cause, Strategy, or Action;
8. cancellation, deadline, incompatibility, revocation, changed input, invalid output, Runtime failure, or permission failure ends with an accurate business reason and no success result.

The consumer does not expose MLflow, a training workspace, external repository paths, model-serving internals, provider SDK errors, or a generic model registry UI.

### Desktop acceptance

- The same released SDK passes independent Consumer and Xanthil Desktop Consumer checks without rebuilding or changing the Pack.
- The Desktop loads and verifies the real Pack, not a fixture or model-file substitute.
- The input snapshot is the one the user confirmed and is rechecked before inference.
- The same Pack, input, and Runtime produce the same values across repeated local runs.
- Output coverage, non-negativity, intervals, categories/dates, provenance, and contract version pass validation before success.
- A successful result is visible inside the same Project/Session evidence and reporting workflow as other analysis Evidence.
- macOS and Windows provide equivalent product behavior; platform-specific packaging or dependency differences do not change the Pack contract.
- Actual 28-day product acceptance uses the Controller-held future actuals only after the approved release and acceptance Gate; unmet thresholds fail the Model Pack and Xanthil integration acceptance rather than being adjusted in the Desktop.

## 3. Revised authority-map relationship

- Data Authority owns the source and derived input snapshots and the future actuals.
- Ontology Authority owns category, currency, date, measure, and business-meaning versions.
- Model Pack owns the executable model package identity, declared contract, evaluation, limits, and provenance; it owns neither Data nor Ontology.
- A prediction may support a run-scoped Hypothesis or report Evidence. It never directly creates or activates a Hypothesis Asset or Strategy Asset.
- Knowledge Capability may help retrieve Pack documentation or related material; Memory Capability may retain user/Session context. Neither can satisfy Pack identity, input, compatibility, or acceptance checks.

## 4. Explicitly not added

- CLI parity or a new CLI consumer;
- automatic Pack selection, fallback, registry, hot switching, or multi-model routing;
- model training or MLflow operations inside Xanthil Desktop;
- external network, cloud serving, enterprise Backend, or Frontend-to-serving direct calls in phase one;
- Hypothesis/Strategy automatic promotion, Decision automation, or business Action execution;
- exact package schema, installation format, paths, command, dependency manager, process model, error enum, or UI component contract.
