# pi-xanthil Business-Function Transfer Matrix

> Status: frozen product input; no implementation or external-study authority
> Purpose: close the Xanthil Desktop D0/D1 business-function scope without making pi-xanthil an implementation or research dependency
> Boundary: product semantics only; no UI copying, repository migration, Change, Schema, dependency, test, production code, data access, or model call is authorized

## 1. Authority rule

pi-xanthil is historical product-discovery provenance, not current product authority. This matrix is the exhaustive transfer decision for the Xanthil Desktop static Demo and `DA_REQUIRED_COMPLETE` journey:

- **transferred** means the named business capability is required and is fully governed by the current Xanthil plan and required-capabilities attachment;
- **deferred** means it is not required for D0 or D1 and cannot be inferred back into scope from pi-xanthil;
- **not inherited** means the source implementation or UI choice is prohibited as a JuanerAI contract or default.

The Demo maker, future Spec author, Test author, Worker, and Reviewer do not need to open the pi-xanthil repository to determine current scope. A later authorized read-only study may provide evidence for a separately proposed revision, but cannot change this matrix without an explicit user product decision and plan revision.

## 2. Transferred business functions

| pi-xanthil-origin product intent | Xanthil Desktop D0/D1 decision | Current product authority and visible endpoint |
|---|---|---|
| business requirement intake | transferred into Data preparation | capture objective, decision boundary, exclusions, time boundary, accountable user, and expected output; confirm before execution |
| original/raw and aggregate data preparation | transferred into Data preparation | inventory source/raw/prepared/aggregate states, field meaning, grain, time, permissions, planned transformations, validations, outputs, stop conditions, snapshot, and lineage |
| data extraction and aggregate computation | transferred into Data cleaning | approved local Python processing produces validated aggregate Data and Evidence; raw or unapproved prepared detail does not enter LLM context |
| historical `free analysis` capability | transferred as the Evidence-based Analysis (循证分析) workspace | falsifiable Hypothesis, supporting/refuting/inconclusive Evidence, active refutation, alternatives, uncertainty, and non-causal default |
| branch exploration | transferred as Fork | immutable parent point, distinct child Run, selected inherited snapshots, visible lineage, explicit comparison, and no automatic merge |
| delegated analytical contribution | transferred as bounded Subagent | explicit role, input, allowed data/tools, stop condition, output contract, visible cancellation/failure/disagreement, and non-authoritative result |
| offline analysis | transferred as offline evidence-bound mode | no admitted network access; unsupported model text cannot become an accepted Finding; missing Evidence yields a gap or stop |
| analytical Skill and Prompt use | transferred as versioned run provenance and bounded management | purpose, allowed capability, data boundary, provenance, compatibility, immutable Run reference, and no override of authority or asset Gates |
| report output | transferred into report candidate, review, and lock | Evidence citations, refutations, limitations, provenance, Recommendations, immutable locked version, and no implicit Decision/Action/asset promotion |
| execution feedback | transferred with separated business records | Recommendation, authorization, task, actual execution, Execution Receipt, Outcome, attribution, and uncertainty remain distinct; first required flow may use a manual verification task |
| learning from analysis and feedback | transferred only as separate draft Hypothesis and Strategy writeback proposals | source Run and scope remain visible; neither proposal is silently promoted or activated |

The normative details, negative behavior, first fixture/oracle, cross-platform evidence, and completion Gate are in [`xanthil-desktop-required-capabilities.md`](xanthil-desktop-required-capabilities.md). The static representation is in [`xanthil-desktop-static-demo-brief.md`](xanthil-desktop-static-demo-brief.md).

## 3. Deferred business scope

The following are outside D0 and D1:

- every pi-xanthil business function not explicitly named in the transferred table;
- complete pi-xanthil feature parity or a generic migration program;
- automatic business Action execution and external action connectors;
- generic asset-library administration, marketplace, automatic cross-Workspace learning, or automatic asset activation;
- automatic Fork merge, autonomous Subagent swarms, self-modifying Skills/Prompts, and background scheduling;
- independent Knowledge or Memory products;
- enterprise identity, tenancy, policy, deployment, migration, concurrency, recovery, and administration;
- Model Pack production or consumption before `DA_REQUIRED_COMPLETE` and separate start authorization.

“Deferred” creates no backlog promise, sequence, or implementation authority. Adding any item requires a new product decision and the applicable planning and Change Gates.

## 4. Source choices not inherited

| Source choice | Current disposition |
|---|---|
| pi-xanthil UI, shell, layout, or component language | not inherited; Codex app is the mandatory UI and interaction baseline, with Xanthil branding and semantics |
| source state numbers, enums, internal types, API events, errors, and Session structures | not inherited; future executable contracts use JuanerAI business or standard platform types |
| repository paths, Express routes, SQLite migrations, HTTP conventions, directory names, or deployment status | not inherited and not implementation input |
| Pi Session structures, `.mcp.json`, source sandbox paths, source Skill directories, or automatic bridge generation | not inherited; Runtime and Adapter boundaries require later approved decisions |
| source Node/Python child-process topology, compute registry, artifact paths, or cleanup assumptions | not inherited; the user-provided Python technical proposal is a D0.5 hard Gate |
| source tests, fixtures, models, runtime results, versions, or commits | not evidence for JuanerAI; the first Desktop vertical instead uses the explicitly re-adopted `member-orders-v2` fixture/oracle and future Change evidence |
| source Memory scoring, token budgets, global pools, or independent Memory UI | not inherited; Memory remains a background capability and non-authoritative context |

## 5. Conflict and completeness rule

If a proposed Demo or product behavior is not traceable to the transferred table and current required-capabilities attachment, it is out of scope. If pi-xanthil evidence conflicts with this package, this package wins. If the current package itself is silent on a load-bearing behavior, the gap returns to the Controller; no external repository lookup or source implementation may supply a default.
