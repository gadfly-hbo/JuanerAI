import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const require=createRequire(import.meta.url);
test('INSTALL-005: internal package uses explicit non-existing output and only supplied local resources, never the historical out',()=>{
  assert.ok(process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES);
  assert.ok(process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT);
  const config=require('../../forge.config.cjs');
  assert.equal(config.outDir,process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT,'Forge owns output selection before Electron Packager');
  assert.deepEqual(config.packagerConfig.extraResource,[
    join(process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES,'toolchain-deployment.json'),
    join(process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES,'toolchain'),
    join(process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES,'THIRD_PARTY_NOTICES'),
  ]);
  assert.equal(config.packagerConfig.asar,true);
  assert.deepEqual(config.makers,[]);
  assert.deepEqual(config.rebuildConfig.onlyModules,[]);
  assert.equal(typeof config.hooks?.postPackage, 'function', 'internal delivery must seal and strictly verify the actual completed bundle');
});

test('INSTALL-004: real Forge postPackage passes its exact bundle to the seal entry and propagates failure', async () => {
  const config = require('../../forge.config.cjs');
  const seal = require('./seal-internal-app.cjs'), original = seal.sealInternalApp;
  const output = join(process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT, 'Xanthil-darwin-arm64');
  const helper=require('./build-keychain-helper.cjs'),originalHelper=helper.buildKeychainHelper;
  const helperCalls=[];
  const calls = [];
  try {
    // Only the native signing boundary is observed here; the same actual entry's
    // real signature behavior is covered by the frozen strict RED/GREEN bundle.
    helper.buildKeychainHelper=app=>{helperCalls.push(app);};
    seal.sealInternalApp = app => { calls.push(app); };
    await config.hooks.postPackage(config, { platform: 'darwin', arch: 'arm64', outputPaths: [output] });
    assert.deepEqual(calls, [join(output, 'Xanthil.app')]);
    assert.deepEqual(helperCalls,[join(output,'Xanthil.app')],'PS-03 normal package contains the signed OS helper');
    const failure = new Error('synthetic native signature rejection');
    seal.sealInternalApp = () => { throw failure; };
    await assert.rejects(config.hooks.postPackage(config, { platform: 'darwin', arch: 'arm64', outputPaths: [output] }), error => error === failure);
    seal.sealInternalApp = () => assert.fail('invalid output must not invoke signing');
    await assert.rejects(config.hooks.postPackage(config, { platform: 'linux', arch: 'arm64', outputPaths: [output] }), /approved single darwin-arm64/);
    await assert.rejects(config.hooks.postPackage(config, { platform: 'darwin', arch: 'arm64', outputPaths: ['/outside-approved-output'] }), /Unexpected internal signing output/);
  } finally { seal.sealInternalApp = original;helper.buildKeychainHelper=originalHelper; }
});
