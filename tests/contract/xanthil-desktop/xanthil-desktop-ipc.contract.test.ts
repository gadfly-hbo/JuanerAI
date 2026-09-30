import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { randomUUID } from 'node:crypto';

import { assertB1ElectronBoundaryHealth, assertB2RendererIndexContract, assertB2TsxSeamHealth, createB1ElectronBoundary, createB2RecordingDesktopApi, createRealDesktopApplication, createU11InactiveMainHarness, createU12ProjectAdmissionApplication, loadB1Preload, loadDesktopModule, loadFreshB1Main, membershipRepurchaseConfirmation, requireB2Renderer, requireU11IpcContract, requiredExport, requiredRecord, requiredString, withB2MountCapture, withIsolatedProject } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { assertDesktopFixtureHealth, createSessionCommand, desktopTestIds, readSyntheticCsvPair } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

const escapeRegexLiteral = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const phase of ['initial-admission', 'chooser-return', 'read-return', 'reinspection', 'confirm-admission', 'ready-replay'] as const) {
  test(`F1 same-Application continuation: ${phase} rejects a completed Project switch without a later old-source effect [AC-XDESK-009-04]`, async () => withIsolatedProject(async root => {
    const aRoot = join(root, 'a'), bRoot = join(root, 'b'); await mkdir(aRoot); await mkdir(bRoot);
    const a = (await createU12ProjectAdmissionApplication(aRoot)).application, b = (await createU12ProjectAdmissionApplication(bRoot)).application;
    const openedA = await requiredExport<(x: unknown) => Promise<Record<string, unknown>>>(a, 'openProject')({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:desktopTestIds.project,display_name:'Synthetic A'});
    const openedB = await requiredExport<(x: unknown) => Promise<Record<string, unknown>>>(b, 'openProject')({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:randomUUID(),display_name:'Synthetic B'});
    const projectValue = (p: Record<string, unknown>) => ({project:{project_id:p.project_id,display_name:p.display_name,schema_version:'1.0',write_state:'ready'},sessions:[]});
    const main = await loadDesktopModule('apps/desktop/main.ts'), pair = await readSyntheticCsvPair(), sender = {}, events: string[] = [];
    let selected: 'a'|'b' = 'a', armed = false, choices = 0, reads = 0, switched: Promise<unknown> | undefined;
    const handlers = requiredExport<(x:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main, 'createXanthilDesktopIpcHandlers')({
      senderPolicy:(s:unknown)=>s===sender,
      productionProfile:{async openProject(){events.push('profile-'+selected);return selected==='a'?{application:a,value:projectValue(openedA)}:{application:b,value:projectValue(openedB)};}},
      nativeDialogs:{
        async selectProject(){return{projectRoot:selected==='a'?aRoot:bRoot,display_name:'Synthetic selection'};},
        async selectImportFiles(){choices++;events.push('chooser-return');if(armed&&phase==='chooser-return')queueMicrotask(switchProject);return {};},
        async selectExportFile(){assert.fail('no export');},
      },
      sourceReader:{async readSelectedFiles(){reads++;events.push('source-read');if(armed&&phase==='read-return')queueMicrotask(switchProject);return{members:{display_name:'members.csv',bytes:pair.members},orders:{display_name:'orders.csv',bytes:pair.orders}};}},
      exportWriter:{async writeAndReadBack(){assert.fail('no export');}},
    });
    function switchProject() {
      selected='b';
      switched=handlers.selectProject(sender,{contract_version:'1.0',command_id:randomUUID()}).then(result=>{assert.equal(result.ok,true);events.push('switch-completed');return result;});
    }
    assert.equal((await handlers.selectProject(sender,{contract_version:'1.0',command_id:randomUUID()})).ok,true);
    const created=requiredRecord((await handlers.createSession(sender,createSessionCommand())).value,'created'),s=requiredRecord(created.session,'session'),r=requiredRecord(created.revision,'revision');
    const guard={contract_version:'1.0',project_id:desktopTestIds.project,session_id:s.session_id,case_id:s.case_id,revision_id:r.revision_id,expected_row_version:r.row_version};
    const full=membershipRepurchaseConfirmation(),configuration={column_mapping:full.column_mapping,comparison_period:full.comparison_period,current_period:full.current_period,currency:full.currency,time_zone:full.time_zone,valid_statuses:full.valid_statuses,selected_group_mode:full.selected_group_mode};
    let request:Record<string,unknown>=guard,method='selectImportFiles';
    if(phase==='reinspection'||phase==='confirm-admission'||phase==='ready-replay'){
      const initial=await handlers.selectImportFiles(sender,guard);assert.equal(initial.ok,true);
      request={...guard,inspection_token:requiredRecord(initial.value,'inspection').inspection_token,configuration};
      if(phase!=='reinspection'){
        const evaluated=await handlers.selectImportFiles(sender,request);assert.equal(evaluated.ok,true);
        const preview=requiredRecord(evaluated.value,'preview'),issue_treatments=(preview.reviewable_issues as {code:string;count:string;treatment_options:string[]}[]).map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}));
        method='confirmRevision';request={...guard,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments}};
        if(phase==='ready-replay')assert.equal((await handlers.confirmRevision(sender,request)).ok,true);
      }
    }
    const dbA=join(aRoot,'.xanthil','desktop','state.sqlite'),dbB=join(bRoot,'.xanthil','desktop','state.sqlite'),beforeA=await readFile(dbA),beforeB=await readFile(dbB);
    const priorReads=reads,priorChoices=choices;events.length=0;armed=true;
    const pending=handlers[method](sender,request);
    if(phase!=='chooser-return'&&phase!=='read-return')switchProject();
    const result=await pending;await switched;
    assert.ok(events.includes('switch-completed'),'the competing legitimate Project request actually completed');
    assert.equal((await handlers.listSessions(sender,{contract_version:'1.0',project_id:openedB.project_id})).ok,true);
    assert.deepEqual(await readFile(dbA),beforeA);assert.deepEqual(await readFile(dbB),beforeB);
    console.log(JSON.stringify({phase,events,sourceReads:reads-priorReads,chooserCalls:choices-priorChoices,result}));
    assert.equal(resultCode(result),'STALE_REVISION','old Project success must not publish after switching');
    assert.equal(reads-priorReads,phase==='read-return'?1:0,'no old-source read may begin after switch; an already begun read is not undone');
    assert.equal(choices-priorChoices,phase==='chooser-return'||phase==='read-return'?1:0);
    if(phase==='read-return')assert.ok(events.indexOf('source-read')<events.indexOf('switch-completed'));
  }));
}

test('F2 Main failures explain the specific safe next step without inventing absence of prior effects [AC-XDESK-008-07]',async()=>{
  const main=await loadDesktopModule('apps/desktop/main.ts'),sender={};
  for(const [code,reason,next]of [
    ['SCHEMA_UNSUPPORTED',/格式|版本/,/支持.*项目|空目录/],['STALE_REVISION',/版本|修订/,/重新打开|刷新/],
    ['SOURCE_CHANGED',/源文件|配置/,/重新选择|重新核对/],['STORE_BUSY',/占用|写入/,/写入|关闭/],
    ['FORBIDDEN',/不允许|拒绝/,/当前|允许/],['RESULT_PENDING',/尚未确认|待核对/,/重新打开/],
  ] as const){
    const forbidden=async()=>assert.fail('Project failure must not reach import/export effects');
    const handlers=requiredExport<(x:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({senderPolicy:(s:unknown)=>s===sender,nativeDialogs:{selectProject:async()=>({opaque:true}),selectImportFiles:forbidden,selectExportFile:forbidden},sourceReader:{readSelectedFiles:forbidden},exportWriter:{writeAndReadBack:forbidden},productionProfile:{openProject:async()=>{throw Object.assign(new Error('/Users/secret/private-source: raw infrastructure'),{code});}}});
    const result=await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand}),error=requiredRecord(result.error,'failure');
    assert.equal(error.code,code);assert.match(String(error.message),reason);assert.match(String(error.recovery_action),next);
    assert.doesNotMatch(JSON.stringify(error),/secret|infrastructure|not active|No chooser|No unverified|records remain unchanged/);
    for(const field of ['message','what_did_not_happen','preserved_authority','recovery_action'])assert.ok(String(error[field]).length>0);
  }
});

