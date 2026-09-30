import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

test('DEV-01 formal Main admits the Forge renderer development endpoint',async()=>{
 const source=await readFile('apps/desktop/main.ts','utf8');
 assert.match(source,/MAIN_WINDOW_VITE_DEV_SERVER_URL/);
 assert.match(source,/window\.loadURL\(/);
});
test('DEV-01 Main and Preload are built once and require explicit restart',async()=>{
 for(const path of ['vite.main.config.mjs','vite.preload.config.mjs']){
  const config=(await import('../../../'+path)).default;
  assert.equal(config.build.watch,null,path);
 }
});
test('DEV-02 development cannot auto-load production credentials or activation',async()=>{
 const source=await readFile('apps/desktop/main.ts','utf8');
 assert.equal(source.includes('development ? null : loadPersonalCaseAssistantActivation'),true);
 assert.equal(source.includes('createMacOsCredentialStore(credentialHelper)'),true);
});
test('DEV-03 renderer server is loopback-only with a fixed port and bounded filesystem',async()=>{
 const config=(await import(new URL('../../../vite.renderer.config.mjs',import.meta.url).href)).default;
 assert.equal(config.server?.host,'127.0.0.1');
 assert.equal(config.server?.port,5173);
 assert.equal(config.server?.strictPort,true);
 assert.equal(config.server?.fs?.strict,true);
 assert.equal(config.publicDir,false);
});
import {mkdtemp,mkdir,symlink,writeFile,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {developmentEndpoint,isDevelopmentFrame,prepareDevelopmentRoot,assertDevelopmentPath} from '../../../apps/desktop/development.ts';
test('DEV-03 packaged deployment ignores all compiled development inputs; development rejects wrong endpoints',()=>{
 for(const endpoint of ['https://evil.example','file:///tmp/a','http://127.0.0.1:5174','http://127.0.0.1:5173/evil','http://localhost:5173@evil/','http://[::1]:5173']){
  assert.equal(developmentEndpoint(true,endpoint),null);
  assert.throws(()=>developmentEndpoint(false,endpoint));
 }
 assert.equal(developmentEndpoint(false,'http://localhost:5173'),'http://127.0.0.1:5173/');
 assert.equal(developmentEndpoint(true,'http://localhost:5173'),null);
 for(const url of ['http://127.0.0.1:5174/','http://127.0.0.1:5173/evil','http://localhost:5173/','http://127.0.0.1:5173/?other','about:blank'])assert.equal(isDevelopmentFrame(url,'http://127.0.0.1:5173/'),false);
 assert.equal(isDevelopmentFrame('http://127.0.0.1:5173/','http://127.0.0.1:5173/'),true);
});
test('DEV-02 owned development root rejects existing unrelated data and escaped chooser capabilities',async()=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'desktop-dev-boundary-')));
 const dev=prepareDevelopmentRoot(join(root,'dev'));
 assert.deepEqual(prepareDevelopmentRoot(dev.root),dev);
 const project=join(dev.projects,'synthetic');await mkdir(project);assertDevelopmentPath(dev.projects,project);
 const original=join(root,'original');await mkdir(original);await writeFile(join(original,'sentinel'),'untouched');
 assert.throws(()=>prepareDevelopmentRoot(original));
 assert.throws(()=>assertDevelopmentPath(dev.projects,original));
 const escape=join(dev.projects,'escape');await symlink(original,escape);assert.throws(()=>assertDevelopmentPath(dev.projects,escape));
 assert.throws(()=>assertDevelopmentPath(dev.root,join(escape,'report.html'),true));
 assert.equal(await readFile(join(original,'sentinel'),'utf8'),'untouched');
});
test('DEV-04 daily Desktop command never packages, artifact checks stay explicit',async()=>{
 const {scripts}=JSON.parse(await readFile('package.json','utf8'));
 assert.equal(scripts['desktop:test'].includes('desktop:package'),false);
 assert.equal(typeof scripts['desktop:test:artifact'],'string');
 assert.equal(typeof scripts['desktop:test:native'],'string');
});
test('DEV-03 same-document report anchors retain valid development IPC',()=>{
 assert.equal(isDevelopmentFrame('http://127.0.0.1:5173/#evidence-1','http://127.0.0.1:5173/'),true);
});
test('DEV-02 development keeps the real settings capability with its own credential helper',async()=>{
 const source=await readFile('apps/desktop/main.ts','utf8');
 assert.equal(source.includes('development || caseAssistantConfig'),false,'development must not disable settings');
 assert.equal(source.includes('development-keychain/xanthil-keychain'),true);
 const swift=await readFile('adapters/credentials-macos/keychain.swift','utf8');
 assert.match(swift,/#if XANTHIL_DEVELOPMENT/);
 assert.match(swift,/com\.juanerai\.xanthil\.development\.xiaomi-token-plan-cn/);
});
test('DEV-04 npm test selects canonical portable checks and current daily Desktop additions',async()=>{
 const {scripts}=JSON.parse(await readFile('package.json','utf8'));
 assert.equal(scripts.test,'node tools/desktop/test-daily.mjs --all');
});
