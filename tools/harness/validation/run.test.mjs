import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('TEST-XDESK-CF-RESTORATION requires full Console then Desktop phases without intermediate selectors',async()=>{
  const source=await readFile(PUBLIC_RUNNER,'utf8');
  const actual=source.split('\n').map(line=>line.replace(/^run_group \S+ /,'')).filter(line=>/^node --test (?:--test-concurrency=1 )?(tests|tools)\//.test(line));
  const expected=[
    'node --test tools/harness/validation/*.test.mjs',
    'node --test tests/unit/xanthil-local-analysis/*.test.ts',
    'node --test tests/integration/xanthil-local-analysis/*.test.ts',
    'node --test tests/contract/model-pack-contract-enabler/*.test.ts',
    'node --test tests/integration/model-pack-contract-enabler/*.test.ts',
    'node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs',
    "node --test tests/unit/run-evidence-console/run-evidence.unit.test.ts",
    "node --test tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts",
    "node --test tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts",
    "node --test tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts",
    "node --test tests/unit/xanthil-desktop/*.test.ts tests/unit/xanthil-desktop/open-analysis-client.unit.test.mjs tests/unit/xanthil-desktop/report-studio-source.unit.test.mjs",
    "node --test tests/contract/xanthil-desktop/*.test.ts",
    "node --test tests/integration/xanthil-desktop/*.test.ts tests/integration/xanthil-desktop/browser-companion-process.test.mjs tests/integration/xanthil-desktop/browser-service-view.test.mjs tests/integration/xanthil-desktop/browser-workspace-view.test.mjs",
    "node --test tests/integration/decision-platform/*.test.ts tests/integration/decision-platform/*.test.mjs",
  ];
  assert.deepEqual(actual,expected);
  assert.doesNotMatch(source,/test-name-pattern|phase[_-]?selector|configuration[_-]?selector|desktop:package/);
  assert.match(source,/unset XANTHIL_REAL_PI_ACCEPTANCE/);
  assert.notDeepEqual(actual.filter(line=>!line.includes('run-evidence-console')),expected,'Console omission cannot masquerade as final coverage');
});

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PUBLIC_RUNNER = path.join(REPO_ROOT, 'tools', 'harness', 'validation', 'run');
const CANONICAL_NODE = process.execPath;
const VALIDATION_CHILD = 'validation:runner-fixture.test.mjs:unset';
const C0_RUNNER_CHILDREN = Object.freeze([
  'unit:local-analysis.unit.test.ts:unset',
  'integration:local-analysis.integration.test.ts:unset',
  'contract:model-pack-contract-enabler.contract.test.ts:unset',
  'integration:model-pack-contract-enabler.integration.test.ts:unset',
  'project-board:project-control.test.mjs:unset',
  'project-board:status-cli.test.mjs:unset',
]);
const CF_CONSOLE_PATHS = Object.freeze([
  "tests/unit/run-evidence-console/run-evidence.unit.test.ts",
  "tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts",
  "tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts",
  "tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts"
]);
// D006 exact current suites; approved retired runtime-only paths have no aliases.
const CF_DESKTOP_GROUPS = [
  [
    "tests/unit/xanthil-desktop/case-assistant.unit.test.ts",
    "tests/unit/xanthil-desktop/coverage-map.test.ts",
    "tests/unit/xanthil-desktop/development-mode.test.ts",
    "tests/unit/xanthil-desktop/member-task-canonical.unit.test.ts",
    "tests/unit/xanthil-desktop/open-analysis-autonomous-arguments.unit.test.ts",
    "tests/unit/xanthil-desktop/open-analysis-code-output.unit.test.ts",
    "tests/unit/xanthil-desktop/open-analysis-methods.unit.test.ts",
    "tests/unit/xanthil-desktop/open-analysis-semantics.unit.test.ts",
    "tests/unit/xanthil-desktop/open-analysis-workbench.unit.test.ts",
    "tests/unit/xanthil-desktop/open-computation-context.unit.test.ts",
    "tests/unit/xanthil-desktop/open-membership-framework.unit.test.ts",
    "tests/unit/xanthil-desktop/provider-credentials.unit.test.ts",
    "tests/unit/xanthil-desktop/provider-settings.unit.test.ts",
    "tests/unit/xanthil-desktop/report-postprocessing.unit.test.ts",
    "tests/unit/xanthil-desktop/report-studio-source.unit.test.ts",
    "tests/unit/xanthil-desktop/xanthil-desktop.unit.test.ts",
    "tests/unit/xanthil-desktop/open-analysis-client.unit.test.mjs",
    "tests/unit/xanthil-desktop/report-studio-source.unit.test.mjs"
  ],
  [
    "tests/contract/xanthil-desktop/case-assistant-store.contract.test.ts",
    "tests/contract/xanthil-desktop/member-analysis-plan.contract.test.ts",
    "tests/contract/xanthil-desktop/member-task-ui.contract.test.ts",
    "tests/contract/xanthil-desktop/new-architecture-build.contract.test.ts",
    "tests/contract/xanthil-desktop/report-studio-bundle.contract.test.ts",
    "tests/contract/xanthil-desktop/report-studio-gateway.contract.test.ts",
    "tests/contract/xanthil-desktop/report-studio-policy.contract.test.ts",
    "tests/contract/xanthil-desktop/report-studio-store.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-main-module-format.contract.test.ts",
    "tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts"
  ],
  [
    "tests/integration/xanthil-desktop/browser-client.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-companion.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-independent-profile.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-local-transport.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-membership-plan.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-membership-recovery.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-model-policy.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-model-runtime.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-node-entry.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-preparation.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-project-catalog.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-service-auth.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-ui-http.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-ui-live.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-ui-report-content.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-workspace.integration.test.ts",
    "tests/integration/xanthil-desktop/case-assistant.integration.test.ts",
    "tests/integration/xanthil-desktop/case-collaboration-lifecycle.integration.test.ts",
    "tests/integration/xanthil-desktop/case-collaboration.integration.test.ts",
    "tests/integration/xanthil-desktop/conversational-three-core.integration.test.ts",
    "tests/integration/xanthil-desktop/member-analysis-chain.integration.test.ts",
    "tests/integration/xanthil-desktop/member-task-retained.integration.test.ts",
    "tests/integration/xanthil-desktop/member-task.integration.test.ts",
    "tests/integration/xanthil-desktop/metric-assets-browser.integration.test.ts",
    "tests/integration/xanthil-desktop/metric-assets-import.integration.test.ts",
    "tests/integration/xanthil-desktop/metric-assets-store.integration.test.ts",
    "tests/integration/xanthil-desktop/multiturn-requirement-updates.integration.test.ts",
    "tests/integration/xanthil-desktop/native-computation-capability.integration.test.ts",
    "tests/integration/xanthil-desktop/native-only-flow.integration.test.ts",
    "tests/integration/xanthil-desktop/native-read-feedback.integration.test.ts",
    "tests/integration/xanthil-desktop/new-architecture-agent.integration.test.ts",
    "tests/integration/xanthil-desktop/new-architecture-case.integration.test.ts",
    "tests/integration/xanthil-desktop/new-architecture-desktop.integration.test.ts",
    "tests/integration/xanthil-desktop/new-architecture-membership.integration.test.ts",
    "tests/integration/xanthil-desktop/new-architecture-normal-entry.integration.test.ts",
    "tests/integration/xanthil-desktop/new-architecture-persistence.integration.test.ts",
    "tests/integration/xanthil-desktop/normal-entry-parameters.integration.test.ts",
    "tests/integration/xanthil-desktop/open-analysis-autonomous-native-session.integration.test.ts",
    "tests/integration/xanthil-desktop/open-analysis-storage.integration.test.ts",
    "tests/integration/xanthil-desktop/open-computation-asset.integration.test.ts",
    "tests/integration/xanthil-desktop/open-computation-fresh-diagnostics.integration.test.ts",
    "tests/integration/xanthil-desktop/open-computation-independent-context.integration.test.ts",
    "tests/integration/xanthil-desktop/open-document-source.integration.test.ts",
    "tests/integration/xanthil-desktop/pi-harness-first-loop.integration.test.ts",
    "tests/integration/xanthil-desktop/provider-settings.integration.test.ts",
    "tests/integration/xanthil-desktop/report-postprocessing.integration.test.ts",
    "tests/integration/xanthil-desktop/report-studio-http.integration.test.ts",
    "tests/integration/xanthil-desktop/report-studio-local-access.integration.test.ts",
    "tests/integration/xanthil-desktop/report-studio-process.integration.test.ts",
    "tests/integration/xanthil-desktop/report-studio-profile.integration.test.ts",
    "tests/integration/xanthil-desktop/report-studio-workspace.integration.test.ts",
    "tests/integration/xanthil-desktop/requirement-draft.integration.test.ts",
    "tests/integration/xanthil-desktop/retry-policy-configuration.integration.test.ts",
    "tests/integration/xanthil-desktop/sdk041-case-session.integration.test.ts",
    "tests/integration/xanthil-desktop/sdk041-connection-probe.integration.test.ts",
    "tests/integration/xanthil-desktop/sdk041-session-purposes.integration.test.ts",
    "tests/integration/xanthil-desktop/shared-analysis-tools.integration.test.ts",
    "tests/integration/xanthil-desktop/shared-runtime-state.integration.test.ts",
    "tests/integration/xanthil-desktop/three-core-browser-ui.integration.test.ts",
    "tests/integration/xanthil-desktop/three-core-model-report.integration.test.ts",
    "tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts",
    "tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts",
    "tests/integration/xanthil-desktop/xlsx-package-root.integration.test.ts",
    "tests/integration/xanthil-desktop/browser-companion-process.test.mjs",
    "tests/integration/xanthil-desktop/browser-service-view.test.mjs",
    "tests/integration/xanthil-desktop/browser-workspace-view.test.mjs"
  ],
  []
];
const CF_TSCONFIG_APPENDIX = Object.freeze([
  "packages/product-core/xanthil-desktop-decision-case.ts",
  "packages/application/xanthil-desktop-decision-case.ts",
  "packages/contracts/xanthil-desktop-ipc.ts",
  "packages/ports/xanthil-desktop-decision-case.ts",
  "adapters/storage-local/xanthil-desktop-decision-case.ts",
  "adapters/analytics-duckdb/process.ts",
  "adapters/analytics-duckdb/xanthil-desktop-decision-case.ts",
  "profiles/personal/xanthil-desktop.ts",
  "apps/desktop/main.ts",
  
  
  "tests/fixtures/xanthil-desktop/coverage-map.ts",
  "tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts",
  "tests/fixtures/xanthil-desktop/desktop-e2e-harness.ts",
  "tests/fixtures/xanthil-desktop/desktop-fixtures.ts",
  "tests/unit/xanthil-desktop/xanthil-desktop.unit.test.ts",
  "tests/unit/xanthil-desktop/coverage-map.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts",
  
  "tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts",
  "tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts",
  
  "tests/contract/xanthil-desktop/xanthil-desktop-main-module-format.contract.test.ts"
]);
// Accepted Change002 AC-01–13 / PS-01–08 additions to the preserved43+25 roots.
// Independent literals; never infer expected roots or phases from actual config.
const CHANGE002_TSCONFIG_APPENDIX = Object.freeze([
  'packages/contracts/case-assistant.ts',
  'packages/product-core/case-assistant.ts',
  'packages/application/case-assistant.ts',
  'packages/ports/case-assistant.ts',
  
  'adapters/storage-local/case-assistant.ts',
  
  
  
  'tests/integration/xanthil-desktop/case-assistant.integration.test.ts',
  
  
  'tests/contract/xanthil-desktop/case-assistant-store.contract.test.ts',
  'tests/unit/xanthil-desktop/case-assistant.unit.test.ts',
  'tests/fixtures/case-assistant/fixtures.ts',
  'tests/fixtures/case-assistant/completed-case.ts',
  
  
  'packages/ports/provider-settings.ts',
  'packages/contracts/provider-settings.ts',
  'packages/application/provider-settings.ts',
  'adapters/credentials-macos/index.ts',
  
  'tests/unit/xanthil-desktop/provider-settings.unit.test.ts',
  'tests/integration/xanthil-desktop/provider-settings.integration.test.ts',
  
  
]);
// Accepted Change003 prepends these four roots to the retained100, in this order.
// Keep independent literals so config omissions/substitutions cannot define the oracle.
const CHANGE003_TSCONFIG_PREFIX = Object.freeze([
  
  'tests/integration/xanthil-desktop/case-collaboration.integration.test.ts',
  'tests/integration/xanthil-desktop/conversational-three-core.integration.test.ts',
  'tests/integration/xanthil-desktop/case-collaboration-lifecycle.integration.test.ts',
  
]);
// Approved Change004 P1 plan/chain/task/runtime/native coverage appends seven
// roots after the retained104. Keep this oracle independent of actual config.
const CHANGE004_TSCONFIG_APPENDIX = Object.freeze([
  'tests/contract/xanthil-desktop/member-analysis-plan.contract.test.ts',
  'tests/integration/xanthil-desktop/member-analysis-chain.integration.test.ts',
  'tests/integration/xanthil-desktop/member-task.integration.test.ts',
  
  
  
  
]);
// Approved CI-only mechanical partition; original Change004 roots stay intact.
const CI_MAINTENANCE_TSCONFIG_APPENDIX = Object.freeze([
  'tests/integration/xanthil-desktop/member-task-retained.integration.test.ts',
  'tests/fixtures/xanthil-desktop/member-task-test-support.ts',
]);
// Change005 accepted D1/D3/D5 consumers append without moving retained roots.
const CHANGE005_TSCONFIG_APPENDIX = Object.freeze([
  'tests/integration/xanthil-desktop/browser-preparation.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-membership-recovery.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-local-transport.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-membership-plan.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-workspace.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-client.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-model-runtime.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-model-policy.integration.test.ts',
  'profiles/personal/browser-membership.ts',
  'tests/integration/xanthil-desktop/browser-companion.integration.test.ts',
  'apps/browser/service-main.ts',
  'tests/integration/xanthil-desktop/browser-independent-profile.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-project-catalog.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-service-auth.integration.test.ts',
  'tests/integration/xanthil-desktop/browser-node-entry.integration.test.ts',
  'adapters/agent-pi/provider-credentials.ts',
  'tests/unit/xanthil-desktop/provider-credentials.unit.test.ts',
  'tests/integration/xanthil-desktop/open-agent-ledger.integration.test.ts',
  'adapters/storage-local/open-analysis-collaboration.ts',
  
  'packages/ports/open-analysis-code.ts',
  'adapters/analytics-duckdb/open-analysis-code.ts',
  
  'tests/unit/xanthil-desktop/open-analysis-code-output.unit.test.ts',
  'packages/ports/open-analysis-runtime.ts',
  'tests/integration/xanthil-desktop/open-agent-runtime.integration.test.ts',
  
  'tests/unit/xanthil-desktop/open-analysis-workbench.unit.test.ts',
  'packages/ports/open-analysis-verifier.ts',
  
  'packages/application/open-analysis.ts',
  
  'packages/ports/open-analysis-store.ts',
  'adapters/storage-local/open-analysis.ts',
  'tests/integration/xanthil-desktop/open-analysis-storage.integration.test.ts',
  'packages/application/open-analysis-workspace.ts',
  'profiles/personal/open-analysis.ts',
  
  
  'packages/product-core/open-analysis-methods.ts',
  'tests/unit/xanthil-desktop/open-analysis-methods.unit.test.ts',
  'tests/integration/xanthil-desktop/open-document-source.integration.test.ts',
  'tests/unit/xanthil-desktop/open-membership-framework.unit.test.ts',
  'tests/integration/xanthil-desktop/shared-runtime-state.integration.test.ts',
  'tests/integration/xanthil-desktop/requirement-draft.integration.test.ts',
  'tests/integration/xanthil-desktop/shared-analysis-tools.integration.test.ts',
]);
// Change006 additive, independently fixed roots; the Change005 inventory stays intact.
const CHANGE006_TSCONFIG_APPENDIX = Object.freeze([
  'tests/integration/xanthil-desktop/metric-assets-import.integration.test.ts',
  'tests/integration/xanthil-desktop/metric-assets-store.integration.test.ts',
  
  
  
  
  
  'tests/integration/xanthil-desktop/metric-assets-browser.integration.test.ts',
]);
// Report Studio adds independent exact roots; no earlier inventory is weakened.
const DECISION_TSCONFIG_APPENDIX = Object.freeze([
  "adapters/decision-platform/ingress.ts",
  "tests/integration/decision-platform/ingress.integration.test.ts",
  "adapters/decision-platform/process.ts",
  "adapters/decision-platform/child.ts",
  "adapters/decision-platform/material-policy.ts",
  "packages/ports/decision-platform.ts",
  "tests/integration/decision-platform/process.integration.test.ts",
  "tests/integration/decision-platform/material-policy.integration.test.ts",
  "adapters/decision-platform/store.ts",
  "adapters/decision-platform/gateway.ts",
  "packages/application/decision-platform.ts",
  "tests/integration/decision-platform/store.integration.test.ts",
  "tests/integration/decision-platform/gateway.integration.test.ts",
  "tests/integration/decision-platform/workspace.integration.test.ts",
  "adapters/decision-platform/history.ts",
  "adapters/decision-platform/runtime-channel.ts",
  "adapters/decision-platform/materials.ts",
  "adapters/decision-platform/effects-gateway.ts",
  "adapters/decision-platform/extraction-scope.ts",
  "adapters/decision-platform/runtime-authorization.ts",
  "packages/application/decision-sources.ts",
  "packages/application/decision-effects.ts",
  "tests/integration/decision-platform/sources.integration.test.ts",
  "tests/integration/decision-platform/host-http.integration.test.ts",
  "tests/integration/decision-platform/runtime-authorization.integration.test.ts",
  "tests/integration/decision-platform/effects.integration.test.ts",
  "tests/integration/decision-platform/extraction-scope.integration.test.ts",
  "profiles/personal/decision-platform.ts",
  "apps/browser/decision-platform-http.ts",
  "tests/integration/decision-platform/materials.integration.test.ts",
  "tests/integration/decision-platform/effects-gateway.integration.test.ts"
]);
const HARNESS_TSCONFIG_APPENDIX=Object.freeze(['tests/integration/xanthil-desktop/pi-harness-first-loop.integration.test.ts']);
const DECISION_TEST_PATHS = Object.freeze([
  "tests/integration/decision-platform/effects-gateway.integration.test.ts",
  "tests/integration/decision-platform/effects.integration.test.ts",
  "tests/integration/decision-platform/extraction-scope.integration.test.ts",
  "tests/integration/decision-platform/gateway.integration.test.ts",
  "tests/integration/decision-platform/host-http.integration.test.ts",
  "tests/integration/decision-platform/ingress.integration.test.ts",
  "tests/integration/decision-platform/material-policy.integration.test.ts",
  "tests/integration/decision-platform/materials.integration.test.ts",
  "tests/integration/decision-platform/process.integration.test.ts",
  "tests/integration/decision-platform/runtime-authorization.integration.test.ts",
  "tests/integration/decision-platform/sources.integration.test.ts",
  "tests/integration/decision-platform/store.integration.test.ts",
  "tests/integration/decision-platform/workspace.integration.test.ts",
  "tests/integration/decision-platform/ui-contract.integration.test.mjs"
]);
const REPORT_STUDIO_TSCONFIG_APPENDIX = Object.freeze([
  'packages/contracts/report-studio.ts',
  'adapters/report-studio/bundle.ts',
  'tests/contract/xanthil-desktop/report-studio-bundle.contract.test.ts',
  'packages/application/report-studio-source.ts',
  'tests/unit/xanthil-desktop/report-studio-source.unit.test.ts',
  'packages/ports/report-studio.ts',
  'adapters/report-studio/store.ts',
  'tests/contract/xanthil-desktop/report-studio-store.contract.test.ts',
  'packages/application/report-studio.ts',
  'tests/integration/xanthil-desktop/report-studio-workspace.integration.test.ts',
  'adapters/report-studio/local-access.ts',
  'tests/integration/xanthil-desktop/report-studio-local-access.integration.test.ts',
  'adapters/report-studio/gateway.ts',
  'tests/contract/xanthil-desktop/report-studio-gateway.contract.test.ts',
  'adapters/report-studio/process.ts',
  'tests/integration/xanthil-desktop/report-studio-process.integration.test.ts',
  'profiles/personal/report-studio.ts',
  'tests/integration/xanthil-desktop/report-studio-profile.integration.test.ts',
  'apps/browser/report-studio-http.ts',
  'tests/integration/xanthil-desktop/report-studio-http.integration.test.ts',
  'adapters/report-studio/policy.ts',
  'tests/contract/xanthil-desktop/report-studio-policy.contract.test.ts',
  'apps/browser/installed-main.ts',
]);

test('CI-REPORT-STUDIO-001: new roots reject omission, substitution, duplication, reordering and extras', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-report-studio-'));
  t.after(() => rm(root, {recursive:true,force:true}));
  for (const name of C1A_TUPLE_CONFIGURATION_FILES) await cp(path.join(REPO_ROOT,name),path.join(root,name));
  assert.equal(await currentRunnerTuple(root),'CF');
  const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8'));
  const start=original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-HARNESS_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length-DECISION_TSCONFIG_APPENDIX.length-REPORT_STUDIO_TSCONFIG_APPENDIX.length;
  for(let i=start;i<original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-HARNESS_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length-DECISION_TSCONFIG_APPENDIX.length;i++) {
    for(const [label,files] of [
      ['omit',original.files.filter((_,n)=>n!==i)],
      ['replace',original.files.map((f,n)=>n===i?'tests/unapproved.test.ts':f)],
      ['duplicate',original.files.map((f,n)=>n===i?original.files[i-1]:f)],
      ['reorder',original.files.map((f,n)=>n===i?original.files[i-1]:n===i-1?original.files[i]:f)],
      ['extra',[...original.files,'tests/unapproved.test.ts']],
    ]) await t.test(i+' '+label,async()=>{
      await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));
      await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});
    });
  }
});
const C0_ROOT_COUNT = 43;
const DEVELOPMENT_TSCONFIG_APPENDIX = Object.freeze([
  'apps/desktop/development.ts', 
  'tests/unit/xanthil-desktop/development-mode.test.ts',
  
]);
const DESKTOP_ROOT_START = CHANGE003_TSCONFIG_PREFIX.length + C0_ROOT_COUNT;
const CHANGE004_ROOT_START = DESKTOP_ROOT_START + CF_TSCONFIG_APPENDIX.length +
  CHANGE002_TSCONFIG_APPENDIX.length + DEVELOPMENT_TSCONFIG_APPENDIX.length;
