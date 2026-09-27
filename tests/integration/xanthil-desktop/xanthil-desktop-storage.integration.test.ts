import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { createBlockingDuckDbChild, createExactXdk1HotJournal, createRealDesktopApplication, createU12ProjectAdmissionApplication, openConfirmedDesktopRevision, requiredExport, requiredRecord, requiredString, revisionCommand, withIsolatedProject } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { createSessionCommand, desktopTestIds } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

type Method = (value: Record<string, unknown>) => Promise<Record<string, unknown>>;

const projectOpen = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project' };

test('U1.5 native recovery: committed Session and edited fields survive real hot rollback without adopting orphan directories [AC-XDESK-002-06, AC-XDESK-011-06]', async t => withIsolatedProject(async projectRoot => {
  const { application } = await createU12ProjectAdmissionApplication(projectRoot);
  await requiredExport<Method>(application, 'openProject')(projectOpen);
  const created = await requiredExport<Method>(application, 'createSession')(createSessionCommand()), session = requiredRecord(created.session, 'session');
  const owner = { project_id: desktopTestIds.project, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id };
  const saved = await requiredExport<Method>(application, 'saveForm')({ contract_version: '1.0', command_id: desktopTestIds.revisionCommand, ...owner, expected_row_version: '1', form: { kind: 'case_fields', fields: { ...createSessionCommand().fields, question_text: 'Committed before owner crash' } } });
  await mkdir(join(projectRoot, 'uncommitted-orphan'));
  const path = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), before = await readFile(path), directories = await readdir(projectRoot, { recursive: true });
  const crash = await createExactXdk1HotJournal(path);
  t.diagnostic(JSON.stringify(crash));
  assert.notEqual(crash.dirty_sha256, crash.committed_sha256);
  const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(projectOpen);
  assert.deepEqual(await requiredExport<Method>(reopened.application, 'readProjection')(owner), saved);
  assert.deepEqual(await readFile(path), before);
  assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
  const listed = await requiredExport<(x: unknown) => Promise<unknown[]>>(reopened.application, 'listSessions')({ project_id: desktopTestIds.project });
  assert.equal(listed.length, 1);
}));

test('U1.5 owner crash: killed real Session writer before/after native COMMIT reopens only committed authority [AC-XDESK-002-03, AC-XDESK-002-05, AC-XDESK-002-06]', async t => {
  for (const point of ['before', 'after']) await t.test(point, async t => withIsolatedProject(async projectRoot => {
    const initial = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(initial.application, 'openProject')(projectOpen);
    const script = `
      const { DatabaseSync } = await import('node:sqlite');
      const { createU12ProjectAdmissionApplication } = await import(${JSON.stringify(new URL('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts', import.meta.url).href)});
      const { application } = await createU12ProjectAdmissionApplication(${JSON.stringify(projectRoot)});
      await application.openProject(${JSON.stringify(projectOpen)});
      const original = DatabaseSync.prototype.exec;
      DatabaseSync.prototype.exec = function(sql) {
        if (sql !== 'COMMIT') return original.call(this, sql);
        if (${JSON.stringify(point)} === 'after') original.call(this, sql);
        process.stdout.write('U1-OWNED-COMMIT-BOUNDARY\\n');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      };
      await application.createSession(${JSON.stringify(createSessionCommand())});
    `;
    const child = spawn(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let stdout = '', stderr = '', reached = false;
    const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      const timer = setTimeout(() => { child.kill('SIGKILL'); }, 10_000);
      child.stdout.on('data', chunk => { stdout += String(chunk); if (!reached && stdout.includes('U1-OWNED-COMMIT-BOUNDARY')) { reached = true; child.kill('SIGKILL'); } });
      child.stderr.on('data', chunk => { stderr += String(chunk); });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('close', (code, signal) => { clearTimeout(timer); resolve({ code, signal }); });
    });
    t.diagnostic(JSON.stringify({ point, child_pid: child.pid, argv: child.spawnargs, reached, ...result, stdout, stderr }));
    assert.equal(reached, true); assert.equal(result.signal, 'SIGKILL'); assert.equal(result.code, null);
    const directories = (await readdir(projectRoot)).filter(name => name !== '.xanthil');
    assert.equal(directories.length, 1, 'the actual writer published its Session directory before COMMIT');
    assert.deepEqual((await readdir(join(projectRoot, directories[0]))).sort(), ['010_draw', '020_clean', '060_reports']);
    const reopened = await createU12ProjectAdmissionApplication(projectRoot); await requiredExport<Method>(reopened.application, 'openProject')(projectOpen);
    const sessions = await requiredExport<(x: unknown) => Promise<Record<string, unknown>[]>>(reopened.application, 'listSessions')({ project_id: desktopTestIds.project });
    assert.equal(sessions.length, point === 'after' ? 1 : 0);
    const path = join(projectRoot, '.xanthil', 'desktop', 'state.sqlite'), db = new DatabaseSync(path, { readOnly: true });
    try { assert.equal(db.prepare("SELECT COUNT(*) AS n FROM command_receipts WHERE operation_kind='create_session'").get()?.n, point === 'after' ? 1 : 0); assert.equal(db.prepare('SELECT COUNT(*) AS n FROM case_revisions').get()?.n, point === 'after' ? 1 : 0); } finally { db.close(); }
    if (point === 'after') {
      const before = createHash('sha256').update(await readFile(path)).digest('hex');
      const recovered = await requiredExport<Method>(reopened.application, 'createSession')(createSessionCommand());
      assert.equal(requiredRecord(recovered.session, 'session').session_id, sessions[0].session_id);
      assert.equal(requiredRecord(recovered.revision, 'revision').question_text, createSessionCommand().fields.question_text);
      assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), before, 'receipt resolution causes no second write');
    }
    assert.deepEqual((await readdir(projectRoot)).filter(name => name !== '.xanthil'), directories, 'orphan is retained, not scanned/adopted/cleaned');
  }));
});