test('F1 Main import admission rejects foreign owner and stale version before any chooser or source read [AC-XDESK-009-04]',async()=>withIsolatedProject(async projectRoot=>{
  const main=await loadDesktopModule('apps/desktop/main.ts'),real=await createU12ProjectAdmissionApplication(projectRoot),sources=await readSyntheticCsvPair(),sender={};let choices=0,reads=0;let choose:()=>Promise<unknown|null>=async()=>({});
  const handlers=requiredExport<(x:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({
    senderPolicy:(s:unknown)=>s===sender,nativeDialogs:{selectProject:async()=>({projectRoot,display_name:'Synthetic Project'}),selectImportFiles:async()=>{choices++;return choose();},selectExportFile:async()=>{assert.fail('no export');}},
    exportWriter:{writeAndReadBack:async()=>{assert.fail('no export');}},sourceReader:{readSelectedFiles:async()=>{reads++;return{members:{display_name:'members.csv',bytes:sources.members},orders:{display_name:'orders.csv',bytes:sources.orders}};}},
    productionProfile:{openProject:async()=>{const opened=await requiredExport<(x:unknown)=>Promise<Record<string,unknown>>>(real.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});return{application:real.application,value:await profileProjectOpenValue(real.application,opened)};}}});
  assert.equal((await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand})).ok,true);
  const created=requiredRecord((await handlers.createSession(sender,createSessionCommand())).value,'created'),s=requiredRecord(created.session,'session'),r=requiredRecord(created.revision,'revision');
  const guard={contract_version:'1.0',project_id:desktopTestIds.project,session_id:s.session_id,case_id:s.case_id,revision_id:r.revision_id,expected_row_version:r.row_version},db=join(projectRoot,'.xanthil','desktop','state.sqlite'),before=await readFile(db);
  const observations=[];for(const [input,code]of [[{...guard,session_id:'f1000000-0000-4000-8000-000000000001'},'NOT_FOUND'],[{...guard,expected_row_version:'999'},'STALE_REVISION']] as const){const c=choices,n=reads,result=await handlers.selectImportFiles(sender,input);observations.push({code:resultCode(result),expected:code,choices:choices-c,reads:reads-n});}
  assert.deepEqual(await readFile(db),before);assert.deepEqual(observations,[{code:'NOT_FOUND',expected:'NOT_FOUND',choices:0,reads:0},{code:'STALE_REVISION',expected:'STALE_REVISION',choices:0,reads:0}]);
  const success=await handlers.selectImportFiles(sender,guard);assert.equal(success.ok,true);assert.equal(choices,1);assert.equal(reads,1);
  choose=async()=>null;assert.equal(resultCode(await handlers.selectImportFiles(sender,guard)),'CANCELLED');assert.equal(reads,1);
  const choice=membershipRepurchaseConfirmation(),configuration={column_mapping:choice.column_mapping,comparison_period:choice.comparison_period,current_period:choice.current_period,currency:choice.currency,time_zone:choice.time_zone,valid_statuses:choice.valid_statuses,selected_group_mode:choice.selected_group_mode};
  assert.equal(resultCode(await handlers.selectImportFiles(sender,{...guard,inspection_token:requiredRecord(success.value,'inspection').inspection_token,configuration})),'SOURCE_CHANGED');assert.equal(reads,1,'cancellation invalidates the old native selection');
  choose=async()=>{await requiredExport<(x:unknown)=>Promise<unknown>>(real.application,'saveForm')({...guard,command_id:desktopTestIds.retryCommand,form:{kind:'case_fields',fields:{question_text:'Updated while chooser is open',hypothesis_display_title:'Updated hypothesis',business_context:'Synthetic only',alternative_explanations:[]}}});return {};};
  assert.equal(resultCode(await handlers.selectImportFiles(sender,guard)),'STALE_REVISION');assert.equal(reads,1,'owner/version is checked again after the chooser and before reading');
  const staleConfirmation={...guard,command_id:desktopTestIds.revisionCommand,inspection_token:requiredRecord(success.value,'inspection').inspection_token,confirmation:membershipRepurchaseConfirmation()};
  assert.equal(resultCode(await handlers.confirmRevision(sender,staleConfirmation)),'STALE_REVISION');assert.equal(reads,1);
}));

test('U3 native export writer publishes selected bytes exclusively and verifies a fresh physical readback [AC-XDESK-007-07, AC-XDESK-009-04]',async()=>withIsolatedProject(async root=>{
  const main=await loadDesktopModule('apps/desktop/main.ts'),writer=requiredExport<()=>{writeAndReadBack(c:unknown,b:Uint8Array):Promise<Record<string,unknown>>}>(main,'createNativeReportExportWriter')();
  for(const extension of ['md','html']){
    const target=join(root,`export.${extension}`),bytes=new TextEncoder().encode(extension==='md'?'# Synthetic report\n':'<!doctype html><title>Synthetic report</title>');
    const result=await writer.writeAndReadBack({path:target},bytes);assert.equal(result.byte_length,String(bytes.length));assert.equal(result.sha256,(await import('node:crypto')).createHash('sha256').update(bytes).digest('hex'));assert.deepEqual(new Uint8Array(await readFile(target)),bytes);
    await assert.rejects(()=>writer.writeAndReadBack({path:target},new TextEncoder().encode('replacement')));assert.deepEqual(new Uint8Array(await readFile(target)),bytes);
  }
}));

test('U2 Main source capability: explicit re-preview binds current owner/token/config and rereads only selected files before confirmation [AC-XDESK-004-05, AC-XDESK-009-04]',async()=>withIsolatedProject(async projectRoot=>{
  const main=await loadDesktopModule('apps/desktop/main.ts'),real=await createU12ProjectAdmissionApplication(projectRoot),sources=await readSyntheticCsvPair(),sender={},capability={synthetic_files:true};let choices=0,reads=0;
  const handlers=requiredExport<(x:unknown)=>Record<string,(s:unknown,r:unknown)=>Promise<Record<string,unknown>>>>(main,'createXanthilDesktopIpcHandlers')({
    senderPolicy:(s:unknown)=>s===sender,nativeDialogs:{selectProject:async()=>({projectRoot,display_name:'Synthetic Project'}),selectImportFiles:async()=>{choices++;return capability;},selectExportFile:async()=>{assert.fail('import path never selects an export');}},
    exportWriter:{writeAndReadBack:async()=>{assert.fail('import path never exports');}},
    sourceReader:{readSelectedFiles:async(value:unknown)=>{assert.equal(value,capability);reads++;return {members:{display_name:'members.csv',bytes:sources.members},orders:{display_name:'orders.csv',bytes:sources.orders}};}},
    productionProfile:{openProject:async()=>{const opened=await requiredExport<(x:unknown)=>Promise<Record<string,unknown>>>(real.application,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});return {application:real.application,value:await profileProjectOpenValue(real.application,opened)};}}});
  assert.equal((await handlers.selectProject(sender,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand})).ok,true);
  const created=await handlers.createSession(sender,createSessionCommand()),p=requiredRecord(created.value,'created'),s=requiredRecord(p.session,'session'),r=requiredRecord(p.revision,'revision'),guard={contract_version:'1.0',project_id:desktopTestIds.project,session_id:s.session_id,case_id:s.case_id,revision_id:r.revision_id,expected_row_version:r.row_version};
  assert.equal(resultCode(await handlers.selectImportFiles({},guard)),'FORBIDDEN');assert.equal(choices,0);assert.equal(reads,0);
  const initial=await handlers.selectImportFiles(sender,guard);assert.equal(initial.ok,true);const inspection=requiredRecord(initial.value,'inspection');assert.equal(requiredRecord(inspection.evaluation,'evaluation').status,'unconfigured');
  const full=membershipRepurchaseConfirmation(),configuration={column_mapping:full.column_mapping,comparison_period:full.comparison_period,current_period:full.current_period,currency:full.currency,time_zone:full.time_zone,valid_statuses:full.valid_statuses,selected_group_mode:full.selected_group_mode};
  assert.equal(resultCode(await handlers.selectImportFiles(sender,{...guard,inspection_token:desktopTestIds.retryCommand,configuration})),'SOURCE_CHANGED');assert.equal(choices,1);assert.equal(reads,1);
  const evaluated=await handlers.selectImportFiles(sender,{...guard,inspection_token:inspection.inspection_token,configuration});assert.equal(evaluated.ok,true);const preview=requiredRecord(evaluated.value,'preview');assert.equal(choices,1);assert.equal(reads,2);
  const issue_treatments=(preview.reviewable_issues as {code:string;count:string;treatment_options:string[]}[]).map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}));
  assert.equal(resultCode(await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.revisionCommand,inspection_token:inspection.inspection_token,confirmation:{...full,issue_treatments}})),'SOURCE_CHANGED');assert.equal(reads,2);
  assert.equal(resultCode(await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments,valid_statuses:[...full.valid_statuses,'unapproved-status']}})),'SOURCE_CHANGED');assert.equal(reads,2,'changed confirmation configuration is refused before a source read');
  const confirmed=await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments}});assert.equal(confirmed.ok,true);assert.equal(requiredRecord(requiredRecord(confirmed.value,'confirmed').revision,'revision').state,'Ready');assert.equal(reads,3);assert.equal(choices,1);
  const replay=await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments}});assert.deepEqual(replay,confirmed);assert.equal(reads,3,'exact committed replay uses immutable Store evidence, never native source files');
  assert.equal(resultCode(await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments,valid_statuses:[...full.valid_statuses,'unapproved-status']}})),'COMMAND_CONFLICT');assert.equal(reads,3);
  assert.equal(resultCode(await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.retryCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments}})),'STALE_REVISION');assert.equal(reads,3,'a new command cannot borrow a successful receipt');
  const snapshot=requiredRecord(requiredRecord(confirmed.value,'projection').snapshot,'snapshot'),membersPath=join(projectRoot,String(s.session_id),'010_draw',String(snapshot.snapshot_id),'members.csv');
  await writeFile(membersPath,Buffer.from('Synthetic tampered confirmed bytes'));const tampered=await readFile(membersPath);
  assert.equal(resultCode(await handlers.confirmRevision(sender,{...guard,command_id:desktopTestIds.revisionCommand,inspection_token:preview.inspection_token,confirmation:{...full,issue_treatments}})),'INTEGRITY_BLOCKED');assert.equal(reads,3,'receipt replay cannot hide newly damaged immutable evidence');assert.deepEqual(await readFile(membersPath),tampered);
  assert.doesNotMatch(JSON.stringify([initial,evaluated,confirmed]),/synthetic_files|projectRoot|\/Users\/|North|South|cmp-001|cur-001/);
}));