const FIXTURE_BUILD_OBSERVATION = 'fixture-build:case-assistant:unset';
const C0_RUNNER_TEST_TARGETS = Object.freeze([
  'tools/harness/validation/*.test.mjs',
  'tests/unit/xanthil-local-analysis/*.test.ts',
  'tests/integration/xanthil-local-analysis/*.test.ts',
  'tests/contract/model-pack-contract-enabler/*.test.ts', 'tests/integration/model-pack-contract-enabler/*.test.ts',
  'tools/harness/project-board/project-control.test.mjs', 'tools/harness/project-board/status-cli.test.mjs',
]);
const C0_TUPLE_CONFIGURATION_FILES = Object.freeze(['package-lock.json', 'package.json', 'tsconfig.json']);
const C1A_TUPLE_CONFIGURATION_FILES = Object.freeze(['forge.config.cjs', 'package-lock.json', 'package.json', 'tsconfig.json', 'vite.main.config.mjs']);
const focusedChildren = tuple => tuple === 'CF' ? CF_DESKTOP_GROUPS.filter(paths=>paths.length>0).map(paths=>['--test',...paths]) : [];

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({
      code,
      signal,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stderr).toString('utf8')
    }));
  });
}

async function writeExecutable(file, text) {
  await writeFile(file, text, 'utf8');
  await chmod(file, 0o755);
}

