import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const NODE = '/Users/huangbo/Dev/Env/homebrew/bin/node';
const GIT = '/Users/huangbo/Dev/Env/homebrew/bin/git';
const SNAPSHOT_URL = new URL('./worktree-snapshot-contract.mjs', import.meta.url);
const PRODUCTION_URL = new URL('./production.mjs', import.meta.url);
const PRODUCTION_PATH = fileURLToPath(PRODUCTION_URL);
const REPOSITORY_ROOT = path.resolve(path.dirname(PRODUCTION_PATH), '../../..');
const NUL = Buffer.from([0]);
const HEX_A = 'a'.repeat(64);
const HEX_B = 'b'.repeat(64);
const HEX_C = 'c'.repeat(64);
const HEAD = '0123456789abcdef0123456789abcdef01234567';
let retainedLeaf = 0;
const test = (name, callback) => nodeTest(`C${String(++retainedLeaf).padStart(3, '0')} ${name}`, callback);
const addedTest = (id, name, callback) => nodeTest(`${id} ${name}`, callback);

// This oracle is Test-owned: it imports no production parser, canonicalizer,
// path matcher, serializer, or hash helper.
const hash = value => createHash('sha256').update(value).digest('hex');
const canonicalJson = value => Array.isArray(value)
  ? `[${value.map(canonicalJson).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const canonicalHash = value => hash(Buffer.from(canonicalJson(value), 'utf8'));
const scopeHash = subject => canonicalHash({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths });

function parseKnownStatus(status) {
  if (status.length === 0) return [];
  const records = []; let start = 0; const bytes = Buffer.from(status);
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue;
    const record = bytes.subarray(start, index);
    records.push({ xy: record.subarray(0, 2).toString('ascii'), path: record.subarray(3) });
    start = index + 1;
  }
  assert.equal(start, bytes.length, 'oracle fixture has complete NUL records');
  return records;
}

function oracleSnapshot(subject, observation, { header = 'JUANERAI_WORKTREE_SNAPSHOT_V1' } = {}) {
  const scope_sha256 = scopeHash(subject);
  const raw_inventory_sha256 = hash(Buffer.from(observation.status_stdout));
  const status = parseKnownStatus(observation.status_stdout);
  const entries = status.map(({ xy, path: pathBytes }) => {
    const entry = observation.entries.find(candidate => Buffer.from(candidate.path_bytes).equals(pathBytes));
    assert.ok(entry, 'oracle fixture must correlate each raw status path itself');
    if (xy === ' D') return { pathBytes, xy, type: 'MISSING', mode: '000000', identity: 'MISSING' };
    if (entry.before.type === 'SYMLINK') return { pathBytes, xy, type: 'SYMLINK', mode: '120000', identity: entry.content.target_sha256 };
    return {
      pathBytes, xy, type: 'FILE', mode: (entry.before.mode & 0o111n) !== 0n ? '100755' : '100644', identity: entry.content.sha256,
    };
  }).sort((left, right) => Buffer.compare(left.pathBytes, right.pathBytes));
  const records = entries.map(entry => Buffer.concat([
    entry.pathBytes, NUL, Buffer.from(entry.xy, 'ascii'), NUL, Buffer.from(entry.type, 'ascii'), NUL,
    Buffer.from(entry.mode, 'ascii'), NUL, Buffer.from(entry.identity, 'ascii'), NUL,
  ]));
  const preimage = Buffer.concat([
    Buffer.from(header, 'ascii'), NUL,
    Buffer.from(observation.repository_root_realpath, 'utf8'), NUL,
    Buffer.from(observation.worktree_root_realpath, 'utf8'), NUL,
    Buffer.from(observation.branch, 'utf8'), NUL,
    Buffer.from(observation.head_sha, 'ascii'), NUL,
    Buffer.from(observation.common_git_dir_realpath, 'utf8'), NUL,
    Buffer.from(scope_sha256, 'ascii'), NUL,
    Buffer.from(raw_inventory_sha256, 'ascii'), NUL,
    ...records,
  ]);
  return {
    scope_sha256, raw_inventory_sha256, worktree_snapshot_sha256: hash(preimage), entry_count: entries.length,
  };
}

function present(type = 'FILE', mode = 0o100644n, stamp = 1n) {
  return { kind: 'PRESENT', type, mode, dev: 9n, ino: 11n, size: 13n, mtime_ns: stamp, ctime_ns: stamp + 1n };
}

function missing() { return { kind: 'MISSING' }; }

function entry(pathBytes, before, content, after = before) {
  return {
    path_bytes: Buffer.from(pathBytes), parent_realpath: '/private/tmp/wveb-worktree/scopes', before, content, after,
  };
}

function validL1({ empty = false } = {}) {
  const subject = {
    kind: 'WORKTREE', repository_root: '/private/tmp/wveb-repository', worktree_root: '/private/tmp/wveb-worktree',
    branch: 'work/mac-mini/wveb-contract', head_sha: HEAD, common_git_dir: '/private/tmp/wveb-repository/.git',
    allowed_paths: ['scopes/**', 'z-last.txt'], forbidden_paths: ['scopes/blocked/**'],
  };
  const records = empty ? [] : [
    Buffer.from(' M scopes/a.txt\0', 'utf8'), Buffer.from(' T scopes/run\0', 'utf8'),
    Buffer.from('?? scopes/é.txt\0', 'utf8'), Buffer.from(' D scopes/removed.txt\0', 'utf8'),
  ];
  const status_stdout = Buffer.concat(records);
  const file = entry(Buffer.from('scopes/a.txt'), present('FILE', 0o100644n), { kind: 'FILE', sha256: HEX_A });
  const executable = entry(Buffer.from('scopes/run'), present('FILE', 0o100711n), { kind: 'FILE', sha256: HEX_B });
  const unicode = entry(Buffer.from('scopes/é.txt'), present('SYMLINK', 0o120777n), { kind: 'SYMLINK', target_sha256: HEX_C });
  const deleted = entry(Buffer.from('scopes/removed.txt'), missing(), missing(), missing());
  const observation = {
    repository_root_realpath: subject.repository_root, worktree_root_realpath: subject.worktree_root,
    common_git_dir_realpath: subject.common_git_dir, branch: subject.branch, head_sha: subject.head_sha,
    status_stdout, ignored_status_stdout: Buffer.from(status_stdout),
    index_probe: { exit_code: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) },
    // Deliberately unlike byte order: a decoded/locale sort cannot choose this order.
    entries: empty ? [] : [deleted, executable, file, unicode],
  };
  return { subject, observation };
}

function evaluationInput(fixture = validL1()) {
  return { schema_version: '1.0', subject: fixture.subject, observation: fixture.observation };
}

function changedL1(mutator) {
  const fixture = validL1();
  mutator(fixture);
  return evaluationInput(fixture);
}

async function evaluator() {
  const module = await import(SNAPSHOT_URL.href);
  assert.deepEqual(Object.keys(module).sort(), ['evaluateWorktreeSnapshotObservationV1']);
  assert.equal(typeof module.evaluateWorktreeSnapshotObservationV1, 'function');
  return module.evaluateWorktreeSnapshotObservationV1;
}

async function factory() {
  const module = await import(PRODUCTION_URL.href);
  assert.equal(typeof module.createValidationGateway, 'function', 'AC-WVEB-002 requires the public exact factory');
  assert.equal(Object.hasOwn(module, 'PINNED_PRODUCTION_GIT_PATH'), false, 'fixed Git path remains private');
  return module.createValidationGateway;
}

let productionAstPromise;
async function productionAst() {
  if (!productionAstPromise) productionAstPromise = (async () => {
    const bytes = await readFile(PRODUCTION_PATH);
    assert.equal(path.isAbsolute(PRODUCTION_PATH), true, 'AST oracle binds an absolute production path');
    assert.equal(PRODUCTION_PATH, path.join(REPOSITORY_ROOT, 'tools/harness/change-coordinator/production.mjs'), 'AST oracle parses only the exact repository production path');
    const text = bytes.toString('utf8');
    assert.deepEqual(Buffer.from(text, 'utf8'), bytes, 'AST oracle proves exact UTF-8 byte roundtrip');
    assert.equal(ts.version, '5.9.3', 'AST oracle uses exactly the project-local locked TypeScript');
    const sourceFile = ts.createSourceFile(PRODUCTION_PATH, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    assert.deepEqual(sourceFile.parseDiagnostics, [], 'AST oracle rejects production syntax diagnostics');
    return Object.freeze({ absolute_path: PRODUCTION_PATH, byte_length: bytes.length, sha256: hash(bytes), bytes, sourceFile });
  })();
  return productionAstPromise;
}

function astNodes(root, predicate) {
  const found = [];
  const visit = node => {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
}

function uniqueAst(nodes, label) {
  assert.equal(nodes.length, 1, `${label}: expected one AST target, found ${nodes.length}`);
  const node = nodes[0];
  assert.ok(node.getStart() >= 0 && node.end > node.getStart(), `${label}: target has a source range`);
  return node;
}

function namedFunction(sourceFile, name) {
  return uniqueAst(astNodes(sourceFile, node => ts.isFunctionDeclaration(node) && node.name?.text === name), `function ${name}`);
}

function callsIn(node, predicate) {
  return astNodes(node, child => ts.isCallExpression(child) && predicate(child));
}

function callPropertyName(call) {
  return ts.isPropertyAccessExpression(call.expression) ? call.expression.name.text : null;
}

function stringLiteralValue(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : null;
}

function rejected(result, reason) {
  assert.deepEqual(result, { kind: 'REJECTED', reason });
}

function run(executable, args, { cwd, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = []; const stderr = [];
    child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)));
    child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)));
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
  });
}

async function git(cwd, args) {
  const result = await run(GIT, args, { cwd, env: { ...process.env, LC_ALL: 'C', LANG: 'C', GIT_TERMINAL_PROMPT: '0' } });
  assert.equal(result.code, 0, `temporary Git command succeeds: ${args.join(' ')}`);
  assert.equal(result.signal, null);
  return result.stdout;
}

async function withWorktree(callback) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'juanerai-wveb-'));
  const repository = path.join(temporary, 'repository');
  const worktree = path.join(temporary, 'worktree');
  try {
    await git(temporary, ['init', '-q', '-b', 'main', repository]);
    await git(repository, ['-c', 'user.name=WVEB', '-c', 'user.email=wveb@example.invalid', 'commit', '--allow-empty', '-qm', 'baseline']);
    await git(repository, ['worktree', 'add', '-q', '-b', 'work/mac-mini/wveb-execution', worktree, 'HEAD']);
    const repository_root = await realpath(repository);
    const worktree_root = await realpath(worktree);
    const branch = (await git(worktree, ['branch', '--show-current'])).toString('utf8').trim();
    const head_sha = (await git(worktree, ['rev-parse', 'HEAD'])).toString('utf8').trim();
    const common_git_dir = await realpath((await git(worktree, ['rev-parse', '--path-format=absolute', '--git-common-dir'])).toString('utf8').trim());
    const subject = {
      kind: 'WORKTREE', repository_root, worktree_root, branch, head_sha, common_git_dir,
      allowed_paths: ['checks/**'], forbidden_paths: ['checks/private/**'],
    };
    await callback({ temporary, repository, worktree, subject });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

function definition(subject, id = 'regression-affected-suite', argv = [NODE, '-e', 'process.stdout.write("wv-pass")']) {
  const tuple = id === 'regression-affected-suite'
    ? { validation_kind: 'REGRESSION', validation_scope: 'AFFECTED_SUITE' }
    : { validation_kind: 'REGRESSION', validation_scope: 'TEST_ASSET_RETIREMENT' };
  return { id, ...tuple, subject: 'WORKTREE', argv, cwd: subject.worktree_root, environment: {}, timeout_ms: 2_000 };
}

function expectedReceipt(subject, definitionValue, snapshot, {
  status = 'COMPLETED', verdict = 'PASS', failure_code = null, stdout = Buffer.from('wv-pass'), stderr = Buffer.alloc(0),
  execution_cwd = definitionValue.cwd, worktree_snapshot_sha256 = snapshot.worktree_snapshot_sha256,
} = {}) {
  const value = {
    validation_id: definitionValue.id, validation_kind: definitionValue.validation_kind, validation_scope: definitionValue.validation_scope,
    status, verdict, failure_code, command_definition_sha256: canonicalHash(definitionValue), receipt_sha256: null,
    subject_kind: 'WORKTREE', subject_sha: subject.head_sha, repository_root: subject.repository_root,
    worktree_root: subject.worktree_root, branch: subject.branch, head_sha: subject.head_sha,
    common_git_dir: subject.common_git_dir, execution_cwd, scope_sha256: snapshot.scope_sha256,
    worktree_snapshot_sha256, candidate_sha: null, candidate_tree: null, stdout_sha256: hash(stdout),
    stderr_sha256: hash(stderr), validator_head: null, idempotency_id: definitionValue.id,
  };
  const { receipt_sha256: ignored, ...other23 } = value;
  value.receipt_sha256 = canonicalHash(other23);
  return { kind: 'OK', value, receipt_sha256: canonicalHash(value) };
}

function statObservation(stat) {
  const type = stat.isFile() ? 'FILE'
    : stat.isSymbolicLink() ? 'SYMLINK'
      : stat.isDirectory() ? 'DIRECTORY'
        : stat.isSocket() ? 'SOCKET'
          : stat.isFIFO() ? 'FIFO'
            : stat.isBlockDevice() ? 'BLOCK_DEVICE'
              : stat.isCharacterDevice() ? 'CHARACTER_DEVICE' : 'OTHER';
  const values = [stat.mode, stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs];
  assert.ok(values.every(value => typeof value === 'bigint' && value >= 0n), 'Test oracle receives only nonnegative primitive bigint lstat fields');
  return {
    kind: 'PRESENT', type, mode: stat.mode, dev: stat.dev, ino: stat.ino,
    size: stat.size, mtime_ns: stat.mtimeNs, ctime_ns: stat.ctimeNs,
  };
}

async function actualObservation(subject) {
  // A real-Git, Test-owned observation used only as the independent expected-byte oracle.
  const status_stdout = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']);
  const ignored_status_stdout = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames', '--ignored=matching']);
  const index = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
  const entries = [];
  for (const { xy, path: pathBytes } of parseKnownStatus(status_stdout)) {
    const target = path.join(subject.worktree_root, pathBytes.toString('utf8'));
    if (xy === ' D') {
      entries.push({ path_bytes: Buffer.from(pathBytes), parent_realpath: await realpath(path.dirname(target)), before: missing(), content: missing(), after: missing() });
      continue;
    }
    const before = statObservation(await lstat(target, { bigint: true }));
    const content = before.type === 'SYMLINK'
      ? { kind: 'SYMLINK', target_sha256: hash(await readlink(target, 'buffer')) }
      : { kind: 'FILE', sha256: hash(await readFile(target)) };
    const after = statObservation(await lstat(target, { bigint: true }));
    entries.push({ path_bytes: Buffer.from(pathBytes), parent_realpath: await realpath(path.dirname(target)), before, content, after });
  }
  return {
    repository_root_realpath: subject.repository_root, worktree_root_realpath: subject.worktree_root,
    common_git_dir_realpath: subject.common_git_dir, branch: subject.branch, head_sha: subject.head_sha,
    status_stdout, ignored_status_stdout,
    index_probe: { exit_code: index.code, signal: index.signal, stdout: index.stdout, stderr: index.stderr }, entries,
  };
}

function expectedPreSnapshotMismatchReceipt(subject, definitionValue) {
  return expectedReceipt(subject, definitionValue, { scope_sha256: scopeHash(subject), worktree_snapshot_sha256: null }, {
    status: 'START_FAILED', verdict: null, failure_code: 'SUBJECT_MISMATCH', stdout: Buffer.alloc(0), stderr: Buffer.alloc(0),
    execution_cwd: null, worktree_snapshot_sha256: null,
  });
}

async function refreshSubjectHead(subject) {
  subject.head_sha = (await git(subject.worktree_root, ['rev-parse', 'HEAD'])).toString('utf8').trim();
}

async function commitFixture(worktree, relative, contents) {
  const target = path.join(worktree, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
  await git(worktree, ['add', relative]);
  await git(worktree, ['-c', 'user.name=WVEB', '-c', 'user.email=wveb@example.invalid', 'commit', '-qm', `fixture-${relative.replaceAll('/', '-')}`]);
  return target;
}

async function snapshotConsumerInventory() {
  const target = 'tools/harness/change-coordinator/worktree-snapshot-contract.mjs';
  const productionRecord = await productionAst();
  const list = async args => {
    const result = await run(GIT, args, { cwd: REPOSITORY_ROOT, env: { ...process.env, LC_ALL: 'C', LANG: 'C', GIT_TERMINAL_PROMPT: '0' } });
    assert.equal(result.code, 0, `repository inventory Git succeeds: ${args.join(' ')}`);
    assert.equal(result.signal, null, 'repository inventory Git has no signal');
    assert.deepEqual(result.stderr, Buffer.alloc(0), 'repository inventory Git has no stderr');
    const paths = []; let start = 0;
    for (let index = 0; index < result.stdout.length; index += 1) {
      if (result.stdout[index] !== 0) continue;
      const raw = result.stdout.subarray(start, index);
      assert.ok(raw.length > 0, 'repository inventory rejects empty NUL record');
      paths.push(Buffer.from(raw)); start = index + 1;
    }
    assert.equal(start, result.stdout.length, 'repository inventory rejects an unterminated NUL record');
    return paths;
  };
  const rawPaths = [
    ...await list(['-C', REPOSITORY_ROOT, 'ls-files', '--cached', '-z', '--', '*.mjs']),
    ...await list(['-C', REPOSITORY_ROOT, 'ls-files', '--others', '--exclude-standard', '-z', '--', '*.mjs']),
  ];
  const seenRaw = new Set(); const decoded = new Map(); const candidates = [];
  for (const raw of rawPaths) {
    assert.equal(raw.subarray(-4).equals(Buffer.from('.mjs')), true, 'repository inventory retains only ASCII .mjs names');
    const rawKey = raw.toString('hex');
    if (seenRaw.has(rawKey)) continue;
    seenRaw.add(rawKey);
    const relative = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    assert.deepEqual(Buffer.from(relative, 'utf8'), raw, 'repository inventory proves UTF-8 path roundtrip');
    assert.equal(relative.startsWith('/'), false, 'repository inventory rejects absolute paths');
    assert.equal(relative.includes('\\'), false, 'repository inventory rejects backslash paths');
    const components = relative.split('/');
    assert.equal(components.every(component => component.length > 0 && component !== '.' && component !== '..'), true, 'repository inventory rejects empty or dot path components');
    const absolute = path.resolve(REPOSITORY_ROOT, ...components);
    const lexical = path.relative(REPOSITORY_ROOT, absolute);
    assert.equal(lexical === relative && !lexical.startsWith(`..${path.sep}`) && lexical !== '..' && !path.isAbsolute(lexical), true, 'repository inventory rejects repository escapes or lexical ambiguity');
    const previous = decoded.get(relative);
    assert.equal(previous === undefined || previous === rawKey, true, 'repository inventory rejects decoded-path collisions');
    decoded.set(relative, rawKey);
    candidates.push({ raw, relative, absolute });
  }
  candidates.sort((left, right) => Buffer.compare(left.raw, right.raw));
  const candidatePaths = new Set(candidates.map(candidate => candidate.relative));
  const classify = relative => {
    if (relative.endsWith('.test.mjs')) return 'TEST';
    if (relative === 'tools/harness/change-coordinator/fixtures.mjs') return 'FIXTURE';
    if (['.juanerai/', '.agents/', '.ai-coding/', '.codex/', 'docs/', 'openspec/', 'tools/harness/project-board/', 'tools/harness/validation/'].some(prefix => relative.startsWith(prefix))) return 'NONPRODUCTION';
    if (relative === target) return 'PROVIDER';
    return 'PRODUCTION';
  };
  const matchedSites = [];
  for (const candidate of candidates) {
    let sourceFile;
    if (candidate.absolute === productionRecord.absolute_path) ({ sourceFile } = productionRecord);
    else {
      const bytes = await readFile(candidate.absolute);
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      assert.deepEqual(Buffer.from(text, 'utf8'), bytes, `repository inventory proves UTF-8 source roundtrip: ${candidate.relative}`);
      sourceFile = ts.createSourceFile(candidate.absolute, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      assert.deepEqual(sourceFile.parseDiagnostics, [], `repository inventory rejects syntax diagnostics: ${candidate.relative}`);
    }
    const references = astNodes(sourceFile, node => (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      ? Boolean(node.moduleSpecifier && (ts.isStringLiteral(node.moduleSpecifier) || ts.isNoSubstitutionTemplateLiteral(node.moduleSpecifier)))
      : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0])));
    for (const reference of references) {
      const specifier = ts.isCallExpression(reference) ? stringLiteralValue(reference.arguments[0]) : stringLiteralValue(reference.moduleSpecifier);
      if (!specifier?.startsWith('./') && !specifier?.startsWith('../')) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(candidate.relative), specifier));
      assert.equal(resolved !== '..' && !resolved.startsWith('../'), true, `repository inventory rejects relative import escape: ${candidate.relative}`);
      assert.equal(candidatePaths.has(resolved), true, `repository inventory rejects unresolved relative module: ${candidate.relative} -> ${specifier}`);
      if (resolved === target) matchedSites.push({ path: candidate.relative, category: classify(candidate.relative), start: reference.getStart(sourceFile), end: reference.end, kind: ts.SyntaxKind[reference.kind] });
    }
  }
  assert.equal(matchedSites.every(site => site.category === 'PRODUCTION' || site.category === 'TEST'), true, 'repository inventory never hides a snapshot reference in a non-Test excluded category');
  const productionSites = matchedSites.filter(site => site.category === 'PRODUCTION');
  assert.equal(productionSites.length, 1, 'repository inventory finds exactly one production snapshot-module reference site');
  const productionConsumers = [...new Set(productionSites.map(site => site.path))];
  assert.deepEqual(productionConsumers, ['tools/harness/change-coordinator/production.mjs'], 'repository inventory finds exactly the sole production consumer');
  return Object.freeze({ candidate_paths: Object.freeze(candidates.map(candidate => candidate.relative)), matched_sites: Object.freeze(matchedSites.map(site => Object.freeze(site))), production_consumers: Object.freeze(productionConsumers) });
}

test('RED-WVEB-001 / REQ-WVEB-001 / AC-WVEB-001: normal ESM import exposes the approved pure snapshot evaluator', async () => {
  const module = await import(SNAPSHOT_URL.href);
  assert.equal(typeof module.evaluateWorktreeSnapshotObservationV1, 'function');
});

test('RED-WVEB-002 / REQ-WVEB-001 / AC-WVEB-002,003: production normal ESM import exposes the exact validation factory', async () => {
  const module = await import(PRODUCTION_URL.href);
  assert.equal(typeof module.createValidationGateway, 'function', 'legacy private SHA-only validation is not the WORKTREE factory contract');
});

test('TEST-WVEB-001 / REQ-WVEB-001 / AC-WVEB-001: L1 exact empty and raw-byte mixed snapshots have the independent hashes', async () => {
  const evaluate = await evaluator();
  const empty = validL1({ empty: true });
  assert.deepEqual(evaluate(evaluationInput(empty)), { kind: 'OK', value: oracleSnapshot(empty.subject, empty.observation) });
  const mixed = validL1();
  const expected = oracleSnapshot(mixed.subject, mixed.observation);
  assert.deepEqual(evaluate(evaluationInput(mixed)), { kind: 'OK', value: expected });
  const reordered = validL1();
  reordered.subject.allowed_paths = [...reordered.subject.allowed_paths].reverse();
  const reorderedExpected = oracleSnapshot(reordered.subject, reordered.observation);
  assert.notEqual(reorderedExpected.scope_sha256, expected.scope_sha256, 'one signed-scope-order mutation changes the independent scope hash');
  assert.deepEqual(evaluate(evaluationInput(reordered)), { kind: 'OK', value: reorderedExpected }, 'the evaluator retains signed scope order');
});

function l1Mutation(name, reason, build) {
  test(`TEST-WVEB-002 / REQ-WVEB-001 / AC-WVEB-001,005: ${name}`, async () => {
    const evaluate = await evaluator();
    const control = validL1();
    assert.deepEqual(evaluate(evaluationInput(control)), { kind: 'OK', value: oracleSnapshot(control.subject, control.observation) }, 'known-good control');
    rejected(evaluate(build()), reason);
  });
}

l1Mutation('extra top-level field rejects INPUT_INVALID', 'INPUT_INVALID', () => ({ schema_version: '1.0', subject: validL1().subject, observation: validL1().observation, extra: true }));
l1Mutation('missing top-level observation rejects INPUT_INVALID', 'INPUT_INVALID', () => ({ schema_version: '1.0', subject: validL1().subject }));
l1Mutation('array top-level input rejects INPUT_INVALID', 'INPUT_INVALID', () => []);
l1Mutation('top-level accessor rejects INPUT_INVALID', 'INPUT_INVALID', () => {
  const input = evaluationInput();
  Object.defineProperty(input, 'schema_version', { enumerable: true, get: () => '1.0' });
  return input;
});
l1Mutation('non-plain top-level input rejects INPUT_INVALID', 'INPUT_INVALID', () => {
  const input = evaluationInput(); Object.setPrototypeOf(input, null); return input;
});
l1Mutation('wrong schema version rejects INPUT_INVALID', 'INPUT_INVALID', () => ({ schema_version: '1.1', subject: validL1().subject, observation: validL1().observation }));
l1Mutation('array subject rejects INPUT_INVALID', 'INPUT_INVALID', () => ({ schema_version: '1.0', subject: [], observation: validL1().observation }));
l1Mutation('extra subject field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.extra = 'x'; }));
l1Mutation('extra index field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.index_probe.extra = 'x'; }));
l1Mutation('content accessor rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.defineProperty(observation.entries[2].content, 'sha256', { get: () => HEX_A, enumerable: true }); }));
l1Mutation('macbook branch rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.branch = 'work/macbook/not-execution'; }));
l1Mutation('uppercase Head rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.head_sha = 'A'.repeat(40); }));
l1Mutation('relative repository root rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.repository_root = 'relative'; }));
l1Mutation('dot-dot scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['../escape']; }));
l1Mutation('leading-slash scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['/scopes']; }));
l1Mutation('trailing-slash scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes/']; }));
l1Mutation('empty-segment scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes//entry']; }));
l1Mutation('dot-segment scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes/./entry']; }));
l1Mutation('NUL scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes/\0entry']; }));
l1Mutation('backslash scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes\\entry']; }));
l1Mutation('second-glob scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes/**/entry']; }));
l1Mutation('other-wildcard scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes/*']; }));
l1Mutation('duplicate signed scope rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['scopes/**', 'scopes/**']; }));
l1Mutation('direct allowed-forbidden scope conflict rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.forbidden_paths = ['scopes/**']; }));
l1Mutation('single scope item over 4096 bytes rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = ['a'.repeat(4097)]; }));
l1Mutation('canonical signed scope over one MiB rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.allowed_paths = Array.from({ length: 270 }, (_, index) => `scope-${index}/${'a'.repeat(4000)}`); }));
l1Mutation('absolute raw path rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M /absolute/path\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('dot raw path rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M ./dot\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('dot-dot raw path rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M scopes/../escape\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('backslash raw path rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M scopes\\escape\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('rename two-path raw bytes reject SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from('R  old\0new\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('unterminated raw record rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M scopes/no-nul'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('unsupported XY rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from('A  scopes/bad.txt\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('ignored !! record rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.ignored_status_stdout = Buffer.concat([observation.status_stdout, Buffer.from('!! ignored.txt\0')]); }));
l1Mutation('ignored stream disagreement rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.ignored_status_stdout = Buffer.from(''); }));
l1Mutation('dirty index exit rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.index_probe.exit_code = 1; }));
l1Mutation('noisy index stderr rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.index_probe.stderr = Buffer.from('dirty'); }));
l1Mutation('missing status entry rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries.pop(); }));
l1Mutation('extra status entry rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries.push({ ...observation.entries[0], path_bytes: Buffer.from('scopes/extra') }); }));
l1Mutation('worktree realpath mismatch rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.worktree_root_realpath = '/wrong'; }));
l1Mutation('escaped parent realpath rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[0].parent_realpath = '/outside'; }));
l1Mutation('forbidden narrower scope wins SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ subject }) => { subject.forbidden_paths = ['scopes/a.txt']; }));
l1Mutation('socket leaf rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].before = present('SOCKET'); observation.entries[2].after = observation.entries[2].before; }));
l1Mutation('file content represented as symlink rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].content = { kind: 'SYMLINK', target_sha256: HEX_A }; }));
l1Mutation('before-after dev race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, dev: 99n }; }));
l1Mutation('before-after ino race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, ino: 99n }; }));
l1Mutation('before-after size race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, size: 99n }; }));
l1Mutation('before-after mtime race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, mtime_ns: 99n }; }));
l1Mutation('before-after ctime race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, ctime_ns: 99n }; }));
l1Mutation('missing subject field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { delete subject.kind; }));
l1Mutation('wrong subject field type rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.kind = 7; }));
l1Mutation('subject accessor rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { Object.defineProperty(subject, 'kind', { enumerable: true, get: () => 'WORKTREE' }); }));
l1Mutation('non-plain subject rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { Object.setPrototypeOf(subject, null); }));
l1Mutation('missing observation field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { delete observation.head_sha; }));
l1Mutation('extra observation field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.extra = true; }));
l1Mutation('wrong observation field type rejects INPUT_INVALID', 'INPUT_INVALID', () => ({ schema_version: '1.0', subject: validL1().subject, observation: [] }));
l1Mutation('observation accessor rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.defineProperty(observation, 'branch', { enumerable: true, get: () => 'work/mac-mini/wveb-contract' }); }));
l1Mutation('non-plain observation rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.setPrototypeOf(observation, null); }));
l1Mutation('missing index field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { delete observation.index_probe.signal; }));
l1Mutation('wrong index type rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.index_probe = 1; }));
l1Mutation('index accessor rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.defineProperty(observation.index_probe, 'exit_code', { enumerable: true, get: () => 0 }); }));
l1Mutation('non-plain index rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.setPrototypeOf(observation.index_probe, null); }));
l1Mutation('missing entry field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { delete observation.entries[0].after; }));
l1Mutation('extra entry field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[0].extra = true; }));
l1Mutation('wrong entry type rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[0] = 1; }));
l1Mutation('entry accessor rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.defineProperty(observation.entries[0], 'path_bytes', { enumerable: true, get: () => Buffer.from('scopes/a.txt') }); }));
l1Mutation('non-plain entry rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.setPrototypeOf(observation.entries[0], null); }));
l1Mutation('missing stat field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => {
  const entry = observation.entries[2]; const original = entry.before;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const after = { reference: entry.after, prototype: Object.getPrototypeOf(entry.after), keys: Reflect.ownKeys(entry.after), descriptors: Object.getOwnPropertyDescriptors(entry.after) };
  const beforeDescriptors = Object.getOwnPropertyDescriptors(entry.before); delete entry.before.dev;
  assert.strictEqual(entry.after, after.reference); assert.equal(Object.getPrototypeOf(entry.after), after.prototype); assert.deepEqual(Reflect.ownKeys(entry.after), after.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), after.descriptors);
  for (const key of Reflect.ownKeys(beforeDescriptors).filter(key => key !== 'dev')) assert.deepEqual(Object.getOwnPropertyDescriptor(entry.before, key), beforeDescriptors[key]);
}));
l1Mutation('extra stat field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => {
  const entry = observation.entries[2]; const original = entry.before;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const after = { reference: entry.after, prototype: Object.getPrototypeOf(entry.after), keys: Reflect.ownKeys(entry.after), descriptors: Object.getOwnPropertyDescriptors(entry.after) };
  const beforeDescriptors = Object.getOwnPropertyDescriptors(entry.before); entry.before.extra = true;
  assert.strictEqual(entry.after, after.reference); assert.equal(Object.getPrototypeOf(entry.after), after.prototype); assert.deepEqual(Reflect.ownKeys(entry.after), after.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), after.descriptors);
  assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), { ...beforeDescriptors, extra: Object.getOwnPropertyDescriptor(entry.before, 'extra') });
}));
l1Mutation('wrong stat type rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[2].before = 1; }));
test('TEST-WVEB-002 / REQ-WVEB-001 / AC-WVEB-001,005: stat accessor rejects INPUT_INVALID', async () => {
  const evaluate = await evaluator(); const control = validL1(); assert.deepEqual(evaluate(evaluationInput(control)), { kind: 'OK', value: oracleSnapshot(control.subject, control.observation) }, 'known-good control');
  const fixture = validL1(); const entry = fixture.observation.entries[2]; const original = entry.before; let reads = 0;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after); assert.equal(reads, 0);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const after = { reference: entry.after, prototype: Object.getPrototypeOf(entry.after), keys: Reflect.ownKeys(entry.after), descriptors: Object.getOwnPropertyDescriptors(entry.after) };
  const beforeDescriptors = Object.getOwnPropertyDescriptors(entry.before); Object.defineProperty(entry.before, 'ino', { enumerable: true, get() { reads += 1; return 11n; } });
  assert.equal(reads, 0, 'construction never reads the stat accessor'); assert.strictEqual(entry.after, after.reference); assert.equal(Object.getPrototypeOf(entry.after), after.prototype); assert.deepEqual(Reflect.ownKeys(entry.after), after.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), after.descriptors); assert.deepEqual(Object.getOwnPropertyDescriptor(entry.before, 'kind'), beforeDescriptors.kind); assert.deepEqual(Object.getOwnPropertyDescriptor(entry.before, 'type'), beforeDescriptors.type);
  rejected(evaluate(evaluationInput(fixture)), 'INPUT_INVALID'); assert.equal(reads, 0, 'public evaluation never reads the stat accessor');
});
l1Mutation('non-plain stat rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => {
  const entry = observation.entries[2]; const original = entry.before;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const after = { reference: entry.after, prototype: Object.getPrototypeOf(entry.after), keys: Reflect.ownKeys(entry.after), descriptors: Object.getOwnPropertyDescriptors(entry.after) };
  const beforeDescriptors = Object.getOwnPropertyDescriptors(entry.before); Object.setPrototypeOf(entry.before, null);
  assert.strictEqual(entry.after, after.reference); assert.equal(Object.getPrototypeOf(entry.after), after.prototype); assert.deepEqual(Reflect.ownKeys(entry.after), after.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), after.descriptors); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), beforeDescriptors);
}));
l1Mutation('missing after-stat field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => {
  const entry = observation.entries[2]; const original = entry.before;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const before = { reference: entry.before, prototype: Object.getPrototypeOf(entry.before), keys: Reflect.ownKeys(entry.before), descriptors: Object.getOwnPropertyDescriptors(entry.before) }; delete entry.after.dev;
  assert.strictEqual(entry.before, before.reference); assert.equal(Object.getPrototypeOf(entry.before), before.prototype); assert.deepEqual(Reflect.ownKeys(entry.before), before.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), before.descriptors);
}));
l1Mutation('extra after-stat field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => {
  const entry = observation.entries[2]; const original = entry.before;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const before = { reference: entry.before, prototype: Object.getPrototypeOf(entry.before), keys: Reflect.ownKeys(entry.before), descriptors: Object.getOwnPropertyDescriptors(entry.before) }; const afterDescriptors = Object.getOwnPropertyDescriptors(entry.after); entry.after.extra = true;
  assert.strictEqual(entry.before, before.reference); assert.equal(Object.getPrototypeOf(entry.before), before.prototype); assert.deepEqual(Reflect.ownKeys(entry.before), before.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), before.descriptors);
  assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), { ...afterDescriptors, extra: Object.getOwnPropertyDescriptor(entry.after, 'extra') });
}));
l1Mutation('wrong after-stat type rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[2].after = 1; }));
test('TEST-WVEB-002 / REQ-WVEB-001 / AC-WVEB-001,005: after-stat accessor rejects INPUT_INVALID', async () => {
  const evaluate = await evaluator(); const control = validL1(); assert.deepEqual(evaluate(evaluationInput(control)), { kind: 'OK', value: oracleSnapshot(control.subject, control.observation) }, 'known-good control');
  const fixture = validL1(); const entry = fixture.observation.entries[2]; const original = entry.before; let reads = 0;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after); assert.equal(reads, 0);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const before = { reference: entry.before, prototype: Object.getPrototypeOf(entry.before), keys: Reflect.ownKeys(entry.before), descriptors: Object.getOwnPropertyDescriptors(entry.before) }; const afterDescriptors = Object.getOwnPropertyDescriptors(entry.after); Object.defineProperty(entry.after, 'ino', { enumerable: true, get() { reads += 1; return 11n; } });
  assert.equal(reads, 0, 'construction never reads the after-stat accessor'); assert.strictEqual(entry.before, before.reference); assert.equal(Object.getPrototypeOf(entry.before), before.prototype); assert.deepEqual(Reflect.ownKeys(entry.before), before.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), before.descriptors); assert.deepEqual(Object.getOwnPropertyDescriptor(entry.after, 'kind'), afterDescriptors.kind);
  rejected(evaluate(evaluationInput(fixture)), 'INPUT_INVALID'); assert.equal(reads, 0, 'public evaluation never reads the after-stat accessor');
});
l1Mutation('non-plain after-stat rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => {
  const entry = observation.entries[2]; const original = entry.before;
  assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
  entry.before = { ...original }; entry.after = { ...original };
  assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
  const before = { reference: entry.before, prototype: Object.getPrototypeOf(entry.before), keys: Reflect.ownKeys(entry.before), descriptors: Object.getOwnPropertyDescriptors(entry.before) }; const afterDescriptors = Object.getOwnPropertyDescriptors(entry.after); Object.setPrototypeOf(entry.after, null);
  assert.strictEqual(entry.before, before.reference); assert.equal(Object.getPrototypeOf(entry.before), before.prototype); assert.deepEqual(Reflect.ownKeys(entry.before), before.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), before.descriptors); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), afterDescriptors);
}));
l1Mutation('missing content field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { delete observation.entries[2].content.sha256; }));
l1Mutation('extra content field rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[2].content.extra = true; }));
l1Mutation('wrong content type rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[2].content = 1; }));
l1Mutation('non-plain content rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { Object.setPrototypeOf(observation.entries[2].content, null); }));
l1Mutation('NUL repository root rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.repository_root = '/repo\0bad'; }));
l1Mutation('oversized common Git directory rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.common_git_dir = `/${'x'.repeat(4097)}`; }));
l1Mutation('oversized branch rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ subject }) => { subject.branch = `work/mac-mini/${'a'.repeat(256)}`; }));
l1Mutation('empty raw path bytes reject INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[0].path_bytes = Buffer.alloc(0); }));
l1Mutation('oversized raw path bytes reject INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[0].path_bytes = Buffer.alloc(4097, 97); }));
l1Mutation('invalid content hash grammar rejects INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.entries[2].content.sha256 = 'A'.repeat(64); }));
l1Mutation('oversized main status bytes reject INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.alloc(1_048_577); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('oversized ignored status bytes reject INPUT_INVALID', 'INPUT_INVALID', () => changedL1(({ observation }) => { observation.ignored_status_stdout = Buffer.alloc(1_048_577); }));
l1Mutation('empty porcelain path rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M \0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = []; }));
l1Mutation('duplicate porcelain raw path rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.status_stdout = Buffer.from(' M scopes/a.txt\0 M scopes/a.txt\0'); observation.ignored_status_stdout = Buffer.from(observation.status_stdout); observation.entries = [observation.entries[2], observation.entries[2]]; }));
l1Mutation('index signal rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.index_probe.signal = 'SIGTERM'; observation.index_probe.exit_code = null; }));
l1Mutation('index stdout rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.index_probe.stdout = Buffer.from('noisy'); }));
l1Mutation('repository observation root mismatch rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.repository_root_realpath = '/wrong'; }));
l1Mutation('common Git observation root mismatch rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.common_git_dir_realpath = '/wrong'; }));
l1Mutation('observation branch mismatch rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.branch = 'work/mac-mini/other'; }));
l1Mutation('observation Head mismatch rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.head_sha = 'f'.repeat(40); }));
l1Mutation('directory leaf rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].before = present('DIRECTORY'); observation.entries[2].after = observation.entries[2].before; }));
l1Mutation('FIFO leaf rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].before = present('FIFO'); observation.entries[2].after = observation.entries[2].before; }));
l1Mutation('block device leaf rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].before = present('BLOCK_DEVICE'); observation.entries[2].after = observation.entries[2].before; }));
l1Mutation('character device leaf rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].before = present('CHARACTER_DEVICE'); observation.entries[2].after = observation.entries[2].before; }));
l1Mutation('other leaf rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].before = present('OTHER'); observation.entries[2].after = observation.entries[2].before; }));
l1Mutation('symlink represented with file content rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[3].content = { kind: 'FILE', sha256: HEX_A }; }));
l1Mutation('followed symlink file representation rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[3].before = present('FILE'); observation.entries[3].after = observation.entries[3].before; }));
l1Mutation('before-after kind race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = missing(); }));
l1Mutation('before-after type race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, type: 'SYMLINK' }; }));
l1Mutation('before-after mode race rejects SUBJECT_MISMATCH', 'SUBJECT_MISMATCH', () => changedL1(({ observation }) => { observation.entries[2].after = { ...observation.entries[2].before, mode: 0o100755n }; }));

for (const statField of ['mode', 'dev', 'ino', 'size', 'mtime_ns', 'ctime_ns']) {
  for (const [representation, value] of [['Number representation', 1], ['negative bigint', -1n]]) test(`TEST-WVEB-002 / REQ-WVEB-001 / AC-WVEB-001,005: present ${statField} ${representation} rejects INPUT_INVALID`, async () => {
    const evaluate = await evaluator(); const fixture = validL1(); const entry = fixture.observation.entries[2]; const original = entry.before;
    assert.equal(original.kind, 'PRESENT'); assert.equal(original.type, 'FILE'); assert.strictEqual(original, entry.after);
    entry.before = { ...original }; entry.after = { ...original };
    assert.notStrictEqual(entry.before, entry.after); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.before), Object.getOwnPropertyDescriptors(entry.after));
    assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: oracleSnapshot(fixture.subject, fixture.observation) }, 'isolated present stats remain valid before the one-field mutation');
    const after = { reference: entry.after, prototype: Object.getPrototypeOf(entry.after), keys: Reflect.ownKeys(entry.after), descriptors: Object.getOwnPropertyDescriptors(entry.after) };
    const beforeDescriptors = Object.getOwnPropertyDescriptors(entry.before); const originalValue = beforeDescriptors[statField].value;
    assert.notStrictEqual(originalValue, value, 'the stat representation mutation is not a no-op'); entry.before[statField] = value;
    assert.strictEqual(entry.before[statField], value, 'only the designated before stat value changes'); assert.equal(Object.getOwnPropertyDescriptor(entry.before, statField).writable, beforeDescriptors[statField].writable); assert.equal(Object.getOwnPropertyDescriptor(entry.before, statField).enumerable, beforeDescriptors[statField].enumerable); assert.equal(Object.getOwnPropertyDescriptor(entry.before, statField).configurable, beforeDescriptors[statField].configurable);
    for (const key of Reflect.ownKeys(beforeDescriptors).filter(key => key !== statField)) assert.deepEqual(Object.getOwnPropertyDescriptor(entry.before, key), beforeDescriptors[key]);
    assert.strictEqual(entry.after, after.reference); assert.equal(Object.getPrototypeOf(entry.after), after.prototype); assert.deepEqual(Reflect.ownKeys(entry.after), after.keys); assert.deepEqual(Object.getOwnPropertyDescriptors(entry.after), after.descriptors);
    rejected(evaluate(evaluationInput(fixture)), 'INPUT_INVALID');
  });
}

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003: factory input is closed and gateway exposes only execute', async () => {
  const createValidationGateway = await factory();
  const control = createValidationGateway({ nodeExecutable: NODE });
  assert.deepEqual(Object.keys(control), ['execute']);
  assert.equal(Object.isFrozen(control), true);
  let reads = 0;
  const accessorInput = {};
  Object.defineProperty(accessorInput, 'nodeExecutable', { enumerable: true, get() { reads += 1; return NODE; } });
  assert.throws(() => createValidationGateway(accessorInput), /INPUT_INVALID/, 'a valid-looking getter is not an admitted data field');
  assert.equal(reads, 0, 'factory admission rejects before reading the accessor');
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-003,004: both exact definitions produce complete 24-field receipt and independent hashes', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ subject }) => {
    const gateway = createValidationGateway({ nodeExecutable: NODE });
    const observation = await actualObservation(subject);
    const snapshot = oracleSnapshot(subject, observation);
    const first = definition(subject);
    const second = definition(subject, 'regression-test-asset-retirement');
    const firstReceipt = await gateway.execute({ definition: first, subject });
    const secondReceipt = await gateway.execute({ definition: second, subject });
    assert.deepEqual(firstReceipt, expectedReceipt(subject, first, snapshot));
    assert.deepEqual(secondReceipt, expectedReceipt(subject, second, snapshot));
    assert.notEqual(firstReceipt.value.command_definition_sha256, secondReceipt.value.command_definition_sha256, 'the one definition-tuple mutation binds the receipt command identity');
  });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003,004: real child proves closed spawn environment authority and full receipt', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const parentSentinel = `WVEB_PARENT_SENTINEL_${process.pid}_${Date.now()}`;
    const childObservation = path.join(temporary, 'child-environment.json');
    process.env[parentSentinel] = 'parent-only';
    try {
      const d = definition(subject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1],JSON.stringify(Object.keys(process.env).sort()))', childObservation]);
      const snapshot = oracleSnapshot(subject, await actualObservation(subject));
      const actual = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject });
      const childEnvironmentKeys = JSON.parse(await readFile(childObservation, 'utf8'));
      assert.equal(Object.hasOwn(process.env, parentSentinel), true, 'parent sentinel was set for the closed-environment witness');
      assert.equal(childEnvironmentKeys.includes(parentSentinel), false, 'the production child cannot inherit a parent field');
      const remainingChildKeys = [...childEnvironmentKeys];
      const darwinInjection = remainingChildKeys.indexOf('__CF_USER_TEXT_ENCODING');
      if (darwinInjection !== -1) remainingChildKeys.splice(darwinInjection, 1);
      assert.deepEqual(remainingChildKeys, [], 'after excluding only the named Darwin/Node injection, no child environment fields remain');
      assert.deepEqual(actual, expectedReceipt(subject, d, snapshot, { stdout: Buffer.alloc(0) }));
    } finally {
      delete process.env[parentSentinel];
    }
  });
});

async function assertNonemptySuccess(prepare) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ worktree, subject }) => {
    await prepare({ worktree, subject });
    const d = definition(subject);
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    assert.ok(snapshot.entry_count > 0, 'real nonempty Git inventory reaches the public factory');
    assert.deepEqual(await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject }), expectedReceipt(subject, d, snapshot));
  });
}

const resistantChildProgram = [
  'const fs=require("node:fs");const os=require("node:os");',
  'const readyPath=process.argv[1];const signalPath=process.argv[2];const mutationPath=process.argv[3]||null;',
  'const numbers=new Set();const installed=[];',
  'for(const [name,number] of Object.entries(os.constants.signals)){if(numbers.has(number)||name==="SIGKILL"||name==="SIGSTOP")continue;numbers.add(number);try{process.on(name,()=>fs.appendFileSync(signalPath,name+"\\n"));installed.push(name)}catch(error){if(error?.code!=="ERR_UNKNOWN_SIGNAL"&&error?.code!=="ERR_INVALID_ARG_VALUE")throw error}}',
  'if(!installed.includes("SIGTERM"))throw new Error("SIGTERM handler unavailable");',
  'fs.writeFileSync(readyPath,JSON.stringify({kind:"ready",pid:process.pid,installed}));',
  'if(mutationPath)fs.writeFileSync(mutationPath,"mutation\\n");',
  'process.stdout.write("resistant-ready\\n");process.stderr.write("resistant-stderr\\n");setInterval(()=>{},1000);',
].join('');

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function waitForResistantReady(readyPath) {
  const deadline = Date.now() + 1_500;
  for (;;) {
    try {
      const ready = JSON.parse(await readFile(readyPath, 'utf8'));
      assert.deepEqual(Object.keys(ready).sort(), ['installed', 'kind', 'pid']);
      assert.equal(ready.kind, 'ready');
      assert.equal(Number.isSafeInteger(ready.pid) && ready.pid > 0, true, 'ready record has one exact PID');
      assert.equal(new Set(ready.installed).size, ready.installed.length, 'ready record has no duplicate signal handler');
      assert.equal(ready.installed.includes('SIGTERM'), true, 'ready record proves the SIGTERM handler was installed');
      return ready;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      if (Date.now() >= deadline) throw new Error('resistant child never produced its ready record');
      await pause(10);
    }
  }
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitForPidExit(pid) {
  const deadline = Date.now() + 1_500;
  while (pidAlive(pid)) {
    if (Date.now() >= deadline) throw new Error(`recorded child PID ${pid} remained alive after production receipt`);
    await pause(10);
  }
}

async function assertResistantTimeout({ mutateWorktree }) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, worktree, subject }) => {
    const readyPath = path.join(temporary, 'resistant-ready.json');
    const signalPath = path.join(temporary, 'resistant-signals.log');
    const mutationPath = mutateWorktree ? path.join(worktree, 'checks', 'resistant-mutation.txt') : null;
    await writeFile(signalPath, '');
    if (mutationPath) await mkdir(path.dirname(mutationPath), { recursive: true });
    const d = { ...definition(subject, 'regression-affected-suite', [NODE, '-e', resistantChildProgram, readyPath, signalPath, ...(mutationPath ? [mutationPath] : [])]), timeout_ms: 250 };
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    const execution = createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject });
    let ready;
    let watchdog;
    try {
      ready = await waitForResistantReady(readyPath);
      const settled = await Promise.race([
        execution.then(value => ({ kind: 'settled', value })),
        new Promise(resolve => { watchdog = setTimeout(() => resolve({ kind: 'watchdog' }), 900); }),
      ]);
      assert.notEqual(settled.kind, 'watchdog', 'watchdog intervention is an unconditional Test failure');
      clearTimeout(watchdog);
      const recordedSignals = (await readFile(signalPath, 'utf8')).split('\n').filter(Boolean);
      assert.deepEqual(recordedSignals, [], 'production delivered no catchable terminating signal to the resistant child');
      await waitForPidExit(ready.pid);
      const expected = mutateWorktree
        ? expectedReceipt(subject, d, snapshot, { status: 'INTERRUPTED', verdict: null, failure_code: 'SUBJECT_MISMATCH', stdout: Buffer.from('resistant-ready\n'), stderr: Buffer.from('resistant-stderr\n') })
        : expectedReceipt(subject, d, snapshot, { status: 'INTERRUPTED', verdict: null, failure_code: 'TIMEOUT', stdout: Buffer.from('resistant-ready\n'), stderr: Buffer.from('resistant-stderr\n') });
      assert.deepEqual(settled.value, expected, 'receipt binds the Test-owned exact child outputs and the pre-snapshot identity');
      if (mutateWorktree) assert.equal(await readFile(mutationPath, 'utf8'), 'mutation\n', 'the post-snapshot observed the real child mutation');
      else assert.equal(snapshot.worktree_snapshot_sha256, oracleSnapshot(subject, await actualObservation(subject)).worktree_snapshot_sha256, 'unchanged post-snapshot retains the pre-snapshot identity');
    } finally {
      if (watchdog) clearTimeout(watchdog);
      if (ready?.pid && pidAlive(ready.pid)) process.kill(ready.pid, 'SIGKILL');
      await execution;
      if (ready?.pid) await waitForPidExit(ready.pid);
    }
  });
}

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003,004: real nonempty regular-file snapshot succeeds with full receipt', async () => {
  await assertNonemptySuccess(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/regular.txt', 'before\n');
    await refreshSubjectHead(subject);
    await writeFile(target, 'after\n');
  });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003,004: real nonempty executable-file snapshot succeeds with full receipt', async () => {
  await assertNonemptySuccess(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/executable.txt', 'run\n');
    await refreshSubjectHead(subject);
    await chmod(target, 0o755);
  });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003,004: real nonempty symlink snapshot succeeds with full receipt', async () => {
  await assertNonemptySuccess(async ({ worktree, subject }) => {
    const target = path.join(worktree, 'checks', 'link');
    await mkdir(path.dirname(target), { recursive: true });
    await symlink('first-target', target);
    await git(worktree, ['add', 'checks/link']);
    await git(worktree, ['-c', 'user.name=WVEB', '-c', 'user.email=wveb@example.invalid', 'commit', '-qm', 'fixture-symlink']);
    await refreshSubjectHead(subject);
    await unlink(target);
    await symlink('second-target', target);
  });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003,004: real tracked deletion snapshot succeeds with full receipt', async () => {
  await assertNonemptySuccess(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/deleted.txt', 'remove me\n');
    await refreshSubjectHead(subject);
    await unlink(target);
  });
});

function invalidRequestLeaf(name, makeRequest, { identityTrap = true } = {}) {
  test(`TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-003: ${name} rejects before Git or a child`, async () => {
    const createValidationGateway = await factory();
    await withWorktree(async ({ temporary, subject }) => {
      const gateway = createValidationGateway({ nodeExecutable: NODE });
      const sentinel = path.join(temporary, 'must-not-start');
      const baseSubject = identityTrap ? { ...subject, repository_root: path.join(temporary, 'absent-ordering-trap') } : subject;
      const d = definition(baseSubject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1], "started")', sentinel]);
      if (identityTrap) assert.deepEqual(await gateway.execute({ definition: d, subject: baseSubject }), expectedPreSnapshotMismatchReceipt(baseSubject, d), 'the unmutated closed request reaches the distinct identity trap');
      const request = await makeRequest({ d, subject: baseSubject, temporary });
      const beforeStatus = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']);
      await assert.rejects(gateway.execute(request), /INPUT_INVALID/);
      await assert.rejects(readFile(sentinel), /ENOENT/);
      assert.deepEqual(await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']), beforeStatus, 'invalid admission has no Test-observable worktree effect beyond its Test fixture');
    });
  });
}

invalidRequestLeaf('missing request subject', ({ d }) => ({ definition: d }));
invalidRequestLeaf('extra request field', ({ d, subject }) => ({ definition: d, subject, extra: true }));
invalidRequestLeaf('legacy subject_sha request field', ({ d, subject }) => ({ definition: d, subject, subject_sha: subject.head_sha }));
invalidRequestLeaf('Candidate request field', ({ d, subject }) => ({ definition: d, subject, candidate: {} }));
invalidRequestLeaf('extra definition field', ({ d, subject }) => ({ definition: { ...d, extra: true }, subject }));
invalidRequestLeaf('unknown definition tuple id', ({ d, subject }) => ({ definition: { ...d, id: 'not-a-closed-definition' }, subject }));
invalidRequestLeaf('empty argv', ({ d, subject }) => ({ definition: { ...d, argv: [] }, subject }));
invalidRequestLeaf('non-string argv element', ({ d, subject }) => ({ definition: { ...d, argv: [NODE, 7] }, subject }));
invalidRequestLeaf('non-empty environment', ({ d, subject }) => ({ definition: { ...d, environment: { X: '1' } }, subject }));
invalidRequestLeaf('wrong argv executable', ({ d, subject }) => ({ definition: { ...d, argv: ['node', ...d.argv.slice(1)] }, subject }));
invalidRequestLeaf('wrong definition subject tuple', ({ d, subject }) => ({ definition: { ...d, subject: 'CANDIDATE' }, subject }));
invalidRequestLeaf('relative execution cwd', ({ d, subject }) => ({ definition: { ...d, cwd: 'relative' }, subject }));
invalidRequestLeaf('outside execution cwd', ({ d, subject }) => ({ definition: { ...d, cwd: '/private/tmp' }, subject }), { identityTrap: false });
invalidRequestLeaf('symlink-escaping execution cwd', async ({ d, subject, temporary }) => {
  const escapingCwd = path.join(subject.worktree_root, 'escaping-cwd');
  await symlink(temporary, escapingCwd);
  return { definition: { ...d, cwd: escapingCwd }, subject };
}, { identityTrap: false });
invalidRequestLeaf('non-positive timeout', ({ d, subject }) => ({ definition: { ...d, timeout_ms: 0 }, subject }));
invalidRequestLeaf('extra Candidate field in subject', ({ d, subject }) => ({ definition: d, subject: { ...subject, candidate_sha: HEAD } }));

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-004: unchanged nonzero child retains only COMPLETED FAIL NONZERO_EXIT', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ subject }) => {
    const d = definition(subject, 'regression-affected-suite', [NODE, '-e', 'process.stderr.write("wv-fail");process.exit(7)']);
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    const receipt = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject });
    assert.deepEqual(receipt, expectedReceipt(subject, d, snapshot, { status: 'COMPLETED', verdict: 'FAIL', failure_code: 'NONZERO_EXIT', stdout: Buffer.alloc(0), stderr: Buffer.from('wv-fail') }));
  });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-004: missing absolute Node child retains only START_FAILED PROCESS_START_FAILED', async () => {
  const missingNode = '/private/tmp/juanerai-wveb-missing-node';
  const createValidationGateway = await factory();
  await withWorktree(async ({ subject }) => {
    const d = definition(subject, 'regression-affected-suite', [missingNode, '-e', 'process.exit(0)']);
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    const receipt = await createValidationGateway({ nodeExecutable: missingNode }).execute({ definition: d, subject });
    assert.deepEqual(receipt, expectedReceipt(subject, d, snapshot, { status: 'START_FAILED', verdict: null, failure_code: 'PROCESS_START_FAILED', stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }));
  });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-004: timeout child retains only INTERRUPTED null TIMEOUT', async () => {
  await assertResistantTimeout({ mutateWorktree: false });
});

test('TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-004: self-signal child retains only INTERRUPTED null SIGNAL_EXIT', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ subject }) => {
    const signal = definition(subject, 'regression-affected-suite', [NODE, '-e', 'process.kill(process.pid, "SIGTERM")']);
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    const signalReceipt = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: signal, subject });
    assert.deepEqual(signalReceipt, expectedReceipt(subject, signal, snapshot, { status: 'INTERRUPTED', verdict: null, failure_code: 'SIGNAL_EXIT', stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }));
  });
});

async function assertPreSnapshotMismatch(alter) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const sentinel = path.join(temporary, 'must-not-start');
    const d = definition(subject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1], "child")', sentinel]);
    const altered = alter(subject, temporary);
    const receipt = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject: altered });
    assert.deepEqual(receipt, expectedPreSnapshotMismatchReceipt(altered, d));
    await assert.rejects(readFile(sentinel), /ENOENT/);
  });
}

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: wrong repository root starts zero child', async () => {
  await assertPreSnapshotMismatch((subject, temporary) => ({ ...subject, repository_root: path.join(temporary, 'wrong-root') }));
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: wrong worktree root starts zero child', async () => {
  await assertPreSnapshotMismatch((subject, temporary) => ({ ...subject, worktree_root: path.join(temporary, 'wrong-worktree') }));
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-003,004,005: macbook branch is admission INPUT_INVALID with no receipt and zero child', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const sentinel = path.join(temporary, 'must-not-start');
    const trappedSubject = { ...subject, repository_root: path.join(temporary, 'absent-ordering-trap') };
    const d = definition(trappedSubject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1], "child")', sentinel]);
    const gateway = createValidationGateway({ nodeExecutable: NODE });
    assert.deepEqual(await gateway.execute({ definition: d, subject: trappedSubject }), expectedPreSnapshotMismatchReceipt(trappedSubject, d), 'the valid control reaches only the distinct identity trap');
    const macbookSubject = { ...trappedSubject, branch: 'work/macbook/not-an-execution-subject' };
    await assert.rejects(gateway.execute({ definition: d, subject: macbookSubject }), /INPUT_INVALID/);
    await assert.rejects(readFile(sentinel), /ENOENT/);
    assert.equal((await git(subject.worktree_root, ['status', '--porcelain=v1', '-z'])).length, 0, 'invalid branch admission has no downstream worktree effect');
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: wrong Head starts zero child', async () => {
  await assertPreSnapshotMismatch(subject => ({ ...subject, head_sha: 'f'.repeat(40) }));
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: wrong common Git directory starts zero child', async () => {
  await assertPreSnapshotMismatch((subject, temporary) => ({ ...subject, common_git_dir: path.join(temporary, 'wrong-common') }));
});

async function assertRealGitMismatch(mutate) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, worktree, subject }) => {
    await mutate({ worktree, subject });
    const sentinel = path.join(temporary, 'must-not-start');
    const d = definition(subject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1], "child")', sentinel]);
    const receipt = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject });
    assert.deepEqual(receipt, expectedPreSnapshotMismatchReceipt(subject, d));
    await assert.rejects(readFile(sentinel), /ENOENT/);
  });
}

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: actual out-of-scope dirty file starts zero child', async () => {
  await assertRealGitMismatch(async ({ worktree }) => { await writeFile(path.join(worktree, 'outside.txt'), 'out'); });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: actual forbidden-wins dirty file starts zero child', async () => {
  await assertRealGitMismatch(async ({ worktree }) => {
    await mkdir(path.join(worktree, 'checks', 'private'), { recursive: true });
    await writeFile(path.join(worktree, 'checks', 'private', 'blocked.txt'), 'blocked');
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: actual ignored Git file starts zero child', async () => {
  await assertRealGitMismatch(async ({ worktree, subject }) => {
    await writeFile(path.join(worktree, '.gitignore'), 'ignored.txt\n');
    await git(worktree, ['add', '.gitignore']);
    await git(worktree, ['-c', 'user.name=WVEB', '-c', 'user.email=wveb@example.invalid', 'commit', '-qm', 'ignore']);
    subject.head_sha = (await git(worktree, ['rev-parse', 'HEAD'])).toString('utf8').trim();
    await writeFile(path.join(worktree, 'ignored.txt'), 'ignored');
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: actual staged index starts zero child', async () => {
  await assertRealGitMismatch(async ({ worktree }) => {
    await mkdir(path.join(worktree, 'checks'), { recursive: true });
    await writeFile(path.join(worktree, 'checks', 'staged.txt'), 'staged');
    await git(worktree, ['add', 'checks/staged.txt']);
  });
});

async function assertPostProcessMutation(prepare, script, verify) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, worktree, subject }) => {
    const target = await prepare({ worktree, subject });
    const sentinel = path.join(temporary, 'exactly-one-child');
    const d = definition(subject, 'regression-affected-suite', [NODE, '-e', script, sentinel, target]);
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    const receipt = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject });
    assert.deepEqual(receipt, expectedReceipt(subject, d, snapshot, {
      status: 'INTERRUPTED', verdict: null, failure_code: 'SUBJECT_MISMATCH', stdout: Buffer.alloc(0), stderr: Buffer.alloc(0),
    }));
    assert.equal(await readFile(sentinel, 'utf8'), 'launch\n', 'the sole child appended exactly one launch record');
    await verify(target);
    assert.equal((await git(worktree, ['rev-parse', 'HEAD'])).toString('utf8').trim(), subject.head_sha, 'no State/Ledger/STAGE/Candidate/publication effect');
  });
}

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: post-process create mutation returns full SUBJECT_MISMATCH receipt once', async () => {
  await assertPostProcessMutation(async ({ worktree }) => {
    await mkdir(path.join(worktree, 'checks'), { recursive: true });
    return path.join(worktree, 'checks', 'created.txt');
  }, 'const fs=require("node:fs");fs.appendFileSync(process.argv[1],"launch\\n");fs.writeFileSync(process.argv[2],"created")', async target => {
    assert.equal(await readFile(target, 'utf8'), 'created');
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: post-process remove mutation returns full SUBJECT_MISMATCH receipt once', async () => {
  await assertPostProcessMutation(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/remove.txt', 'remove\n');
    await refreshSubjectHead(subject);
    return target;
  }, 'const fs=require("node:fs");fs.appendFileSync(process.argv[1],"launch\\n");fs.unlinkSync(process.argv[2])', async target => {
    await assert.rejects(readFile(target), /ENOENT/);
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: post-process rewrite mutation returns full SUBJECT_MISMATCH receipt once', async () => {
  await assertPostProcessMutation(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/rewrite.txt', 'before\n');
    await refreshSubjectHead(subject);
    return target;
  }, 'const fs=require("node:fs");fs.appendFileSync(process.argv[1],"launch\\n");fs.writeFileSync(process.argv[2],"after\\n")', async target => {
    assert.equal(await readFile(target, 'utf8'), 'after\n');
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: post-process chmod mutation returns full SUBJECT_MISMATCH receipt once', async () => {
  await assertPostProcessMutation(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/chmod.txt', 'mode\n');
    await refreshSubjectHead(subject);
    return target;
  }, 'const fs=require("node:fs");fs.appendFileSync(process.argv[1],"launch\\n");fs.chmodSync(process.argv[2],0o755)', async target => {
    assert.equal((await lstat(target, { bigint: true })).mode & 0o111n, 0o111n);
  });
});

test('TEST-WVEB-004 / REQ-WVEB-001 / AC-WVEB-004,005: post-process replace mutation returns full SUBJECT_MISMATCH receipt once', async () => {
  await assertPostProcessMutation(async ({ worktree, subject }) => {
    const target = await commitFixture(worktree, 'checks/replace.txt', 'file\n');
    await refreshSubjectHead(subject);
    return target;
  }, 'const fs=require("node:fs");fs.appendFileSync(process.argv[1],"launch\\n");fs.unlinkSync(process.argv[2]);fs.symlinkSync("replacement-target",process.argv[2])', async target => {
    assert.equal((await lstat(target)).isSymbolicLink(), true);
  });
});

test('TEST-WVEB-005 / REQ-WVEB-001 / AC-WVEB-002,006: structural scope proves production is sole evaluator consumer and composition uses its factory', async () => {
  const inventory = await snapshotConsumerInventory();
  assert.deepEqual(inventory.production_consumers, ['tools/harness/change-coordinator/production.mjs'], 'repository-wide inventory retains the exact sole production consumer');
  const productionSites = inventory.matched_sites.filter(site => site.category === 'PRODUCTION');
  assert.deepEqual(productionSites.map(site => [site.path, site.category]), [['tools/harness/change-coordinator/production.mjs', 'PRODUCTION']], 'repository-wide inventory retains one production target reference');
  assert.equal(inventory.matched_sites.every(site => site.category === 'PRODUCTION' || site.category === 'TEST'), true, 'repository-wide inventory retains Test target references as audit records without counting them as production consumers');
  const { sourceFile } = await productionAst();
  const evaluatorImports = astNodes(sourceFile, node => ts.isImportDeclaration(node)
    && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === './worktree-snapshot-contract.mjs'
    && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
    && node.importClause.namedBindings.elements.some(element => element.name.text === 'evaluateWorktreeSnapshotObservationV1'));
  uniqueAst(evaluatorImports, 'sole production evaluator import');
  const collector = namedFunction(sourceFile, 'collectWorktreeSnapshotObservationV1');
  assert.equal(callsIn(collector, call => ts.isIdentifier(call.expression) && call.expression.text === 'evaluateWorktreeSnapshotObservationV1').length, 0, 'private collector observes only; it does not evaluate');
  const factoryNode = namedFunction(sourceFile, 'createValidationGateway');
  assert.equal(callsIn(factoryNode, call => ts.isIdentifier(call.expression) && call.expression.text === 'evaluateWorktreeSnapshotObservationV1').length, 2, 'gateway evaluates exactly pre- and post-snapshots');
});

test('TEST-WVEB-005 / REQ-WVEB-001 / AC-WVEB-002,003: real temporary Git oracle agrees with production on scope/raw/snapshot/command/inner/outer bytes', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ subject }) => {
    const observation = await actualObservation(subject);
    const snapshot = oracleSnapshot(subject, observation);
    const d = definition(subject);
    const actual = await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject });
    assert.deepEqual(actual, expectedReceipt(subject, d, snapshot));
  });
});

test('TEST-WVEB-006 / REQ-WVEB-001 / AC-WVEB-006: composition input stays zero-field and this suite asserts no L3 success', async () => {
  const production = await import(PRODUCTION_URL.href);
  await assert.rejects(production.createProductionComposition({ state: {} }), /INPUT_INVALID/);
  await assert.rejects(production.createProductionComposition({ validation: {} }), /INPUT_INVALID/);
});

// Correction 005: every public L2 mutation begins from a valid request whose
// repository root is a syntactically-valid ordering trap.  A closed-shape
// rejection must therefore be INPUT_INVALID without starting its child.
async function assertAdmissionInvalid(id, name, mutate) {
  addedTest(id, name, async () => {
    const createValidationGateway = await factory();
    await withWorktree(async ({ temporary, subject }) => {
      const sentinel = path.join(temporary, `${id}-child`);
      const trappedSubject = { ...subject, repository_root: path.join(temporary, 'absent-ordering-trap') };
      const d = definition(trappedSubject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1],"started")', sentinel]);
      const request = { definition: d, subject: trappedSubject };
      const counter = { value: 0 };
      await mutate({ request, d, subject: trappedSubject, counter });
      assert.equal(counter.value, 0, 'accessor callback starts at zero');
      await assert.rejects(createValidationGateway({ nodeExecutable: NODE }).execute(request), /INPUT_INVALID/);
      assert.equal(counter.value, 0, 'rejected admission never invokes an accessor callback');
      await assert.rejects(readFile(sentinel), /ENOENT/);
      assert.equal((await git(subject.worktree_root, ['rev-parse', 'HEAD'])).toString('utf8').trim(), subject.head_sha);
    });
  });
}

addedTest('N001', 'mixed raw-byte snapshot exact hash', async () => { const evaluate = await evaluator(); const fixture = validL1(); assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: oracleSnapshot(fixture.subject, fixture.observation) }); });
addedTest('N002', 'identical input deterministic repeat', async () => { const evaluate = await evaluator(); const fixture = validL1(); assert.deepEqual(evaluate(evaluationInput(fixture)), evaluate(evaluationInput(fixture))); });
addedTest('N003', 'L1 signed-scope order changes hash', async () => {
  const evaluate = await evaluator();
  const fixture = validL1();
  const reordered = validL1();
  reordered.subject.allowed_paths = [...reordered.subject.allowed_paths].reverse();
  const expected = oracleSnapshot(reordered.subject, reordered.observation);
  assert.notEqual(expected.scope_sha256, oracleSnapshot(fixture.subject, fixture.observation).scope_sha256, 'one scope-order mutation changes the independent hash');
  assert.deepEqual(evaluate(evaluationInput(reordered)), { kind: 'OK', value: expected });
});
addedTest('N004', 'raw inventory bytes are not normalized', async () => {
  const evaluate = await evaluator();
  const fixture = validL1();
  const altered = Buffer.from(fixture.observation.status_stdout);
  altered.write('?? ', 0, 'ascii');
  fixture.observation.status_stdout = altered;
  fixture.observation.ignored_status_stdout = Buffer.from(altered);
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  assert.notEqual(expected.raw_inventory_sha256, oracleSnapshot(validL1().subject, validL1().observation).raw_inventory_sha256, 'one valid porcelain XY mutation changes raw-inventory bytes');
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: expected });
});
addedTest('N005', 'V1 header and NUL framing bind snapshot', async () => {
  const evaluate = await evaluator();
  const fixture = validL1();
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  const v2Framed = oracleSnapshot(fixture.subject, fixture.observation, { header: 'JUANERAI_WORKTREE_SNAPSHOT_V2' });
  assert.notEqual(expected.worktree_snapshot_sha256, v2Framed.worktree_snapshot_sha256, 'the independent V1/V2 header mutation changes the framed snapshot');
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: expected });
});

addedTest('N006', 'factory enumerable extra rejects INPUT_INVALID', async () => { const create = await factory(); assert.throws(() => create({ nodeExecutable: NODE, extra: true }), /INPUT_INVALID/); });
for (const [id, name, make] of [
  ['N007', 'factory symbol extra rejects INPUT_INVALID', () => { const value = { nodeExecutable: NODE }; value[Symbol('extra')] = true; return value; }],
  ['N008', 'factory non-enumerable extra rejects INPUT_INVALID', () => { const value = { nodeExecutable: NODE }; Object.defineProperty(value, 'extra', { value: true }); return value; }],
  ['N009', 'factory getter-only nodeExecutable rejects without callback', () => { const value = {}; Object.defineProperty(value, 'nodeExecutable', { enumerable: true, get() { throw new Error('getter called'); } }); return value; }],
  ['N010', 'factory non-plain input rejects INPUT_INVALID', () => Object.assign(Object.create(null), { nodeExecutable: NODE })],
  ['N011', 'factory wrong top-level type rejects INPUT_INVALID', () => []],
  ['N012', 'factory nonabsolute nodeExecutable rejects INPUT_INVALID', () => ({ nodeExecutable: 'node' })],
  ['N103', 'factory required nodeExecutable non-enumerable rejects INPUT_INVALID', () => { const value = {}; Object.defineProperty(value, 'nodeExecutable', { value: NODE }); return value; }],
]) addedTest(id, name, async () => { const create = await factory(); assert.throws(() => create(make()), /INPUT_INVALID/); });
addedTest('N104', 'factory setter-only nodeExecutable rejects INPUT_INVALID', async () => {
  const create = await factory();
  let writes = 0;
  const value = {};
  Object.defineProperty(value, 'nodeExecutable', { enumerable: true, set() { writes += 1; } });
  assert.throws(() => create(value), /INPUT_INVALID/);
  assert.equal(writes, 0, 'factory admission does not invoke a setter-only required field');
});
addedTest('N013', 'valid factory returns frozen execute-only gateway', async () => { const create = await factory(); const gateway = create({ nodeExecutable: NODE }); assert.deepEqual(Object.keys(gateway), ['execute']); assert.equal(Object.isFrozen(gateway), true); });
addedTest('N014', 'retirement definition full receipt and hash', async () => { const create = await factory(); await withWorktree(async ({ subject }) => { const d = definition(subject, 'regression-test-asset-retirement'); const snapshot = oracleSnapshot(subject, await actualObservation(subject)); assert.deepEqual(await create({ nodeExecutable: NODE }).execute({ definition: d, subject }), expectedReceipt(subject, d, snapshot)); }); });

const descriptorMutation = (target, key, kind, counter) => {
  if (kind === 'symbol') target[Symbol('extra')] = true;
  if (kind === 'hidden') Object.defineProperty(target, 'extra', { value: true });
  if (kind === 'getter') Object.defineProperty(target, key, { enumerable: true, get() { counter.value += 1; return undefined; } });
  if (kind === 'setter') Object.defineProperty(target, key, { enumerable: true, set() { counter.value += 1; } });
  if (kind === 'requiredHidden') {
    const prototype = Object.getPrototypeOf(target); const keys = Reflect.ownKeys(target); const descriptors = Object.getOwnPropertyDescriptors(target); const descriptor = descriptors[key];
    assert.ok(descriptor && Object.hasOwn(descriptor, 'value'), 'required hidden mutation begins with one required data descriptor'); assert.equal(descriptor.enumerable, true, 'required hidden mutation begins enumerable');
    Object.defineProperty(target, key, { value: descriptor.value, writable: descriptor.writable, enumerable: false, configurable: descriptor.configurable });
    const changed = Object.getOwnPropertyDescriptor(target, key);
    assert.strictEqual(changed.value, descriptor.value, 'required hidden mutation preserves the exact data value'); assert.equal(changed.writable, descriptor.writable); assert.equal(changed.enumerable, false); assert.equal(changed.configurable, descriptor.configurable);
    assert.equal(Object.getPrototypeOf(target), prototype, 'required hidden mutation preserves prototype'); assert.deepEqual(Reflect.ownKeys(target), keys, 'required hidden mutation preserves own keys');
    for (const ownKey of keys.filter(ownKey => ownKey !== key)) assert.deepEqual(Object.getOwnPropertyDescriptor(target, ownKey), descriptors[ownKey], 'required hidden mutation preserves every other descriptor');
  }
};
const objectCases = [
  ['N015', 'request symbol extra', ({ request }) => { request[Symbol('extra')] = true; }], ['N016', 'request non-enumerable extra', ({ request }) => Object.defineProperty(request, 'extra', { value: true })], ['N017', 'request definition getter-only callback zero', ({ request, counter }) => descriptorMutation(request, 'definition', 'getter', counter)], ['N018', 'request non-plain object', ({ request }) => Object.setPrototypeOf(request, null)], ['N019', 'request wrong type', ({ request }) => { Object.setPrototypeOf(request, Array.prototype); }], ['N105', 'request definition non-enumerable', ({ request, counter }) => descriptorMutation(request, 'definition', 'requiredHidden', counter)], ['N106', 'request definition setter-only callback zero', ({ request, counter }) => descriptorMutation(request, 'definition', 'setter', counter)],
  ['N020', 'subject missing kind', ({ subject }) => { delete subject.kind; }], ['N021', 'subject symbol extra', ({ subject }) => { subject[Symbol('extra')] = true; }], ['N022', 'subject non-enumerable extra', ({ subject }) => Object.defineProperty(subject, 'extra', { value: true })], ['N023', 'subject kind getter-only callback zero', ({ subject, counter }) => descriptorMutation(subject, 'kind', 'getter', counter)], ['N024', 'subject non-plain object', ({ subject }) => Object.setPrototypeOf(subject, null)], ['N025', 'subject wrong kind type', ({ subject }) => { subject.kind = 1; }], ['N107', 'subject kind non-enumerable', ({ subject, counter }) => descriptorMutation(subject, 'kind', 'requiredHidden', counter)], ['N108', 'subject kind setter-only callback zero', ({ subject, counter }) => descriptorMutation(subject, 'kind', 'setter', counter)],
  ['N026', 'definition missing id', ({ d }) => { delete d.id; }], ['N027', 'definition symbol extra', ({ d }) => { d[Symbol('extra')] = true; }], ['N028', 'definition non-enumerable extra', ({ d }) => Object.defineProperty(d, 'extra', { value: true })], ['N029', 'definition id getter-only callback zero', ({ d, counter }) => descriptorMutation(d, 'id', 'getter', counter)], ['N030', 'definition non-plain object', ({ request }) => Object.setPrototypeOf(request.definition, null)], ['N031', 'definition wrong id type', ({ d }) => { d.id = 1; }], ['N032', 'definition missing environment', ({ d }) => { delete d.environment; }], ['N109', 'definition id non-enumerable', ({ d, counter }) => descriptorMutation(d, 'id', 'requiredHidden', counter)], ['N110', 'definition id setter-only callback zero', ({ d, counter }) => descriptorMutation(d, 'id', 'setter', counter)],
  ['N033', 'environment symbol extra', ({ d }) => { d.environment[Symbol('extra')] = true; }], ['N034', 'environment non-enumerable extra', ({ d }) => Object.defineProperty(d.environment, 'extra', { value: true })], ['N035', 'environment getter-only callback zero', ({ d, counter }) => descriptorMutation(d.environment, 'extra', 'getter', counter)], ['N036', 'environment non-plain object', ({ d }) => Object.setPrototypeOf(d.environment, null)], ['N037', 'environment wrong type', ({ d }) => { d.environment = []; }], ['N111', 'environment setter-only extra callback zero', ({ d, counter }) => descriptorMutation(d.environment, 'extra', 'setter', counter)],
];
for (const [id, name, mutate] of objectCases) assertAdmissionInvalid(id, name, mutate);

const arrayNames = [
  'argv non-array', 'argv symbol key', 'argv hidden key', 'argv accessor index callback zero', 'argv hole', 'argv enumerable extra string key',
  'allowed non-array', 'allowed wrong item', 'allowed symbol key', 'allowed hidden key', 'allowed accessor index callback zero', 'allowed hole', 'allowed enumerable extra string key', 'allowed leading slash', 'allowed trailing slash', 'allowed empty segment', 'allowed dot segment', 'allowed dot-dot segment', 'allowed NUL', 'allowed backslash', 'allowed second glob', 'allowed wildcard', 'allowed raw-byte duplicate', 'allowed item over 4096', 'allowed combined scope over 1MiB',
  'forbidden non-array', 'forbidden wrong item', 'forbidden symbol key', 'forbidden hidden key', 'forbidden accessor index callback zero', 'forbidden hole', 'forbidden enumerable extra string key', 'forbidden leading slash', 'forbidden trailing slash', 'forbidden empty segment', 'forbidden dot segment', 'forbidden dot-dot segment', 'forbidden NUL', 'forbidden backslash', 'forbidden second glob', 'forbidden wildcard', 'forbidden raw-byte duplicate', 'forbidden item over 4096', 'forbidden combined scope over 1MiB',
];
for (let offset = 0; offset < arrayNames.length; offset += 1) {
  const number = 38 + offset; const id = `N${String(number).padStart(3, '0')}`;
  assertAdmissionInvalid(id, arrayNames[offset], ({ d, subject, counter }) => {
    if (number >= 38 && number <= 43) {
      if (number === 38) d.argv = {};
      if (number === 39) d.argv[Symbol('extra')] = true;
      if (number === 40) Object.defineProperty(d.argv, 'extra', { value: true });
      if (number === 41) Object.defineProperty(d.argv, '0', { enumerable: true, get() { counter.value += 1; return NODE; } });
      if (number === 42) { d.argv = [NODE, '-e']; delete d.argv[1]; }
      if (number === 43) Object.defineProperty(d.argv, 'extra', { value: true, enumerable: true });
      return;
    }
    const allowed = number >= 44 && number <= 62; const target = allowed ? subject.allowed_paths : subject.forbidden_paths;
    const local = allowed ? number - 44 : number - 63;
    if (local === 0) { if (allowed) subject.allowed_paths = {}; else subject.forbidden_paths = {}; }
    if (local === 1) target[0] = 1;
    if (local === 2) target[Symbol('extra')] = true;
    if (local === 3) Object.defineProperty(target, 'extra', { value: true });
    if (local === 4) Object.defineProperty(target, '0', { enumerable: true, get() { counter.value += 1; return 'checks/**'; } });
    if (local === 5) { delete target[0]; }
    if (local === 6) Object.defineProperty(target, 'extra', { value: 'unexpected', enumerable: true, writable: true, configurable: true });
    const grammar = ['/bad', 'checks/', 'checks//bad', 'checks/./bad', 'checks/../bad', 'checks/\0bad', 'checks\\bad', 'checks/**/bad', 'checks/*'];
    if (local >= 7 && local <= 15) target[0] = grammar[local - 7];
    if (local === 16) {
      if (allowed) target[1] = target[0];
      else target.push(target[0]);
    }
    if (local === 17) target[0] = 'a'.repeat(4097);
    if (local === 18) target.push(...Array.from({ length: 270 }, (_, index) => `scope-${index}/${'a'.repeat(4000)}`));
  });
}
assertAdmissionInvalid('N082', 'identical allowed forbidden rule conflict', ({ subject }) => { subject.forbidden_paths = [...subject.allowed_paths]; });
addedTest('N083', 'broader allowed and narrower forbidden remains valid', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ subject }) => {
    const d = definition(subject);
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    assert.deepEqual(await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject }), expectedReceipt(subject, d, snapshot));
  });
});
addedTest('N084', 'scope array order is preserved in the hash', async () => {
  const evaluate = await evaluator();
  const fixture = validL1();
  const reordered = validL1();
  reordered.subject.allowed_paths = [...reordered.subject.allowed_paths].reverse();
  const expected = oracleSnapshot(reordered.subject, reordered.observation);
  assert.notEqual(expected.scope_sha256, oracleSnapshot(fixture.subject, fixture.observation).scope_sha256);
  assert.deepEqual(evaluate(evaluationInput(reordered)), { kind: 'OK', value: expected });
});
addedTest('N085', 'resistant-child post-mutation keeps SUBJECT_MISMATCH precedence', async () => {
  await assertResistantTimeout({ mutateWorktree: true });
});
addedTest('N086', 'one SIGKILL timeout send site', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  const kill = uniqueAst(callsIn(lifecycle, call => callPropertyName(call) === 'kill' && stringLiteralValue(call.arguments[0]) === 'SIGKILL'), 'timeout SIGKILL send');
  assert.equal(ts.SyntaxKind[kill.kind], 'CallExpression');
});
addedTest('N087', 'no SIGTERM send', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  assert.equal(callsIn(lifecycle, call => callPropertyName(call) === 'kill' && stringLiteralValue(call.arguments[0]) === 'SIGTERM').length, 0, 'bounded child lifecycle has no SIGTERM send');
});
addedTest('N088', 'no grace timer', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  const timer = uniqueAst(callsIn(lifecycle, call => ts.isIdentifier(call.expression) && call.expression.text === 'setTimeout'), 'single timeout timer');
  assert.equal(timer.arguments.length, 2, 'the sole timeout has no grace-period argument');
});
addedTest('N089', 'no second timer', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  assert.equal(callsIn(lifecycle, call => ts.isIdentifier(call.expression) && call.expression.text === 'setTimeout').length, 1, 'bounded child lifecycle has exactly one timer');
});
addedTest('N090', 'no fallback signal', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  const sends = callsIn(lifecycle, call => callPropertyName(call) === 'kill');
  assert.equal(sends.length, 1, 'bounded child lifecycle has one termination send and no fallback');
  assert.equal(stringLiteralValue(sends[0].arguments[0]), 'SIGKILL', 'the sole termination send is SIGKILL');
});
addedTest('N091', 'no replacement child', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  assert.equal(callsIn(lifecycle, call => ts.isIdentifier(call.expression) && call.expression.text === 'spawn').length, 1, 'one child spawn has no replacement path');
});
addedTest('N092', 'no caller signal timing configuration', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  assert.deepEqual(lifecycle.parameters.map(parameter => parameter.name.getText(sourceFile)), ['executable', 'args', 'cwd', 'timeout_ms'], 'child lifecycle exposes only the frozen timeout parameter');
});
addedTest('N093', 'two timeout linearization exits only', async () => {
  const { sourceFile } = await productionAst();
  const lifecycle = namedFunction(sourceFile, 'executeValidationChild');
  const closeHandlers = callsIn(lifecycle, call => callPropertyName(call) === 'once' && stringLiteralValue(call.arguments[0]) === 'close');
  const closeHandler = uniqueAst(closeHandlers, 'single child close handler');
  assert.equal(callsIn(closeHandler.arguments[1], call => ts.isIdentifier(call.expression) && call.expression.text === 'finish').length, 1, 'close-before-timeout is the sole normal terminal exit');
  const timeoutCallback = uniqueAst(callsIn(lifecycle, call => ts.isIdentifier(call.expression) && call.expression.text === 'setTimeout'), 'single timeout callback').arguments[0];
  assert.equal(callsIn(timeoutCallback, call => callPropertyName(call) === 'kill' && stringLiteralValue(call.arguments[0]) === 'SIGKILL').length, 1, 'timeout-before-close has the sole SIGKILL exit');
});
addedTest('N094', 'admission precedes realpath Git snapshot child', async () => {
  const { sourceFile } = await productionAst();
  const factoryNode = namedFunction(sourceFile, 'createValidationGateway');
  const position = name => uniqueAst(callsIn(factoryNode, call => ts.isIdentifier(call.expression) && call.expression.text === name), `gateway ${name} call`).getStart();
  const collect = callsIn(factoryNode, call => ts.isIdentifier(call.expression) && call.expression.text === 'collectWorktreeSnapshotObservationV1');
  assert.equal(collect.length, 2, 'gateway has exactly the frozen pre- and post-snapshot collection calls');
  const ordered = [position('validWorktreeSubject'), position('validateDefinition'), position('validateSubjectIdentityAndCwd'), collect[0].getStart(), position('executeValidationChild'), collect[1].getStart()];
  assert.deepEqual([...ordered].sort((left, right) => left - right), ordered, 'strict request admission precedes identity, snapshot, and child effects');
});
addedTest('N095', 'composition calls same factory', async () => {
  const { sourceFile } = await productionAst();
  const composition = namedFunction(sourceFile, 'createProductionComposition');
  const call = uniqueAst(callsIn(composition, candidate => ts.isIdentifier(candidate.expression) && candidate.expression.text === 'createValidationGateway'), 'composition factory call');
  assert.equal(ts.isObjectLiteralExpression(call.arguments[0]), true);
  assert.deepEqual(call.arguments[0].properties.map(property => property.name?.getText(sourceFile)), ['nodeExecutable']);
});
addedTest('N096', 'collector private', async () => {
  const { sourceFile } = await productionAst();
  const collector = namedFunction(sourceFile, 'collectWorktreeSnapshotObservationV1');
  assert.equal((ts.getCombinedModifierFlags(collector) & ts.ModifierFlags.Export) === 0, true, 'collector declaration is not exported');
});
addedTest('N097', 'pinned git private', async () => {
  const { sourceFile } = await productionAst();
  const declaration = uniqueAst(astNodes(sourceFile, node => ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'PINNED_PRODUCTION_GIT_PATH'), 'pinned Git declaration');
  const list = declaration.parent?.parent;
  assert.equal(ts.isVariableStatement(list), true);
  assert.equal((ts.getCombinedModifierFlags(list) & ts.ModifierFlags.Export) === 0, true, 'pinned Git declaration is private');
});
for (const [number, name] of [[98, 'factory filesystem injection rejects'], [99, 'factory process injection rejects'], [100, 'composition callback injection rejects'], [101, 'composition validation injection rejects']]) addedTest(`N${String(number).padStart(3, '0')}`, name, async () => { const production = await import(PRODUCTION_URL.href); if (number === 98) assert.throws(() => production.createValidationGateway({ nodeExecutable: NODE, filesystem: {} }), /INPUT_INVALID/); else if (number === 99) assert.throws(() => production.createValidationGateway({ nodeExecutable: NODE, process: {} }), /INPUT_INVALID/); else if (number === 100) await assert.rejects(production.createProductionComposition({ callback: () => {} }), /INPUT_INVALID/); else await assert.rejects(production.createProductionComposition({ validation: {} }), /INPUT_INVALID/); });
addedTest('N102', 'no L3 exports', async () => {
  const { sourceFile } = await productionAst();
  const forbidden = new Set(['applyControllerCommand', 'run', 'settlement', 'status']);
  const exported = astNodes(sourceFile, node => (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) && (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0);
  const names = exported.flatMap(node => ts.isFunctionDeclaration(node) ? [node.name?.text] : node.declarationList.declarations.map(declaration => ts.isIdentifier(declaration.name) ? declaration.name.text : null)).filter(Boolean);
  assert.equal(names.some(name => forbidden.has(name)), false, 'production exports no L3 entry point');
});
assertAdmissionInvalid('N112', 'allowed empty-string item', ({ subject }) => { subject.allowed_paths[0] = ''; });
assertAdmissionInvalid('N113', 'forbidden empty-string item', ({ subject }) => { subject.forbidden_paths[0] = ''; });

// Test Correction 010: append-only scalar, caller-array, and root admission
// leaves.  These helpers are deliberately local to the added leaves: the
// retained 279-leaf prefix (including its helpers) stays byte-for-byte intact.
function scalarHostile(kind, valid, counter) {
  if (kind === 'null') return null;
  if (kind === 'undefined') return undefined;
  if (kind === 'number') return 7;
  if (kind === 'boolean') return true;
  if (kind === 'bigint') return 1n;
  if (kind === 'symbol') return Symbol('hostile');
  if (kind === 'boxed') return new String(valid);
  if (kind === 'object') return {};
  if (kind === 'array') return [valid];
  if (kind === 'function') return function hostile() {};
  if (kind === 'toString') return { toString() { counter.value += 1; return valid; } };
  if (kind === 'toStringValueOf') return { toString() { counter.value += 1; return {}; }, valueOf() { counter.value += 1; return valid; } };
  if (kind === 'toPrimitive') return { [Symbol.toPrimitive]() { counter.value += 1; return valid; } };
  if (kind === 'decimal40') return BigInt('1'.repeat(40));
  if (kind === 'invalidHeadToString') return { toString() { counter.value += 1; return 'g'.repeat(40); } };
  throw new Error(`unknown scalar hostile kind: ${kind}`);
}

async function assertScalarAdmissionInvalid(id, field, kind) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const sentinel = path.join(temporary, `${id}-child`);
    const trappedSubject = { ...subject, repository_root: path.join(temporary, 'absent-ordering-trap') };
    const d = definition(trappedSubject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1],"started")', sentinel]);
    const request = { definition: d, subject: trappedSubject };
    const counter = { value: 0 };
    assert.deepEqual(await createValidationGateway({ nodeExecutable: NODE }).execute(request), expectedPreSnapshotMismatchReceipt(trappedSubject, d), 'known-good scalar control reaches only the independent ordering trap');
    await assert.rejects(readFile(sentinel), /ENOENT/);
    const valid = field === 'cwd' ? d.cwd : trappedSubject.head_sha;
    const host = field === 'cwd' ? d : trappedSubject;
    const descriptors = Object.getOwnPropertyDescriptors(host);
    const before = descriptors[field];
    const keys = Reflect.ownKeys(host);
    host[field] = scalarHostile(kind, valid, counter);
    const after = Object.getOwnPropertyDescriptor(host, field);
    assert.equal(after.enumerable, before.enumerable, 'scalar mutation preserves descriptor visibility');
    assert.equal(after.writable, before.writable, 'scalar mutation preserves descriptor writability');
    assert.equal(after.configurable, before.configurable, 'scalar mutation preserves descriptor configurability');
    assert.deepEqual(Reflect.ownKeys(host), keys, 'scalar mutation preserves own keys');
    for (const key of Reflect.ownKeys(descriptors).filter(key => key !== field)) {
      const actual = Object.getOwnPropertyDescriptor(host, key); const expected = descriptors[key];
      assert.strictEqual(actual.value, expected.value, `scalar mutation preserves ${String(key)} value identity`);
      assert.equal(actual.enumerable, expected.enumerable); assert.equal(actual.writable, expected.writable); assert.equal(actual.configurable, expected.configurable);
    }
    assert.equal(counter.value, 0, 'conversion callback begins at zero');
    const status = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']);
    const head = await git(subject.worktree_root, ['rev-parse', 'HEAD']);
    const index = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    await assert.rejects(createValidationGateway({ nodeExecutable: NODE }).execute(request), /INPUT_INVALID/);
    assert.equal(counter.value, 0, 'admission never coerces the hostile scalar');
    await assert.rejects(readFile(sentinel), /ENOENT/);
    assert.deepEqual(await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']), status, 'invalid scalar has no worktree status effect');
    assert.deepEqual(await git(subject.worktree_root, ['rev-parse', 'HEAD']), head, 'invalid scalar has no HEAD effect');
    const afterIndex = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    assert.deepEqual(afterIndex, index, 'invalid scalar has no index effect');
  });
}

const scalarCases = [
  ['null', 'null'], ['undefined', 'undefined'], ['number', 'number'], ['boolean', 'boolean'], ['bigint', 'bigint'], ['symbol', 'symbol'],
  ['boxed valid string', 'boxed'], ['plain object', 'object'], ['one-element valid string array', 'array'], ['function', 'function'],
  ['toString valid string callback', 'toString'], ['toString/valueOf valid string callbacks', 'toStringValueOf'], ['Symbol.toPrimitive valid string callback', 'toPrimitive'],
];
for (const [offset, [name, kind]] of scalarCases.entries()) addedTest(`N${String(114 + offset).padStart(3, '0')}`, `definition.cwd ${name} rejects INPUT_INVALID without coercion`, async () => {
  await assertScalarAdmissionInvalid(`N${String(114 + offset).padStart(3, '0')}`, 'cwd', kind);
});
for (const [offset, [name, kind]] of scalarCases.entries()) addedTest(`N${String(127 + offset).padStart(3, '0')}`, `subject.head_sha ${name} rejects INPUT_INVALID without coercion`, async () => {
  await assertScalarAdmissionInvalid(`N${String(127 + offset).padStart(3, '0')}`, 'head_sha', kind);
});
addedTest('N140', 'subject.head_sha forty-digit primitive bigint rejects INPUT_INVALID without coercion', async () => { await assertScalarAdmissionInvalid('N140', 'head_sha', 'decimal40'); });
addedTest('N141', 'subject.head_sha invalid toString callback rejects INPUT_INVALID without coercion', async () => { await assertScalarAdmissionInvalid('N141', 'head_sha', 'invalidHeadToString'); });

function arrayMutation(target, kind, method, counter) {
  const originalPrototype = Object.getPrototypeOf(target);
  const originalKeys = Reflect.ownKeys(target);
  const originalDescriptors = Object.getOwnPropertyDescriptors(target);
  if (kind === 'nullPrototype') Object.setPrototypeOf(target, null);
  if (kind === 'customPrototype') Object.setPrototypeOf(target, Object.create(Array.prototype));
  if (kind === 'dataHook') {
    const prototype = Object.create(Array.prototype);
    prototype[method] = function hostileMethod(...args) { counter.method += 1; return Array.prototype[method].apply(this, args); };
    Object.setPrototypeOf(target, prototype);
  }
  if (kind === 'getterHook') {
    const prototype = Object.create(Array.prototype);
    Object.defineProperty(prototype, method, { get() { counter.getter += 1; return function hostileMethod(...args) { counter.method += 1; return Array.prototype[method].apply(this, args); }; } });
    Object.setPrototypeOf(target, prototype);
  }
  if (kind === 'hiddenIndex') {
    const descriptor = originalDescriptors['0'];
    Object.defineProperty(target, '0', { ...descriptor, enumerable: false });
  }
  if (kind === 'frozen') Object.freeze(target);
  if (kind === 'readonly') {
    for (let index = 0; index < target.length; index += 1) Object.defineProperty(target, String(index), { ...originalDescriptors[String(index)], writable: false });
    Object.defineProperty(target, 'length', { ...originalDescriptors.length, writable: false });
  }
  assert.deepEqual(Reflect.ownKeys(target), originalKeys, 'array mutation preserves own key identity');
  for (const key of originalKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    assert.strictEqual(descriptor.value, originalDescriptors[key].value, `array mutation preserves ${String(key)} value identity`);
    if (!(kind === 'hiddenIndex' && key === '0')) assert.equal(descriptor.enumerable, originalDescriptors[key].enumerable, `array mutation preserves ${String(key)} enumerability`);
    if (kind !== 'hiddenIndex' && kind !== 'readonly' && kind !== 'frozen') assert.deepEqual(descriptor, originalDescriptors[key], `prototype-only mutation preserves ${String(key)} descriptor`);
  }
  if (kind === 'hiddenIndex') {
    const changed = Object.getOwnPropertyDescriptor(target, '0'); const original = originalDescriptors['0'];
    assert.equal(changed.enumerable, false, 'index zero becomes non-enumerable'); assert.equal(changed.writable, original.writable); assert.equal(changed.configurable, original.configurable); assert.strictEqual(changed.value, original.value);
    for (const key of originalKeys.filter(key => key !== '0')) assert.deepEqual(Object.getOwnPropertyDescriptor(target, key), originalDescriptors[key], `hidden-index mutation preserves ${String(key)} descriptor`);
  }
  if (kind === 'readonly') {
    assert.equal(Object.isFrozen(target), false, 'readonly array remains non-frozen');
    for (const key of originalKeys) assert.equal(Object.getOwnPropertyDescriptor(target, key).writable, false, `readonly array makes ${String(key)} non-writable`);
  }
  if (kind === 'frozen') assert.equal(Object.isFrozen(target), true, 'frozen array is a positive input');
  if (!['nullPrototype', 'customPrototype', 'dataHook', 'getterHook'].includes(kind)) assert.equal(Object.getPrototypeOf(target), originalPrototype, 'descriptor-only mutation preserves prototype');
}

function l1ArrayFixture(surface) {
  const fixture = validL1();
  const target = surface === 'allowed' ? fixture.subject.allowed_paths : surface === 'forbidden' ? fixture.subject.forbidden_paths : fixture.observation.entries;
  return { fixture, target };
}

async function assertL1Array(id, surface, kind) {
  const evaluate = await evaluator();
  const control = validL1();
  assert.deepEqual(evaluate(evaluationInput(control)), { kind: 'OK', value: oracleSnapshot(control.subject, control.observation) }, 'known-good L1 control');
  const { fixture, target } = l1ArrayFixture(surface);
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  const counter = { getter: 0, method: 0 };
  arrayMutation(target, kind, 'every', counter);
  assert.equal(counter.getter, 0, 'L1 callback getter begins at zero'); assert.equal(counter.method, 0, 'L1 callback method begins at zero');
  const actual = evaluate(evaluationInput(fixture));
  assert.equal(counter.getter, 0, 'L1 admission does not read inherited getter');
  assert.equal(counter.method, 0, 'L1 admission does not invoke inherited method');
  if (kind === 'frozen' || kind === 'readonly') assert.deepEqual(actual, { kind: 'OK', value: expected });
  else rejected(actual, 'INPUT_INVALID');
}

async function assertL2Array(id, surface, kind) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const sentinel = path.join(temporary, `${id}-child`);
    const trappedSubject = { ...subject, repository_root: path.join(temporary, 'absent-ordering-trap') };
    const positive = kind === 'frozen' || kind === 'readonly';
    const activeSubject = positive ? subject : trappedSubject;
    const d = positive
      ? definition(activeSubject)
      : definition(activeSubject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1],"started")', sentinel]);
    const target = surface === 'argv' ? d.argv : surface === 'allowed' ? activeSubject.allowed_paths : activeSubject.forbidden_paths;
    const counter = { getter: 0, method: 0 };
    const method = surface === 'argv' ? 'every' : Symbol.iterator;
    const gateway = createValidationGateway({ nodeExecutable: NODE });
    const controlSnapshot = positive ? oracleSnapshot(activeSubject, await actualObservation(activeSubject)) : null;
    const controlExpected = positive ? expectedReceipt(activeSubject, d, controlSnapshot) : null;
    if (positive) assert.deepEqual(await gateway.execute({ definition: d, subject: activeSubject }), controlExpected, 'known-good mutable array control runs the real child with the full receipt');
    else assert.deepEqual(await gateway.execute({ definition: d, subject: activeSubject }), expectedPreSnapshotMismatchReceipt(activeSubject, d), 'known-good L2 array control reaches only the independent ordering trap');
    await assert.rejects(readFile(sentinel), /ENOENT/);
    arrayMutation(target, kind, method, counter);
    const status = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']);
    const head = await git(subject.worktree_root, ['rev-parse', 'HEAD']);
    const index = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    assert.equal(counter.getter, 0, 'L2 callback getter begins at zero'); assert.equal(counter.method, 0, 'L2 callback method begins at zero');
    if (positive) {
      assert.deepEqual(await gateway.execute({ definition: d, subject: activeSubject }), controlExpected, 'positive immutable L2 array runs the real child with the full receipt');
    } else {
      await assert.rejects(gateway.execute({ definition: d, subject: activeSubject }), /INPUT_INVALID/);
      await assert.rejects(readFile(sentinel), /ENOENT/);
    }
    assert.equal(counter.getter, 0, 'L2 admission does not read inherited getter');
    assert.equal(counter.method, 0, 'L2 admission does not invoke inherited method');
    assert.deepEqual(await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']), status, 'array admission has no worktree status effect');
    assert.deepEqual(await git(subject.worktree_root, ['rev-parse', 'HEAD']), head, 'array admission has no HEAD effect');
    const afterIndex = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    assert.deepEqual(afterIndex, index, 'array admission has no index effect');
  });
}

const l1Arrays = [['allowed', 142], ['forbidden', 149], ['entries', 156]];
const l2Arrays = [['argv', 163], ['allowed', 170], ['forbidden', 177]];
const arrayCases = [['null prototype', 'nullPrototype'], ['hook-free custom prototype', 'customPrototype'], ['prototype data method hook', 'dataHook'], ['prototype getter method hook', 'getterHook'], ['non-enumerable existing index zero', 'hiddenIndex'], ['valid frozen array', 'frozen'], ['valid readonly non-frozen array', 'readonly']];
for (const [surface, start] of l1Arrays) for (const [offset, [name, kind]] of arrayCases.entries()) addedTest(`N${String(start + offset).padStart(3, '0')}`, `L1 ${surface} ${name}`, async () => { await assertL1Array(`N${String(start + offset).padStart(3, '0')}`, surface, kind); });
for (const [surface, start] of l2Arrays) for (const [offset, [name, kind]] of arrayCases.entries()) addedTest(`N${String(start + offset).padStart(3, '0')}`, `L2 ${surface} ${name}`, async () => { await assertL2Array(`N${String(start + offset).padStart(3, '0')}`, surface, kind); });

function lexicalRoot(value, kind) {
  if (kind === 'dot') return `${value}/.`;
  if (kind === 'dotdot') return `${value}/segment/..`;
  if (kind === 'doubleSlash') return value.replace(/^\//, '//');
  if (kind === 'trailingSlash') return `${value}/`;
  if (kind === 'root') return '/';
  throw new Error(`unknown root kind: ${kind}`);
}

async function assertL1Root(field, kind) {
  const evaluate = await evaluator();
  const fixture = validL1({ empty: true });
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: oracleSnapshot(fixture.subject, fixture.observation) }, 'known-good L1 root control');
  if (kind === 'root') {
    const subjectDescriptors = Object.getOwnPropertyDescriptors(fixture.subject);
    const observationField = `${field}_realpath`;
    const observationDescriptors = Object.getOwnPropertyDescriptors(fixture.observation);
    const subjectKeys = Reflect.ownKeys(fixture.subject); const observationKeys = Reflect.ownKeys(fixture.observation);
    fixture.subject[field] = '/'; fixture.observation[observationField] = '/';
    assert.deepEqual(Reflect.ownKeys(fixture.subject), subjectKeys); assert.deepEqual(Reflect.ownKeys(fixture.observation), observationKeys);
    for (const key of Reflect.ownKeys(subjectDescriptors).filter(key => key !== field)) assert.strictEqual(Object.getOwnPropertyDescriptor(fixture.subject, key).value, subjectDescriptors[key].value, `L1 root slash preserves subject ${String(key)} value identity`);
    for (const key of Reflect.ownKeys(observationDescriptors).filter(key => key !== observationField)) assert.strictEqual(Object.getOwnPropertyDescriptor(fixture.observation, key).value, observationDescriptors[key].value, `L1 root slash preserves observation ${String(key)} value identity`);
    assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: oracleSnapshot(fixture.subject, fixture.observation) });
    return;
  }
  const original = fixture.subject[field];
  const descriptors = Object.getOwnPropertyDescriptors(fixture.subject);
  const keys = Reflect.ownKeys(fixture.subject);
  fixture.subject[field] = lexicalRoot(original, kind);
  assert.equal(path.resolve(fixture.subject[field]), path.resolve(original), 'root lexical mutation keeps the normalized target');
  assert.deepEqual(Reflect.ownKeys(fixture.subject), keys, 'L1 root mutation preserves own keys');
  for (const key of Reflect.ownKeys(descriptors).filter(key => key !== field)) assert.strictEqual(Object.getOwnPropertyDescriptor(fixture.subject, key).value, descriptors[key].value, `L1 root mutation preserves ${String(key)} value identity`);
  rejected(evaluate(evaluationInput(fixture)), 'INPUT_INVALID');
}

async function assertL2Root(id, field, kind) {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const sentinel = path.join(temporary, `${id}-child`);
    const trapField = field === 'repository_root' ? 'worktree_root' : 'repository_root';
    const trappedSubject = { ...subject, [trapField]: path.join(temporary, `absent-ordering-trap-${trapField}`) };
    const d = definition(trappedSubject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1],"started")', sentinel]);
    const gateway = createValidationGateway({ nodeExecutable: NODE });
    assert.deepEqual(await gateway.execute({ definition: d, subject: trappedSubject }), expectedPreSnapshotMismatchReceipt(trappedSubject, d), 'known-good root control reaches only the independent ordering trap');
    await assert.rejects(readFile(sentinel), /ENOENT/);
    const descriptors = Object.getOwnPropertyDescriptors(trappedSubject);
    const keys = Reflect.ownKeys(trappedSubject);
    if (kind === 'root') trappedSubject[field] = '/';
    else {
      const original = trappedSubject[field];
      trappedSubject[field] = lexicalRoot(original, kind);
      assert.equal(path.resolve(trappedSubject[field]), path.resolve(original), 'L2 root lexical mutation keeps normalized target');
    }
    assert.deepEqual(Reflect.ownKeys(trappedSubject), keys, 'L2 root mutation preserves own keys');
    for (const key of Reflect.ownKeys(descriptors).filter(key => key !== field)) assert.strictEqual(Object.getOwnPropertyDescriptor(trappedSubject, key).value, descriptors[key].value, `L2 root mutation preserves ${String(key)} value identity`);
    const status = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']);
    const head = await git(subject.worktree_root, ['rev-parse', 'HEAD']);
    const index = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    if (kind === 'root') assert.deepEqual(await gateway.execute({ definition: d, subject: trappedSubject }), expectedPreSnapshotMismatchReceipt(trappedSubject, d), 'lexical root passes admission and reaches the separate identity trap');
    else await assert.rejects(gateway.execute({ definition: d, subject: trappedSubject }), /INPUT_INVALID/);
    await assert.rejects(readFile(sentinel), /ENOENT/);
    assert.deepEqual(await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']), status, 'root admission starts no child or worktree effect');
    assert.deepEqual(await git(subject.worktree_root, ['rev-parse', 'HEAD']), head, 'root admission has no HEAD effect');
    const afterIndex = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    assert.deepEqual(afterIndex, index, 'root admission has no index effect');
  });
}

const rootFields = ['repository_root', 'worktree_root', 'common_git_dir'];
const rootCases = [['dot segment', 'dot'], ['dot-dot segment', 'dotdot'], ['repeated slash', 'doubleSlash'], ['trailing slash', 'trailingSlash'], ['lexical root slash', 'root']];
for (const [fieldIndex, field] of rootFields.entries()) for (const [caseIndex, [name, kind]] of rootCases.entries()) {
  const id = `N${String(184 + fieldIndex * 5 + caseIndex).padStart(3, '0')}`;
  addedTest(id, `L1 ${field} ${name}`, async () => { await assertL1Root(field, kind); });
}
for (const [fieldIndex, field] of rootFields.entries()) for (const [caseIndex, [name, kind]] of rootCases.entries()) {
  const id = `N${String(199 + fieldIndex * 5 + caseIndex).padStart(3, '0')}`;
  addedTest(id, `L2 ${field} ${name}`, async () => { await assertL2Root(id, field, kind); });
}

// Test011 has exactly three consumers: the discriminator descriptors admitted by L1.
async function assertL1KindAccessorRejectsWithoutCallback(surface) {
  const evaluate = await evaluator();
  const fixture = validL1();
  const file = fixture.observation.entries.find(candidate => Buffer.from(candidate.path_bytes).equals(Buffer.from('scopes/a.txt')));
  assert.ok(file, 'Test-owned fixture supplies a FILE entry');

  // Existing entry() defaults after to before.  Keep the control valid while
  // ensuring the selected stat positions are independent records.
  file.before = present('FILE', 0o100644n, 17n);
  file.after = present('FILE', 0o100644n, 17n);
  assert.notStrictEqual(file.before, file.after, 'before and after stat records must not alias');

  const target = surface === 'before' ? file.before : surface === 'after' ? file.after : file.content;
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: expected }, 'known-good L1 oracle control');

  const prototype = Object.getPrototypeOf(target);
  const keys = Reflect.ownKeys(target);
  const descriptors = Object.getOwnPropertyDescriptors(target);
  const original = Object.getOwnPropertyDescriptor(target, 'kind');
  assert.ok(original && Object.hasOwn(original, 'value'), 'valid control has an own data kind descriptor');
  assert.equal(original.enumerable, true, 'valid control kind is enumerable');
  const counter = { value: 0 };
  const accessor = () => {
    counter.value += 1;
    return original.value;
  };
  Object.defineProperty(target, 'kind', {
    get: accessor,
    enumerable: original.enumerable,
    configurable: original.configurable,
  });

  const mutated = Object.getOwnPropertyDescriptor(target, 'kind');
  assert.ok(mutated && Object.hasOwn(mutated, 'get') && !Object.hasOwn(mutated, 'value'), 'single mutation replaces only kind with an accessor descriptor');
  assert.strictEqual(mutated.get, accessor, 'fixture retains the exact hostile accessor');
  assert.strictEqual(Object.getPrototypeOf(target), prototype, 'kind descriptor mutation preserves prototype');
  assert.deepEqual(Reflect.ownKeys(target), keys, 'kind descriptor mutation preserves own keys');
  for (const key of keys.filter(key => key !== 'kind')) {
    assert.deepEqual(Object.getOwnPropertyDescriptor(target, key), descriptors[key], `kind descriptor mutation preserves ${String(key)} descriptor`);
  }
  assert.equal(counter.value, 0, 'kind accessor begins at zero');
  rejected(evaluate(evaluationInput(fixture)), 'INPUT_INVALID');
  assert.equal(counter.value, 0, 'L1 descriptor admission never reads kind accessor');
}

addedTest('N214', 'L1 before.kind accessor rejects without callback', async () => { await assertL1KindAccessorRejectsWithoutCallback('before'); });
addedTest('N215', 'L1 after.kind accessor rejects without callback', async () => { await assertL1KindAccessorRejectsWithoutCallback('after'); });
addedTest('N216', 'L1 content.kind accessor rejects without callback', async () => { await assertL1KindAccessorRejectsWithoutCallback('content'); });

addedTest('N217', 'L1 root slash nonempty descendant parent / REQ-WVEB-001 / AC-WVEB-001,005', async () => {
  const evaluate = await evaluator();
  const control = validL1();
  assert.deepEqual(evaluate(evaluationInput(control)), { kind: 'OK', value: oracleSnapshot(control.subject, control.observation) }, 'ordinary-root nonempty control has a complete independent oracle');
  const fixture = validL1({ empty: true });
  const rootEntry = entry(Buffer.from('scopes/a.txt'), present('FILE', 0o100644n), { kind: 'FILE', sha256: HEX_A });
  rootEntry.parent_realpath = '/scopes';
  fixture.subject.worktree_root = '/';
  fixture.observation.worktree_root_realpath = '/';
  fixture.observation.status_stdout = Buffer.from(' M scopes/a.txt\0', 'utf8');
  fixture.observation.ignored_status_stdout = Buffer.from(fixture.observation.status_stdout);
  fixture.observation.entries = [rootEntry];
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  assert.equal(expected.entry_count, 1, 'root fixture has a nonempty inventory');
  assert.equal(rootEntry.path_bytes.equals(Buffer.from('scopes/a.txt')), true, 'root fixture preserves the raw status path');
  assert.equal(rootEntry.parent_realpath, '/scopes', 'root fixture parent is a component descendant of slash');
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: expected }, 'slash root admits a matching nonempty descendant parent');
});

addedTest('N218', 'L1 root slash nonempty root-level leaf / REQ-WVEB-001 / AC-WVEB-001,005', async () => {
  const evaluate = await evaluator();
  const fixture = validL1({ empty: true });
  const rootEntry = entry(Buffer.from('z-last.txt'), present('FILE', 0o100644n), { kind: 'FILE', sha256: HEX_A });
  fixture.subject.worktree_root = '/';
  fixture.observation.worktree_root_realpath = '/';
  rootEntry.parent_realpath = '/';
  fixture.observation.status_stdout = Buffer.from(' M z-last.txt\0', 'utf8');
  fixture.observation.ignored_status_stdout = Buffer.from(fixture.observation.status_stdout);
  fixture.observation.entries = [rootEntry];
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  assert.equal(expected.entry_count, 1, 'root-level fixture has a nonempty inventory');
  assert.equal(rootEntry.parent_realpath, fixture.subject.worktree_root, 'root-level leaf parent equals slash worktree root');
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: expected }, 'slash-root equality boundary remains valid');
});

addedTest('N219', 'L1 ordinary-root same-name-prefix sibling rejects / REQ-WVEB-001 / AC-WVEB-001,005', async () => {
  const evaluate = await evaluator();
  const fixture = validL1();
  const expected = oracleSnapshot(fixture.subject, fixture.observation);
  assert.deepEqual(evaluate(evaluationInput(fixture)), { kind: 'OK', value: expected }, 'ordinary-root nonempty control has a complete independent oracle');
  const file = fixture.observation.entries.find(candidate => Buffer.from(candidate.path_bytes).equals(Buffer.from('scopes/a.txt')));
  assert.ok(file, 'fixture supplies the scoped file entry');
  const originalParent = file.parent_realpath;
  file.parent_realpath = `${fixture.subject.worktree_root}-sibling/scopes`;
  assert.equal(originalParent, `${fixture.subject.worktree_root}/scopes`, 'control parent is the ordinary-root descendant');
  assert.equal(file.parent_realpath, `${fixture.subject.worktree_root}-sibling/scopes`, 'only parent moves to a same-name-prefix sibling');
  rejected(evaluate(evaluationInput(fixture)), 'SUBJECT_MISMATCH');
});

addedTest('N220', 'L2 ordinary-root descendant cwd executes / REQ-WVEB-001 / AC-WVEB-003,004', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ worktree, subject }) => {
    const nested = path.join(worktree, 'checks', 'nested');
    await mkdir(nested, { recursive: true });
    const executionCwd = await realpath(nested);
    const d = definition(subject);
    d.cwd = executionCwd;
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    assert.equal(snapshot.entry_count, 0, 'temporary Git control supplies a complete empty inventory oracle');
    assert.equal(executionCwd.startsWith(`${subject.worktree_root}/`), true, 'execution cwd is an ordinary-root component descendant');
    assert.deepEqual(await createValidationGateway({ nodeExecutable: NODE }).execute({ definition: d, subject }), expectedReceipt(subject, d, snapshot, { execution_cwd: executionCwd }), 'real child receipt binds the descendant execution cwd');
  });
});

addedTest('N221', 'L2 ordinary-root same-name-prefix sibling cwd rejects without child / REQ-WVEB-001 / AC-WVEB-003,004,005', async () => {
  const createValidationGateway = await factory();
  await withWorktree(async ({ temporary, subject }) => {
    const sibling = await realpath(await mkdir(path.join(temporary, 'worktree-sibling'), { recursive: true }));
    const sentinel = path.join(temporary, 'N221-child');
    const d = definition(subject, 'regression-affected-suite', [NODE, '-e', 'require("node:fs").writeFileSync(process.argv[1], "started")', sentinel]);
    const gateway = createValidationGateway({ nodeExecutable: NODE });
    const snapshot = oracleSnapshot(subject, await actualObservation(subject));
    assert.deepEqual(await gateway.execute({ definition: d, subject }), expectedReceipt(subject, d, snapshot, { stdout: Buffer.alloc(0) }), 'ordinary-root control runs before the cwd mutation');
    assert.deepEqual(await readFile(sentinel), Buffer.from('started'), 'control child writes its sentinel');
    await unlink(sentinel);
    const status = await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']);
    const head = await git(subject.worktree_root, ['rev-parse', 'HEAD']);
    const index = await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
    d.cwd = sibling;
    assert.equal(sibling, `${subject.worktree_root}-sibling`, 'sibling cwd is a lexical same-name-prefix path');
    await assert.rejects(gateway.execute({ definition: d, subject }), /INPUT_INVALID/);
    await assert.rejects(readFile(sentinel), /ENOENT/);
    assert.deepEqual(await git(subject.worktree_root, ['status', '--porcelain=v1', '-z']), status, 'sibling-cwd rejection has no worktree status effect');
    assert.deepEqual(await git(subject.worktree_root, ['rev-parse', 'HEAD']), head, 'sibling-cwd rejection has no HEAD effect');
    assert.deepEqual(await run(GIT, ['diff', '--cached', '--quiet', subject.head_sha, '--'], { cwd: subject.worktree_root, env: { ...process.env, LC_ALL: 'C', LANG: 'C' } }), index, 'sibling-cwd rejection has no index effect');
  });
});
