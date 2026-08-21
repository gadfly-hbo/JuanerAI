import assert from 'node:assert/strict';

// These are the public package entry modules required by the approved layer seams.
// Tests intentionally do not reach into implementation-private modules.
const seamUrls = Object.freeze({
  core: new URL('../../../packages/product-core/local-analysis.mjs', import.meta.url),
  application: new URL('../../../packages/application/local-analysis.mjs', import.meta.url),
  ports: new URL('../../../packages/ports/local-analysis.mjs', import.meta.url),
  agentAdapter: new URL('../../../adapters/agent-pi/local-analysis.mjs', import.meta.url),
  analysisAdapter: new URL('../../../adapters/analytics-duckdb/local-analysis.mjs', import.meta.url),
  artifactAdapter: new URL('../../../adapters/storage-local/local-analysis.mjs', import.meta.url),
  cli: new URL('../../../apps/cli/xanthil.mjs', import.meta.url),
  personalProfile: new URL('../../../profiles/personal/local-analysis.mjs', import.meta.url),
});

export async function loadPublicSeam(name) {
  assert.ok(seamUrls[name], `unknown approved public seam: ${name}`);
  return import(seamUrls[name]);
}

export function requiredExport(module, name) {
  assert.equal(typeof module[name], 'function', `public seam must export ${name}`);
  return module[name];
}

export const approvedToolNames = Object.freeze([
  'profile_approved_fixture',
  'calculate_member_repurchase_metrics',
  'validate_member_repurchase_metrics',
]);
