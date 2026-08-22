import assert from 'node:assert/strict';

type PublicSeams = {
  core: typeof import('../../../packages/product-core/local-analysis.ts');
  application: typeof import('../../../packages/application/local-analysis.ts');
  ports: typeof import('../../../packages/ports/local-analysis.ts');
  agentAdapter: typeof import('../../../adapters/agent-pi/local-analysis.ts');
  analysisAdapter: typeof import('../../../adapters/analytics-duckdb/local-analysis.ts');
  artifactAdapter: typeof import('../../../adapters/storage-local/local-analysis.ts');
  cli: typeof import('../../../apps/cli/xanthil.ts');
  personalProfile: typeof import('../../../profiles/personal/local-analysis.ts');
};

// These are the public package entry modules required by the approved layer seams.
// Tests intentionally do not reach into implementation-private modules.
const seamUrls = Object.freeze({
  core: new URL('../../../packages/product-core/local-analysis.ts', import.meta.url),
  application: new URL('../../../packages/application/local-analysis.ts', import.meta.url),
  ports: new URL('../../../packages/ports/local-analysis.ts', import.meta.url),
  agentAdapter: new URL('../../../adapters/agent-pi/local-analysis.ts', import.meta.url),
  analysisAdapter: new URL('../../../adapters/analytics-duckdb/local-analysis.ts', import.meta.url),
  artifactAdapter: new URL('../../../adapters/storage-local/local-analysis.ts', import.meta.url),
  cli: new URL('../../../apps/cli/xanthil.ts', import.meta.url),
  personalProfile: new URL('../../../profiles/personal/local-analysis.ts', import.meta.url),
});

export function loadPublicSeam(name: 'core'): Promise<PublicSeams['core']>;
export function loadPublicSeam(name: 'application'): Promise<PublicSeams['application']>;
export function loadPublicSeam(name: 'ports'): Promise<PublicSeams['ports']>;
export function loadPublicSeam(name: 'agentAdapter'): Promise<PublicSeams['agentAdapter']>;
export function loadPublicSeam(name: 'analysisAdapter'): Promise<PublicSeams['analysisAdapter']>;
export function loadPublicSeam(name: 'artifactAdapter'): Promise<PublicSeams['artifactAdapter']>;
export function loadPublicSeam(name: 'cli'): Promise<PublicSeams['cli']>;
export function loadPublicSeam(name: 'personalProfile'): Promise<PublicSeams['personalProfile']>;
export function loadPublicSeam<K extends keyof PublicSeams>(name: K): Promise<PublicSeams[K]>;
export async function loadPublicSeam(name: keyof typeof seamUrls) {
  assert.ok(seamUrls[name], `unknown approved public seam: ${String(name)}`);
  return import(seamUrls[name].href);
}

export function requiredExport<T extends object, K extends keyof T>(module: T, name: K): T[K] {
  const value = module[name];
  assert.equal(typeof value, 'function', `public seam must export ${String(name)}`);
  if (typeof value !== 'function') throw new Error(`public seam must export ${String(name)}`);
  return value;
}

export const approvedToolNames = Object.freeze([
  'profile_approved_fixture',
  'calculate_member_repurchase_metrics',
  'validate_member_repurchase_metrics',
]);