test('U2 native cancellation [AC-XDESK-008-04]: real Application Store and analytics Adapter reap the owned process before reopened terminal history', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const child = await createBlockingDuckDbChild(projectRoot);
    const ready = await openConfirmedDesktopRevision(projectRoot, undefined, { duckdbExecutable: child.executable });
    const readyRevision = requiredRecord(ready.projection.revision, 'ready revision');
    const started = requiredExport<Method>(ready.application, 'startAnalysis')({ ...revisionCommand(ready.owner, desktopTestIds.retryCommand, requiredString(readyRevision, 'row_version')), confirmation_id: ready.confirmationId });
    await child.assertStarted();
    const admitted = await requiredExport<Method>(ready.application, 'readProjection')(ready.owner);
    assert.equal(Array.isArray(admitted.runs), true, 'the real Application must admit a durable Run before any local child can be cancelled');
    const running = (admitted.runs as Array<Record<string, unknown>>).at(-1);
    assert.ok(running, 'startAnalysis must expose the admitted Run identity');
    assert.equal(requiredString(running, 'status'), 'Running');
    const runningRevision = requiredRecord(admitted.revision, 'running revision');
    const cancelled = await requiredExport<Method>(ready.application, 'cancelAnalysis')({ ...revisionCommand(ready.owner, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', requiredString(runningRevision, 'row_version')), run_id: requiredString(running, 'run_id') });
    await child.assertTerminated();
    await started;
    assert.equal((cancelled.runs as Array<Record<string, unknown>>).at(-1)?.status, 'Cancelled', 'cancellation is terminal and never reports successful analysis evidence');
    const reopened = await createRealDesktopApplication(projectRoot);
    await requiredExport<Method>(reopened.application,'openProject')(projectOpen);
    const afterReopen = await requiredExport<Method>(reopened.application, 'openSession')({ contract_version: '1.0', project_id: ready.owner.project_id, session_id: ready.owner.session_id });
    const terminal = (afterReopen.runs as Array<Record<string, unknown>>).at(-1);
    assert.ok(terminal, 'reopen must retain the original Run identity rather than scan/adopt a replacement');
    assert.equal(requiredString(terminal, 'run_id'), requiredString(running, 'run_id'));
    assert.equal(requiredString(terminal, 'status'), 'Cancelled', 'reopen cannot resume, resend, or rewrite owned local work');
    assert.equal((afterReopen.findings as unknown[]).length, 0, 'a cancelled owned child produces no Finding or business authority');
  });
});

