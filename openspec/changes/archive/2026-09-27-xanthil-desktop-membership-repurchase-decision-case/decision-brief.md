# Stage 2 Technical Decision Record

## Current verdict

SPEC_AUTHOR_COMPLETE_INTERRUPTED_RESUMPTION_001 — independent whole-package
review and affected Spec Gate pending

The activated Incremental Contract Amendment 001 authorizes the finite,
monotone internal subsets closed by this package. This author status does not claim
ponytail review, affected Spec Gate, Test, RED, TDD_READY, Worker, GREEN,
Validator, acceptance, or delivery. Historical P4 PASS remains valid. The
former bootstrap conflict is historical and must not be re-raised as missing
authority.

The accepted UI Contract and recorded user UI Gate PASS, dependency matrix, SQLite structure,
security boundary, and P1/P2/P3 feasibility remain unchanged. The Technical
Decision Amendment dated 2026-09-19 delegates the previously missing Run
contract mapping to the Mac mini coordinator for this named Change. The
coordinator approves the minimal additive direction below in principle; this
record closes its technical details and the consolidated Gate/ponytail findings
for Controller rereview. The complete package subsequently passed ponytail and
Spec Gate, P4 adopted/installed the frozen dependency graph once, and two
bounded compatibility clarifications closed the stale TEST-XCLI-021 oracle and
its over-prescribed dependency-proof method. The affected Gate, narrow Test,
canonical baseline, and four Console suites then passed; P4 PASS is retained
and none of that work is reopened. Test Recovery Amendment 001 now authorizes
only the directed existing-seam testability closeout recorded here before a
fresh whole-package ponytail/affected Spec Gate.

## Incremental contract decision

The selected progression is one normal production app and four internal
contract tuples, with no runtime phase selector or second entry:

| Tuple | Internal composition | Active public behavior at checkpoint |
|---|---|---|
| I1 / U1 | Store + clock; no Analysis, Run, or Assistance construction | select Project, list/open/create Session, save case fields, read/wait projection |
| I2 / U2 | Store + Analysis + Run + clock/scheduler; assistance `null` | I1 plus draft/import/confirm/start/cancel analysis |
| I3 / U3 | I2 plus export helper and decision/report Store methods | I2 plus accept Finding, all save-form branches, complete, export |
| I4 / U4/final | exact final six-key composition and optional Pi Runtime | all twenty final public methods |

The same exported factory names and approved paths are retained. Each tuple
advertises only its implemented internal methods and exact dependency keys;
there is no `Partial`, `any`, cast-to-final object, no-op success, throwing
Adapter placeholder, registry, fallback, or special bootstrap app. The full
IPC facade and projection are not partialized. Inactive routes perform the
ordered Main refusal defined in design.md. Final evidence requires retirement
of every intermediate-only signature, record-admission branch, config-oracle
branch, and development-incomplete refusal, with the exact final contract and
full P5 runner restored.

Existing Project admission is also tuple-specific. After the unchanged raw
header/application-id/user-version/journal/integrity preflight, a read-only
record check refuses the whole Project as public `FORBIDDEN` before any
business-write connection or semantic reconciliation when rows, states,
receipts, references, or form kinds require a later tuple. SQLite-native
rollback of an exact recognized hot journal remains the sole separately
attributed physical-write exception before record inspection. No later data is
omitted, defaulted, migrated, repaired, or marked corrupt. Later builds open
earlier Projects without migration or identity/receipt churn.

## Decision authority and history

The first Spec draft correctly stopped because the approved Desktop Run has two
immutable CSV sources, performs no provider/model call, and must preserve
evidence under `.xanthil/runs/<run_id>/`, while the existing executable
`RunArtifactStore` is fixture- and model-specific. The read-only source finding
is retained at:

- `baseline-integrity-001/run-store-contract-precheck-001.json`
- 21124 bytes
- SHA-256
  `69767ed425e985f44a8238cc73f83f326b315540b284fd2aa6892dd3eca314fd`

The blocker is superseded, not erased, by Technical Decision Amendment 001 and
the coordinator decision. The approved business ledger remains unchanged. The
named-Change structure-grill exception authorizes the Spec role to select only
the minimum technical field, version, identity, and Port/factory details needed
to encode that ledger. It does not authorize new business behavior.

## Selected contract

The Change adds a closed Desktop Run Artifact contract with manifest
`schema_version: "3.0"` under the existing `.xanthil/runs` root.

- `packages/product-core/xanthil-desktop-decision-case.ts` owns the Desktop
  manifest types, closed validation, deterministic-result shapes, and exact
  terminal lifecycle rules.
- `packages/ports/xanthil-desktop-decision-case.ts` owns one business-oriented
  `DesktopRunEvidenceStore` Port.
- `adapters/storage-local/xanthil-desktop-decision-case.ts` exports the one
  `createLocalDesktopRunEvidenceStore` factory and implements the approved
  staging, atomic publication, terminalization, and exact-run-id reads.
