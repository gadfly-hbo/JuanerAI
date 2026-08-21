# TASK-007 Worker Handoff — Authorized Reproducible First Stack

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Gate, Authority, and Route

- Spec Gate: PASS.
- User explicitly authorized creating `/Users/huangbo/JuanerAI/package.json` and `/Users/huangbo/JuanerAI/package-lock.json` and performing a project-local npm install of exact `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`.
- TEST-XCLI-021 is accepted expected RED: its independent negative oracle passes, then the only focused failure is `ENOENT` for the absent root `package.json`; `1` test, `0` pass, `1` fail, zero skipped/cancelled/todo.
- Goal: create the exact approved manifest, generate its npm 11.12.1 lock, install only the frozen project-local dependency graph, and turn unchanged TEST-XCLI-021 GREEN.
- Non-goals: no Agent Adapter implementation, test edit, scripts/build tooling, global install/configuration, credential/model/network use beyond npm registry dependency resolution, alternative package manager, unrelated upgrade, or production behavior.
- Classification: R2/standard supply-chain and reproducibility boundary.
- Route: bounded Worker at `gpt-5.6-terra` high. One route attempt; stop on install/lock/contract drift rather than substituting the global Pi installation.

## Ownership and Effects

- Allowed source writes only:
  - `/Users/huangbo/JuanerAI/package.json`
  - `/Users/huangbo/JuanerAI/package-lock.json`
- Authorized generated install effect:
  - `/Users/huangbo/JuanerAI/node_modules/**`, created only by the frozen project-local npm install.
- Forbidden: tests, production modules, OpenSpec/project-control, global npm/Pi prefixes, credentials, npm configuration, other manifests/lockfiles, scripts/tooling, Python packages, and every other path.
- No cleanup or deletion command is authorized. The root currently has no package manifest, lock, or project-local `node_modules`; if that assumption is false at Worker start, stop `INSTALL_STATE_CONFLICT` before writing.
- You are not alone in the repository. Preserve every existing file and do not revert another agent's work.

## Exact Manifest

Create exactly:

```json
{
  "private": true,
  "type": "module",
  "packageManager": "npm@11.12.1",
  "engines": {
    "node": ">=22.19.0"
  },
  "dependencies": {
    "@earendil-works/pi-coding-agent": "0.84.2",
    "typebox": "1.3.7"
  }
}
```

No `name`, version, scripts, dev/optional/peer dependencies, workspace, compiler, bundler, build, overrides, resolutions, package-manager alternative, or range is authorized.

## Install Procedure

1. Confirm the three authorized targets are absent and record the high-write before snapshot.
2. Create `package.json` with the exact bytes/shape above using the approved file-edit mechanism.
3. Run once:
   - `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`
4. Before installing packages, inspect the generated lock and fail closed unless:
   - npm lockfile version is supported by npm 11.12.1;
   - the root lock entry mirrors exactly the two approved direct dependencies;
   - local package entries resolve exact `0.84.2` and `1.3.7`;
   - no additional direct dependency or lifecycle script was introduced.
5. Run once from the repository root:
   - `npm install --ignore-scripts --no-audit --no-fund`
6. Do not use the global Pi package, `npm link`, global flags, alternate prefix/cache config, `--force`, `--legacy-peer-deps`, lifecycle scripts, or a second install attempt.

Transitive packages required by the two exact direct dependencies are permitted only as lockfile/install-tree transitive entries. They do not become direct dependencies.

## Constraint Matrix and Evidence

Before writing, return a concise matrix covering:

- exact manifest and direct-dependency closure;
- lock root and installed-version parity;
- project-local resolution versus global Pi;
- Node/npm/DuckDB/Python prerequisites;
- no scripts/build/compiler/alternate lock/Python package surface;
- install failure/no-retry handling;
- allowed source writes and generated `node_modules` effect;
- positive TEST-XCLI-021 evidence and its negative-first oracle.

## Write Risk and Validation Budget

- `write_risk: high` because npm creates a substantial generated dependency tree and may use cache/network. The task content write is confined to two root artifacts plus project-local `node_modules`; the Worker CLI's own session/history/log growth must be reported separately.
- Before/after non-blocking write-risk snapshots:
  - `node /Users/huangbo/Dev/AgentOps/coding-system/tools/write-risk/write-risk-monitor.mjs snapshot --repo /Users/huangbo/JuanerAI --label before`
  - corresponding `snapshot --label after` and an inline size/count comparison summary; do not persist snapshots in the repository.
- Manifest/lock JSON/static inspection: any number, read-only after generation.
- Lock-only command: maximum `1/1`.
- Project-local install command: maximum `1/1`.
- Dependency inventory: maximum one `npm ls --depth=0 --json`.
- Final focused GREEN: maximum one execution:
  - `node --test --test-name-pattern='^TEST-XCLI-021' tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- Version commands: one each for Node, npm, DuckDB, and Python.
- No full suite, Agent Adapter tests, E2E, audit/update/outdated, build, model/provider, credential, global npm, or equivalent retry.

If lock generation, install, local resolution, or focused validation fails, stop with exact `INSTALL_BLOCKED`, `LOCK_CONTRACT_DRIFT`, or `REVISION_SCOPE_ESCALATION`; do not retry, edit tests, broaden dependencies, or fall back to the global Pi CLI.

## Handoff

Return:

- exact changed source artifacts and generated install effect;
- constraint-matrix mapping;
- lockfile version/root/direct dependency evidence;
- project-local resolved paths and exact installed package versions without dumping the transitive tree;
- engine versions;
- TEST-XCLI-021 counts and command budget;
- install command counts, lifecycle-script suppression, no global mutation/model/credential evidence;
- high-write before/after summary, anomalous large files/cache/log/WAL findings, and cleanup requirement if any;
- `TASK_007_READY_FOR_CONTROLLER_REVIEW` or an exact stop signal.

Do not start TASK-005, TASK-006, or Validator. Controller independently accepts and advances the Gate.