async function entries(root) {
  const found = [];
  async function visit(relative = '') {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const next = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(next);
      else found.push(next);
    }
  }
  await visit();
  return found.sort();
}

/**
 * H-TUPLE proves the complete closed tuple first.  This independent, minimal
 * discriminator selects the fixed runner expectation for that already-healthy
 * C0 or C1a tuple; it never derives an expectation from runner source.
 */
const DEEP_RESEARCH_TSCONFIG_APPENDIX = Object.freeze(['packages/ports/deep-research.ts','packages/application/deep-research.ts','profiles/personal/deep-research.ts','apps/browser/deep-research-http.ts']);
const AGENT_TSCONFIG_APPENDIX=Object.freeze([
  "packages/ports/open-analysis-judgment-review.ts",
  "packages/product-core/open-analysis-judgment-conditions.ts",
  "packages/product-core/open-analysis-judgment-review.ts",
  "packages/product-core/open-analysis-natural-review.ts",
  "packages/product-core/open-analysis-option-unit.ts",
  "packages/product-core/open-analysis-reviewable-document.ts",
  "packages/product-core/open-analysis-reviewed-content.ts",
  "packages/product-core/open-reviewed-analysis-source.ts",
  "tests/fixtures/xanthil-desktop/change007-b06-actual102.ts",
  "tests/fixtures/xanthil-desktop/change007-content-model.ts",
  "tests/fixtures/xanthil-desktop/change007-long-artifact.ts",
  "tests/integration/xanthil-desktop/agent-host-proposal-contract.integration.test.ts",
  "tests/integration/xanthil-desktop/agent-host-browser-entry.integration.test.ts",
  "tests/integration/xanthil-desktop/open-analysis-long-artifact.integration.test.ts",
  "tests/integration/xanthil-desktop/open-analysis-natural-review.integration.test.ts",
  "tests/integration/xanthil-desktop/normal-entry-parameters.integration.test.ts"
]);
const METRIC_FACTORY_TSCONFIG_APPENDIX = Object.freeze(['packages/ports/metric-factory.ts','packages/application/metric-factory.ts','adapters/metric-factory/bundle.ts','adapters/metric-factory/copies.ts','adapters/metric-factory/process.ts','profiles/personal/metric-factory.ts','apps/browser/metric-factory-http.ts','tests/integration/metric-factory/copies.test.ts','tests/integration/metric-factory/process.test.ts']);
// Frozen literal; never loaded from actual configuration to form expectations.
const D006_TSCONFIG_ROOTS=[
  "tests/integration/xanthil-desktop/case-collaboration.integration.test.ts",
  "tests/integration/xanthil-desktop/case-collaboration-lifecycle.integration.test.ts",
  "packages/product-core/local-analysis.ts",
  "packages/ports/local-analysis.ts",
  "tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts",
  "tests/unit/xanthil-local-analysis/coverage-map.test.ts",
  "tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts",
  "tests/fixtures/xanthil-local-analysis/coverage-map.ts",
  "tests/fixtures/xanthil-local-analysis/fixture-oracle.ts",
  "tests/fixtures/xanthil-local-analysis/port-contracts.ts",
  "tests/fixtures/xanthil-local-analysis/public-seams.ts",
  "apps/console/xanthil-console.ts",
  "packages/application/run-evidence-query.ts",
  "packages/product-core/run-evidence.ts",
  "packages/ports/run-evidence-reader.ts",
  "adapters/storage-local/run-evidence-reader.ts",
  "profiles/personal/console.ts",
  "tests/unit/run-evidence-console/run-evidence.unit.test.ts",
  "tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts",
  "tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts",
  "tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts",
  "tests/fixtures/run-evidence-console/run-evidence-fixtures.ts",
  "tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts",
  "tests/fixtures/run-evidence-console/console-harness.ts",
  "tests/fixtures/run-evidence-console/coverage-map.ts",
  "packages/contracts/model-pack.ts",
  "packages/ports/analytical-model-runtime.ts",
  "tests/contract/model-pack-contract-enabler/model-pack-package.contract.test.ts",
  "tests/contract/model-pack-contract-enabler/analytical-model-runtime.contract.test.ts",
  "tests/integration/model-pack-contract-enabler/contracts-inactive.integration.test.ts",
  "tests/fixtures/model-pack-contract-enabler/model-pack-fixtures.ts",
  "tests/fixtures/model-pack-contract-enabler/model-pack-package-driver.ts",
  "tests/fixtures/model-pack-contract-enabler/analytical-model-runtime-driver.ts",
  "packages/product-core/xanthil-desktop-decision-case.ts",
  "packages/application/xanthil-desktop-decision-case.ts",
  "packages/contracts/xanthil-desktop-ipc.ts",
  "packages/ports/xanthil-desktop-decision-case.ts",
  "adapters/storage-local/xanthil-desktop-decision-case.ts",
  "adapters/analytics-duckdb/process.ts",
  "adapters/analytics-duckdb/xanthil-desktop-decision-case.ts",
  "profiles/personal/xanthil-desktop.ts",
  "apps/desktop/main.ts",
  "tests/fixtures/xanthil-desktop/coverage-map.ts",
  "tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts",
  "tests/fixtures/xanthil-desktop/desktop-e2e-harness.ts",
  "tests/fixtures/xanthil-desktop/desktop-fixtures.ts",
  "tests/unit/xanthil-desktop/xanthil-desktop.unit.test.ts",
  "tests/unit/xanthil-desktop/coverage-map.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts",
  "tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts",
  "tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts",
  "tests/contract/xanthil-desktop/xanthil-desktop-main-module-format.contract.test.ts",
  "packages/contracts/case-assistant.ts",
  "packages/product-core/case-assistant.ts",
  "packages/application/case-assistant.ts",
  "packages/ports/case-assistant.ts",
  "adapters/storage-local/case-assistant.ts",
  "tests/integration/xanthil-desktop/case-assistant.integration.test.ts",
  "tests/contract/xanthil-desktop/case-assistant-store.contract.test.ts",
  "tests/unit/xanthil-desktop/case-assistant.unit.test.ts",
  "tests/fixtures/case-assistant/fixtures.ts",
  "tests/fixtures/case-assistant/completed-case.ts",
  "packages/ports/provider-settings.ts",
  "packages/contracts/provider-settings.ts",
  "packages/application/provider-settings.ts",
  "adapters/credentials-macos/index.ts",
  "tests/unit/xanthil-desktop/provider-settings.unit.test.ts",
  "tests/integration/xanthil-desktop/provider-settings.integration.test.ts",
  "apps/desktop/development.ts",
  "tests/unit/xanthil-desktop/development-mode.test.ts",
  "tests/contract/xanthil-desktop/member-analysis-plan.contract.test.ts",
  "tests/integration/xanthil-desktop/member-analysis-chain.integration.test.ts",
  "tests/integration/xanthil-desktop/member-task.integration.test.ts",
  "tests/integration/xanthil-desktop/member-task-retained.integration.test.ts",
  "tests/fixtures/xanthil-desktop/member-task-test-support.ts",
  "tests/integration/xanthil-desktop/browser-preparation.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-membership-recovery.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-local-transport.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-membership-plan.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-workspace.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-client.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-model-runtime.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-model-policy.integration.test.ts",
  "profiles/personal/browser-membership.ts",
  "tests/integration/xanthil-desktop/browser-companion.integration.test.ts",
  "apps/browser/service-main.ts",
  "tests/integration/xanthil-desktop/browser-independent-profile.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-project-catalog.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-service-auth.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-node-entry.integration.test.ts",
  "adapters/agent-pi/provider-credentials.ts",
  "tests/unit/xanthil-desktop/provider-credentials.unit.test.ts",
  "packages/ports/analysis-agent.ts",
  "adapters/agent-pi/professional-agent.ts",
  "adapters/agent-pi/persistent-runtime-state.ts",
  "tests/integration/xanthil-desktop/new-architecture-agent.integration.test.ts",
  "tests/integration/xanthil-desktop/new-architecture-persistence.integration.test.ts",
  "packages/ports/open-analysis-code.ts",
  "tests/unit/xanthil-desktop/open-analysis-code-output.unit.test.ts",
  "packages/ports/open-analysis-runtime.ts",
  "tests/unit/xanthil-desktop/open-analysis-workbench.unit.test.ts",
  "packages/ports/open-analysis-verifier.ts",
  "packages/application/open-analysis.ts",
  "packages/ports/open-analysis-store.ts",
  "adapters/storage-local/open-analysis.ts",
  "tests/integration/xanthil-desktop/open-analysis-storage.integration.test.ts",
  "packages/application/open-analysis-workspace.ts",
  "profiles/personal/open-analysis.ts",
  "packages/product-core/open-analysis-methods.ts",
  "tests/unit/xanthil-desktop/open-analysis-methods.unit.test.ts",
  "tests/integration/xanthil-desktop/open-document-source.integration.test.ts",
  "tests/unit/xanthil-desktop/open-membership-framework.unit.test.ts",
  "tests/integration/xanthil-desktop/shared-runtime-state.integration.test.ts",
  "tests/integration/xanthil-desktop/requirement-draft.integration.test.ts",
  "tests/integration/xanthil-desktop/shared-analysis-tools.integration.test.ts",
  "tests/integration/xanthil-desktop/metric-assets-import.integration.test.ts",
  "tests/integration/xanthil-desktop/metric-assets-store.integration.test.ts",
  "tests/integration/xanthil-desktop/metric-assets-browser.integration.test.ts",
  "packages/contracts/report-studio.ts",
  "adapters/report-studio/bundle.ts",
  "tests/contract/xanthil-desktop/report-studio-bundle.contract.test.ts",
  "packages/application/report-studio-source.ts",
  "tests/unit/xanthil-desktop/report-studio-source.unit.test.ts",
  "packages/ports/report-studio.ts",
  "adapters/report-studio/store.ts",
  "tests/contract/xanthil-desktop/report-studio-store.contract.test.ts",
  "packages/application/report-studio.ts",
  "tests/integration/xanthil-desktop/report-studio-workspace.integration.test.ts",
  "adapters/report-studio/local-access.ts",
  "tests/integration/xanthil-desktop/report-studio-local-access.integration.test.ts",
  "adapters/report-studio/gateway.ts",
  "tests/contract/xanthil-desktop/report-studio-gateway.contract.test.ts",
  "adapters/report-studio/process.ts",
  "tests/integration/xanthil-desktop/report-studio-process.integration.test.ts",
  "profiles/personal/report-studio.ts",
  "tests/integration/xanthil-desktop/report-studio-profile.integration.test.ts",
  "apps/browser/report-studio-http.ts",
  "tests/integration/xanthil-desktop/report-studio-http.integration.test.ts",
  "adapters/report-studio/policy.ts",
  "tests/contract/xanthil-desktop/report-studio-policy.contract.test.ts",
  "apps/browser/installed-main.ts",
  "adapters/decision-platform/ingress.ts",
  "tests/integration/decision-platform/ingress.integration.test.ts",
  "adapters/decision-platform/process.ts",
  "adapters/decision-platform/child.ts",
  "adapters/decision-platform/material-policy.ts",
  "packages/ports/decision-platform.ts",
  "tests/integration/decision-platform/process.integration.test.ts",
  "tests/integration/decision-platform/material-policy.integration.test.ts",
  "adapters/decision-platform/store.ts",
  "adapters/decision-platform/gateway.ts",
  "packages/application/decision-platform.ts",
  "tests/integration/decision-platform/store.integration.test.ts",
  "tests/integration/decision-platform/gateway.integration.test.ts",
  "tests/integration/decision-platform/workspace.integration.test.ts",
  "adapters/decision-platform/history.ts",
  "adapters/decision-platform/runtime-channel.ts",
  "adapters/decision-platform/materials.ts",
  "adapters/decision-platform/effects-gateway.ts",
  "adapters/decision-platform/extraction-scope.ts",
  "adapters/decision-platform/runtime-authorization.ts",
  "packages/application/decision-sources.ts",
  "packages/application/decision-effects.ts",
  "tests/integration/decision-platform/sources.integration.test.ts",
  "tests/integration/decision-platform/host-http.integration.test.ts",
  "tests/integration/decision-platform/runtime-authorization.integration.test.ts",
  "tests/integration/decision-platform/effects.integration.test.ts",
  "tests/integration/decision-platform/extraction-scope.integration.test.ts",
  "profiles/personal/decision-platform.ts",
  "apps/browser/decision-platform-http.ts",
  "tests/integration/decision-platform/materials.integration.test.ts",
  "tests/integration/decision-platform/effects-gateway.integration.test.ts",
  "tests/integration/xanthil-desktop/pi-harness-first-loop.integration.test.ts",
  "packages/ports/deep-research.ts",
  "packages/application/deep-research.ts",
  "profiles/personal/deep-research.ts",
  "apps/browser/deep-research-http.ts",
  "packages/ports/open-analysis-judgment-review.ts",
  "packages/product-core/open-analysis-judgment-conditions.ts",
  "packages/product-core/open-analysis-judgment-review.ts",
  "packages/product-core/open-analysis-natural-review.ts",
  "packages/product-core/open-analysis-option-unit.ts",
  "packages/product-core/open-analysis-reviewable-document.ts",
  "packages/product-core/open-analysis-reviewed-content.ts",
  "packages/product-core/open-reviewed-analysis-source.ts",
  "tests/fixtures/xanthil-desktop/change007-b06-actual102.ts",
  "tests/fixtures/xanthil-desktop/change007-content-model.ts",
  "tests/integration/xanthil-desktop/normal-entry-parameters.integration.test.ts",
  "packages/ports/metric-factory.ts",
  "packages/application/metric-factory.ts",
  "adapters/metric-factory/bundle.ts",
  "adapters/metric-factory/copies.ts",
  "adapters/metric-factory/process.ts",
  "profiles/personal/metric-factory.ts",
  "apps/browser/metric-factory-http.ts",
  "tests/integration/metric-factory/copies.test.ts",
  "tests/integration/metric-factory/process.test.ts",
  "tests/contract/xanthil-desktop/new-architecture-build.contract.test.ts",
  "tests/integration/xanthil-desktop/new-architecture-case.integration.test.ts",
  "tests/integration/xanthil-desktop/new-architecture-desktop.integration.test.ts",
  "tests/integration/xanthil-desktop/new-architecture-membership.integration.test.ts",
  "tests/integration/xanthil-desktop/new-architecture-normal-entry.integration.test.ts",
  "tests/contract/xanthil-desktop/member-task-ui.contract.test.ts",
  "tests/integration/xanthil-desktop/browser-ui-http.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-ui-live.integration.test.ts",
  "tests/integration/xanthil-desktop/browser-ui-report-content.integration.test.ts",
  "tests/integration/xanthil-desktop/open-analysis-autonomous-native-session.integration.test.ts",
  "tests/integration/xanthil-desktop/sdk041-case-session.integration.test.ts",
  "tests/integration/xanthil-desktop/sdk041-connection-probe.integration.test.ts",
  "tests/integration/xanthil-desktop/sdk041-session-purposes.integration.test.ts",
  "tests/integration/xanthil-desktop/xlsx-package-root.integration.test.ts",
  "tests/unit/xanthil-desktop/member-task-canonical.unit.test.ts",
  "tests/unit/xanthil-desktop/open-analysis-autonomous-arguments.unit.test.ts",
  "tests/unit/xanthil-desktop/open-analysis-semantics.unit.test.ts",
  "tests/integration/xanthil-desktop/open-computation-asset.integration.test.ts",
  "tests/integration/xanthil-desktop/open-computation-fresh-diagnostics.integration.test.ts",
  "tests/integration/xanthil-desktop/open-computation-independent-context.integration.test.ts",
  "tests/unit/xanthil-desktop/open-computation-context.unit.test.ts",
  "packages/ports/report-postprocessing.ts",
  "packages/product-core/report-postprocessing.ts",
  "packages/application/report-postprocessing.ts",
  "tests/fixtures/xanthil-desktop/report-postprocessing-provider.ts",
  "tests/unit/xanthil-desktop/report-postprocessing.unit.test.ts",
  "tests/integration/xanthil-desktop/report-postprocessing.integration.test.ts",
  "tests/integration/xanthil-desktop/three-core-model-report.integration.test.ts",
  "tests/integration/xanthil-desktop/native-computation-capability.integration.test.ts",
  "tests/integration/xanthil-desktop/three-core-browser-ui.integration.test.ts",
  "tests/integration/xanthil-desktop/conversational-three-core.integration.test.ts",
  "tests/integration/xanthil-desktop/multiturn-requirement-updates.integration.test.ts",
  "tests/integration/xanthil-desktop/native-only-flow.integration.test.ts",
  "tests/integration/xanthil-desktop/native-read-feedback.integration.test.ts",
  "tests/fixtures/xanthil-desktop/native-report.ts",
  "tests/integration/xanthil-desktop/retry-policy-configuration.integration.test.ts"
];
async function currentRunnerTuple(root = REPO_ROOT) {
  const [manifestSource, tsconfigSource, rootEntries] = await Promise.all([
    readFile(path.join(root, 'package.json'), 'utf8'),
    readFile(path.join(root, 'tsconfig.json'), 'utf8'),
    readdir(root, { withFileTypes: true }),
  ]);
  const manifest = JSON.parse(manifestSource);
  const tsconfig = JSON.parse(tsconfigSource);
  const scripts = manifest.scripts;
  const files = tsconfig.files;
  assert.equal(typeof scripts, 'object', 'the tuple discriminator requires the manifest scripts object');
  assert.equal(Array.isArray(files), true, 'the tuple discriminator requires the explicit tsconfig files array');
  const knownConfigurationFiles = rootEntries
    .filter((entry) => entry.isFile() && [...C1A_TUPLE_CONFIGURATION_FILES].includes(entry.name))
    .map((entry) => entry.name)
    .sort();

  assert.equal(manifest.main, '.vite/build/main.cjs', 'the already-approved CommonJS package entry remains exact');
  assert.deepEqual(manifest.config, { forge: './forge.config.cjs' }, 'C1a requires the exact P5 Forge config');
  assert.equal(tsconfig.compilerOptions?.jsx, 'react-jsx', 'C1a requires its exact JSX mode');
  assert.deepEqual(files,D006_TSCONFIG_ROOTS,'D006 complete fixed root inventory: no missing, replaced, duplicate, reordered or extra roots');
  assert.deepEqual(knownConfigurationFiles,C1A_TUPLE_CONFIGURATION_FILES);
  return 'CF';
}
function expectedRunnerChildren(tuple) {
  if(tuple==='C0')return C0_RUNNER_CHILDREN;
  const child=path=>path.split('/')[1]+':'+path.split('/').at(-1)+':unset';
  return [...C0_RUNNER_CHILDREN,...CF_CONSOLE_PATHS.map(child),...CF_DESKTOP_GROUPS.slice(0,3).flat().map(child),FIXTURE_BUILD_OBSERVATION,...CF_DESKTOP_GROUPS[3].map(child),...DECISION_TEST_PATHS.map(child),'decision-ui:unset'];
}
function expectedRunnerTestTargets(tuple) {
  return tuple==='C0'?C0_RUNNER_TEST_TARGETS:[...C0_RUNNER_TEST_TARGETS,...CF_CONSOLE_PATHS,
    'tests/unit/xanthil-desktop/*.test.ts','tests/unit/xanthil-desktop/open-analysis-client.unit.test.mjs','tests/unit/xanthil-desktop/report-studio-source.unit.test.mjs','tests/contract/xanthil-desktop/*.test.ts',
    'tests/integration/xanthil-desktop/*.test.ts','tests/integration/xanthil-desktop/browser-companion-process.test.mjs','tests/integration/xanthil-desktop/browser-service-view.test.mjs','tests/integration/xanthil-desktop/browser-workspace-view.test.mjs','tests/integration/decision-platform/*.test.ts','tests/integration/decision-platform/*.test.mjs'];
}

