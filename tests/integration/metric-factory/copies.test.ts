import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,writeFileSync,readFileSync,symlinkSync,mkdirSync,renameSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMetricCopies} from '../../../adapters/metric-factory/copies.ts';
import {metricHash,verifyMetricBundle} from '../../../adapters/metric-factory/bundle.ts';
import {createMetricDelivery} from '../../../packages/application/metric-factory.ts';
import {readPersonalMetricDeployment} from '../../../profiles/personal/metric-factory.ts';
const root=()=>realpathSync(mkdtempSync(join(tmpdir(),'mf-copies-')));
const publication=(version='1.0.0')=>{const bytes=Buffer.from('synthetic fixed SAP '+version);return {packageId:'synthetic-system',version,contentFingerprint:'sha256:'+'a'.repeat(64),packageFingerprint:'sha256:'+'b'.repeat(64),sha256:metricHash(bytes),bytes};};
test('MF-05 exact copy, repeat returns original receipt; old copies retained and independently checked',()=>{
 const dir=root(),store=createMetricCopies(dir,'a'.repeat(64)),delivery=createMetricDelivery(store,()=>{}),value=publication();
 const first=delivery.save(value);assert.deepEqual(delivery.save(value),first);assert.deepEqual(store.read(value.packageId).bytes,value.bytes);
 delivery.save(publication('1.0.1'));assert.equal(store.read(value.packageId).receipt.version,'1.0.1');assert.deepEqual(delivery.read(value.packageId,'1.0.0').receipt,first);
 assert.throws(()=>delivery.read(value.packageId,'9.0.0'),{code:'ENOENT'});
 writeFileSync(join(dir,value.packageId,'1.0.0.sap.yaml'),'changed');assert.throws(()=>delivery.save(value),/CORRUPT/);
});
test('MF-05 lost receipt recovers same immutable bytes without generating a version',()=>{
 const dir=root(),value=publication();mkdirSync(join(dir,value.packageId));writeFileSync(join(dir,value.packageId,'1.0.0.sap.yaml'),value.bytes);
 const receipt=createMetricCopies(dir,'a'.repeat(64)).save(value);assert.equal(receipt.sha256,value.sha256);assert.equal(receipt.version,'1.0.0');
});
test('MF-04 rejects bad bytes, path traversal and redirected copy roots',()=>{
 const dir=root(),store=createMetricCopies(join(dir,'copies'),'a'.repeat(64)),value=publication();
 assert.throws(()=>store.save({...value,sha256:'0'.repeat(64)}),/PUBLICATION_INVALID/);assert.throws(()=>store.save({...value,packageId:'../outside'}),/ID_INVALID/);
 mkdirSync(join(dir,'target'));symlinkSync(join(dir,'target'),join(dir,'copies'));assert.throws(()=>store.save(value),/ROOT_INVALID/);
});
test('MF-05 revoked host control cannot save or read through the application',()=>{
 const app=createMetricDelivery(createMetricCopies(root(),'a'.repeat(64)),()=>{throw Error('REVOKED');});assert.throws(()=>app.save(publication()),/REVOKED/);assert.throws(()=>app.read('synthetic-system','1.0.0'),/REVOKED/);
});

test('MF-01 fixed manifest rejects changed, missing, unlisted and symlink resources',()=>{
 const dir=root(),paths=['node','dist/integration.js','dist/index.html','dist/app.js','dist/api.js','dist/style.css','package.json','package-lock.json','LICENSE','INTEGRATION-CHANGES.md','MODEL-CATALOG-NOTICE.txt','THIRD-PARTY-NOTICES.txt','source-identity.json'];
 mkdirSync(join(dir,'dist'));const files=paths.map(path=>{const bytes=Buffer.from('synthetic '+path);writeFileSync(join(dir,path),bytes);return {path,bytes:bytes.length,sha256:metricHash(bytes)};});
 const manifest=Buffer.from(JSON.stringify({version:1,sourceCommit:'169faa8d45e1c5616c004f8fb844a7ca68add156',sourceSnapshot:'a'.repeat(64),files}));writeFileSync(join(dir,'manifest.json'),manifest);const sha=metricHash(manifest);
 assert.equal(verifyMetricBundle(dir,sha).files.length,paths.length);
 assert.throws(()=>verifyMetricBundle(dir,'0'.repeat(64)),/MANIFEST_CHANGED/);
 writeFileSync(join(dir,'dist/app.js'),'changed');assert.throws(()=>verifyMetricBundle(dir,sha),/BUNDLE_BYTES/);writeFileSync(join(dir,'dist/app.js'),'synthetic dist/app.js');
 renameSync(join(dir,'node'),join(dir,'missing-node'));assert.throws(()=>verifyMetricBundle(dir,sha));renameSync(join(dir,'missing-node'),join(dir,'node'));
 writeFileSync(join(dir,'extra'),'unlisted');assert.throws(()=>verifyMetricBundle(dir,sha),/UNLISTED/);unlinkSync(join(dir,'extra'));
 symlinkSync(join(dir,'dist'),join(dir,'redirect'));assert.throws(()=>verifyMetricBundle(dir,sha),/LINK/);
});
test('MF-01 bad deployment stays unavailable without disabling the host',async()=>{
 const dir=root();writeFileSync(join(dir,'metric-factory-deployment.json'),'{"version":999}');
 const workspace=readPersonalMetricDeployment(dir,join(dir,'data'))!;assert.deepEqual(await workspace.status(),{available:false});await assert.rejects(()=>workspace.open(()=>{}),/UNAVAILABLE/);await workspace.close();
});
test('MF-09 persisted copies reject another source and missing exact versions without latest fallback',()=>{
 const dir=root(),store=createMetricCopies(dir,'a'.repeat(64));store.save(publication());
 assert.throws(()=>createMetricCopies(dir,'b'.repeat(64)).read('synthetic-system','1.0.0'),/CORRUPT/);
 assert.throws(()=>store.read('synthetic-system','9.0.0'),{code:'ENOENT'});
});
