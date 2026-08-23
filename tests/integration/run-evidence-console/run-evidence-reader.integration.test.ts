import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, rename, stat, symlink, unlink, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { createExactRun, makeDeclaredSourceUnreadable, workspaceSnapshot } from '../../fixtures/run-evidence-console/run-evidence-fixtures.ts';

const profileUrl = new URL('../../../profiles/personal/console.ts', import.meta.url);

async function query(run: string): Promise<any> {
  const { createPersonalConsoleProfile } = await import(profileUrl.href);
  return createPersonalConsoleProfile().query.read({ run_directory: run });
}

test('TEST-REC-005 [AC-REC-002-01..02, AC-REC-004-01, AC-REC-005-01] local Adapter contains all reads and never mutates controlled workspace', async (t) => {
  const fixture = await createExactRun();
  const declaredSource = await makeDeclaredSourceUnreadable(fixture.run);
  await assert.rejects(lstat(declaredSource));
  const before = await workspaceSnapshot(fixture.root);
  const result = await query(fixture.run);
  assert.equal(result.kind, 'verified_succeeded');
  assert.deepEqual(await workspaceSnapshot(fixture.root), before, 'selected Run and outside workspace remain byte-identical');
  await t.test('symlink_manifest_rejected', async () => {
    const manifest = join(fixture.run, 'run.json');
    await rename(manifest, join(fixture.run, 'real-run.json'));
    await symlink(join(fixture.run, 'real-run.json'), manifest);
    const bad = await query(fixture.run);
    assert.deepEqual(bad, { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  });
  await t.test('selected_directory_and_declared_asset_symlinks_rejected', async () => {
    const selected = await createExactRun();
    const linkedRun = `${selected.run}-link`;
    await symlink(selected.run, linkedRun);
    assert.deepEqual(await query(linkedRun), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
    const asset = join(selected.run, 'summary.md');
    await rename(asset, join(selected.run, 'real-summary.md'));
    await symlink(join(selected.run, 'real-summary.md'), asset);
    assert.deepEqual(await query(selected.run), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  });
  await t.test('declared_directory_is_not_an_asset', async () => {
    const selected = await createExactRun();
    const asset = join(selected.run, 'summary.md');
    await unlink(asset);
    await mkdir(asset);
    assert.deepEqual(await query(selected.run), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  });
  await t.test('escaped_declared_paths_rejected', async () => {
    for (const path of ['../outside', '/private/tmp/outside']) {
      const selected = await createExactRun();
      const run = JSON.parse(await (await import('node:fs/promises')).readFile(join(selected.run, 'run.json'), 'utf8')) as { artifacts: { path: string }[] };
      run.artifacts[0].path = path;
      await writeFile(join(selected.run, 'run.json'), JSON.stringify(run));
      assert.deepEqual(await query(selected.run), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }, path);
    }
  });
  await t.test('unaccepted_manifest_never_probes_manifest_named_sentinel', async () => {
    const selected = await createExactRun();
    const sentinel = join(selected.run, 'sentinel.txt');
    await writeFile(sentinel, 'must remain unread');
    const before = await stat(sentinel);
    await writeFile(join(selected.run, 'run.json'), JSON.stringify({ schema_version: '1.0', status: 'succeeded', artifacts: [{ path: 'sentinel.txt' }], unknown: true }));
    assert.deepEqual(await query(selected.run), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
    const after = await stat(sentinel);
    assert.equal(after.atimeMs, before.atimeMs, 'unaccepted manifest must not open the sentinel named inside it');
  });
  await t.test('run_id_mismatch_never_opens_a_second_path', async () => {
    const selected = await createExactRun();
    const sentinel = join(selected.run, 'analysis-contract.json');
    const before = await stat(sentinel);
    const manifest = JSON.parse(await readFile(join(selected.run, 'run.json'), 'utf8')) as { run_id: string };
    manifest.run_id = '0198d943-8b71-7a11-9abc-0000000000d4';
    await writeFile(join(selected.run, 'run.json'), JSON.stringify(manifest));
    assert.deepEqual(await query(selected.run), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
    const after = await stat(sentinel);
    assert.equal(after.atimeMs, before.atimeMs, 'a manifest identity mismatch must not open the second-path sentinel');
  });
  await t.test('declared_asset_byte_size_mismatch_never_opens_the_asset', async () => {
    const selected = await createExactRun();
    const sentinel = join(selected.run, 'outputs', 'O-001.json');
    const before = await stat(sentinel);
    const manifest = JSON.parse(await readFile(join(selected.run, 'run.json'), 'utf8')) as { artifacts: { path: string; byte_size: number }[] };
    const descriptor = manifest.artifacts.find((asset) => asset.path === 'outputs/O-001.json');
    if (!descriptor) throw new Error('fixture descriptor missing');
    descriptor.byte_size += 1;
    await writeFile(join(selected.run, 'run.json'), JSON.stringify(manifest));
    const result = await query(selected.run);
    const after = await stat(sentinel);
    assert.equal(after.atimeMs, before.atimeMs, 'Adapter metadata admission must reject before reading the asset sentinel');
    assert.deepEqual(result, { kind: 'rejected', error: { code: 'RUN_CHECKSUM_MISMATCH' } });
  });
  await t.test('declared_asset_byte_size_is_exact_without_an_invented_file_cap', async () => {
    const selected = await createExactRun();
    const path = join(selected.run, 'outputs', 'O-001.json');
    const bytes = Buffer.from(JSON.stringify({ retained: 'x'.repeat(1_100_000) }));
    await writeFile(path, bytes);
    const manifest = JSON.parse(await readFile(join(selected.run, 'run.json'), 'utf8')) as { artifacts: { path: string; byte_size: number; sha256: string }[] };
    const descriptor = manifest.artifacts.find((asset) => asset.path === 'outputs/O-001.json');
    if (!descriptor) throw new Error('fixture descriptor missing');
    const { sha256 } = await import('../../fixtures/run-evidence-console/run-evidence-fixtures.ts');
    descriptor.byte_size = bytes.byteLength;
    descriptor.sha256 = sha256(bytes);
    await writeFile(join(selected.run, 'run.json'), JSON.stringify(manifest));
    assert.equal((await query(selected.run)).kind, 'verified_succeeded');
  });
});

test('TEST-REC-006 [AC-REC-003-01, AC-REC-003-03, AC-REC-004-01..03] exact success resolves the closed evidence graph', async () => {
  const fixture = await createExactRun();
  const result = await query(fixture.run);
  assert.equal(result.kind, 'verified_succeeded');
  assert.deepEqual(result.view.findings[0].evidence_ids, ['E-001']);
  assert.ok(result.view.assets.some((asset: { artifact_id: string }) => asset.artifact_id === 'Q-001'));
  assert.match(JSON.stringify(result.view), /member-orders-v1\.csv/);
  assert.match(JSON.stringify(result.view), /baseline/);
  assert.match(JSON.stringify(result.view), /tiny and synthetic/);
  assert.match(JSON.stringify(result.view), /1\.0/);
  assert.ok(result.integrity.every((entry: { outcome: string }) => entry.outcome === 'verified'));
  assert.deepEqual(result.view.provenance, {
    recorded_product_version: '1.0.0',
    recorded_agent_runtime_version: '0.84.2',
    recorded_agent_adapter_version: '1.0.0',
    recorded_model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' },
  });
  assert.equal('vendor' in result.view.provenance, false);
  assert.equal(JSON.stringify(result.view.provenance).includes('pi_'), false);
});

test('TEST-REC-005 [AC-REC-002-01, AC-REC-005-03] rejects observable same-inode same-size mutation during a read', async () => {
  const fixture = await createExactRun();
  const path = join(fixture.run, 'queries', 'Q-001.sql');
  const bytes = Buffer.from(`SELECT 1;\n${' '.repeat(32 * 1024 * 1024)}`, 'utf8');
  await writeFile(path, bytes);
  const manifest = JSON.parse(await readFile(join(fixture.run, 'run.json'), 'utf8')) as { artifacts: { path: string; byte_size: number; sha256: string }[] };
  const descriptor = manifest.artifacts.find((asset) => asset.path === 'queries/Q-001.sql');
  if (!descriptor) throw new Error('fixture descriptor missing');
  const { sha256 } = await import('../../fixtures/run-evidence-console/run-evidence-fixtures.ts');
  descriptor.byte_size = bytes.byteLength;
  descriptor.sha256 = sha256(bytes);
  await writeFile(join(fixture.run, 'run.json'), JSON.stringify(manifest));

  let mutating = true;
  let mutations = 0;
  const mutation = (async () => {
    while (mutating) {
      const timestamp = new Date(1_800_000_000_000 + mutations * 1_000);
      mutations += 1;
      await utimes(path, timestamp, timestamp);
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  })();
  let result: Awaited<ReturnType<typeof query>>;
  try { result = await query(fixture.run); }
  finally { mutating = false; await mutation; }

  assert.ok(mutations > 1, 'the file metadata changed repeatedly while the read was active');
  assert.deepEqual(result, { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
});

test('TEST-REC-007 [AC-REC-003-02, AC-REC-005-03] terminal non-success is restricted and unstable reads fail closed', async () => {
  const expected = {
    failed: { ended_at: '2026-08-20T00:01:00.000Z', stage: 'artifact_finalize', error_code: 'ARTIFACT_WRITE_FAILED', keys: ['ended_at', 'error_code', 'provenance', 'status', 'terminal_stage'] },
    cancelled: { ended_at: '2026-08-20T00:01:00.000Z', stage: 'analysis_python', error_code: undefined, keys: ['ended_at', 'provenance', 'status', 'terminal_stage'] },
  } as const;
  for (const status of ['failed', 'cancelled'] as const) {
    const fixture = await createExactRun(status);
    const result = await query(fixture.run);
    assert.equal(result.kind, 'verified_non_success');
    assert.equal(result.view.findings, undefined);
    assert.equal(result.view.evidence, undefined);
    assert.equal(result.view.summary, undefined);
    assert.equal(result.view.status, status);
    assert.equal(result.view.ended_at, expected[status].ended_at);
    assert.equal(result.view.terminal_stage, expected[status].stage);
    assert.equal(result.view.error_code, expected[status].error_code);
    assert.deepEqual(Object.keys(result).sort(), ['integrity', 'kind', 'view']);
    assert.deepEqual(Object.keys(result.view).sort(), expected[status].keys);
    assert.deepEqual(result.view.provenance, {
      recorded_product_version: '1.0.0',
      recorded_agent_runtime_version: '0.84.2',
      recorded_agent_adapter_version: '1.0.0',
      recorded_model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' },
    });
    assert.deepEqual(result.integrity, [{ path: 'analysis-contract.json', outcome: 'verified' }]);
  }
  const inProgress = await createExactRun('in_progress');
  assert.deepEqual(await query(inProgress.run), { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } });
  const retained = await createExactRun('failed');
  const retainedAsset = retained.artifact.persistedAssetById['DOC-SUMMARY'];
  const { bytes: retainedBytes, ...retainedDescriptor } = retainedAsset;
  const retainedManifest = JSON.parse(await readFile(join(retained.run, 'run.json'), 'utf8')) as { artifacts: unknown[] };
  retainedManifest.artifacts = [retainedDescriptor];
  await writeFile(join(retained.run, retainedDescriptor.path), retainedBytes);
  await writeFile(join(retained.run, 'run.json'), JSON.stringify(retainedManifest));
  const retainedResult = await query(retained.run);
  assert.equal(retainedResult.kind, 'verified_non_success');
  assert.deepEqual(Object.keys(retainedResult.view).sort(), ['assets', 'ended_at', 'error_code', 'provenance', 'status', 'terminal_stage']);
  assert.ok(retainedResult.view.assets);
  assert.deepEqual(Object.keys(retainedResult.view.assets[0]).sort(), ['artifact_id', 'byte_size', 'category', 'media_type', 'path', 'sha256']);
  assert.deepEqual(retainedResult.integrity, [{ path: 'analysis-contract.json', outcome: 'verified' }, { path: 'summary.md', outcome: 'verified' }]);
  for (const selection of ['', 'relative/run', '/definitely/missing/run', '\0']) {
    const rejected = await query(selection);
    assert.deepEqual(rejected, { kind: 'rejected', error: { code: 'RUN_READ_FAILED' } }, JSON.stringify(selection));
  }
});

test('TEST-REC-008 and TEST-REC-010 [AC-REC-001-02, AC-REC-004-02, AC-REC-005-01..03, AC-REC-006-01..03, AC-REC-007-03..05] forbid unapproved capability imports and filesystem effects', async () => {
  const read = async (path: string) => (await import('node:fs/promises')).readFile(new URL(path, import.meta.url), 'utf8');
  const [adapter, experience, profile, application, core, port] = await Promise.all([
    read('../../../adapters/storage-local/run-evidence-reader.ts'), read('../../../apps/console/xanthil-console.ts'), read('../../../profiles/personal/console.ts'),
    read('../../../packages/application/run-evidence-query.ts'), read('../../../packages/product-core/run-evidence.ts'), read('../../../packages/ports/run-evidence-reader.ts'),
  ]);
  assert.doesNotMatch(adapter, /\b(writeFile|appendFile|rename|rm|unlink|chmod|mkdir|readdir|opendir|glob|RunArtifactStore|fetch|https?|child_process|sources\s*\[|sources\.)\b/);
  assert.doesNotMatch(experience, /\b(writeFile|appendFile|rename|rm|unlink|chmod|mkdir|fetch|child_process|RunArtifactStore|sources\s*\[|sources\.)\b/);
  assert.doesNotMatch(`${application}\n${core}\n${port}\n${experience}`, /(?:agent-pi|analytics-duckdb|pi_adapter|pi_version|provider-specific|RunArtifactStore|process\.env|credential|endpoint|transcript|mtime)/);
  assert.doesNotMatch(core, /run-evidence-reader\.ts/);
  assert.doesNotMatch(profile, /local-analysis\.ts|RunArtifactStore|agent-pi|analytics-duckdb/);
});