function testTargetsFromRunnerSource(source) {
  return source.split('\n').flatMap((line) => line.match(/(?:tests\/|tools\/harness\/(?:project-board|validation)\/)[^\s'"]+\.test\.(?:ts|mjs)/g) ?? []);
}

function desktopArgvRecords(lines) {
  return lines.filter((line) => line.startsWith('argv:') && line.includes('xanthil-desktop'));
}

async function fixture(t, {
  wrongNode = false,
  failGroup = '',
  failTarget = '',
  runnerTuple = 'C0',
  duckdbOutput = 'v1.5.2 (Variegata) 8a5851971f'
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-'));
  const bin = path.join(root, 'toolchain-bin');
  const observation = path.join(root, 'observation.log');
  const nodeVersion = wrongNode ? 'v25.0.0' : 'v26.0.0';
  await mkdir(bin, { recursive: true });
  await mkdir(path.join(root, 'tools', 'harness', 'validation'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', '@types', 'node'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', 'typescript'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', 'typebox'), { recursive: true });
  for (const directory of [
    'tests/fixtures/case-assistant',
    'tests/unit/xanthil-local-analysis',
    ...CF_CONSOLE_PATHS.map(file=>path.dirname(file)),
    ...(runnerTuple==='CF'?['tests/e2e/xanthil-desktop','tests/integration/decision-platform','tools/decision-platform']:[]),
    ...(runnerTuple !== 'C0' ? ['tests/unit/xanthil-desktop', 'tests/integration/xanthil-desktop'] : []),
    'tests/contract/xanthil-local-analysis',
    ...(runnerTuple !== 'C0' ? ['tests/contract/xanthil-desktop'] : []),
    'tests/integration/xanthil-local-analysis',
    'tests/e2e/xanthil-local-analysis',
    'tests/contract/model-pack-contract-enabler',
    'tests/integration/model-pack-contract-enabler',
    'tools/harness/project-board'
  ]) await mkdir(path.join(root, directory), { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    dependencies: {
      typebox: '1.3.7'
    },
    devDependencies: {
      '@types/node': '22.19.19',
      typescript: '5.9.3'
    },
    scripts: { typecheck: 'tsc -p tsconfig.json --noEmit' }
  }), 'utf8');
  await writeFile(path.join(root, 'node_modules', '@types', 'node', 'package.json'), '{"version":"22.19.19"}\n', 'utf8');
  await writeFile(path.join(root, 'node_modules', 'typescript', 'package.json'), '{"version":"5.9.3"}\n', 'utf8');
  await writeFile(path.join(root, 'node_modules', 'typebox', 'package.json'), '{"version":"1.3.7"}\n', 'utf8');
  await writeFile(path.join(root, 'tsconfig.json'), '{"compilerOptions":{"strict":true,"noEmit":true}}\n', 'utf8');
  for (const file of [
    'tools/harness/validation/runner-fixture.test.mjs',
    'tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts',
    
    'tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts',
    
    'tests/contract/model-pack-contract-enabler/model-pack-contract-enabler.contract.test.ts',
    'tests/integration/model-pack-contract-enabler/model-pack-contract-enabler.integration.test.ts',
    'tools/harness/project-board/project-control.test.mjs',
    'tools/harness/project-board/status-cli.test.mjs',
    ...(runnerTuple==='CF'?[...CF_CONSOLE_PATHS,...CF_DESKTOP_GROUPS.flat(),...DECISION_TEST_PATHS,'tools/decision-platform/build-ui.mjs','tests/fixtures/case-assistant/build-native-fixture.mjs']:[]),
  ]) await writeFile(path.join(root, file), '// fixture placeholder\n', 'utf8');

  await writeExecutable(path.join(bin, 'node'), `#!/bin/sh
set -eu
case "$1" in
  --version) printf '%s\\n' '${nodeVersion}' ;;
  -e|-p) exec '${CANONICAL_NODE}' "$@" ;;
  --check)
    printf 'syntax:%s\\n' "\${2##*/}" >> "$CVR_OBSERVATION"
    if [ "\${CVR_FIXTURE_FAIL:-}" = syntax ]; then printf 'native syntax stderr\\n' >&2; exit 17; fi
    ;;
  tests/fixtures/case-assistant/build-native-fixture.mjs)
    [ "$#" = 1 ] || exit 64
    printf 'fixture-build:case-assistant:%s\\n' "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
    [ "\${CVR_FIXTURE_FAIL:-}" != fixture-build ] || { printf 'native fixture-build stderr\\n' >&2; exit 37; }
    ;;
  tools/decision-platform/build-ui.mjs)
    printf 'decision-ui:%s\\n' "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
    [ "\${CVR_FIXTURE_FAIL:-}" != decision-ui ] || exit 37
    ;;
  --test|--experimental-strip-types)
    test_mode=false
    for arg in "$@"; do [ "$arg" = --test ] && test_mode=true; done
    [ "$test_mode" = true ] || { printf 'unexpected fake node invocation: %s\n' "$*" >&2; exit 64; }
    argv=
    for arg in "$@"; do argv="\${argv}\${argv:+|}\${arg}"; done
    printf 'argv:%s\n' "$argv" >> "$CVR_OBSERVATION"
    group=unknown
    for arg in "$@"; do case "$arg" in
      *tests/unit/*) group=unit ;;
      *tests/contract/*) group=contract ;;
      *tests/integration/*) group=integration ;;
      *tests/e2e/*) group=e2e ;;
      *tools/harness/project-board/*) group=project-board ;;
      *tools/harness/validation/*) group=validation ;;
    esac; done
    target=unknown
    target_failed=false
    for arg in "$@"; do case "$arg" in
      *.test.*)
        target="\${arg##*/}"
        if [ "\${CVR_FIXTURE_FAIL_TARGET:-}" = "$target" ]; then target_failed=true; fi
        printf '%s:%s:%s\\n' "$group" "$target" "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
        ;;
    esac; done
    [ "$target" != unknown ] || printf '%s:%s:%s\\n' "$group" "$target" "\${XANTHIL_REAL_PI_ACCEPTANCE-unset}" >> "$CVR_OBSERVATION"
    printf 'native %s stdout\\n' "$group"
    printf 'native %s stderr\\n' "$group" >&2
    if [ "\${CVR_FIXTURE_FAIL:-}" = "$group" ]; then exit 23; fi
    if [ "$target_failed" = true ]; then exit 31; fi
    ;;
  *) printf 'unexpected fake node invocation: %s\\n' "$*" >&2; exit 64 ;;
esac
`);
  await writeExecutable(path.join(bin, 'npm'), `#!/bin/sh
case "$1" in
  --version) printf '11.12.1\\n' ;;
  run)
    [ "$2" = typecheck ] || exit 64
    printf 'typecheck\\n' >> "$CVR_OBSERVATION"
    [ "\${CVR_FIXTURE_FAIL:-}" != typecheck ] || exit 29
    ;;
  *) exit 64 ;;
esac
`);
  await writeExecutable(path.join(bin, 'duckdb'), `#!/bin/sh
[ "$1" = --version ] && printf '%s\\n' '${duckdbOutput}' || exit 64
`);
  await writeExecutable(path.join(bin, 'python3'), "#!/bin/sh\n[ \"$1\" = --version ] && printf 'Python 3.9.6\\n' || exit 64\n");

  const health = await run(path.join(bin, 'node'), ['--test', 'tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts'], {
    cwd: root,
    env: { ...process.env, CVR_OBSERVATION: observation }
  });
  assert.equal(health.code, 0, 'fixture command health must be GREEN before runner observation');
  assert.match(await readFile(observation, 'utf8'), /unit:local-analysis\.unit\.test\.ts:unset\n$/, 'fixture must record an independently healthy child');
  await writeFile(observation, '', 'utf8');

  t.after(() => rm(root, { recursive: true, force: true }));
  const syntaxBasenames = (await entries(root))
    .filter((file) => file.endsWith('.mjs') || file.endsWith('.ts'))
    .map((file) => path.basename(file))
    .sort();
  return { root, bin, observation, failGroup, failTarget, syntaxBasenames };
}

async function installPublicRunner(f) {
  await stat(PUBLIC_RUNNER).catch(() => assert.fail(`expected public entrypoint is absent: ${PUBLIC_RUNNER}`));
  const destination = path.join(f.root, 'tools', 'harness', 'validation', 'run');
  await cp(PUBLIC_RUNNER, destination);
  await chmod(destination, 0o755);
  return destination;
}

async function invoke(f, runner, inherited = {}, args = []) {
  return run(runner, args, {
    cwd: path.join(f.root, 'elsewhere'),
    env: {
      ...process.env,
      ...inherited,
      PATH: '/caller-path-that-must-not-be-used',
      JUANERAI_TOOLCHAIN_BIN: f.bin,
      CVR_OBSERVATION: f.observation,
      CVR_FIXTURE_FAIL: f.failGroup,
      CVR_FIXTURE_FAIL_TARGET: f.failTarget
    }
  });
}

async function observedLines(f) {
  const text = await readFile(f.observation, 'utf8');
  return text === '' ? [] : text.trim().split('\n');
}

test('CI-PORTABLE-001: explicit portable mode retains every portable suite and reports package/GUI NOT RUN', async (t) => {
  const f = await fixture(t, { runnerTuple: 'CF' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' }, ['--portable']);
  assert.equal(result.code, 0, result.stderr);
  const excluded = ['xanthil-desktop-main-module-format.contract.test.ts', ...CF_DESKTOP_GROUPS[3].map(file=>path.basename(file)), FIXTURE_BUILD_OBSERVATION];
  assertCanonicalOrder(await observedLines(f), f, expectedRunnerChildren('CF').filter(line => !excluded.some(name => line.includes(name))));
  for (const label of ['Electron binary', 'packaged Main module', 'Desktop packaged GUI', 'native/manual acceptance']) {
    assert.ok(result.stdout.includes(`NOT RUN: ${label}`), label);
  }
  assert.doesNotMatch(result.stdout, /full.*PASS|product.*PASS/i);
});

test('CI-CHECK-001: canonical validation checks its own contracts first and stops before product work', async t => {
  const f = await fixture(t, { runnerTuple: 'CF', failGroup: 'validation' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' }, ['--portable']);
  assert.equal(result.code, 23, 'the validation contract failure must stop the public runner');
  assert.deepEqual((await observedLines(f)).filter(line => !line.startsWith('argv:')), [VALIDATION_CHILD]);
  assert.match(result.stdout, /native validation stdout/);
  assert.match(result.stderr, /native validation stderr/);
});

test('CI-LOG-003: failed canonical group reports duration and exact child exit', async t => {
  const f = await fixture(t, { runnerTuple: 'CF', failGroup: 'validation' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.equal(result.code, 23);
  assert.match(result.stdout, /BEGIN validation-contracts\n/);
  assert.match(result.stdout, /END validation-contracts exit=23 duration=[0-9]+s\n/);
});

test('CI-PORTABLE-002: portable failures stop later suites and default mode cannot inherit a portable bypass', async (t) => {
  const f = await fixture(t, { runnerTuple: 'CF', failTarget: 'xanthil-desktop-store.contract.test.ts' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, {}, ['--portable']);
  assert.equal(result.code, 31);
  assert.match(result.stderr, /native contract stderr/);
  assert.equal((await observedLines(f)).some(line => !line.startsWith('syntax:') && line.includes('xanthil-desktop-storage.integration.test.ts')), false);
  const full = await fixture(t, { runnerTuple: 'CF' });
  const fullRunner = await installPublicRunner(full);
  await mkdir(path.join(full.root, 'elsewhere'));
  assert.equal((await invoke(full, fullRunner, { JUANERAI_VALIDATION_SCOPE: 'portable' })).code, 0);
  assertCanonicalOrder(await observedLines(full), full, expectedRunnerChildren('CF'));
});

function assertCanonicalOrder(lines, f, expectedSuites) {
  const syntax = lines.filter((line) => line.startsWith('syntax:'));
  const phases = lines.filter((line) => !line.startsWith('syntax:') && !line.startsWith('argv:'));
  assert.deepEqual(syntax.slice().sort(), f.syntaxBasenames.map((name) => `syntax:${name}`));
  assert.deepEqual(phases, [VALIDATION_CHILD, 'typecheck', ...expectedSuites]);
  assert.equal(lines.indexOf(VALIDATION_CHILD), 1, 'one validation argv must precede its child');
  assert.equal(lines.indexOf('typecheck'), syntax.length + 2, 'contracts and native syntax precede strict typecheck');
}

test('Final CF checkpoint preserves mapped roots and complete offline behavior coverage', async () => {
  assert.equal(await currentRunnerTuple(), 'CF');
  const source = await readFile(PUBLIC_RUNNER, 'utf8');
  assert.deepEqual(testTargetsFromRunnerSource(source), expectedRunnerTestTargets('CF'));
  assert.doesNotMatch(source, /phase[_-]?selector|configuration[_-]?selector|desktop:package/);
});

test('CI-CHECK-001: fixed Desktop fixture inventory matches actual suite files', async () => {
  for (const [index, group] of ['unit', 'contract', 'integration', 'e2e'].entries()) {
    const directory = `tests/${group}/xanthil-desktop`;
    const names=await readdir(path.join(REPO_ROOT,directory)).catch(error=>{
      if(error.code==='ENOENT'&&CF_DESKTOP_GROUPS[index].length===0)return[];
      throw error;
    });
    const actual=[...names.filter(name=>name.endsWith('.test.ts')).sort(),...(['tests/integration/xanthil-desktop','tests/unit/xanthil-desktop'].includes(directory)?names.filter(name=>name.endsWith('.test.mjs')).sort():[])].map(name=>`${directory}/${name}`);
    assert.deepEqual(actual, CF_DESKTOP_GROUPS[index], 'new source tests require explicit fixture coverage, not automatic acceptance');
  }
});

test('CVR-TEST-001: selected toolchain passes and starts offline checks in order', async (t) => {
  const tuple = await currentRunnerTuple();
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.equal(result.code, 0);
  const lines = await observedLines(f);
  assert.ok(lines.includes('typecheck'), 'the strict typecheck phase must run after native syntax checks');
  assertCanonicalOrder(lines, f, expectedRunnerChildren(tuple));
  assert.deepEqual(desktopArgvRecords(lines), focusedChildren(tuple).map((argv) => `argv:${argv.join('|')}`), `${tuple} retains every C0 child effect and adds only its fixed C1a focused argv`);
});

test('CVR-TEST-002: wrong version fails before every validation command', async (t) => {
  const f = await fixture(t, { wrongNode: true });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(f.observation, 'utf8'), '');

  const missingToken = await fixture(t, { duckdbOutput: '(Variegata) 8a5851971f' });
  const missingTokenRunner = await installPublicRunner(missingToken);
  await mkdir(path.join(missingToken.root, 'elsewhere'));
  const missingTokenResult = await invoke(missingToken, missingTokenRunner);
  assert.notEqual(missingTokenResult.code, 0);
  assert.equal(await readFile(missingToken.observation, 'utf8'), '');

  const mismatchedToken = await fixture(t, { duckdbOutput: 'v1.5.1 (Variegata) 8a5851971f' });
  const mismatchedTokenRunner = await installPublicRunner(mismatchedToken);
  await mkdir(path.join(mismatchedToken.root, 'elsewhere'));
  const mismatchedTokenResult = await invoke(mismatchedToken, mismatchedTokenRunner);
  assert.notEqual(mismatchedTokenResult.code, 0);
  assert.equal(await readFile(mismatchedToken.observation, 'utf8'), '');
});

test('CVR-TEST-003: inherited real-model gate is absent from the E2E child', async (t) => {
  const tuple = await currentRunnerTuple();
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.equal(result.code, 0);
  assert.match(await readFile(f.observation, 'utf8'), /e2e:.*:unset/);
});

test('CVR-TEST-004: validation failure streams natively, stops later checks, and creates no result', async (t) => {
  const f = await fixture(t, { failGroup: 'contract' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const before = await entries(f.root);
  const result = await invoke(f, runner);
  assert.notEqual(result.code, 0);
  assert.match(result.stdout, /native contract stdout/);
  assert.match(result.stderr, /native contract stderr/);
  assertCanonicalOrder(await observedLines(f), f, [
    'unit:local-analysis.unit.test.ts:unset',
    'integration:local-analysis.integration.test.ts:unset',
    'contract:model-pack-contract-enabler.contract.test.ts:unset'
  ]);
  assert.deepEqual(await entries(f.root), before, 'runner must not create a result or other persistent output');
});

test('TEST-XDESK-013: each approved C0 or C1a tuple runs only its independently fixed validation phase order and stops at its first native failure', async (t) => {
  const tuple = await currentRunnerTuple();
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.equal(result.code, 0);
  const lines = await observedLines(f);
  assertCanonicalOrder(lines, f, expectedRunnerChildren(tuple));
  assert.deepEqual(
    desktopArgvRecords(lines),
    focusedChildren(tuple).map((argv) => `argv:${argv.join('|')}`),
    `${tuple} invokes only its independently fixed Desktop child argv; C0/C1a runner mismatch is rejected rather than inferred`,
  );

  const failureTarget = tuple !== 'C0' ? 'xanthil-desktop.unit.test.ts' : 'model-pack-contract-enabler.contract.test.ts';
  const failing = await fixture(t, { runnerTuple: tuple, failTarget: failureTarget });
  const failingRunner = await installPublicRunner(failing);
  await mkdir(path.join(failing.root, 'elsewhere'));
  const failed = await invoke(failing, failingRunner);
  assert.notEqual(failed.code, 0);
  assert.match(failed.stdout, tuple !== 'C0' ? /native unit stdout/ : /native contract stdout/);
  assert.match(failed.stderr, tuple !== 'C0' ? /native unit stderr/ : /native contract stderr/);
  const stopped = (await observedLines(failing)).filter((line) => !line.startsWith('syntax:') && !line.startsWith('argv:'));
  const expectedStopped = tuple !== 'C0'
    ? [VALIDATION_CHILD, 'typecheck', ...C0_RUNNER_CHILDREN,...CF_CONSOLE_PATHS.map(p=>p.split('/')[1]+':'+p.split('/').at(-1)+':unset'), ...CF_DESKTOP_GROUPS[0].map(p=>'unit:'+path.basename(p)+':unset')]
    : [
    VALIDATION_CHILD,
    'typecheck',
    'unit:local-analysis.unit.test.ts:unset',
    ];
  assert.deepEqual(stopped, expectedStopped, `${tuple} streams its first failing retained/focused phase and stops every later phase`);
});

test('AC-XDESK-LA-004-01: preflights exact local tool and dependency health before product phases without calling it RED', async (t) => {
  const f = await fixture(t, { wrongNode: true });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner);
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(f.observation, 'utf8'), '', 'preflight failure must stop before syntax, typecheck, or product suites');
});

test('AC-XDESK-LA-004-02: C0/C1a retain only their fixed runner phase list and exact selector-free focused argv', async () => {
  const tuple = await currentRunnerTuple();
  const source = await readFile(PUBLIC_RUNNER, 'utf8');
  assert.deepEqual(testTargetsFromRunnerSource(source), expectedRunnerTestTargets(tuple), `${tuple} runner target order is a fixed Test literal and cannot borrow another tuple's phase`);
  assert.doesNotMatch(source, /test-name-pattern|phase[_-]?selector|configuration[_-]?selector/, 'the final runner has no partial coverage or runtime/configuration selector');
  assert.equal(CF_CONSOLE_PATHS.length,4);assert.equal(CF_DESKTOP_GROUPS.length,4);
});

test('AC-XDESK-LA-004-03: streams native failure stops later phases removes real-model gate and creates no success output', async (t) => {
  const f = await fixture(t, { failGroup: 'integration' });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const before = await entries(f.root);
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.notEqual(result.code, 0);
  assert.match(result.stdout, /native integration stdout/);
  assert.match(result.stderr, /native integration stderr/);
  assert.doesNotMatch(await readFile(f.observation, 'utf8'), /:1$/m);
  assert.deepEqual(await entries(f.root), before);
});

test('AC-XDESK-LA-004-04: C0/C1a preserve the no-debug gate separation without preclaiming package or native acceptance', async (t) => {
  const tuple = await currentRunnerTuple();
  const source = await readFile(PUBLIC_RUNNER, 'utf8');
  const desktopTargets = testTargetsFromRunnerSource(source).filter((target) => target.includes('xanthil-desktop'));
  assert.deepEqual(desktopTargets,expectedRunnerTestTargets(tuple).filter(target=>target.includes('xanthil-desktop')), 'CF runs all Desktop phases against the separately frozen healthy package');
  assert.doesNotMatch(source, /desktop:package/, 'the runner cannot silently rebuild or claim normal native/manual acceptance');
  assert.match(source, /unset XANTHIL_REAL_PI_ACCEPTANCE/, 'the runner explicitly removes the inherited real-model gate before its children');
  const f = await fixture(t, { runnerTuple: tuple });
  const runner = await installPublicRunner(f);
  await mkdir(path.join(f.root, 'elsewhere'));
  const result = await invoke(f, runner, { XANTHIL_REAL_PI_ACCEPTANCE: '1' });
  assert.equal(result.code, 0);
  assert.doesNotMatch(await readFile(f.observation, 'utf8'), /:1$/m, 'the real owned children receive no inherited real-model gate');
});

test('CI-CHANGE002-001: closed roots reject omission, substitution, reordering and extra configuration', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-tuple-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of C1A_TUPLE_CONFIGURATION_FILES) await cp(path.join(REPO_ROOT,name),path.join(root,name));
  assert.equal(await currentRunnerTuple(root),'CF');
  const original = JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8'));
  for (const mutate of [
    files => files.slice(0,-1),
    files => [...files,'packages/application/unapproved.ts'],
    files => files.map((file,index)=>index===68?'packages/contracts/unapproved.ts':file),
    files => [...files.slice(0,68),files[69],files[68],...files.slice(70)],
    // Each added root must remain present, exact and in its approved position.
    ...[0,1,2,3].flatMap(index => [
      files => files.filter((_,position)=>position!==index),
      files => files.map((file,position)=>position===index?'tests/unapproved.test.ts':file),
      files => files.map((file,position)=>position===index?files[index+1]:position===index+1?files[index]:file),
    ]),
  ]) {
    await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files:mutate(original.files)}));
    await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});
  }
  await writeFile(path.join(root,'tsconfig.json'),JSON.stringify(original));
  const manifest = JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  await writeFile(path.join(root,'package.json'),JSON.stringify({...manifest,config:{forge:'./unapproved.cjs'}}));
  await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});
});

test('CI-CHANGE004-001: every appended root and retained boundary remain exact', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-change004-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of C1A_TUPLE_CONFIGURATION_FILES) await cp(path.join(REPO_ROOT,name),path.join(root,name));
  assert.equal(await currentRunnerTuple(root),'CF');
  const original = JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8'));
  const start = CHANGE004_ROOT_START;
  const mutations = [
    ['retained roots alone', files => files.slice(0,start)],
    ['extra trailing root', files => [...files,'tests/unapproved.test.ts']],
    ['extra leading root', files => ['tests/unapproved.test.ts',...files]],
    ['appendix moved before retained roots', files => [...files.slice(start),...files.slice(0,start)]],
    ['retained tail substituted', files => files.map((file,index)=>index===start-1?'tests/unapproved.test.ts':file)],
    ['retained tail reordered', files => [...files.slice(0,start-2),files[start-1],files[start-2],...files.slice(start)]],
    ...CHANGE004_TSCONFIG_APPENDIX.flatMap((_,offset) => { const index = start + offset; return [
      [`root ${index} omitted`, files => files.filter((_,position)=>position!==index)],
      [`root ${index} substituted`, files => files.map((file,position)=>position===index?'tests/unapproved.test.ts':file)],
      [`root ${index} replaced by preceding root`, files => files.map((file,position)=>position===index?files[index-1]:file)],
      [`root ${index} swapped with preceding root`, files => files.map((file,position)=>position===index?files[index-1]:position===index-1?files[index]:file)],
    ]; }),
  ];
  for (const [name, mutate] of mutations) await t.test(name, async () => {
    await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files:mutate(original.files)}));
    await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'},name);
  });
  await writeFile(path.join(root,'tsconfig.json'),JSON.stringify(original));
  assert.equal(await currentRunnerTuple(root),'CF','the restored approved tuple remains healthy');
});

