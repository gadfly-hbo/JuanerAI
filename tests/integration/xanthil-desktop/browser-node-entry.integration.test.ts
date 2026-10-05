import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,constants} from 'node:fs';
import {join,resolve} from 'node:path';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {readBrowserServiceIdentity} from '../../../adapters/storage-local/browser-project-origin.ts';
import {browserServiceEnvironment} from '../../../tools/browser/service-environment.ts';

test('BF-R11 CA: child environment preserves only approved startup inputs',()=>{
 const source={PATH:'/tools',JUANERAI_TOOLCHAIN_BIN:'/toolchain',NODE_EXTRA_CA_CERTS:'/untrusted.pem',NODE_TLS_REJECT_UNAUTHORIZED:'0',NODE_OPTIONS:'--use-openssl-ca',HTTPS_PROXY:'http://proxy',API_KEY:'synthetic-secret'};
 const env=browserServiceEnvironment('/profile',source);
 assert.equal(env.PATH,'/tools');assert.equal(env.JUANERAI_TOOLCHAIN_BIN,'/toolchain');assert.equal(env.JUANERAI_DESKTOP_DEV_ROOT,'/profile');
 for(const key of ['NODE_TLS_REJECT_UNAUTHORIZED','NODE_OPTIONS','HTTPS_PROXY','API_KEY'])assert.equal(env[key],undefined);
 assert.notEqual(env.NODE_EXTRA_CA_CERTS,source.NODE_EXTRA_CA_CERTS);
 assert.equal(source.NODE_EXTRA_CA_CERTS,'/untrusted.pem','parent environment stays unchanged');
});

test('BF-R11 CA: macOS service uses only the readable public system CA bundle',()=>{
 const checks:unknown[][]=[];
 const env=browserServiceEnvironment('/profile',{NODE_EXTRA_CA_CERTS:'/untrusted.pem'},'darwin',(path,mode)=>{checks.push([path,mode]);});
 assert.equal(env.NODE_EXTRA_CA_CERTS,'/etc/ssl/cert.pem');
 assert.deepEqual(checks,[['/etc/ssl/cert.pem',constants.R_OK]]);
});

test('BF-R11 CA: missing or unreadable system bundle retains default TLS trust',()=>{
 for(const code of ['ENOENT','EACCES']){
  const env=browserServiceEnvironment('/profile',{NODE_EXTRA_CA_CERTS:'/untrusted.pem'},'darwin',()=>{throw Object.assign(new Error('unavailable'),{code});});
  assert.equal(env.NODE_EXTRA_CA_CERTS,undefined);assert.equal(env.NODE_TLS_REJECT_UNAUTHORIZED,undefined);
 }
});

test('BF-R11 CA: other platforms do not inspect or inherit an extra CA bundle',()=>{
 for(const platform of ['linux','win32'] as const){
  const env=browserServiceEnvironment('/profile',{NODE_EXTRA_CA_CERTS:'/untrusted.pem'},platform,()=>assert.fail('macOS bundle must not be inspected'));
  assert.equal(env.NODE_EXTRA_CA_CERTS,undefined);
 }
});

test('BF-R08/11: normal Node startup exits while independent service serves later requests; stop is explicit',async()=>{
 const scripts=JSON.parse(readFileSync('package.json','utf8')).scripts;assert.equal(scripts['web:start'],'node tools/browser/entry.mjs start');
 const root=mkdtempSync(join(browserEvidenceRoot,'node-entry-')),env={...process.env,JUANERAI_DESKTOP_DEV_ROOT:root},command=resolve('tools/browser/entry.mjs'),directory=join(root,'user-data','web-service');
 const run=(action:string)=>spawnSync(process.execPath,[command,action,'--no-open'],{env,encoding:'utf8',timeout:20000});
 try{
  const started=run('start');assert.equal(started.status,0,started.stderr);assert.doesNotMatch(started.stdout,/#[a-f0-9]{64}|credential/);
  const first=readBrowserServiceIdentity(directory);
  const call=async(path:string,body:unknown,headers:Record<string,string>)=>{const r=await fetch(first.origin+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')};};
  const again=run('start');assert.equal(again.status,0,again.stderr);assert.deepEqual(readBrowserServiceIdentity(directory),first);
  const opened=await call('/v1/service/open',{}, {'x-xanthil-service':first.credential});assert.equal(opened.status,200);
  const boot=await call('/v1/bootstrap',{token:opened.body.token},{origin:first.origin});assert.equal(boot.status,200);
  const projects=await fetch(first.origin+'/v1/projects',{headers:{cookie:boot.cookie!.split(';')[0]}});assert.equal(projects.status,200);assert.deepEqual(await projects.json(),{projects:[],current:null});
  assert.equal((await fetch(first.origin+'/')).status,200,'service remains after startup commands have exited');
 }finally{const stopped=run('stop');assert.equal(stopped.status,0,stopped.stderr);}
});

test('BF-R08: an unreachable service with held ownership is not reported as stopped',async()=>{
 const {prepareDevelopmentRoot}=await import('../../../apps/desktop/development.ts'),{acquireBrowserServiceIdentity}=await import('../../../adapters/storage-local/browser-project-origin.ts'),{mkdirSync}=await import('node:fs');
 const root=mkdtempSync(join(browserEvidenceRoot,'node-unknown-')),paths=prepareDevelopmentRoot(root),directory=join(paths.userData,'web-service');mkdirSync(directory,{mode:0o700});const lease=acquireBrowserServiceIdentity(directory);lease.publish('http://127.0.0.1:1');
 try{const result=spawnSync(process.execPath,[resolve('tools/browser/entry.mjs'),'stop','--no-open'],{env:{...process.env,JUANERAI_DESKTOP_DEV_ROOT:root},encoding:'utf8',timeout:15000});assert.equal(result.status,1,'unreachable owned service must remain unknown');assert.doesNotMatch(result.stdout,/已停止/);}finally{lease.close();}
});

test('BF-R11: missing local computation descriptor has a readable bounded failure, without building or credential access',async()=>{
 const module=await import('../../../apps/browser/service-main.ts'),read=Reflect.get(module,'readIndependentWebToolchain');assert.equal(typeof read,'function');
 const root=mkdtempSync(join(browserEvidenceRoot,'missing-web-runtime-'));
 await assert.rejects(()=>read(join(root,'not-present.json')),(error:unknown)=>{assert.equal((error as {code:string}).code,'WEB_TOOLCHAIN_UNAVAILABLE');assert.match((error as Error).message,/本地计算环境尚未准备/);assert.doesNotMatch((error as Error).message,/not-present|ENOENT/);return true;});
});

test('BF-R11: missing helper stays visible unavailable and never probes or falls back',async()=>{
 const {createMacOsCredentialStore}=await import('../../../adapters/credentials-macos/index.ts'),{createProviderSettings}=await import('../../../packages/application/provider-settings.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'missing-web-helper-')),settings=createProviderSettings({store:createMacOsCredentialStore(join(root,'not-present-helper')),probe:async()=>assert.fail('no Provider fallback')});
 assert.equal((await settings.request({operation:'read'})).value.state,'unconfigured');const result=await settings.request({operation:'refresh'});assert.equal(result.ok,false);assert.equal(result.value.state,'keychain_unavailable');settings.close();
});