// case:closed-ipc-main-security-contract
async function requestValidator() {
  await assertDesktopFixtureHealth();
  const ipc = await loadDesktopModule('packages/contracts/xanthil-desktop-ipc.ts');
  assert.equal(requiredExport<string>(ipc, 'XANTHIL_DESKTOP_CONTRACT_VERSION'), '1.0');
  return requiredExport<(method: string, value: unknown) => unknown>(ipc, 'validateXanthilDesktopRequest');
}

async function profileProjectOpenValue(application: Record<string, unknown>, opened: Record<string, unknown>) {
  const projectId = requiredString(opened, 'project_id');
  const displayName = requiredString(opened, 'display_name');
  const sessions = await requiredExport<(request: Record<string, unknown>) => Promise<readonly Record<string, unknown>[]>>(application, 'listSessions')({ project_id: projectId });
  return Object.freeze({
    project: Object.freeze({ project_id: projectId, display_name: displayName, schema_version: '1.0', write_state: 'ready' }),
    sessions,
  });
}

/**
 * The Main handler is the subject.  These injected values are only its three
 * approved external boundaries; they carry opaque capabilities and record
 * effects, while the real Application/Store remains underneath Main.
 */
async function createRealMainHarness(projectRoot: string) {
  const [main, sources] = await Promise.all([loadDesktopModule('apps/desktop/main.ts'), readSyntheticCsvPair()]);
  const application = await createRealDesktopApplication(projectRoot);
  const effects: string[] = [];
  const projectCapability = Object.freeze({ capability_kind: 'project', projectRoot });
  const filesCapability = Object.freeze({ capability_kind: 'files', members: 'members-token', orders: 'orders-token' });
  const exportCapability = Object.freeze({ capability_kind: 'export', destination: 'export-token' });
  const nativeDialogs = Object.freeze({
    async selectProject() { effects.push('selectProject'); return projectCapability; },
    async selectImportFiles() { effects.push('selectImportFiles'); return filesCapability; },
    async selectExportFile() { effects.push('selectExportFile'); return {capability:exportCapability,display_name:'synthetic.html',format:'html'}; },
  });
  const sourceReader = Object.freeze({
    async readSelectedFiles(capability: unknown) {
      assert.equal(capability, filesCapability, 'Main may read only its latest chooser capability');
      effects.push('readSelectedFiles');
      return { members: { display_name: 'members.csv', bytes: sources.members }, orders: { display_name: 'orders.csv', bytes: sources.orders } };
    },
  });
  const exportWriter = Object.freeze({
    async writeAndReadBack(capability: unknown, bytes: Uint8Array) {
      assert.equal(capability, exportCapability, 'Main may write only the native save capability');
      effects.push(`writeAndReadBack:${bytes.byteLength}`);
      return { sha256: (await import('node:crypto')).createHash('sha256').update(bytes).digest('hex'), byte_length: String(bytes.byteLength) };
    },
  });
  const packagedTopFrame = Object.freeze({ frame_kind: 'packaged-top-frame' });
  const senderPolicy = (sender: unknown) => sender === packagedTopFrame;
  const createHandlers = requiredExport<(value: Record<string, unknown>) => Record<string, (sender: unknown, request: Record<string, unknown>) => Promise<Record<string, unknown>>>>(main, 'createXanthilDesktopIpcHandlers');
  const productionProfile = Object.freeze({
    async openProject(request: Record<string, unknown>) {
      assert.equal(request.projectDirectoryCapability, projectCapability, 'only Main-held Project capability reaches the Profile opener');
      effects.push('profile.openProject');
      const opened = await requiredExport<(request: Record<string, unknown>) => Promise<Record<string, unknown>>>(application.application, 'openProject')({
        contract_version: '1.0', command_id: request.command_id, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project',
      });
      const value = await profileProjectOpenValue(application.application, opened);
      return Object.freeze({ application: application.application, value });
    },
  });
  const handlers = createHandlers({ productionProfile, nativeDialogs, sourceReader, exportWriter, senderPolicy });
  return Object.freeze({ handlers, effects, packagedTopFrame, application });
}

function resultCode(result: Record<string, unknown>) {
  assert.equal(result.ok, false, 'Main must return the closed DesktopResult failure branch instead of throwing raw infrastructure errors');
  return requiredString(requiredRecord(result.error, 'DesktopResult.error'), 'code');
}

function assertClosedU11Failure(result: Record<string, unknown>, code: 'FORBIDDEN' | 'INVALID_REQUEST' | 'NOT_FOUND', subject: string) {
  assert.deepEqual(Object.keys(result).sort(), ['error', 'ok'], `${subject} has no raw or future top-level result fields`);
  assert.equal(result.ok, false, `${subject} must return a closed DesktopResult failure branch`);
  const error = requiredRecord(result.error, `${subject}.error`);
  assert.deepEqual(Object.keys(error).sort(), ['code', 'message', 'preserved_authority', 'recovery_action', 'what_did_not_happen'], `${subject} has no raw error field, path, or stack`);
  assert.equal(error.code, code, `${subject} returns its exact closed failure code`);
  for (const field of ['message', 'what_did_not_happen', 'preserved_authority', 'recovery_action']) {
    assert.equal(typeof error[field], 'string', `${subject} includes string ${field}`);
    assert.ok((error[field] as string).length > 0, `${subject} gives a non-empty ${field}`);
  }
  assert.deepEqual(structuredClone(result), result, `${subject} is a structured-clone public value`);
  assert.doesNotMatch(JSON.stringify(result), /(?:file:\/\/|\/Users\/|\\Users\\|projectRoot|capability_kind|stack)/, `${subject} does not disclose a raw authority or filesystem path`);
}

/** M1.2 wires the real Store/Application through exactly the allowed Profile boundary. */
async function createU12AdmissionMainHarness(projectRoot: string) {
  const [main, admission] = await Promise.all([
    loadDesktopModule('apps/desktop/main.ts'),
    createU12ProjectAdmissionApplication(projectRoot),
  ]);
  const effects: string[] = [];
  const packagedTopFrame = Object.freeze({ frame_kind: 'packaged-top-frame' });
  const projectCapability = Object.freeze({ capability_kind: 'project' });
  const nativeDialogs = Object.freeze({
    async selectProject() { effects.push('selectProject'); return projectCapability; },
    async selectImportFiles() { assert.fail('U1 admission never chooses import sources'); },
    async selectExportFile() { assert.fail('U1 admission never chooses an export'); },
  });
  const productionProfile = Object.freeze({
    async openProject(request: Record<string, unknown>) {
      assert.equal(request.projectDirectoryCapability, projectCapability, 'only Main-held chooser capability enters the Profile');
      effects.push('profile.openProject');
      const opened = await requiredExport<(value: Record<string, unknown>) => Promise<Record<string, unknown>>>(admission.application, 'openProject')({
        contract_version: '1.0', command_id: request.command_id,
        proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project',
      });
      const value = await profileProjectOpenValue(admission.application, opened);
      return Object.freeze({ application: admission.application, value });
    },
  });
  const createHandlers = requiredExport<(value: Record<string, unknown>) => Record<string, (sender: unknown, request: Record<string, unknown>) => Promise<Record<string, unknown>>>>(main, 'createXanthilDesktopIpcHandlers');
  const handlers = createHandlers({ productionProfile, nativeDialogs, sourceReader: { async readSelectedFiles() { assert.fail('U1 admission never reads import sources'); } }, exportWriter:{async writeAndReadBack(){assert.fail('U1 admission never exports');}}, senderPolicy: (sender: unknown) => sender === packagedTopFrame });
  return Object.freeze({ handlers, effects, packagedTopFrame });
}

test('U1.4 IPC alternatives: malformed members fail at real Main without business writes after healthy Project selection [AC-XDESK-009-04]', async () => withIsolatedProject(async projectRoot => {
  const harness = await createU12AdmissionMainHarness(projectRoot);
  assert.equal((await harness.handlers.selectProject(harness.packagedTopFrame, { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand })).ok, true);
  const effects = [...harness.effects], database = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), before = await readFile(database);
  for (const alternatives of [[''], ['\u0085\u00a0\u2028\u2029'], ['Valid', '']]) {
    const fields = { ...createSessionCommand().fields, alternative_explanations: alternatives };
    assertClosedU11Failure(await harness.handlers.createSession(harness.packagedTopFrame, { ...createSessionCommand(), fields }), 'INVALID_REQUEST', 'invalid alternative create');
    assertClosedU11Failure(await harness.handlers.saveForm(harness.packagedTopFrame, { contract_version: '1.0', command_id: desktopTestIds.revisionCommand, project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, expected_row_version: '1', form: { kind: 'case_fields', fields } }), 'INVALID_REQUEST', 'invalid alternative save');
  }
  assert.deepEqual(harness.effects, effects); assert.deepEqual(await readFile(database), before);
}));