test('CI-CHANGE002-002: full fixture build failure stops GUI and fixed argv detects phase mutations', async t => {
  const failed = await fixture(t,{runnerTuple:'CF',failGroup:'fixture-build'});
  const runner = await installPublicRunner(failed);
  await mkdir(path.join(failed.root,'elsewhere'));
  const result = await invoke(failed,runner);
  assert.equal(result.code,37);
  assert.match(result.stderr,/native fixture-build stderr/);
  const expected = expectedRunnerChildren('CF');
  assertCanonicalOrder(await observedLines(failed),failed,expected.slice(0,expected.indexOf(FIXTURE_BUILD_OBSERVATION)+1));
  for (const mutate of [
    source => source.replace('run_group native-fixture node tests/fixtures/case-assistant/build-native-fixture.mjs\n',':\n'),
    source => source.replace('tests/integration/xanthil-desktop/browser-service-view.test.mjs tests/integration/xanthil-desktop/browser-workspace-view.test.mjs','tests/integration/xanthil-desktop/browser-workspace-view.test.mjs tests/integration/xanthil-desktop/browser-service-view.test.mjs'),
    source => source.replace('tests/integration/xanthil-desktop/browser-companion-process.test.mjs ',''),
  ]) {
    const f = await fixture(t,{runnerTuple:'CF'});
    const copied = await installPublicRunner(f);
    await writeFile(copied,mutate(await readFile(copied,'utf8')));
    await mkdir(path.join(f.root,'elsewhere'));
    assert.equal((await invoke(f,copied)).code,0,'mutant fixture must execute before its oracle is checked');
    const lines = await observedLines(f);
    assert.throws(()=>{
      assertCanonicalOrder(lines,f,expected);
      assert.deepEqual(desktopArgvRecords(lines),focusedChildren('CF').map(argv=>`argv:${argv.join('|')}`));
    },{code:'ERR_ASSERTION'},'accepted phase/argv oracle must reject this mutant');
  }
});

