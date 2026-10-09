import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {createDuckDbPythonDesktopLocalAnalysisExecution} from '../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {createMemberSourcePreparation} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import {readDesktopPythonTool} from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
import {browserSourceFixture,browserBindingFixture,browserCandidateFixture,fixtureWorkbook} from '../../fixtures/xanthil-desktop/browser-sources.ts';
import {fixturePlan} from '../../fixtures/xanthil-desktop/member-analysis.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

type Inspect=ReturnType<typeof preparation>['inspectSources'];
function execution(){const bin=process.env.JUANERAI_TOOLCHAIN_BIN;assert.ok(bin,'exact toolchain prerequisite');const python=readDesktopPythonTool(bin);return createDuckDbPythonDesktopLocalAnalysisExecution({duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2',...python});}
function preparation(){const bin=process.env.JUANERAI_TOOLCHAIN_BIN;assert.ok(bin);return createMemberSourcePreparation(readDesktopPythonTool(bin));}
function inspectSources():Inspect{const fn=Reflect.get(preparation(),'inspectSources');assert.equal(typeof fn,'function','BF-CAP04: actual preparation adapter must expose trusted multisource inspection');return fn;}

test('BF-CAP04 E02-a: three real sources include both workbook sheets with exact source/row/cell identity',async()=>{
 const sources=browserSourceFixture(),before=sources.map(s=>Buffer.from(s.bytes));
 const base=browserEvidenceRoot;mkdirSync(base,{recursive:true});const root=mkdtempSync(join(base,'sources-'));
 for(const source of sources)writeFileSync(join(root,source.source_id+'.'+source.format),source.bytes,{flag:'wx'});
 const result=await inspectSources()({sources,cancellation_signal:new AbortController().signal,deadline_seconds:10});
 writeFileSync(join(root,'inspection.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 assert.equal(result.version,'1.0');assert.equal(result.sources.length,3);
 for(const [i,source] of result.sources.entries()){assert.equal(source.source_id,sources[i].source_id);assert.equal(source.sha256,createHash('sha256').update(before[i]).digest('hex'));assert.equal(source.byte_length,String(before[i].length));assert.deepEqual(sources[i].bytes,before[i]);}
 const workbook=result.sources[1];assert.deepEqual(workbook.sheets.map(s=>s.name),['比较期','本期']);
 assert.deepEqual(workbook.sheets.map(s=>s.rows.map(r=>r.row)),[[1,2,3],[1,2,3]]);
 assert.deepEqual(workbook.sheets[0].rows[2].cells[3],{column:'D',type:'string',value:'20.00'});
 assert.deepEqual(workbook.sheets[1].rows[2].cells[3],{column:'D',type:'string',value:'30.00'});
 assert.equal(result.sources[2].sheets[0].rows[2].cells[0].value,'c3');
});

test('BF-CAP01/04 E02-b: independently qualified three-source candidate feeds the actual M1 and independent verifier',async()=>{
 const sources=browserSourceFixture(),bindings=browserBindingFixture(sources),candidate=browserCandidateFixture(),adapter=execution();
 const qualify=Reflect.get(preparation(),'qualifySources');
 assert.equal(typeof qualify,'function','BF-CAP04: candidate conversion must be checked independently before metrics');
 const qualified=await qualify({sources,bindings,candidate,cancellation_signal:new AbortController().signal,deadline_seconds:10});
 assert.equal(qualified.status,'qualified');assert.equal(qualified.source_set.sources.length,3);assert.equal(qualified.lineage.length,8);
 assert.equal(qualified.normalized.orders.sha256,createHash('sha256').update(candidate.orders_bytes).digest('hex'));
 const plan=fixturePlan(candidate),implementation=await adapter.describeImplementation({execution_plan:plan});
 const request={run_id:'01991a00-0000-7000-8000-000000000051',expected_code_identity:implementation.code_identity,contract:{...plan.parameters,schema_version:'2.0',execution_plan:plan},snapshot:candidate,group_pseudonym_map:{North:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',South:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},cancellation_signal:new AbortController().signal,deadline_seconds:30};
 const primary=await adapter.calculate(request),independent=await adapter.verify(request);
 assert.deepEqual(primary.result,independent.result);assert.equal(primary.result.m2.status,'not_selected');
 assert.equal(primary.result.periods.comparison.repeat_revenue_fen,'2000');assert.equal(primary.result.periods.current.repeat_revenue_fen,'3000');
 assert.deepEqual(primary.result.periods.current.repurchase_rate,{numerator:'1',denominator:'2'});
 const root=browserEvidenceRoot;writeFileSync(join(root,'qualified-m1.json'),JSON.stringify({qualified,plan,primary,independent},null,2)+'\n',{flag:'wx'});
});

test('BF-CAP04 E02-b: row loss, wrong conversion or an unconsumed sheet rejects before metric agreement matters',async t=>{
 for(const mutation of ['lost-row','wrong-amount','duplicate-row','missing-sheet','duplicate-binding','wrong-member'])await t.test(mutation,async()=>{
  const sources=browserSourceFixture(),bindings=browserBindingFixture(sources),candidate=browserCandidateFixture(),adapter=execution();
  const qualify=Reflect.get(preparation(),'qualifySources');assert.equal(typeof qualify,'function');
  if(mutation==='lost-row')candidate.orders_bytes=Buffer.from(candidate.orders_bytes.toString().replace('c3,m2,2026-02-02,10.00,paid,CNY\n',''));
  if(mutation==='wrong-amount')candidate.orders_bytes=Buffer.from(candidate.orders_bytes.toString().replace('30.00','300.00'));
  if(mutation==='duplicate-row')candidate.orders_bytes=Buffer.from(candidate.orders_bytes.toString()+'c3,m2,2026-02-02,10.00,paid,CNY\n');
  if(mutation==='missing-sheet')bindings.splice(2,1);
  if(mutation==='duplicate-binding')bindings.push(bindings[0]);
  if(mutation==='wrong-member')candidate.orders_bytes=Buffer.from(candidate.orders_bytes.toString().replace('c3,m2','c3,m1'));
  await assert.rejects(()=>qualify({sources,bindings,candidate,cancellation_signal:new AbortController().signal,deadline_seconds:10}));
 });
});

test('BF-CAP04 E02-a: shared strings and styled Excel dates preserve the declared cell meanings',async()=>{
 const source=browserSourceFixture()[1];
 source.bytes=fixtureWorkbook([{name:'Values',xml:'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" s="1"><v>45292</v></c><c r="C1" t="n"><v>12.50</v></c><c r="D1" t="b"><v>1</v></c></row></sheetData></worksheet>'}],
 [['xl/sharedStrings.xml','<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>日期</t></si></sst>'],['xl/styles.xml','<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>']]);
 const result=await inspectSources()({sources:[source],cancellation_signal:new AbortController().signal,deadline_seconds:10});
 assert.deepEqual(result.sources[0].sheets[0].rows[0].cells,[{column:'A',type:'string',value:'日期'},{column:'B',type:'date',value:'2024-01-01',source_value:'45292'},{column:'C',type:'number',value:'12.50'},{column:'D',type:'boolean',value:'1'}]);
});

test('BF-CAP04 E02-a: corrupt, formula, external and ambiguous cell sources cannot acquire extraction evidence',async t=>{
 const sheet=(cell:string)=>`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${cell}</row></sheetData></worksheet>`;
 for(const variant of [
  {name:'corrupt archive',bytes:Buffer.from('not a ZIP')},
  {name:'cached formula is not a verified value',bytes:fixtureWorkbook([{name:'Data',xml:sheet('<c r="A1"><f>1+1</f><v>2</v></c>')}])},
  {name:'duplicate coordinate',bytes:fixtureWorkbook([{name:'Data',xml:sheet('<c r="A1"><v>1</v></c><c r="A1"><v>2</v></c>')}])},
  {name:'external relation',bytes:fixtureWorkbook([{name:'Data',xml:sheet('<c r="A1"><v>1</v></c>')}],[['xl/_rels/external.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="external" TargetMode="External" Target="https://invalid.example/"/></Relationships>']])},
  {name:'XML entity',bytes:fixtureWorkbook([{name:'Data',xml:'<!DOCTYPE worksheet [<!ENTITY x "bad">]>'+sheet('<c r="A1" t="str"><v>&x;</v></c>')}])},
 ])await t.test(variant.name,async()=>{const source={...browserSourceFixture()[1],bytes:variant.bytes};await assert.rejects(()=>inspectSources()({sources:[source],cancellation_signal:new AbortController().signal,deadline_seconds:10}),error=>typeof error==='object'&&error!==null&&'code' in error&&String(error.code).startsWith('SOURCE_'));});
});

test('BF-CAP04 E02-a: unsupported date semantics and out-of-range coordinates are refused, never numeric guesses',async t=>{
 const sheet=(cell:string)=>`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${cell}</row></sheetData></worksheet>`;
 for(const variant of [
  {name:'invalid ISO date',xml:sheet('<c r="A1" t="d"><v>2026-02-30</v></c>'),extra:[]},
  {name:'time-only built-in format',xml:sheet('<c r="A1" s="1"><v>0.5</v></c>'),extra:[['xl/styles.xml','<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs><xf numFmtId="0"/><xf numFmtId="45"/></cellXfs></styleSheet>'] as const]},
  {name:'column beyond XFD',xml:sheet('<c r="XFE1"><v>1</v></c>'),extra:[]},
 ])await t.test(variant.name,async()=>{
  const source={...browserSourceFixture()[1],bytes:fixtureWorkbook([{name:'Data',xml:variant.xml}],variant.extra)};
  await assert.rejects(()=>inspectSources()({sources:[source],cancellation_signal:new AbortController().signal,deadline_seconds:10}));
 });
});

test('BF-CAP04 E02-a: shared-string expansion is bounded before constructing the output',async()=>{
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const rows=Array.from({length:600},(_,i)=>`<row r="${i+1}"><c r="A${i+1}" t="s"><v>0</v></c></row>`).join('');
 const bytes=fixtureWorkbook([{name:'Repeated',xml:`<worksheet xmlns="${ns}"><sheetData>${rows}</sheetData></worksheet>`}],
  [['xl/sharedStrings.xml',`<sst xmlns="${ns}"><si><t>${'x'.repeat(32767)}</t></si></sst>`]]);
 const source={...browserSourceFixture()[1],bytes};
 await assert.rejects(()=>inspectSources()({sources:[source],cancellation_signal:new AbortController().signal,deadline_seconds:10}),{code:'SOURCE_CAPACITY'});
});


test('E03-c: preparation execution validates identity and cancellation before creating a run or starting isolation',async()=>{
 const execute=Reflect.get(preparation(),'executePreparation');
 assert.equal(typeof execute,'function','E03-c actual product executor is missing');
 const sources=browserSourceFixture().map(s=>({...s,sha256:createHash('sha256').update(s.bytes).digest('hex')}));
 const code='raise RuntimeError("must not execute")',root=join(browserEvidenceRoot,'never-start');
 const request={version:'1.0',sources,code,code_sha256:createHash('sha256').update(code).digest('hex'),run_directory:root,cancellation_signal:AbortSignal.abort()};
 await assert.rejects(()=>execute(request),{code:'CANCELLED',physical_status:'not_started'});
 await assert.rejects(()=>execute({...request,cancellation_signal:new AbortController().signal,code_sha256:'0'.repeat(64)}),{code:'PREPARATION_IDENTITY_INVALID',physical_status:'not_started'});
 const {existsSync}=await import('node:fs');assert.equal(existsSync(root),false);
});


test('E03-c: untrusted output admission requires exact regular single-link files and immutable directory identity',async()=>{
 const {readPreparationOutputs}=await import('../../../adapters/analytics-duckdb/member-preparation-executor.ts');
 const {lstatSync,linkSync,symlinkSync}=await import('node:fs');
 const root=mkdtempSync(join(browserEvidenceRoot,'output-admission-'));
 for(const variant of ['valid','partial','extra','symlink','hardlink','oversize','directory','identity']){
  const dir=join(root,variant);mkdirSync(dir);
  writeFileSync(join(dir,'members.csv'),'a\n1\n');
  if(variant==='symlink')symlinkSync(join(dir,'members.csv'),join(dir,'orders.csv'));
  else if(variant==='hardlink')linkSync(join(dir,'members.csv'),join(dir,'orders.csv'));
  else if(variant==='directory')mkdirSync(join(dir,'orders.csv'));
  else if(variant!=='partial')writeFileSync(join(dir,'orders.csv'),variant==='oversize'?Buffer.alloc(1048577):'b\n2\n');
  if(variant==='extra')writeFileSync(join(dir,'unrequested.txt'),'detail');
  const id=lstatSync(dir);
  if(variant==='valid'){const candidate=readPreparationOutputs(dir,id);assert.equal(candidate.members_bytes.toString(),'a\n1\n');assert.equal(candidate.orders_bytes.toString(),'b\n2\n');}
  else assert.throws(()=>readPreparationOutputs(dir,{dev:id.dev,ino:variant==='identity'?id.ino+1:id.ino}),{code:'PREPARATION_OUTPUT_INVALID'},variant);
 }
});

test('E03-c: reusing a prior run is a stable pre-payload failure and preserves its evidence',async()=>{
 const execute=preparation().executePreparation,root=mkdtempSync(join(browserEvidenceRoot,'existing-preparation-'));
 writeFileSync(join(root,'retained.txt'),'original failure\n',{flag:'wx'});
 const code='raise RuntimeError("must not run")';
 await assert.rejects(()=>execute({version:'1.0',sources:browserSourceFixture().map(s=>({...s,sha256:createHash('sha256').update(s.bytes).digest('hex')})),code,code_sha256:createHash('sha256').update(code).digest('hex'),run_directory:root,cancellation_signal:new AbortController().signal}),{code:process.platform==='darwin'?'PREPARATION_DIRECTORY_INVALID':'ISOLATION_UNAVAILABLE'});
 const {readFileSync,readdirSync}=await import('node:fs');assert.deepEqual(readdirSync(root),['retained.txt']);assert.equal(readFileSync(join(root,'retained.txt'),'utf8'),'original failure\n');
});


test('E03-c: exact host health producer passes actual identity admission without starting a supervisor',async()=>{
 const fixturePath='../../fixtures/xanthil-desktop/preparation-isolation-payloads.mjs';
 const {fixedPreparationSources,fixedPayload}=await import(fixturePath);
 const root=mkdtempSync(join(browserEvidenceRoot,'host-admission-')),code=fixedPayload('health');
 const request={version:'1.0',sources:fixedPreparationSources(),code,code_sha256:createHash('sha256').update(code).digest('hex'),run_directory:root,cancellation_signal:new AbortController().signal};
 const execute=preparation().executePreparation;
 await assert.rejects(()=>execute(request),{code:process.platform==='darwin'?'PREPARATION_DIRECTORY_INVALID':'ISOLATION_UNAVAILABLE'});
 for(const variant of ['uuid','source-hash','code-hash']){
  const negative={...request,sources:fixedPreparationSources()};
  if(variant==='uuid')negative.sources[0].source_id='01991a00-0000-7000-8000-000000000001';
  if(variant==='source-hash')negative.sources[0].sha256='0'.repeat(64);
  if(variant==='code-hash')negative.code_sha256='0'.repeat(64);
  await assert.rejects(()=>execute(negative),{code:'PREPARATION_IDENTITY_INVALID'},variant);
 }
 const {readdirSync}=await import('node:fs');assert.deepEqual(readdirSync(root),[]);
});


test('E03-c: trusted CPU accounting measures work independently of wall time and refuses unavailable usage',async()=>{
 const {spawnSync}=await import('node:child_process');
 const {fileURLToPath}=await import('node:url');
 const helper=fileURLToPath(new URL('../../../adapters/analytics-duckdb/member-preparation-supervisor.py',import.meta.url));
 const program=String.raw`
import os,runpy,sys,time
m=runpy.run_path(sys.argv[1])
# This imports definitions only: no fork, payload, policy installation or host suite.
assert m['usage_seconds'](24000000,24000000,125,3)==2.0
assert m['usage_seconds'](1000000000,0,1,1)==1.0
for numer,denom in [(0,1),(1,0)]:
    try: m['usage_seconds'](1,1,numer,denom)
    except ValueError: pass
    else: raise AssertionError('invalid timebase accepted')
assert m['resource_failure'](0,1.999) is None
assert m['resource_failure'](0,2.0)=='CPU_LIMIT'
assert m['resource_failure'](0,4.006849)=='CPU_LIMIT'
assert m['resource_failure'](96*1024*1024+1,0)=='MEMORY_LIMIT'
if sys.platform=='darwin':
    read=m['create_usage_reader']()
    before=read(os.getpid()); own_before=time.process_time()
    end=time.process_time()+0.08
    while time.process_time()<end: pass
    after=read(os.getpid()); own_after=time.process_time()
    measured=after['cpu_seconds']-before['cpu_seconds']
    expected=own_after-own_before
    assert measured>0.05 and abs(measured-expected)<0.03,(measured,expected)
    time.sleep(0.05)
    sleeping=read(os.getpid())['cpu_seconds']-after['cpu_seconds']
    assert sleeping<0.03,sleeping
    assert after['resident_bytes']>0
    try: read(-1)
    except OSError: pass
    else: raise AssertionError('unavailable accounting must fail closed')
    original_clock=m['time'].process_time
    m['time'].process_time=lambda: original_clock()+1
    try:
        try: m['create_usage_reader']()
        except OSError: pass
        else: raise AssertionError('invalid calibration must fail before payload')
    finally: m['time'].process_time=original_clock
print('trusted CPU threshold and native self-accounting passed; no policy or payload execution')
`;
 const result=spawnSync(join(process.env.JUANERAI_TOOLCHAIN_BIN!,'python3'),['-I','-B','-c',program,helper],{encoding:'utf8',timeout:5000,env:{PATH:'/usr/bin:/bin'}});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/trusted CPU threshold/);
});


test('E03-d: settlement evidence binds the local Adapter failure and exact operation, never a caller copy',async()=>{
 const {randomUUID}=await import('node:crypto');
 const port=preparation(),context={task_id:randomUUID(),operation_id:randomUUID(),execution_id:randomUUID(),epoch:3};
 const request={version:'1.0',sources:[],code:'',code_sha256:'0'.repeat(64),run_directory:join(browserEvidenceRoot,'never-context-start'),cancellation_signal:AbortSignal.abort(),operation_context:context};
 let error:unknown;
 try{await port.executePreparation(request);}catch(value){error=value;}
 assert.deepEqual(port.describePreparationFailure(error),{physical_status:'not_started',operation_context:context});
 assert.equal(port.describePreparationFailure(Object.assign(new Error('CANCELLED'),{code:'CANCELLED',physical_status:'settled',operation_context:context})),null);
 const copied=port.describePreparationFailure(error)!;Reflect.set(copied.operation_context!,'epoch',9);
 assert.deepEqual(port.describePreparationFailure(error),{physical_status:'not_started',operation_context:context});
});
