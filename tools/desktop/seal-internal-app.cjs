const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function run(argv) {
  const result = spawnSync('/usr/bin/codesign', argv, {
    env: { PATH: '/usr/bin:/bin', LANG: 'en_US.UTF-8' }, encoding: 'utf8', timeout: 30000,
  });
  console.log(JSON.stringify({ command: '/usr/bin/codesign', argv, status: result.status,
    signal: result.signal, error: result.error?.message, stdout: result.stdout, stderr: result.stderr }));
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return result;
}

function inventory(root, directory = root) {
  return fs.readdirSync(directory).sort().flatMap(name => {
    const file = path.join(directory, name), stat = fs.lstatSync(file), relative = path.relative(root, file);
    if (stat.isDirectory()) return inventory(root, file);
    if (stat.isSymbolicLink()) return [[relative, 'link', fs.readlinkSync(file)]];
    return [[relative, stat.mode & 0o777, stat.size, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]];
  });
}

function sealInternalApp(app, options = {}) {
  assert.ok(path.isAbsolute(app) && app.endsWith('/Xanthil.app'));
  assert.ok(fs.lstatSync(app).isDirectory() && !fs.lstatSync(app).isSymbolicLink());
  const resources = path.join(app, 'Contents', 'Resources');
  const descriptor = JSON.parse(fs.readFileSync(path.join(resources, 'toolchain-deployment.json'), 'utf8'));
  assert.deepEqual(Object.keys(options), options.engineeringSmoke === true ? ['engineeringSmoke'] : []);
  assert.equal(descriptor.schema_version, options.engineeringSmoke === true ? '1.0' : '2.0');
  if(options.engineeringSmoke === true) assert.equal(fs.existsSync(path.join(app,'Contents/MacOS/xanthil-keychain')),false,'engineering smoke cannot read production credentials');
  const before = inventory(resources);
  const frameworkRoot = path.join(app, 'Contents', 'Frameworks');
  const names = ['Electron Framework.framework', 'Mantle.framework', 'ReactiveObjC.framework', 'Squirrel.framework',
    'Xanthil Helper (GPU).app', 'Xanthil Helper (Plugin).app', 'Xanthil Helper (Renderer).app', 'Xanthil Helper.app'];
  assert.deepEqual(fs.readdirSync(frameworkRoot).sort(), [...names].sort(), 'unexpected embedded signing scope');
  const targets = [...names.map(name => path.join(frameworkRoot, name)), app];
  // Current approved bundles have no entitlements and no hardened-runtime flag.
  // A future change must not silently inherit osx-sign's wider default policy.
  for (const target of targets) {
    const metadata = run(['--display', '--verbose=4', target]);
    assert.doesNotMatch(metadata.stderr, /flags=.*\bruntime\b/, 'hardened-runtime policy requires a separate decision');
    const entitlements = run(['--display', '--entitlements', '-', target]);
    assert.equal(entitlements.stdout.trim(), '', 'unexpected existing entitlements');
  }
  // Sign nested bundle boundaries inside-out. Never --deep sign, never sign
  // Resources runtimes, never select a keychain identity or alter security policy.
  for (const target of targets) run(['--force', '--sign', '-', '--timestamp=none', target]);
  assert.deepEqual(inventory(resources), before, 'signing must not mutate runtime, app.asar or notices');
  run(['--verify', '--deep', '--strict', '--verbose=2', app]);
}

module.exports = { sealInternalApp };
if (require.main === module) {
  assert.equal(process.argv.length, 3, 'usage: node tools/desktop/seal-internal-app.cjs ABS_NEW_XANTHIL_APP');
  sealInternalApp(process.argv[2]);
}