test('CI-CHECK-001: CI maintenance roots reject omission, substitution, duplication and reordering', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-maintenance-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of C1A_TUPLE_CONFIGURATION_FILES) await cp(path.join(REPO_ROOT, name), path.join(root, name));
  assert.equal(await currentRunnerTuple(root), 'CF');
  const original = JSON.parse(await readFile(path.join(root, 'tsconfig.json'), 'utf8'));
  const start = CHANGE004_ROOT_START + CHANGE004_TSCONFIG_APPENDIX.length;
  for (const offset of CI_MAINTENANCE_TSCONFIG_APPENDIX.keys()) {
    const index = start + offset;
    for (const [name, mutate] of [
      ['omit', files => files.filter((_, position) => position !== index)],
      ['substitute', files => files.map((file, position) => position === index ? 'tests/unapproved.test.ts' : file)],
      ['duplicate preceding', files => files.map((file, position) => position === index ? files[index - 1] : file)],
      ['swap preceding', files => files.map((file, position) => position === index ? files[index - 1] : position === index - 1 ? files[index] : file)],
    ]) await t.test(`${offset}: ${name}`, async () => {
      await writeFile(path.join(root, 'tsconfig.json'), JSON.stringify({ ...original, files: mutate(original.files) }));
      await assert.rejects(() => currentRunnerTuple(root), { code: 'ERR_ASSERTION' });
    });
  }
});