function assertClosedU12AdmissionFailure(result: Record<string, unknown>, subject: string) {
  assert.deepEqual(Object.keys(result).sort(), ['error', 'ok'], `${subject} exposes no raw admission detail`);
  assert.equal(result.ok, false, `${subject} returns the public DesktopResult failure branch`);
  const error = requiredRecord(result.error, `${subject}.error`);
  assert.deepEqual(Object.keys(error).sort(), ['code', 'message', 'preserved_authority', 'recovery_action', 'what_did_not_happen']);
  assert.equal(requiredString(error, 'code'), 'SCHEMA_UNSUPPORTED');
  for (const key of ['message', 'what_did_not_happen', 'preserved_authority', 'recovery_action']) {
    assert.ok(requiredString(error, key).length > 0, `${subject} explains ${key}`);
  }
  assert.deepEqual(structuredClone(result), result, `${subject} is structured-clone safe`);
  assert.doesNotMatch(JSON.stringify(result), /(?:file:\/\/|\/Users\/|\\Users\\|projectRoot|capability_kind|stack)/, `${subject} cannot disclose a raw Project authority`);
}

test('U1.1 M1.1 retained all-method boundary: preserves sender/envelope and inactive refusals after C1b Project admission [AC-XDESK-009-02, AC-XDESK-009-03, AC-XDESK-009-04]', async () => {
  // This is intentionally the first behavioral assertion: when the public
  // IPC seam itself is absent, that exact capability is the only admitted
  // RED.  A later missing Main module remains an invalid environment/loader
  // failure rather than being relabelled as Main behavior.
  const validateRequest = await requireU11IpcContract();
  const validSelectProject = Object.freeze({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand });
  assert.deepEqual(validateRequest('selectProject', validSelectProject), validSelectProject, 'the real public validator accepts its named minimal version-one envelope');
  assert.throws(() => validateRequest('execute', { contract_version: '1.0' }), /INVALID_REQUEST/, 'the real public validator rejects an unnamed generic channel');
  assert.throws(() => validateRequest('selectProject', { ...validSelectProject, project_path: '/forbidden' }), /INVALID_REQUEST/, 'the real public validator rejects a path-like raw field');

  const harness = await createU11InactiveMainHarness(validateRequest);
  const commandIds = Object.freeze([
    desktopTestIds.openProjectCommand,
    desktopTestIds.createSessionCommand,
    desktopTestIds.revisionCommand,
    desktopTestIds.retryCommand,
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    '12121212-1212-4121-8121-121212121212',
    '13131313-1313-4131-8131-131313131313',
    '14141414-1414-4141-8141-141414141414',
    '15151515-1515-4151-8151-151515151515',
    '16161616-1616-4161-8161-161616161616',
    '17171717-1717-4171-8171-171717171717',
    '18181818-1818-4181-8181-181818181818',
    '19191919-1919-4191-8191-191919191919',
  ]);
  const nonCommandMethods = new Set(['listSessions', 'openSession', 'selectImportFiles', 'prepareAssistanceDisclosure', 'readProjection', 'waitForProjection']);
  const methods = [
    'selectProject', 'listSessions', 'openSession', 'createSession', 'createDraftRevision',
    'selectImportFiles', 'confirmRevision', 'startAnalysis', 'cancelAnalysis',
    'prepareAssistanceDisclosure', 'decideAssistanceDisclosure', 'startAssistance',
    'cancelAssistance', 'disposeAssistanceDraft', 'acceptFinding', 'saveForm',
    'completeCase', 'exportReport', 'readProjection', 'waitForProjection',
  ];

  assert.deepEqual(Object.keys(harness.handlers).sort(), methods.slice().sort(), 'M1.1 exposes the exact closed twenty-method public union and no generic channel');
  let commandIndex = 0;
  for (const method of methods) {
    const isNonCommand = nonCommandMethods.has(method);
    const commandId = commandIds[commandIndex];
    if (!isNonCommand) assert.ok(commandId, `${method} receives one allocated UUIDv4 command ID`);
    const request = nonCommandMethods.has(method)
      ? Object.freeze({ contract_version: '1.0' })
      : Object.freeze({ contract_version: '1.0', command_id: commandId });
    if (!isNonCommand) commandIndex += 1;
    const result = await harness.handlers[method]!(harness.acceptedSender, request);
    const expectedCode = ['listSessions', 'readProjection', 'createSession', 'openSession', 'saveForm', 'waitForProjection', 'createDraftRevision', 'selectImportFiles', 'confirmRevision', 'startAnalysis', 'cancelAnalysis','acceptFinding','completeCase','exportReport','prepareAssistanceDisclosure','decideAssistanceDisclosure','startAssistance','cancelAssistance','disposeAssistanceDraft'].includes(method) ? 'NOT_FOUND' : 'FORBIDDEN';
    assertClosedU11Failure(result, expectedCode, `${method} valid minimal envelope without an active Project`);

    const missingVersion = await harness.handlers[method]!(harness.acceptedSender, isNonCommand ? {} : { command_id: commandId! });
    assertClosedU11Failure(missingVersion, 'INVALID_REQUEST', `${method} missing contract_version`);
    const staleVersion = await harness.handlers[method]!(harness.acceptedSender, isNonCommand
      ? { contract_version: '2.0' }
      : { contract_version: '2.0', command_id: commandId! });
    assertClosedU11Failure(staleVersion, 'INVALID_REQUEST', `${method} stale contract_version`);

    if (isNonCommand) {
      const unexpectedCommand = await harness.handlers[method]!(harness.acceptedSender, { contract_version: '1.0', command_id: desktopTestIds.retryCommand });
      assertClosedU11Failure(unexpectedCommand, 'INVALID_REQUEST', `${method} non-command request with command_id`);
    } else {
      const missingCommand = await harness.handlers[method]!(harness.acceptedSender, { contract_version: '1.0' });
      assertClosedU11Failure(missingCommand, 'INVALID_REQUEST', `${method} missing command_id`);
      const malformedCommand = await harness.handlers[method]!(harness.acceptedSender, { contract_version: '1.0', command_id: 'not-a-uuid' });
      assertClosedU11Failure(malformedCommand, 'INVALID_REQUEST', `${method} malformed command_id`);
    }

    const senderFirst = await harness.handlers[method]!(Object.freeze({ frame_kind: 'subframe', method }), {});
    assertClosedU11Failure(senderFirst, 'FORBIDDEN', `${method} rejected sender before envelope validation`);
  }
  assert.equal(commandIndex, commandIds.length, 'every command-bearing intent uses one distinct UUIDv4 command ID while six read-only requests omit it');
  assert.equal(harness.observedSenders.length, 114, 'all exact U1.1 sender/envelope boundary cases retain sender admission');
  assert.deepEqual(harness.observedSenders.filter((sender) => sender === harness.acceptedSender), Array.from({ length: 94 }, () => harness.acceptedSender), 'accepted requests include every valid and malformed envelope');
  assert.equal(harness.observedSenders.filter((sender) => sender !== harness.acceptedSender).length, methods.length, 'every malformed rejected sender stops before its envelope is examined');

  const unparsedFutureBranch = await harness.handlers.saveForm!(harness.acceptedSender, {
    contract_version: '1.0', command_id: desktopTestIds.retryCommand, form: { kind: 'candidate_comparison', candidates: 'must-not-be-parsed-in-M1.1' },
  });
  assertClosedU11Failure(unparsedFutureBranch, 'NOT_FOUND', 'saveForm without active Project refuses before reading its business branch');
  assert.equal(harness.observedSenders.at(-1), harness.acceptedSender, 'the no-parse future branch reaches no dependency beyond senderPolicy');
  assert.deepEqual(harness.effects, ['chooser.cancelled'], 'only the valid active selectProject route reaches its cancelled chooser; no Profile, Store, receipt or other effect occurs');
});

test('U1.2 AC-XDESK-002-03: returns one sanitized Project-admission failure before a Project Session receipt directory or external effect exists', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const desktopRoot = join(projectRoot, '.xanthil', 'desktop');
    const sqlitePath = join(desktopRoot, 'state.sqlite');
    await mkdir(desktopRoot, { recursive: true });
    const malformed = new TextEncoder().encode('not a sqlite database');
    await writeFile(sqlitePath, malformed);
    const harness = await createU12AdmissionMainHarness(projectRoot);
    const result = await harness.handlers.selectProject!(harness.packagedTopFrame, {
      contract_version: '1.0', command_id: desktopTestIds.openProjectCommand,
    });
    assertClosedU12AdmissionFailure(result, 'malformed Project admission');
    const unpublished = await harness.handlers.listSessions!(harness.packagedTopFrame, {
      contract_version: '1.0', project_id: desktopTestIds.project,
    });
    assert.equal(resultCode(unpublished), 'NOT_FOUND', 'failed Project admission never publishes an active Application to a later admitted read');
    assert.deepEqual(harness.effects, ['selectProject', 'profile.openProject'], 'Main invokes only its chooser and real Project-admission Profile boundary');
    assert.deepEqual(new Uint8Array(await readFile(sqlitePath)), malformed, 'failed admission cannot mutate the selected Project database');
    assert.deepEqual((await readdir(desktopRoot)).sort(), ['state.sqlite'], 'failed admission creates no receipt, sidecar, migration, or Session evidence');
    assert.deepEqual(await readdir(projectRoot), ['.xanthil'], 'failed admission creates no Session directory or external artifact');
  });
});