test('U2 native interruption [TEST-XDESK-014]: real Adapter-owned child failure preserves one failed Run and no Finding on reopen', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const child = await createBlockingDuckDbChild(projectRoot);
    const ready = await openConfirmedDesktopRevision(projectRoot, undefined, { duckdbExecutable: child.executable });
    const admission = await requiredExport<Method>(ready.application, 'startAnalysis')({ ...revisionCommand(ready.owner, desktopTestIds.retryCommand, requiredString(requiredRecord(ready.projection.revision, 'ready revision'), 'row_version')), confirmation_id: ready.confirmationId });
    await child.assertStarted();
    const runningProjection = await requiredExport<Method>(ready.application, 'readProjection')(ready.owner);
    const running = (runningProjection.runs as Array<Record<string, unknown>>).at(-1);
    assert.ok(running);
    assert.equal(requiredString(running, 'status'), 'Running');
    await child.interruptOwnedChild();
    await child.assertTerminated();
    let terminalProjection=admission;
    for(let attempt=0;attempt<200;attempt++){terminalProjection=await requiredExport<Method>(ready.application,'readProjection')(ready.owner);if((terminalProjection.runs as Record<string,unknown>[])[0].status!=='Running')break;await new Promise(resolve=>setTimeout(resolve,10));}
    assert.equal((terminalProjection.runs as Record<string,unknown>[])[0].status,'Failed');
    assert.equal((terminalProjection.findings as unknown[]).length, 0, 'the failed child result cannot become a Finding before reopen');
    const reopened = await createRealDesktopApplication(projectRoot);
    await requiredExport<Method>(reopened.application,'openProject')(projectOpen);
    const reopenedProjection = await requiredExport<Method>(reopened.application, 'openSession')({ contract_version: '1.0', project_id: ready.owner.project_id, session_id: ready.owner.session_id });
    const reopenedRun = (reopenedProjection.runs as Array<Record<string, unknown>>).at(-1);
    assert.ok(reopenedRun);
    const reconciled = await requiredExport<Method>(reopened.application, 'reconcileInterrupted')({ command_id: 'abababab-abab-4bab-8bab-abababababab', ...ready.owner, target_kind: 'analysis_run', target_id: requiredString(reopenedRun, 'run_id') });
    assert.equal(requiredString((reconciled.runs as Array<Record<string, unknown>>).at(-1)!, 'status'), 'Failed');
    assert.equal((reconciled.findings as unknown[]).length, 0, 'a killed child cannot publish result, report, Finding, or external continuation');
  });
});

test('U2 reconcile unknown [AC-XDESK-008-05]: unknown target is effect-free and creates no Run or Runtime invocation', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const ready = await openConfirmedDesktopRevision(projectRoot);
    const before=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
    await assert.rejects(()=>requiredExport<Method>(ready.application, 'reconcileInterrupted')({ command_id: desktopTestIds.retryCommand, ...ready.owner, target_kind: 'analysis_run', target_id: '01991a00-0000-7000-8000-000000000001' }),/NOT_FOUND/);
    const projection=await requiredExport<Method>(ready.application,'readProjection')(ready.owner);
    assert.equal((projection.runs as unknown[]).length, 0, 'an unknown/non-running target is effect-free and cannot manufacture a Run');
    assert.equal(ready.runtime.calls.length, 0, 'reconciliation must not contact the optional Runtime/provider');
    assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),before);
  });
});