test('BF-R13 CI-CHANGE005: browser roots reject omission, substitution, duplication, reordering and extra roots', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-cvr-change005-'));
  t.after(() => rm(root, {recursive:true, force:true}));
  for (const name of C1A_TUPLE_CONFIGURATION_FILES) await cp(path.join(REPO_ROOT,name),path.join(root,name));
  assert.equal(await currentRunnerTuple(root),'CF');
  const original = JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8'));
  const start = CHANGE004_ROOT_START + CHANGE004_TSCONFIG_APPENDIX.length + CI_MAINTENANCE_TSCONFIG_APPENDIX.length;
  const mutations = [
    ['extra trailing root', files => [...files,'tests/unapproved.test.ts']],
    ...CHANGE005_TSCONFIG_APPENDIX.flatMap((_,offset) => {const index=start+offset;return [
      [`${offset} omitted`,files=>files.filter((_,position)=>position!==index)],
      [`${offset} substituted`,files=>files.map((file,position)=>position===index?'tests/unapproved.test.ts':file)],
      [`${offset} duplicated`,files=>files.map((file,position)=>position===index?files[index-1]:file)],
      [`${offset} reordered`,files=>files.map((file,position)=>position===index?files[index-1]:position===index-1?files[index]:file)],
    ];}),
  ];
  for (const [name,mutate] of mutations) await t.test(name,async()=>{
    await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files:mutate(original.files)}));
    await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});
  });
  await writeFile(path.join(root,'tsconfig.json'),JSON.stringify(original));
  assert.equal(await currentRunnerTuple(root),'CF');
});

