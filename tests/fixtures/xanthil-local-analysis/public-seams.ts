import assert from 'node:assert/strict';

type PublicSeams = {
  core: typeof import('../../../packages/product-core/local-analysis.ts');
  ports: typeof import('../../../packages/ports/local-analysis.ts');
};

// These are the public package entry modules required by the approved layer seams.
// Tests intentionally do not reach into implementation-private modules.
const seamUrls = Object.freeze({
  core: new URL('../../../packages/product-core/local-analysis.ts', import.meta.url),
  ports: new URL('../../../packages/ports/local-analysis.ts', import.meta.url),
});

export function loadPublicSeam(name: 'core'): Promise<PublicSeams['core']>;
export function loadPublicSeam(name: 'ports'): Promise<PublicSeams['ports']>;
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