test('U2 owner crash windows [TEST-XDESK-014, AC-XDESK-008-05]: native publication boundaries retain immutable orphans and reopen only SQLite authority', async t => {
  const drivers = new URL('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts', import.meta.url).href;
  const fixtures = new URL('../../fixtures/xanthil-desktop/desktop-fixtures.ts', import.meta.url).href;
  const applicationModule = new URL('../../../packages/application/xanthil-desktop-decision-case.ts', import.meta.url).href;
  const immutableFiles = async (root: string) => {
    const paths = (await readdir(root, { recursive: true, withFileTypes: true }))
      .filter(x => x.isFile() && !join(x.parentPath, x.name).startsWith(join(root, '.xanthil', 'desktop', 'state.sqlite')))
      .map(x => join(x.parentPath, x.name)).sort();
    return Promise.all(paths.map(async path => ({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })));
  };
  for (const point of ['running', 'result-before-publication', 'aggregate-published', 'report-published', 'terminal-before-sqlite']) await t.test(point, async t => withIsolatedProject(async projectRoot => {
    const ready = await openConfirmedDesktopRevision(projectRoot);
    const command = { ...revisionCommand(ready.owner, desktopTestIds.retryCommand, requiredString(requiredRecord(ready.projection.revision, 'revision'), 'row_version')), confirmation_id: ready.confirmationId };
    const script = `
      import fs from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      const { createRealDesktopApplication, createControlledDeadlineScheduler } = await import(${JSON.stringify(drivers)});
      const { fixedClock } = await import(${JSON.stringify(fixtures)});
      const { createXanthilDesktopDecisionCaseApplication } = await import(${JSON.stringify(applicationModule)});
      const native = await createRealDesktopApplication(${JSON.stringify(projectRoot)});
      const point = ${JSON.stringify(point)};
      const stop = detail => { fs.writeSync(1, JSON.stringify({ boundary: point, detail, pid: process.pid })+'\\n'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0); };
      const originalRename = fs.renameSync, originalLink = fs.linkSync;
      fs.linkSync = function(from,to) {
        if(point === 'result-before-publication' && String(to).endsWith('/outputs/duckdb.json')) stop({ from:String(from), to:String(to), result_bytes:fs.statSync(from).size });
        return originalLink.call(this,from,to);
      };
      fs.renameSync = function(from,to) {
        const result = originalRename.call(this,from,to);
        if(point==='aggregate-published' && String(from).endsWith('/020_clean')) stop({ from:String(from), to:String(to) });
        if(point==='report-published' && String(from).endsWith('/060_reports')) stop({ from:String(from), to:String(to) });
        if(point==='terminal-before-sqlite' && String(to).endsWith('/run.json') && JSON.parse(fs.readFileSync(to,'utf8')).status==='succeeded') stop({ from:String(from), to:String(to) });
        return result;
      };
      syncBuiltinESMExports();
      const runEvidenceStore={...native.runEvidenceStore,beginRun:async input=>{const result=await native.runEvidenceStore.beginRun(input);if(point==='running')stop({run_id:input.run_id});return result;}};
      const application=createXanthilDesktopDecisionCaseApplication({store:native.store,analysisExecution:native.analysisExecution,runEvidenceStore,assistanceRuntime:null,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler});
      await application.openProject(${JSON.stringify(projectOpen)});
      await application.startAnalysis(${JSON.stringify(command)});
    `;
    const child = spawn(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let stdout = '', stderr = '', reached = false;
    const completion = await new Promise<{code: number|null; signal: NodeJS.Signals|null}>((resolve,reject) => {
      const timer=setTimeout(()=>child.kill('SIGKILL'),30_000);
      child.stdout.on('data', chunk=>{stdout+=String(chunk);if(!reached && stdout.includes('"boundary":')){reached=true;child.kill('SIGKILL');}});
      child.stderr.on('data',chunk=>{stderr+=String(chunk);});
      child.once('error',error=>{clearTimeout(timer);reject(error);});
      child.once('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal});});
    });
    t.diagnostic(JSON.stringify({point,pid:child.pid,argv:child.spawnargs,stdout,stderr,...completion}));
    assert.equal(reached,true,'the real native boundary must be reached, not a timer or loader failure');
    assert.equal(completion.signal,'SIGKILL'); assert.equal(completion.code,null);
    assert.throws(()=>process.kill(child.pid!,0),{code:'ESRCH'},'owned process must be reaped');
    const dbPath=join(projectRoot,'.xanthil','desktop','state.sqlite'), beforeDb=new DatabaseSync(dbPath,{readOnly:true});
    let originalRun: Record<string,unknown>, originalReceipt: Record<string,unknown>;
    try {
      originalRun=beforeDb.prepare('SELECT * FROM analysis_runs').get()!;
      originalReceipt=beforeDb.prepare("SELECT * FROM command_receipts WHERE operation_kind='start_analysis'").get()!;
      assert.equal(originalRun.status,'Running');
      for(const table of ['findings','aggregate_artifacts','report_versions'])assert.equal(beforeDb.prepare('SELECT COUNT(*) AS n FROM '+table).get()?.n,0);
    } finally {beforeDb.close();}
    const manifestPath=join(projectRoot,'.xanthil','runs',String(originalRun!.run_id),'run.json');
    const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
    assert.equal(manifest.status,point==='terminal-before-sqlite'?'succeeded':'in_progress');
    assert.equal(manifest.artifacts.length,point==='terminal-before-sqlite'?6:2,'in-progress run.json remains its initial physical manifest until the sole terminal replacement');
    const directories=(await readdir(projectRoot,{recursive:true})).sort(), files=await immutableFiles(projectRoot);
    if(point==='result-before-publication')assert.ok(files.some(x=>/outputs\/\..*\.tmp$/.test(x.path)),'received real primary result remains an unpublished file');
    if(['aggregate-published','report-published','terminal-before-sqlite'].includes(point))assert.ok(files.some(x=>x.path.endsWith('/aggregate.json')));
    if(['report-published','terminal-before-sqlite'].includes(point))assert.ok(files.some(x=>x.path.endsWith('/report.md')));
    const reopenScript=`
      const {createRealDesktopApplication}=await import(${JSON.stringify(drivers)});
      const {application}=await createRealDesktopApplication(${JSON.stringify(projectRoot)});
      await application.openProject(${JSON.stringify(projectOpen)});
      const value=await application.openSession({contract_version:'1.0',project_id:${JSON.stringify(ready.owner.project_id)},session_id:${JSON.stringify(ready.owner.session_id)}});
      console.log(JSON.stringify(value));
    `;
    const reopening=spawn(process.execPath,['--experimental-strip-types','--input-type=module','-e',reopenScript],{stdio:['ignore','pipe','pipe'],env:process.env});
    let reopenedOut='',reopenedErr='';
    const reopenedExit=await new Promise<number|null>((resolve,reject)=>{const timer=setTimeout(()=>reopening.kill('SIGKILL'),15_000);reopening.stdout.on('data',x=>{reopenedOut+=String(x);});reopening.stderr.on('data',x=>{reopenedErr+=String(x);});reopening.once('error',e=>{clearTimeout(timer);reject(e);});reopening.once('close',code=>{clearTimeout(timer);resolve(code);});});
    t.diagnostic(JSON.stringify({point,reopen_pid:reopening.pid,argv:reopening.spawnargs,exit:reopenedExit,stdout:reopenedOut,stderr:reopenedErr}));
    assert.equal(reopenedExit,0,reopenedErr);
    const projection=JSON.parse(reopenedOut),run=projection.runs[0];
    assert.equal(projection.runs.length,1); assert.equal(run.run_id,originalRun!.run_id);assert.equal(run.status,'Failed');assert.equal(run.terminal_reason,'interrupted');
    assert.equal(projection.findings.length,0);assert.equal(projection.reports.length,0);
    assert.equal(projection.confirmation.confirmation_id,ready.confirmationId);
    assert.deepEqual(await immutableFiles(projectRoot),files,'Run terminal/candidates/snapshot bytes must never be rewritten, adopted or cleaned');
    assert.deepEqual((await readdir(projectRoot,{recursive:true})).sort(),directories,'no resume, replacement work or cleanup');
    const afterDb=new DatabaseSync(dbPath,{readOnly:true});
    try {
      assert.equal(afterDb.prepare('PRAGMA integrity_check').get()?.integrity_check,'ok');
      assert.deepEqual(afterDb.prepare("SELECT * FROM command_receipts WHERE operation_kind='start_analysis'").get(),originalReceipt!);
      assert.equal(afterDb.prepare("SELECT COUNT(*) AS n FROM command_receipts WHERE operation_kind='start_analysis'").get()?.n,1);
      for(const table of ['findings','aggregate_artifacts','report_versions'])assert.equal(afterDb.prepare('SELECT COUNT(*) AS n FROM '+table).get()?.n,0);
    } finally {afterDb.close();}
  }));
});