test('CI-CHANGE006: every new root remains exact without weakening Change005 coverage',async t=>{const root=await mkdtemp(path.join(os.tmpdir(),'juanerai-cvr-change006-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const name of C1A_TUPLE_CONFIGURATION_FILES)await cp(path.join(REPO_ROOT,name),path.join(root,name));assert.equal(await currentRunnerTuple(root),'CF');const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8')),start=original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-HARNESS_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length-DECISION_TSCONFIG_APPENDIX.length-REPORT_STUDIO_TSCONFIG_APPENDIX.length-CHANGE006_TSCONFIG_APPENDIX.length;for(let i=start;i<original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-HARNESS_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length-DECISION_TSCONFIG_APPENDIX.length-REPORT_STUDIO_TSCONFIG_APPENDIX.length;i++)for(const [label,files] of [['omit',original.files.filter((_,n)=>n!==i)],['replace',original.files.map((f,n)=>n===i?'tests/unapproved.test.ts':f)],['duplicate',original.files.map((f,n)=>n===i?original.files[i-1]:f)],['reorder',original.files.map((f,n)=>n===i?original.files[i-1]:n===i-1?original.files[i]:f)]])await t.test(i+' '+label,async()=>{await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});});});

 test('CI-DECISION-001: exact roots and tests reject missing, duplicate and extra coverage',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'juanerai-cvr-decision-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const name of C1A_TUPLE_CONFIGURATION_FILES)await cp(path.join(REPO_ROOT,name),path.join(root,name));
  assert.equal(await currentRunnerTuple(root),'CF');const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8')),start=original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-HARNESS_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length-DECISION_TSCONFIG_APPENDIX.length;
  for(let i=start;i<original.files.length;i++)for(const files of [original.files.filter((_,n)=>n!==i),original.files.map((v,n)=>n===i?'unapproved.ts':v),original.files.map((v,n)=>n===i?original.files[i-1]:v),[...original.files,'unapproved.ts']]){await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});}
  const names=await readdir(path.join(REPO_ROOT,'tests/integration/decision-platform'));assert.deepEqual([...names.filter(n=>n.endsWith('.test.ts')).sort(),...names.filter(n=>n.endsWith('.test.mjs')).sort()].map(n=>'tests/integration/decision-platform/'+n),DECISION_TEST_PATHS);
 });
 test('CI-DECISION-002: actual runner selects new tests and UI build and propagates their failure',async t=>{
  for(const failure of [{failTarget:'effects.integration.test.ts',code:31},{failGroup:'decision-ui',code:37}]){const f=await fixture(t,{runnerTuple:'CF',...failure});const runner=await installPublicRunner(f);await mkdir(path.join(f.root,'elsewhere'));const result=await invoke(f,runner,{},['--portable']);assert.equal(result.code,failure.code,result.stderr);const seen=await observedLines(f);assert.ok(seen.some(s=>s.includes(failure.failTarget??'decision-ui:')));}
 });

 test('CI-HARNESS-001: the new permanent test root remains exact without weakening earlier roots',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'juanerai-cvr-harness-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const name of C1A_TUPLE_CONFIGURATION_FILES)await cp(path.join(REPO_ROOT,name),path.join(root,name));
  assert.equal(await currentRunnerTuple(root),'CF');const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8')),last=original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length-1;
  for(const files of [original.files.filter((_,n)=>n!==last),original.files.map((f,n)=>n===last?'unapproved.ts':f),[...original.files,original.files[last]],[...original.files,'unapproved.ts'],original.files.map((f,n)=>n===last-1?original.files[last]:n===last?original.files[last-1]:f)]){
   await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});
  }
  // The old SDK opt-in branch is retired. Keep the negative capability
  // guarantee on the fixed public execution environment actually used now.
  for(const [platform,processes] of [['linux',true],['darwin',false]])await t.test(`native process admission: ${platform}, processes ${processes}`,async()=>{
   const evidence=await mkdtemp(path.join(process.env.JUANERAI_TEST_EVIDENCE_DIR??os.tmpdir(),'harness-native-admission-'));
   const probe=path.join(evidence,'native-admission.mjs'),sdk=import.meta.resolve('pi-agent-runtime');
   await writeFile(probe,`import assert from 'node:assert/strict';\nimport {createLocalExecutionEnvironment} from ${JSON.stringify(sdk)};\nObject.defineProperty(process,'platform',{value:${JSON.stringify(platform)}});\nconst environment=await createLocalExecutionEnvironment({root:${JSON.stringify(evidence)},policyVersion:'current-native-refusal-v1',exclusiveWorkspace:true,maxFileBytes:1048576,maxOutputBytes:1048576,timeoutMs:300000,processes:${JSON.stringify(processes)}});\nawait assert.rejects(()=>environment.exec('printf must-not-execute',new AbortController().signal),e=>e.reason==='CAPABILITY_UNAVAILABLE');\nconsole.log('CAPABILITY_UNAVAILABLE; no Task, Session, Provider or process payload');\n`);
   const env={...process.env,NODE_DISABLE_COMPILE_CACHE:'1'};delete env.XANTHIL_REAL_PI_ACCEPTANCE;delete env.NODE_TEST_CONTEXT;delete env.NODE_OPTIONS;
   const result=await run(CANONICAL_NODE,[probe],{cwd:REPO_ROOT,env,timeout:20000});
   const output=result.stdout+'\n'+result.stderr;await writeFile(path.join(evidence,'test.log'),output);
   assert.equal(result.code,0,output);assert.match(output,/CAPABILITY_UNAVAILABLE; no Task, Session, Provider or process payload/);
   assert.deepEqual((await readdir(evidence)).sort(),['native-admission.mjs','test.log']);
  });
 });
 test('CI-DR-001: fixed research roots reject omission, substitution, duplication and extras',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'dr-roots-'));
 try{for(const name of C1A_TUPLE_CONFIGURATION_FILES)await cp(path.join(REPO_ROOT,name),path.join(root,name));assert.equal(await currentRunnerTuple(root),'CF');
 const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8')),start=original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length-DEEP_RESEARCH_TSCONFIG_APPENDIX.length;
 for(let i=start;i<original.files.length;i++)for(const files of [original.files.filter((_,n)=>n!==i),original.files.map((f,n)=>n===i?'unapproved.ts':f),[...original.files,original.files[i]]]){await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});}
 }finally{await rm(root,{recursive:true,force:true});}
 });
test('CI-DR-002: real canonical syntax branch parses fixed upstream TypeScript and preserves syntax failures',async t=>{
 for(const broken of [false,true])await t.test(String(broken),async()=>{
  const f=await fixture(t,{runnerTuple:'CF'}),runner=await installPublicRunner(f);await mkdir(path.join(f.root,'elsewhere'));
  await writeFile(path.join(f.root,'node_modules/typescript/index.js'),'module.exports=require('+JSON.stringify(path.join(REPO_ROOT,'node_modules/typescript/lib/typescript.js'))+');');
  const file=path.join(f.root,'openspec/changes/archive/2026-10-18-deep-research-integration/clickable/reference/source.ts');await mkdir(path.dirname(file),{recursive:true});await writeFile(file,broken?'const broken: = ;':'const value: string = "fixed reference"; export {value};');
  const result=await invoke(f,runner,{},['--portable']);assert.equal(result.code,broken?1:0,result.stderr);
 });
});

test('CI-AH-001: the complete fixed agent-host increment refuses omissions substitutions duplicates and reordering',async t=>{const root=await mkdtemp(path.join(os.tmpdir(),'ah-roots-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const name of C1A_TUPLE_CONFIGURATION_FILES)await cp(path.join(REPO_ROOT,name),path.join(root,name));assert.equal(await currentRunnerTuple(root),'CF');const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8')),start=original.files.length-METRIC_FACTORY_TSCONFIG_APPENDIX.length-AGENT_TSCONFIG_APPENDIX.length;for(let i=start;i<original.files.length;i++)for(const files of [original.files.filter((_,n)=>n!==i),original.files.map((f,n)=>n===i?'unapproved.ts':f),[...original.files,original.files[i]]]){await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});}await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files:[...original.files.slice(0,start),...AGENT_TSCONFIG_APPENDIX.toReversed(),...METRIC_FACTORY_TSCONFIG_APPENDIX]}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});});

test('D006 fixed type roots reject every omission, substitution, duplicate, reorder and extra',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'d006-roots-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const name of C1A_TUPLE_CONFIGURATION_FILES)await cp(path.join(REPO_ROOT,name),path.join(root,name));
 assert.equal(await currentRunnerTuple(root),'CF');const original=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8'));
 for(let i=0;i<original.files.length;i++){
  const next=(i+1)%original.files.length;
  for(const files of [original.files.filter((_,n)=>n!==i),original.files.map((v,n)=>n===i?'unapproved.ts':v),[...original.files,original.files[i]],original.files.map((v,n)=>n===i?original.files[next]:n===next?original.files[i]:v)]){
   await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({...original,files}));await assert.rejects(()=>currentRunnerTuple(root),{code:'ERR_ASSERTION'});
  }
 }
});
