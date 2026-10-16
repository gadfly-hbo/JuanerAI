import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, writeFile, rm, realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {patchedStudioSource, prepareStudioSource} from '../../../tools/report-studio/prepare-source.mjs';

const archive = new URL('../../../vendor/reports-factory/74ebb609/source.tar', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = path => execFileSync('tar', ['-xOf', archive.pathname, path]);

test('RS-RETURN-01 exact original revision is selected without fallback, mutation or any model/write callback',async()=>{
 const {reportStudioReturnTarget,selectReportStudioReturnTask}=await import('../../../apps/browser/report-studio-client.mjs'),project='00000001-1111-4111-a111-111111111111',taskId='00000002-1111-4111-a111-111111111111',target={project_id:project,task_id:taskId,revision:'1'},old={identity:{task_id:taskId,revision:'1'},conversation_outcome:{text:'原版合成回复'}},task={identity:{task_id:taskId,revision:'2'},conversation_outcome:{text:'新版合成回复'},history:[old]},original=structuredClone(task);let reads=0;
 assert.deepEqual(reportStudioReturnTarget(target),target);const selected=await selectReportStudioReturnTask(target,project,async id=>{reads++;assert.equal(id,taskId);return task;});assert.equal(selected.display_revision,'1');assert.deepEqual(task,original);assert.equal(reads,1);
 await assert.rejects(()=>selectReportStudioReturnTask(target,'00000003-1111-4111-a111-111111111111',async()=>{assert.fail('wrong project must not read a task');}),/原分析/);
 for(const bad of [{...task,history:[]},{...task,identity:{...task.identity,task_id:'other'}},{...task,history:[{...old,conversation_outcome:null}]}])await assert.rejects(()=>selectReportStudioReturnTask(target,project,async()=>bad),/原分析/);
 for(const bad of [{...target,revision:'0'},{...target,task_id:'../../other'},{...target,control:'forbidden'}])assert.throws(()=>reportStudioReturnTarget(bad),/原分析/);
});

test('RS-BUILTIN-01 exact selected supplier input excludes user data and pins original bytes', async () => {
  const bytes = await readFile(archive);
  assert.equal(bytes.length, 1628160);
  assert.equal(sha(bytes), 'a5cba2b9dc44011d6177068df504483b2550d6c77e958a8c76d0de80a119e62a');
  const entries = execFileSync('tar', ['-tf', archive.pathname], {encoding: 'utf8'}).trim().split('\n');
  assert(entries.length > 0);
  for (const entry of entries) assert(!/^(?:data|work|samples|\.zcode|\.flow)(?:\/|$)/.test(entry), entry);
});

test('RS-BUILTIN-01 edits only explicit built-in credential and execution boundaries', () => {
  const model = source('src/agent/model.ts'), exec = source('src/agent/exec-env.ts');
  const afterModel = patchedStudioSource('src/agent/model.ts', model).toString();
  const afterExec = patchedStudioSource('src/agent/exec-env.ts', exec).toString();
  assert.match(afterModel, /loadKeysFromDisk\(\): void \{\n  if \(process.env\['REPORT_STUDIO_BUILTIN'\] === '1'\) return;/);
  assert(afterModel.endsWith(model.toString().slice(model.toString().indexOf('  const home = homedir();'))));
  assert.match(afterExec, /\['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'PLAYWRIGHT_BROWSERS_PATH'\]/);
  assert.match(afterExec, /REPORT_STUDIO_BUILTIN/);
  for (const [path, bytes] of [['src/agent/model.ts', model], ['src/agent/exec-env.ts', exec]]) {
    assert.throws(() => patchedStudioSource(path, Buffer.concat([bytes, Buffer.from('\n')])), /IDENTITY_MISMATCH/);
    assert.throws(() => patchedStudioSource(path, patchedStudioSource(path, bytes)), /IDENTITY_MISMATCH/);
  }
  assert.throws(() => patchedStudioSource('unknown', model), /IDENTITY_MISMATCH/);
});

test('RS-BUILTIN-01 refuses partial unknown input before any source write', async t => {
  const root = await mkdtemp(join(tmpdir(), 'studio-source-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  execFileSync('tar',['-xf',archive.pathname,'-C',root]);
  const model = source('src/agent/model.ts');
  await writeFile(join(root, 'src/agent/model.ts'), model);
  await writeFile(join(root, 'src/agent/exec-env.ts'), 'unknown supplier source');
  await assert.rejects(() => prepareStudioSource(root), /IDENTITY_MISMATCH/);
  assert.deepEqual(await readFile(join(root, 'src/agent/model.ts')), model);
});

test('RS-PACKAGE-01 builds a closed relocatable resource tree, excludes source data and refuses overwrite',async t=>{
 const {buildReportStudioBundle}=await import('../../../tools/report-studio/build-bundle.mjs');
 const {verifyReportStudioBundle}=await import('../../../adapters/report-studio/bundle.ts');
 const root=await realpath(await mkdtemp(join(tmpdir(),'studio-package-')));t.after(()=>rm(root,{recursive:true,force:true}));
 const sourceRoot=join(root,'source'),browserRoot=join(root,'browser');
 for(const dir of ['dist/juanerai','web-dist/assets','assets/skills/ppt','node_modules/synthetic'])await mkdir(join(sourceRoot,dir),{recursive:true});
 await mkdir(browserRoot);
 const inputs={'dist/juanerai/entry.js':'// synthetic server','web-dist/assets/app.js':'// synthetic UI','assets/skills/ppt/SKILL.md':'synthetic skill','node_modules/synthetic/package.json':JSON.stringify({name:'synthetic',version:'1',license:'MIT'}),'node_modules/synthetic/LICENSE':'synthetic license','package.json':JSON.stringify({name:'report-studio',version:'0.1.0',type:'module',license:'ISC'}),'package-lock.json':JSON.stringify({lockfileVersion:3,packages:{'node_modules/synthetic':{version:'1'}}})};
 for(const [path,body]of Object.entries(inputs))await writeFile(join(sourceRoot,path),body);
 await mkdir(join(sourceRoot,'data'));await writeFile(join(sourceRoot,'data','excluded-private.txt'),'excluded synthetic data');
 const node=join(root,'node'),license=join(root,'Node-LICENSE');await writeFile(node,'synthetic node');await writeFile(license,'synthetic node license');await writeFile(join(browserRoot,'headless-shell'),'synthetic browser');await writeFile(join(browserRoot,'LICENSE'),'synthetic browser license');
 const helper=join(root,'keychain-helper');await writeFile(helper,'synthetic helper never executed',{mode:0o700});
 const output=join(root,'output'),config={supplierRoot:sourceRoot,nodeFile:node,nodeLicense:license,browserRoot,output,version:'synthetic-1',sourceCommit:'a'.repeat(40),lockSha256:sha(inputs['package-lock.json']),keychainHelper:helper,keychainHelperSha256:sha('synthetic helper never executed')};
 const built=await buildReportStudioBundle(config);assert.equal((await verifyReportStudioBundle(output,built.identity)).state,'ready');
 assert(!built.manifest.files.some(f=>f.path.includes('excluded-private')));assert(built.manifest.files.some(f=>f.path==='bin/node'));assert(built.manifest.files.some(f=>f.role==='browser'));await assert.rejects(()=>buildReportStudioBundle(config),/EXISTS/);
});

test('RS-HOST-BROWSER-01 sends exact source once with current control and validates actual loopback launch URL',async()=>{
 const {createReportStudioBrowserClient}=await import('../../../apps/browser/report-studio-client.mjs');
 let control='first',calls=0;const project='00000001-1111-4111-a111-111111111111',task='00000002-1111-4111-a111-111111111111';
 const client=createReportStudioBrowserClient({control:()=>control,request:async(path,options)=>{calls++;assert.equal(path,'/v1/report-studio/projects/'+project+'/open');assert.equal(options.headers['x-xanthil-control'],'second');assert.deepEqual(JSON.parse(options.body),{task_id:task,revision:'2',materials:['conclusion']});return new Response(JSON.stringify({association:{association_id:task,studio_project_id:'proj_synthetic'},url:'http://127.0.0.1:12345/?project=proj_synthetic#bootstrap='+ 'a'.repeat(64)}),{headers:{'content-type':'application/json'}});}});
 control='second';const result=await client.open(project,task,'2',['conclusion']);assert.match(result.url,/127\.0\.0\.1/);assert.equal(calls,1);
 for(const url of ['https://example.com/','http://localhost:12345/#bootstrap='+ 'a'.repeat(64),'http://user:pass@127.0.0.1:12345/#bootstrap='+ 'a'.repeat(64),'http://127.0.0.1:12345/not-home#bootstrap='+ 'a'.repeat(64)]){
 const bad=createReportStudioBrowserClient({control:()=>control,request:async()=>new Response(JSON.stringify({url,association:{studio_project_id:'proj_synthetic'}}),{headers:{'content-type':'application/json'}})});await assert.rejects(()=>bad.open(project,task,'2',['conclusion']));}
 const readonly=createReportStudioBrowserClient({control:()=>null,request:async()=>assert.fail('must not dispatch')});await assert.rejects(()=>readonly.open(project,task,'2',['conclusion']));
});

test('RS-BUILTIN-01 complete multi-edit recipe is idempotent; partial session edits fail before other writes',async t=>{
 const root=await mkdtemp(join(tmpdir(),'studio-overlay-'));t.after(()=>rm(root,{recursive:true,force:true}));execFileSync('tar',['-xf',archive.pathname,'-C',root]);
 const first=await prepareStudioSource(root);assert(first.some(f=>f.path==='src/agent/session-host.ts'));
 const complete=await readFile(join(root,'src/agent/session-host.ts'));assert.deepEqual(await prepareStudioSource(root),first);assert.deepEqual(await readFile(join(root,'src/agent/session-host.ts')),complete);
 await writeFile(join(root,'src/agent/session-host.ts'),complete.toString().replace("    host.builtin = builtin;","    host.builtin = false;"));
 const unchanged=await readFile(join(root,'src/agent/deck-preview.ts'));await assert.rejects(()=>prepareStudioSource(root),/IDENTITY_MISMATCH/);assert.deepEqual(await readFile(join(root,'src/agent/deck-preview.ts')),unchanged);
});

test('RS-CONTINUE-01 deleted working project disables only continue and keeps immutable delivery actions',async()=>{
 const {renderReportStudioDeliveries}=await import('../../../apps/browser/report-studio-client.mjs'),row={delivery_id:'saved',sequence:1,format:'html',source:{revision:'1'},created_at:'2026-10-16T00:00:00Z',warnings:[],studio_project_state:'missing'};
 const html=renderReportStudioDeliveries([row],'2');assert.match(html,/工作项目已删除/);assert.match(html,/data-studio-action="continue"[^>]*disabled/);assert.doesNotMatch(html,/data-studio-action="download"[^>]*disabled/);assert.match(html,/交付详情/);
 const unknown=renderReportStudioDeliveries([{...row,studio_project_state:'unknown'}],'2');assert.match(unknown,/暂不可核对工作项目/);assert.match(unknown,/data-studio-action="check"/);assert.match(unknown,/data-studio-action="continue"[^>]*disabled/);
 const dormant=renderReportStudioDeliveries([{...row,studio_project_state:'not_checked'}],'2');assert.doesNotMatch(dormant,/data-studio-action="continue"[^>]*disabled/);
});