- The Personal Desktop Profile composes that factory directly. There is no
  generic registry, version dispatcher, shared-store abstraction, migration,
  root scan, adoption service, repair loop, or fallback.
- Desktop `run_id` remains a canonical lowercase UUIDv7 so the existing Run
  root naming convention is preserved. Other newly generated Desktop record
  identities are native `crypto.randomUUID()` lowercase UUIDv4 values; no
  custom base32 identity or encoder is introduced.
- The manifest records exactly two source snapshots in fixed order: members,
  then orders. It records deterministic DuckDB/Python execution and
  `model_usage: "none"`; provider, model, Agent Runtime, Pi, tool-call, and
  session fields are prohibited.
- All money, count, and rational values crossing JSON or IPC are canonical
  decimal strings. SQLite arithmetic and aggregation use checked signed 64-bit
  integers through `bigint`; overflow is `CALCULATION_FAILED`, never rounded or
  partially published.
- Offline Assistance doubles enter only through the public business-Port/
  Profile composition factory in contract/integration tests. Those tests use
  real Application/store state and may create a closed synthetic Project;
  after its writer closes, the same frozen production `.app` opens that Project
  through normal Main/Profile/preload/IPC/Renderer to prove visible pending,
  failure, edit/adopt/reject, manual-fallback, save, and reopen behavior. There
  is no second package or packaged injection. The normal factory selects Pi;
  Main, preload, IPC, Renderer, and environment expose no double selector or
  arbitrary transport. Production-package, persisted synthetic-state GUI, and
  Pi Adapter contract evidence remain distinctly attributed.

The exact schema, file inventory, consumer matrix, failure behavior, and
cross-store publication point are frozen in `structure-decision.md` and
`design.md`.

## Compatibility decision

The Desktop 3.0 contract is coexistence, not an extension of old consumers:

| Consumer | Accepted manifests after this Change | 3.0 behavior |
|---|---|---|
| Existing `LocalRunArtifactStore` writer | creates 2.0 only | never creates 3.0 |
| Existing `LocalRunArtifactStore.readTerminalRun` | terminal 1.0 and 2.0 only | existing unsupported-version failure |
| Existing Console `createLocalRunEvidenceReader` | selected-directory 1.0 only | `RUN_CONTRACT_UNSUPPORTED` |
| New `DesktopRunEvidenceStore` | Desktop 3.0 only | validates exact Desktop lifecycle |

The selected-directory Console reader does not enumerate `.xanthil/runs`, and
the new Desktop store addresses one exact UUIDv7 directory. Thus mixed versions
may share the physical root without routing ambiguity. Old Product Core,
Application, adapter, Profile, CLI, Console, fixtures, manifests, and tests are
not rewritten or widened. Existing 1.0/2.0 artifacts remain byte-compatible;
there is no backfill or migration.

Compatibility evidence must include the unchanged local-analysis suites and
all four unchanged `tests/{unit,contract,integration,e2e}/run-evidence-console`
suites. The canonical validation runner does not currently include those four
Console phases; P5 must append them explicitly before the Desktop phases rather
than claim they are already covered.

## Historical completed post-Gate root-configuration decision

The adopted P4 `package.json` is exactly the approved dependency matrix, so the
TEST-XCLI-021 deep-equality failure is an obsolete compatibility oracle rather
than product RED or dependency drift. The selected minimum correction is one
closed two-state test contract:

- P4 is the exact adopted manifest/lock plus the retained 12-option/43-file
  tsconfig and three-file repository-config inventory;
- P5 is the exact P4 dependency graph plus only the approved Main/config/three
  scripts, `jsx: "react-jsx"`, 25 ordered Desktop TS/TSX additions, and four
  approved build config names;
- any partial/mixed state, unknown key, wrong version, omitted/reordered file,
  extra config, or lock/install drift fails;
- dependency health freezes exact approved identity/version/source/integrity,
  Project-local installation, and required entry capability, while the
  package-appropriate read-only/local proof method is not a public contract;
- every original TEST-XCLI-021 negative remains and TEST-XCLI-022 is unchanged.

The refreshed ponytail/affected Spec Gate, one-file narrow Test, focused GREEN,
complete canonical baseline, and four explicit unchanged Console suites all
passed. That compatibility maintenance is historical evidence only: it is not
product RED or TDD_READY and grants no current write permission to the old
TEST-XCLI path. P4 PASS is retained without replay. The recovered product Test
is a separate fresh-context continuation limited to the sixteen current
Test-owned paths in path-contract.md.

## Gate boundary

This incremental closeout changes no product, UI, dependency, persistence,
security, or final evidence obligation. It closes the finite internal tuples,
admission/refusal semantics, 15 ordered loops, 91 evidence leaves, commands and
retirement. It does not dispatch Test, approve RED/TDD_READY, change production
code, call a provider, write Git/board/host state, or release the Change. Root
must rereview the complete package with ponytail and the affected Spec Gate.
Only PASS may release U1.1 Test; each Worker remains locked until that loop's
valid TDD_READY.
