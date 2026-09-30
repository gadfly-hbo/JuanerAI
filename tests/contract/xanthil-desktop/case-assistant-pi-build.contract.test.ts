import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { builtinModules, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

// AC-03 / ACTIVATE-002: exercise emitted code using the real Main build options.
// Source-only SDK tests cannot detect import.meta corruption during CJS bundling.
test('ACTIVATE-004 emitted Main configuration loads installed Pi ESM and completes one offline Agent turn', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'case-assistant-pi-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const config = (await import(pathToFileURL(resolve('vite.main.config.mjs')).href)).default;
  await build({ ...config, configFile: false, logLevel: 'silent', build: {
    ...config.build, outDir: directory, emptyOutDir: false,
    // Forge's Main config supplies these native externals before merging the
    // repository config. Preserve that build boundary in this isolated entry.
    rollupOptions: { ...config.build.rollupOptions, external: [...builtinModules, ...builtinModules.map(name => `node:${name}`), ...config.build.rollupOptions.external] },
    lib: { ...config.build.lib, entry: resolve('adapters/agent-pi/case-assistant.ts'), fileName: () => 'adapter.cjs' },
  } });
  await symlink(resolve('node_modules'), join(directory, 'node_modules'), 'dir');
  // No transport replacement inside Pi: synthetic mode still loads the actual
  // SDK, core and event stream through the emitted production Adapter import.
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('NETWORK_FORBIDDEN'); });
  const emitted = createRequire(import.meta.url)(join(directory, 'adapter.cjs'));
  let calls = 0;
  const runtime = emitted.createPiCaseAssistantRuntime(
    { provider: 'synthetic', model: 'offline', max_input_bytes: 8192, max_output_tokens: 1024 },
    { async respond() { calls++; return { kind: 'question', text: 'Synthetic owner?' }; } },
  );
  const result = await runtime.turn({ provider: 'synthetic', model: 'offline', payload: '{"visible_message":"Synthetic task"}', signal: new AbortController().signal, cost_reservation_microunits: 10 });
  assert.deepEqual(result, { provider: 'synthetic', model: 'offline', cost_microunits: 0, output: { kind: 'question', text: 'Synthetic owner?' } });
  assert.equal(calls, 1);
});