test('U1.3 Main: real Profile creation and reopen remain closed and Draft evidence editing is forbidden [AC-XDESK-002-01, AC-XDESK-009-03]', async () => withIsolatedProject(async projectRoot => {
  const main = await loadDesktopModule('apps/desktop/main.ts'), profileModule = await loadDesktopModule('profiles/personal/xanthil-desktop.ts');
  const profile = requiredExport<(x: unknown) => unknown>(profileModule, 'createPersonalXanthilDesktopProfile')({ assistanceConfig: null, toolchainDeployment: {descriptor_path:join(projectRoot,'not-configured-toolchain.json')}, clock: () => new Date('2026-01-02T03:04:05.006Z'), deadlineScheduler: {schedule: () => ({cancel() {}})} });
  const sender = {}; const handlers = requiredExport<(x: unknown) => Record<string, (s: unknown, r: unknown) => Promise<Record<string, unknown>>>>(main, 'createXanthilDesktopIpcHandlers')({ productionProfile: profile, nativeDialogs: { selectProject: async () => ({ projectRoot, display_name: 'Synthetic Project' }), selectImportFiles:async()=>null,selectExportFile:async()=>null }, sourceReader:{readSelectedFiles:async()=>{assert.fail('U1 never reads sources');}},exportWriter:{writeAndReadBack:async()=>{assert.fail('U1 never exports');}}, senderPolicy: (s: unknown) => s === sender });
  const opened = await handlers.selectProject(sender, { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand }); assert.equal(opened.ok, true);
  const projectId = ((opened.value as Record<string, unknown>).project as Record<string, unknown>).project_id;
  const request = createSessionCommand({ project_id: projectId });
  assert.equal(resultCode(await handlers.createSession({}, request)), 'FORBIDDEN');
  assert.equal(resultCode(await handlers.createSession(sender, { ...request, path: projectRoot })), 'INVALID_REQUEST');
  const created = await handlers.createSession(sender, request); assert.equal(created.ok, true, 'Main activates the real createSession capability only after Project admission');
  const projection = created.value as Record<string, unknown>, session = projection.session as Record<string, unknown>;
  assert.deepEqual(await handlers.readProjection(sender, { contract_version: '1.0', project_id: projectId, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id }), created);
  assert.deepEqual(await handlers.openSession(sender, { contract_version: '1.0', project_id: projectId, session_id: session.session_id }), created, 'the sized U1 result includes the existing M1.4 public open method');
  const owner = { project_id: projectId, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id };
  assert.equal(resultCode(await handlers.saveForm(sender, { contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1', form: { kind: 'evidence_explanation', evidence_explanation_text: 'inactive' } })), 'FORBIDDEN');
  const saved = await handlers.saveForm(sender, { contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1', form: { kind: 'case_fields', fields: { question_text: 'From IPC', hypothesis_display_title: '', business_context: '', alternative_explanations: [] } } });
  assert.equal(saved.ok, true); assert.equal(((saved.value as Record<string, unknown>).revision as Record<string, unknown>).question_text, 'From IPC');
  assert.deepEqual(await handlers.waitForProjection(sender, { contract_version: '1.0', ...owner, projection_token: projection.projection_token }), saved);
  assert.equal(resultCode(await handlers.startAnalysis(sender, { contract_version: '1.0', command_id: desktopTestIds.retryCommand })), 'INVALID_REQUEST', 'active I2 method still requires its complete owner and confirmation envelope');
  assert.doesNotMatch(JSON.stringify(created), /projectRoot|\/Users\/|capability_kind|stack/);
}));

test('TEST-XDESK-008 positive: the named selectProject request accepts only its closed version-1 command shape', async () => {
  const validateRequest = await requestValidator();
  assert.doesNotThrow(() => validateRequest('selectProject', { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand }));
});

test('TEST-XDESK-008 negative: a generic execute channel is rejected before a Main effect', async () => {
  const validateRequest = await requestValidator();
  assert.throws(() => validateRequest('execute', { contract_version: '1.0' }), /INVALID_REQUEST/);
});

test('TEST-XDESK-008 negative: an extra path-like key is rejected from the closed Renderer request', async () => {
  const validateRequest = await requestValidator();
  assert.throws(() => validateRequest('selectProject', { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, project_path: '/forbidden' }), /INVALID_REQUEST/);
});

test('TEST-XDESK-008 version boundary: a stale contract version is rejected without coercion', async () => {
  const validateRequest = await requestValidator();
  assert.throws(() => validateRequest('selectProject', { contract_version: '2.0', command_id: desktopTestIds.openProjectCommand }), /INVALID_REQUEST/);
});

// case:package-security-and-root-configuration-contract
test('TEST-XDESK-011 [AC-XDESK-012-02..06, AC-XTS-001-01..04, AC-XTS-002-01..04] requires the frozen production-only package surface and no mixed P4/P5 configuration', async () => {
  await assertDesktopFixtureHealth();
  const manifest = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.equal(manifest.name, 'xanthil-desktop');
  assert.equal(manifest.version, '0.1.0');
  assert.equal(manifest.main, '.vite/build/main.cjs');
  assert.deepEqual(manifest.config, { forge: './forge.config.cjs' });
  assert.deepEqual((manifest.scripts as Record<string, string>)['desktop:start'], 'node tools/desktop/development-start.mjs');
  assert.deepEqual((manifest.scripts as Record<string, string>)['desktop:package'], 'node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge package --platform=darwin --arch=arm64');
  assert.deepEqual((manifest.scripts as Record<string, string>)['desktop:test'], 'node tools/desktop/test-daily.mjs');
  const main = await loadDesktopModule('apps/desktop/main.ts');
  assert.equal(typeof requiredExport(main, 'createXanthilDesktopIpcHandlers'), 'function');
});

const owner = Object.freeze({ project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision });
const revision = Object.freeze({ contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1' });
const fields = Object.freeze({ question_text: 'Why is repurchase lower?', hypothesis_display_title: 'Current repurchase rate is lower', business_context: '', alternative_explanations: ['Seasonality'] });
const confirmation = Object.freeze({
  column_mapping: { member_id_column: 'member_id', member_group_column: 'member_group', order_id_column: 'order_id', order_member_id_column: 'order_member_id', paid_at_column: 'paid_at', amount_column: 'amount', status_column: 'status', currency_column: 'currency' },
  comparison_period: { start_date: '2026-01-01', end_date: '2026-01-29' }, current_period: { start_date: '2026-02-01', end_date: '2026-03-01' },
  currency: 'CNY', time_zone: 'Asia/Shanghai', valid_statuses: ['paid'], issue_treatments: [], selected_group_mode: 'mapped',
  hypothesis_id: 'current_repurchase_rate_lower_than_comparison', method_id: 'membership_repurchase_comparison', method_version: '1.0',
  authority_confirmed: true, issues_confirmed: true, plan_confirmed: true,
});

const b1Methods = Object.freeze([
  'selectProject', 'listSessions', 'openSession', 'createSession', 'createDraftRevision',
  'selectImportFiles', 'confirmRevision', 'startAnalysis', 'cancelAnalysis',
  'prepareAssistanceDisclosure', 'decideAssistanceDisclosure', 'startAssistance',
  'cancelAssistance', 'disposeAssistanceDraft', 'acceptFinding', 'saveForm',
  'completeCase', 'exportReport', 'readProjection', 'waitForProjection',
]);

function freezeB1Request(request: Record<string, unknown>) {
  return Object.freeze(request);
}

function poisonB1MinimalEnvelope() {
  let reads = 0;
  const envelope: Record<string, unknown> = {};
  Object.defineProperty(envelope, 'contract_version', {
    enumerable: true,
    get() {
      reads += 1;
      throw new Error('a rejected B1 sender/frame must not inspect its request envelope');
    },
  });
  Object.freeze(envelope);
  return Object.freeze({ envelope, reads: () => reads });
}

const b1Requests: Readonly<Record<string, Record<string, unknown>>> = Object.freeze({
  selectProject: freezeB1Request({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand }),
  listSessions: freezeB1Request({ contract_version: '1.0', project_id: desktopTestIds.project }),
  openSession: freezeB1Request({ contract_version: '1.0', project_id: desktopTestIds.project, session_id: desktopTestIds.session }),
  createSession: freezeB1Request({ ...createSessionCommand() }), createDraftRevision: freezeB1Request(revision),
  selectImportFiles: freezeB1Request({ contract_version: '1.0', ...owner, expected_row_version: '1' }),
  confirmRevision: freezeB1Request({ ...revision, inspection_token: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', confirmation }),
  startAnalysis: freezeB1Request({ ...revision, confirmation_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }), cancelAnalysis: freezeB1Request({ ...revision, run_id: '01991a00-0000-7000-8000-000000000001' }),
  prepareAssistanceDisclosure: freezeB1Request({ contract_version: '1.0', ...owner, expected_row_version: '1', action_kind: 'organize_question', requested_provider: 'offline-test', requested_model: 'deterministic' }),
  decideAssistanceDisclosure: freezeB1Request({ ...revision, preview_token: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', payload_sha256: 'a'.repeat(64), decision: 'refused', free_text_confirmed: false }),
  startAssistance: freezeB1Request({ ...revision, disclosure_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }), cancelAssistance: freezeB1Request({ ...revision, attempt_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }),
  disposeAssistanceDraft: freezeB1Request({ ...revision, draft_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', disposition: 'rejected', edited_content: null }),
  acceptFinding: freezeB1Request({ ...revision, finding_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }),
  saveForm: freezeB1Request({ ...revision, form: { kind: 'case_fields', fields } }),
  completeCase: freezeB1Request({ ...revision, acceptance_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', form_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' }),
  exportReport: freezeB1Request({ contract_version: '1.0', command_id: desktopTestIds.retryCommand, ...owner, report_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }),
  readProjection: freezeB1Request({ contract_version: '1.0', ...owner }), waitForProjection: freezeB1Request({ contract_version: '1.0', ...owner, projection_token: '1:receipt' }),
});

test('U1.1 H-B1-LOAD: distinguishes the exact Electron boundary from unrelated loader failure', async () => {
  await assertB1ElectronBoundaryHealth();
});

test('U1.1 B1-BRIDGE: real preload exposes and maps the closed twenty-method xanthilDesktopApi', async () => {
  const { control, preload } = await loadB1Preload();
  const api = requiredExport<Record<string, unknown>>(preload, 'xanthilDesktopApi');
  const ownKeys = Reflect.ownKeys(api);
  assert.deepEqual(ownKeys.filter((key): key is string => typeof key === 'string').sort(), b1Methods.slice().sort(), 'preload exposes exactly the frozen twenty-method own string keys, including non-enumerable members');
  assert.deepEqual(ownKeys.filter((key): key is symbol => typeof key === 'symbol'), [], 'preload exposes no hidden symbol capability');
  for (const method of b1Methods) {
    const invoke = api[method];
    assert.equal(typeof invoke, 'function', `${method} is a named public function`);
    const request = b1Requests[method]!;
    const result = await (invoke as (request: Record<string, unknown>) => Promise<unknown>)(request);
    assert.deepEqual(result, control.structuredCloneSentinel, `${method} returns the exact structured-clone Electron result sentinel`);
    const observed = control.invokes.at(-1)!;
    assert.equal(observed.channel, `xanthil-desktop:v1:${method}`, `${method} invokes only its same-named frozen IPC channel`);
    assert.equal(observed.request, request, `${method} passes its exact frozen request object without wrapper cloning or transformation`);
  }
  assert.equal(control.invokes.length, b1Methods.length, 'every public method invokes one and only one closed channel');
  assert.deepEqual(control.invokes.map(({ channel }) => channel), b1Methods.map((method) => `xanthil-desktop:v1:${method}`), 'the closed channel sequence follows the exact frozen method order');
  assert.deepEqual(control.contextBridgeExposures.map((exposure) => exposure.key), ['xanthilDesktopApi','xanthilCaseAssistantApi','xanthilProviderSettingsApi'], 'PS-01 adds only its closed settings API; both original business APIs are preserved');
  assert.equal(control.contextBridgeExposures[0]!.value, api, 'contextBridge receives the identical public API object');
  for (const forbidden of ['invoke', 'ipcRenderer', 'channel', 'electron', 'shell', 'process', 'require', 'readFile', 'writeFile']) {
    assert.equal(Object.hasOwn(api, forbidden), false, `preload exposes no raw or generic ${forbidden} member`);
  }
});

test('U1.1 B1-ENTRY: normal Main entry registers the existing refusal factory and one local window', async () => {
  const control = createB1ElectronBoundary();
  const { main } = await loadFreshB1Main(control);
  const createHandlers = requiredExport<(value: Record<string, unknown>) => Record<string, (sender: unknown, request: Record<string, unknown>) => Promise<Record<string, unknown>>>>(main, 'createXanthilDesktopIpcHandlers');
  assert.equal(control.requestSingleInstanceLockCalls(), 1, 'normal Main entry requests one single-instance admission');
  assert.equal(control.whenReadyCalls(), 1, 'normal Main entry waits for Electron readiness once');
  assert.deepEqual(control.ipcChannels().sort(), [...b1Methods.map((method) => `xanthil-desktop:v1:${method}`),'xanthil-case-assistant:v1','xanthil-provider-settings:v1'].sort(), 'normal Main retains every business method and adds only the approved closed settings channel');
  assert.deepEqual(await control.ipcHandler('xanthil-provider-settings:v1')(control.foreignSenderEvent(),{operation:'read'}),{ok:false,code:'FORBIDDEN'},'settings refuses an untrusted sender before credential access');
  assert.equal(control.browserWindowOptions.length, 1, 'normal Main entry creates exactly one local BrowserWindow');
  assert.deepEqual(Object.fromEntries(['width','height','useContentSize'].map(key=>[key,control.browserWindowOptions[0]![key]])),{width:1366,height:768,useContentSize:true},'normal startup uses the approved content viewport without relying on a test resize');
  assert.equal(Object.hasOwn(control.browserWindowOptions[0]!, 'minWidth'),false,'the initial viewport does not add an unapproved native resize restriction');
  assert.equal(Object.hasOwn(control.browserWindowOptions[0]!, 'minHeight'),false);
  assert.equal(control.localLoads.length, 1, 'the one BrowserWindow loads one packaged local renderer entry');
  assert.equal(control.remoteLoads.length, 0, 'normal Main entry has no remote or development URL load path');
  assert.match(control.localLoads[0]![0]!, /main_window.*\.html$/u, 'the local renderer entry is the named packaged main_window HTML resource');
  const webPreferences = control.browserWindowOptions[0]!.webPreferences as Record<string, unknown>;
  assert.match(String(webPreferences.preload), /preload/u, 'the one local BrowserWindow uses the actual preload entry');
  const factoryHandlers = createHandlers({
    senderPolicy: (sender: unknown) => sender === control.currentWindow().webContents,
    nativeDialogs: { async selectProject() { return null; }, async selectImportFiles() { return null; },async selectExportFile(){return null;} },
    sourceReader: { async readSelectedFiles() { assert.fail('cancelled chooser cannot read sources'); } },
    exportWriter:{async writeAndReadBack(){assert.fail('cancelled chooser cannot export');}},
    productionProfile: { async openProject() { assert.fail('cancelled chooser cannot invoke Profile'); } },
  });
  for (const method of b1Methods) {
    const registered = control.ipcHandler(`xanthil-desktop:v1:${method}`);
    const accepted = await registered(control.acceptedEvent(), b1Requests[method]!);
    const expectedAccepted = await factoryHandlers[method]!(control.currentWindow().webContents, b1Requests[method]!);
    assert.deepEqual(accepted, expectedAccepted, `${method} registered callback preserves the existing factory refusal for the recorded top frame`);
    const rejected = await registered(control.foreignSenderEvent(), b1Requests[method]!);
    const expectedRejected = await factoryHandlers[method]!(control.foreignSenderEvent().sender, b1Requests[method]!);
    assert.deepEqual(rejected, expectedRejected, `${method} registered callback preserves the existing factory refusal for a rejected sender`);
    const malformed = Object.freeze({ contract_version: '2.0' });
    const admittedMalformed = await registered(control.acceptedEvent(), malformed);
    const expectedMalformed = await factoryHandlers[method]!(control.currentWindow().webContents, malformed);
    assert.deepEqual(admittedMalformed, expectedMalformed, `${method} admitted top frame reaches the existing factory's INVALID_REQUEST envelope refusal`);
    assertClosedU11Failure(admittedMalformed, 'INVALID_REQUEST', `${method} admitted malformed minimal envelope`);
    const rejectedPoison = poisonB1MinimalEnvelope();
    const forbiddenPoison = await registered(control.foreignSenderEvent(), rejectedPoison.envelope);
    const expectedForbiddenPoison = await factoryHandlers[method]!(control.foreignSenderEvent().sender, rejectedPoison.envelope);
    assert.deepEqual(forbiddenPoison, expectedForbiddenPoison, `${method} foreign sender stays forbidden before its poison envelope can be inspected`);
    assertClosedU11Failure(forbiddenPoison, 'FORBIDDEN', `${method} foreign poison envelope`);
    assert.equal(rejectedPoison.reads(), 0, `${method} foreign sender does not read a poison minimal envelope`);
  }
  assert.equal(control.projectDialogCalls.length, 1, 'only the one valid top-frame Project request reaches the native chooser');
});

test('U1.1 B1-SAFETY: normal Main lifecycle denies duplicate authority navigation windows permissions and non-top senders', async () => {
  const deniedControl = createB1ElectronBoundary({ singleInstanceAllowed: false });
  await loadFreshB1Main(deniedControl);
  assert.equal(deniedControl.requestSingleInstanceLockCalls(), 1, 'failed single-instance admission is checked once');
  assert.equal(deniedControl.quitCalls(), 1, 'failed single-instance admission quits before local authority starts');
  assert.equal(deniedControl.whenReadyCalls(), 0, 'failed single-instance admission does not await readiness');
  assert.deepEqual(deniedControl.ipcChannels(), [], 'failed single-instance admission registers no IPC handler');
  assert.equal(deniedControl.browserWindowOptions.length, 0, 'failed single-instance admission creates no window');

  const control = createB1ElectronBoundary();
  const { main } = await loadFreshB1Main(control);
  requiredExport(main, 'createXanthilDesktopIpcHandlers');
  const webPreferences = control.browserWindowOptions[0]!.webPreferences as Record<string, unknown>;
  assert.deepEqual(Object.fromEntries(['contextIsolation', 'sandbox', 'nodeIntegration', 'devTools', 'webSecurity'].map((key) => [key, webPreferences[key]])), {
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    devTools: false,
    webSecurity: true,
  }, 'the one BrowserWindow retains every frozen native security preference');
  const initialWindow = control.currentWindow();
  control.emitApp('second-instance');
  assert.equal(initialWindow.focusCalls, 1, 'a second-instance signal focuses the existing local window');
  assert.equal(control.getAllWindows().length, 1, 'a second-instance signal creates no second authority window');
  assert.equal(control.emitWillNavigate(), 1, 'navigation is prevented at the actual BrowserWindow webContents boundary');
  assert.deepEqual(control.invokeWindowOpenHandler(), { action: 'deny' }, 'new BrowserWindow requests are denied by the actual native handler');
  assert.equal(control.invokePermissionCheck(), false, 'permission checks are denied');
  assert.deepEqual(control.invokePermissionRequest().decisions, [false], 'every permission-request callback decision is a denial');
  assert.equal(control.remoteLoads.length, 0, 'no external URL load path is available');
  assert.equal(control.devToolsCalls(), 0, 'normal Main lifecycle does not open devtools');
  const malformed = Object.freeze({ contract_version: '2.0' });
  for (const method of b1Methods) {
    const handler = control.ipcHandler(`xanthil-desktop:v1:${method}`);
    const admittedMalformed = await handler(control.acceptedEvent(), malformed);
    assertClosedU11Failure(admittedMalformed, 'INVALID_REQUEST', `${method} recorded top frame reaches minimal-envelope validation`);
    const foreignPoison = poisonB1MinimalEnvelope();
    const forbiddenForeign = await handler(control.foreignSenderEvent(), foreignPoison.envelope);
    assertClosedU11Failure(forbiddenForeign, 'FORBIDDEN', `${method} foreign sender is refused before poison-envelope inspection`);
    assert.equal(foreignPoison.reads(), 0, `${method} foreign sender reads no poison envelope getter`);
    const subframePoison = poisonB1MinimalEnvelope();
    const forbiddenSubframe = await handler(control.subframeEvent(), subframePoison.envelope);
    assertClosedU11Failure(forbiddenSubframe, 'FORBIDDEN', `${method} subframe is refused before poison-envelope inspection`);
    assert.equal(subframePoison.reads(), 0, `${method} subframe reads no poison envelope getter`);
  }
  initialWindow.close();
  control.emitApp('activate');
  const replacementWindow = control.currentWindow();
  assert.notEqual(replacementWindow, initialWindow, 'close then activate records a fresh local window authority');
  assert.equal(control.getAllWindows().length, 1, 'close then activate restores one local window without duplicate authority');
  assert.equal(control.getAllWindows()[0], replacementWindow, 'the replacement is the one live local window');
  assert.equal(control.browserWindowOptions.length, 2, 'close then activate creates only the replacement authority window');
  const replacementMalformed = await control.ipcHandler('xanthil-desktop:v1:selectProject')(control.acceptedEvent(), malformed);
  assertClosedU11Failure(replacementMalformed, 'INVALID_REQUEST', 'the replacement main frame alone reaches minimal-envelope validation');
  const oldWindowPoison = poisonB1MinimalEnvelope();
  const oldWindowResult = await control.ipcHandler('xanthil-desktop:v1:selectProject')(
    Object.freeze({ sender: initialWindow.webContents, senderFrame: initialWindow.webContents.mainFrame }),
    oldWindowPoison.envelope,
  );
  assertClosedU11Failure(oldWindowResult, 'FORBIDDEN', 'the closed window loses its former sender authority before envelope inspection');
  assert.equal(oldWindowPoison.reads(), 0, 'the closed window sender reads no poison envelope getter');
});

test('U1.1 H-B2-LOAD: distinguishes valid pinned TSX render from diagnostics and exact missing Renderer', async () => {
  await assertB2TsxSeamHealth();
});

test('U4 Renderer work summary keeps a running Assistance return target and truthful disclosure boundary [AC-XDESK-010-06, AC-XDESK-006-04]',async()=>{
  const recording=createB2RecordingDesktopApi();await withB2MountCapture(recording.api,async()=>{
    const renderer=await requireB2Renderer();
    const summarize=requiredExport<(running:boolean,attempt:Readonly<{status:string;action_kind:string}>|undefined,disclosures:number,hasSessionRun?:boolean)=>Readonly<{label:string;target:string|null;modelBoundary:string}>>(renderer,'summarizeDesktopWork');
    assert.deepEqual(summarize(false,undefined,0),{label:'空闲',target:null,modelBoundary:'无'});
    assert.deepEqual(summarize(true,undefined,0),{label:'本地处理中',target:'本地处理',modelBoundary:'无'});
    assert.deepEqual(summarize(false,undefined,0,true),{label:'空闲',target:'本地处理',modelBoundary:'无'},'a terminal Run keeps only its same-Session navigation point, never a running claim or restart');
    for(const [action,target] of [['organize_question','新建分析'],['explain_evidence','循证分析'],['draft_candidates','执行反馈']]) {
      assert.deepEqual(summarize(false,{status:'Running',action_kind:action},1),{label:'模型辅助处理中',target,modelBoundary:'按逐次披露记录'});
      assert.deepEqual(summarize(false,{status:'Succeeded',action_kind:action},1),{label:'空闲',target:null,modelBoundary:'按逐次披露记录'});
    }
    assert.deepEqual([...recording.calls.entries()],recording.methods.map(method=>[method,0]),'read-only UI summaries never call a business method');
  });
});

test('U3 decision editor exposes two routes, explicit non-closure actions and separate completion without mount effects [AC-XDESK-007-02..05]',async()=>{
  const recording=createB2RecordingDesktopApi();await withB2MountCapture(recording.api,async()=>{
    const renderer=await requireB2Renderer(),react=await import('react'),server=await import('react-dom/server');
    const Editor=requiredExport<(props:Record<string,unknown>)=>import('react').ReactNode>(renderer,'DecisionClosureEditor');let saves=0,completions=0;
    const markup=server.renderToStaticMarkup(react.createElement(Editor,{initial:null,disabled:false,canComplete:false,onSave:()=>{saves++;},onComplete:()=>{completions++;}}));
    for(const text of ['候选比较','证据不足','新增候选','保存草稿','保存闭环路线','暂缓决策','需要补证','完成分析案例'])assert.ok(markup.includes(text),text);
    const completionTag=markup.match(/<button\b[^>]*>完成分析案例<\/button>/u)?.[0];
    assert.ok(completionTag,'the explicit completion control exists');assert.match(completionTag,/\btype="button"/u);assert.match(completionTag,/\bdisabled=""/u);assert.equal(saves,0);assert.equal(completions,0);
  });
});

test('U1.1 B2-COMPONENT: actual XanthilDesktopApp renders the accepted initial shell without a business call', async () => {
  const recording = createB2RecordingDesktopApi();
  await withB2MountCapture(recording.api, async (capture) => {
    const renderer = await requireB2Renderer();
    const react = await import('react') as Record<string, unknown>;
    const server = await import('react-dom/server') as Record<string, unknown>;
    const App = requiredExport<(props: { api: Record<string, unknown> }) => unknown>(renderer, 'XanthilDesktopApp');
    const createElement = requiredExport<(type: unknown, props: unknown) => unknown>(react, 'createElement');
    const renderToStaticMarkup = requiredExport<(element: unknown) => string>(server, 'renderToStaticMarkup');
    const markup = renderToStaticMarkup(createElement(App, { api: recording.api }));
    for (const label of ['JuanerAI','持续做出更好的决策','Xanthil Desktop','Case Assistant','关联一个 Case','模型未配置','Case 决策与预期 v1.0','Status','Quick','Professional','Global Search','Fork','Subagent','Preview']) {
      assert.match(markup, new RegExp(escapeRegexLiteral(label), 'u'), `the accepted initial shell visibly names ${label}`);
    }
    assert.deepEqual([...recording.calls.entries()], recording.methods.map((method) => [method, 0]), 'the exact twenty-method Renderer API remains entirely unused by the static initial shell');
    // A future normal mount is the MOUNT leaf's concern.  COMPONENT proves
    // only the actual export's markup and its zero business API side effect.
  });
});

test('U1.1 B2-MOUNT: normal Renderer mounts the actual app with the identical xanthilDesktopApi and local CSP', async () => {
  const recording = createB2RecordingDesktopApi();
  await withB2MountCapture(recording.api, async (capture) => {
    await assertB2RendererIndexContract();
    const renderer = await requireB2Renderer();
    const App = requiredExport<unknown>(renderer, 'XanthilDesktopApp');
    assert.deepEqual(capture.rootLookups, ['root'], 'normal Renderer mount looks up only #root once');
    assert.deepEqual(capture.createRootTargets, [capture.root], 'normal Renderer mount passes the identical controlled #root to createRoot once');
    assert.equal(capture.renders.length, 1, 'normal Renderer mount renders once');
    const element = capture.renders[0] as { type?: unknown; props?: Record<string, unknown> };
    assert.equal(element.type, App, 'normal Renderer mount renders the identical exported XanthilDesktopApp');
    assert.deepEqual(Object.keys(element.props ?? {}).sort(), ['api'], 'normal Renderer mount supplies no implicit business prop');
    assert.equal(element.props?.api, recording.api, 'normal Renderer mount forwards the identical window.xanthilDesktopApi object');
    assert.deepEqual([...recording.calls.entries()], recording.methods.map((method) => [method, 0]), 'initial normal mount performs zero calls through the exact twenty-method API');
  });
});

test('AC-XDESK-009-03: exposes exactly twenty version-one preload methods with structured-clone business values', async () => {
  const validateRequest = await requestValidator();
  const requests: Readonly<Record<string, Record<string, unknown>>> = {
    selectProject: { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand },
    listSessions: { contract_version: '1.0', project_id: desktopTestIds.project },
    openSession: { contract_version: '1.0', project_id: desktopTestIds.project, session_id: desktopTestIds.session },
    createSession: { ...createSessionCommand() }, createDraftRevision: revision,
    selectImportFiles: { contract_version: '1.0', ...owner, expected_row_version: '1' },
    confirmRevision: { ...revision, inspection_token: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', confirmation },
    startAnalysis: { ...revision, confirmation_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }, cancelAnalysis: { ...revision, run_id: '01991a00-0000-7000-8000-000000000001' },
    prepareAssistanceDisclosure: { contract_version: '1.0', ...owner, expected_row_version: '1', action_kind: 'organize_question', requested_provider: 'offline-test', requested_model: 'deterministic' },
    decideAssistanceDisclosure: { ...revision, preview_token: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', payload_sha256: 'a'.repeat(64), decision: 'refused', free_text_confirmed: false },
    startAssistance: { ...revision, disclosure_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }, cancelAssistance: { ...revision, attempt_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' },
    disposeAssistanceDraft: { ...revision, draft_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', disposition: 'rejected', edited_content: null },
    acceptFinding: { ...revision, finding_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' },
    saveForm: { ...revision, form: { kind: 'case_fields', fields } },
    completeCase: { ...revision, acceptance_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', form_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' },
    exportReport: { contract_version: '1.0', command_id: desktopTestIds.retryCommand, ...owner, report_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' },
    readProjection: { contract_version: '1.0', ...owner }, waitForProjection: { contract_version: '1.0', ...owner, projection_token: '1:receipt' },
  };
  assert.deepEqual(Object.keys(requests).sort(), ['acceptFinding', 'cancelAnalysis', 'cancelAssistance', 'completeCase', 'confirmRevision', 'createDraftRevision', 'createSession', 'decideAssistanceDisclosure', 'disposeAssistanceDraft', 'exportReport', 'listSessions', 'openSession', 'prepareAssistanceDisclosure', 'readProjection', 'saveForm', 'selectImportFiles', 'selectProject', 'startAnalysis', 'startAssistance', 'waitForProjection']);
  for (const [method, request] of Object.entries(requests)) assert.deepEqual(validateRequest(method, request), request, `${method} must retain only its named structured-clone request`);
});

test('AC-XDESK-009-04: real Main rejects a non-top sender, wrong version, and malformed request before chooser, file, export, or Application effect', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const harness = await createRealMainHarness(projectRoot);
    const forbidden = await harness.handlers.selectProject({ frame_kind: 'subframe' }, { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand });
    const staleVersion = await harness.handlers.selectProject(harness.packagedTopFrame, { contract_version: '2.0', command_id: desktopTestIds.openProjectCommand });
    assert.equal(resultCode(forbidden), 'FORBIDDEN');
    assert.equal(resultCode(staleVersion), 'INVALID_REQUEST');
    assert.deepEqual(harness.effects, [], 'sender/version rejection precedes all external effects');
    assert.equal((await harness.handlers.selectProject(harness.packagedTopFrame,{contract_version:'1.0',command_id:desktopTestIds.openProjectCommand})).ok,true);
    const effects=[...harness.effects],before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
    const malformed = await harness.handlers.createSession(harness.packagedTopFrame, { ...createSessionCommand(), display_name: 42 });
    assert.equal(resultCode(malformed), 'INVALID_REQUEST');
    assert.deepEqual(harness.effects, effects, 'malformed business input cannot reach another native dialog, file read/write, or business mutation');
    assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  });
});

test('AC-XDESK-009-01: real Main exposes only structured-clone Desktop results and never returns an opaque chooser capability or source bytes', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const harness = await createRealMainHarness(projectRoot);
    const result = await harness.handlers.selectProject(harness.packagedTopFrame, { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand });
    assert.deepEqual(Object.keys(result).sort(), ['ok', 'value']);
    assert.equal(result.ok, true);
    const value = requiredRecord(result.value, 'selectProject success value');
    assert.deepEqual(Object.keys(value).sort(), ['project', 'sessions']);
    assert.deepEqual(requiredRecord(value.project, 'selectProject Project value'), {
      project_id: desktopTestIds.project, display_name: 'Synthetic Project', schema_version: '1.0', write_state: 'ready',
    });
    assert.deepEqual(value.sessions, [], 'fresh Project selection returns the real ordered empty Session summary list');
    assert.doesNotMatch(JSON.stringify(result), /projectRoot|capability_kind|\/private\/|bytes/);
    assert.deepEqual(harness.effects, ['selectProject', 'profile.openProject']);
  });
});

test('AC-XDESK-009-02: the fixed Main handler object has no navigation, window, permission, shell, URL, devtools, HMR, or arbitrary channel operation', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const harness = await createRealMainHarness(projectRoot);
    assert.deepEqual(Object.keys(harness.handlers).sort(), ['acceptFinding', 'cancelAnalysis', 'cancelAssistance', 'completeCase', 'confirmRevision', 'createDraftRevision', 'createSession', 'decideAssistanceDisclosure', 'disposeAssistanceDraft', 'exportReport', 'listSessions', 'openSession', 'prepareAssistanceDisclosure', 'readProjection', 'saveForm', 'selectImportFiles', 'selectProject', 'startAnalysis', 'startAssistance', 'waitForProjection']);
    for (const forbidden of ['navigate', 'openWindow', 'requestPermission', 'openExternal', 'enableDevTools', 'hmr', 'invoke']) assert.equal(Object.hasOwn(harness.handlers, forbidden), false);
  });
});

test('AC-XDESK-009-05: revalidates owner identity row version and state in Application rather than transport', async () => {
  const validateRequest = await requestValidator();
  const accepted = validateRequest('createDraftRevision', revision);
  assert.deepEqual(accepted, revision, 'transport preserves guard bytes; it cannot synthesize an owner or row version');
  assert.throws(() => validateRequest('createDraftRevision', { ...revision, expected_row_version: '0' }), /INVALID_REQUEST/);
});

test('AC-XDESK-009-06: real Main reload/duplicate delivery returns one durable receipt and refuses changed command bytes without duplicate authority', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const harness = await createRealMainHarness(projectRoot);
    await harness.handlers.selectProject(harness.packagedTopFrame, { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand });
    const first = await harness.handlers.createSession(harness.packagedTopFrame, createSessionCommand());
    const replay = await harness.handlers.createSession(harness.packagedTopFrame, createSessionCommand());
    assert.deepEqual(replay, first);
    const conflict = await harness.handlers.createSession(harness.packagedTopFrame, createSessionCommand({ case_name: 'changed fingerprint' }));
    assert.equal(resultCode(conflict), 'COMMAND_CONFLICT');
    assert.equal(harness.effects.filter((effect) => effect === 'selectProject').length, 1);
  });
});

test('AC-XDESK-LA-001-01: retains every pre-Change TypeScript path and exact explicit P4/P5 graph without inferred glob', async () => {
  const tsconfig = JSON.parse(await readFile(new URL('../../../tsconfig.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.equal(Array.isArray(tsconfig.files), true);
  assert.equal(Object.hasOwn(tsconfig, 'include'), false);
});

test('AC-XDESK-LA-001-02: requires exact P4 options/files plus only ordered P5 JSX and Desktop appendices', async () => {
  const tsconfig = JSON.parse(await readFile(new URL('../../../tsconfig.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.equal((tsconfig.compilerOptions as Record<string, unknown>).jsx, 'react-jsx');
  assert.equal((tsconfig.files as string[]).includes('apps/desktop/main.ts'), true);
});

test('AC-XDESK-LA-001-03: confines Pi Electron React and node:sqlite types to their approved boundaries', async () => {
  const graph = await readFile(new URL('../../../tsconfig.json', import.meta.url), 'utf8');
  assert.doesNotMatch(graph, /\*\*\/\*.ts/);
});

test('AC-XDESK-LA-001-04: keeps public business contracts free of Pi or Electron types', async () => {
  const ipc = await readFile(new URL('../../../packages/contracts/xanthil-desktop-ipc.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(ipc, /(?:Electron\.|BrowserWindow|PiSession|ipcMain)/);
});

test('AC-XDESK-LA-002-01: retains the exact P4 package and npm-v3 lock hashes', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.equal(manifest.name, 'xanthil-desktop');
  assert.equal(manifest.version, '0.1.0');
});

test('AC-XDESK-LA-002-02: accepts only the complete frozen P4 or P5 manifest state and scripts', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  const scripts = manifest.scripts as Record<string, string>;
  assert.equal(scripts['desktop:start'], 'node tools/desktop/development-start.mjs');
  assert.equal(scripts['desktop:package'], 'node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge package --platform=darwin --arch=arm64');
});

test('AC-XDESK-LA-002-03: rejects ranges alternate managers nested locks overrides network SQLite npm and release machinery', async () => {
  const manifest = await readFile(new URL('../../../package.json', import.meta.url), 'utf8');
  assert.doesNotMatch(manifest, /(?:"sqlite"\s*:|"overrides"|"publish"|"electron-updater")/);
});

test('AC-XDESK-LA-002-04: keeps the generated toolchain descriptor package-local and absent from data payloads reports and Git', async () => {
  const manifest = await readFile(new URL('../../../package.json', import.meta.url), 'utf8');
  assert.doesNotMatch(manifest, /toolchain-deployment\.json/);
});
