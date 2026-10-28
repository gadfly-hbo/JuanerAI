import test from 'node:test';
import assert from 'node:assert/strict';
import {compareReportNumber,reportNumberInventory,reportEdition,reportExecutedResults,reportComparisonRecords,requireReportMarkdown,reportExecutionMaterials,reportTextHash,reportNumberOccurrences,reportTextReview,reportUnreadMethodEvidence,type ReportCheckSource} from '../../../packages/product-core/report-postprocessing.ts';

test('ER01-01/03: ordinary sealed output candidates retain exact decimals, input identities and explicit unit interpretation',()=>{
 const subject='11111111-1111-4111-8111-111111111111',file='/synthetic/task/020_clean/independent/'+subject+'/independent_source/input/source-0.csv';
 const source:ReportCheckSource={task_directory:'/synthetic/task',path:'source/actual',file:'input/source-0.csv',content:'amount\n30\n',resource_content:'',sha256:'a'.repeat(64),source_id:'source',source_sha256:'b'.repeat(64),sheet_id:'csv',qualification:'observed',limitations:[],rows:[1,2],columns:['A'],cells:[{row:1,column:'A',value:'amount'},{row:2,column:'A',value:'30'}]};
 const content='{"total":"30","large":9007199254740993,"ratio":0.123456789012345678901,"a/b":{"~count":"2"}}';
 const output={path:'work/results.json',sha256:reportTextHash(content),content};
 const execution={invocation_id:'execution',command:'actual program',output:'saved file',exit_code:0,inputs:[{path:file,sha256:source.sha256}],artifacts:[],outputs:[output]};
 const completion={id:'completion',command_id:'command',work_id:'work',purpose:'analysis' as const,executions:[execution]};
 const decoded=reportExecutedResults(completion,subject,[source]);
 assert.deepEqual(decoded.results.map(r=>r.value),['30','9007199254740993','0.123456789012345678901','2']);
 assert.deepEqual(decoded.results.map(r=>r.evidence?.pointer),['/total','/large','/ratio','/a~1b/~0count']);
 const result=decoded.results[0];assert.equal(result.unit,'未声明');assert.equal(result.evidence?.sha256,output.sha256);assert.equal(result.sources[0].path,file);
 const edition=reportEdition('金额30元。'),proposal={number_ref:'n0',result_ref:result.ref,reported_unit:'CNY',computed_unit:'CNY',reason:'独立审阅真实程序及输入后解释单位',applicability:'supported',independence:'supported',coverage:'supported'};
 const bound=reportComparisonRecords([proposal],edition,'核对金额',[source],decoded.results);assert.equal(bound.bindings[0].computed_unit,'CNY');assert.deepEqual(bound.inventory.claims[0].source_paths,['source/actual']);
 const {computed_unit,...missing}=proposal;assert.equal(reportComparisonRecords([missing],edition,'核对金额',[source],decoded.results).bindings[0].computed_unit,undefined);
 assert.throws(()=>reportComparisonRecords([{...proposal,result_ref:'another-execution'}],edition,'核对金额',[source],decoded.results));
 assert.throws(()=>reportExecutedResults({...completion,executions:[{...execution,outputs:[{...output,content:'{"total":"31"}'}]}]},subject,[source]));
 assert.equal(reportExecutedResults({...completion,executions:[{...execution,exit_code:1}]},subject,[source]).results.length,0);
 const changed=reportExecutedResults({...completion,executions:[{...execution,inputs:[{path:file,sha256:'c'.repeat(64)}]}]},subject,[source]);assert.equal(changed.results[0].sources.length,0,'wrong input version cannot acquire source provenance');
 const materials=reportExecutionMaterials(subject,[execution],[source]);assert.equal([...materials.values()].filter(v=>v===content).length,1);
 assert.throws(()=>reportExecutionMaterials(subject,[{...execution,outputs:[{...output,path:'../outside.json'}]}],[source]));
 assert.throws(()=>reportExecutionMaterials(subject,[{...execution,outputs:[output,output]}],[source]));
});

function inputInventory(edition:ReturnType<typeof reportEdition>,claims:readonly Record<string,unknown>[],paths:readonly string[]){return reportNumberInventory(claims.map(({start,end,...meaning})=>({number_ref:'n'+reportNumberOccurrences(edition.text).findIndex(n=>n.start===start&&n.end===end),...meaning})),edition,paths);}

test('PRC01-04: no undeclared rounding tolerance; decimal and large integer comparison remain exact',()=>{
 assert.equal(compareReportNumber('30','30.4')?.consistent,false);
 assert.equal(compareReportNumber('30.3','30.34')?.consistent,false);
 assert.equal(compareReportNumber('9,007,199,254,740,993','9007199254740993')?.consistent,true);
 assert.equal(compareReportNumber('9007199254740993','9007199254740992')?.delta,'-1');
 assert.equal(compareReportNumber('0.10','0.1')?.consistent,true);
});

test('PRC01-V002: occurrence identities are system-assigned, stable across extraction order and distinct for the same value in different ranges',()=>{
 const e=reportEdition('范围甲30元；范围乙30元。'),claim=(start:number,scope:string)=>({start,end:start+2,kind:'derived',definition:'本范围金额合计',unit:'CNY',scope,source_paths:['source/actual'],prerequisites:[]});
 const a=claim(e.text.indexOf('30'),'范围甲'),b=claim(e.text.lastIndexOf('30'),'范围乙');
 const inventory=inputInventory(e,[b,a],['source/actual']);assert.deepEqual(inventory.claims.map(c=>c.scope),['范围甲','范围乙']);assert.equal(new Set(inventory.claims.map(c=>c.id)).size,2);assert.ok(inventory.claims.every(c=>/^number-[a-f0-9]{32}$/.test(c.id)));assert.deepEqual(inputInventory(e,[a,b],['source/actual']),inventory);
 const moved=reportEdition('2027\n\n'+e.text),shift=(c:typeof a)=>({...c,start:c.start+6,end:c.end+6}),withDate=inputInventory(moved,[{start:0,end:4,kind:'context',definition:'用户给定年份',unit:'年份',scope:'标题',source_paths:[],prerequisites:[]},shift(b),shift(a)],['source/actual']);
 assert.deepEqual(withDate.claims.filter(c=>c.kind==='derived').map(c=>c.id),inventory.claims.map(c=>c.id),'inserting a non-measurement occurrence must not reset existing evidence identities');
 const other=inputInventory(e,[{...a,source_paths:['source/other']},b],['source/actual','source/other']);assert.notEqual(other.claims[0].id,inventory.claims[0].id,'different source identity cannot reuse the old quantity');
 assert.throws(()=>inputInventory(e,[{...a,id:'expected-amount-30'}],['source/actual']));
});

test('PRC01-V005: method resources bind each actual pre-execution file version and reject altered bytes or an escaping program locator',()=>{
 const content='NR>1{sum+=$2} END{print sum}',fact={invocation_id:'owned-unit-fact',command:'exec /usr/bin/awk -f checker.awk input/source-0.csv',output:'30',exit_code:0,inputs:[],artifacts:[{path:'checker.awk',content,sha256:reportTextHash(content)}]};
 const subject='11111111-1111-4111-8111-111111111111',sources=[{task_directory:'/synthetic/task',path:'/synthetic/task/020_clean/source/current/table.txt',file:'input/source-0.csv',content:'value\n1\n'}],base='/synthetic/task/020_clean/independent/'+subject+'/method_review/postcheck/';const materials=reportExecutionMaterials(subject,[fact],sources);assert.equal(materials.get(base+'execution-0/files/checker.awk'),content);assert.ok(materials.get(base+'execution.json')!.includes(reportTextHash(content)));
 assert.throws(()=>reportExecutionMaterials(subject,[{...fact,artifacts:[{...fact.artifacts[0],content:'changed program'}]}],sources));
 assert.throws(()=>reportExecutionMaterials(subject,[{...fact,artifacts:[{...fact.artifacts[0],path:'../outside.awk'}]}],sources));
});

test('PE01-F001: only actual matching-version contiguous read coverage satisfies sealed method evidence',()=>{
 const path='/synthetic/method/sealed-program.txt',content='first line\nsecond line',sha256=reportTextHash(content),material=new Map([[path,content]]),first={path,sha256,first_line:1,last_line:1,invocation_id:'first-page'},last={path,sha256,first_line:2,last_line:2,invocation_id:'last-page'};
 assert.deepEqual(reportUnreadMethodEvidence(material,[]),[path]);assert.deepEqual(reportUnreadMethodEvidence(material,[first]),[path]);assert.deepEqual(reportUnreadMethodEvidence(material,[first,{...last,sha256:'f'.repeat(64)}]),[path]);assert.deepEqual(reportUnreadMethodEvidence(material,[{...first,path:'/synthetic/other-version.txt',last_line:2}]),[path]);assert.deepEqual(reportUnreadMethodEvidence(material,[last,first]),[]);
});

test('RP01-03: one invalid program result does not erase unrelated sealed evidence',()=>{
 const subject='11111111-1111-4111-8111-111111111111',file='/synthetic/task/020_clean/independent/'+subject+'/independent_source/input/source-0.csv';
 const source:ReportCheckSource={task_directory:'/synthetic/task',path:'source/actual',file:'input/source-0.csv',content:'amount\n30\n',resource_content:'',sha256:'a'.repeat(64),source_id:'source',source_sha256:'b'.repeat(64),sheet_id:'csv',qualification:'observed',limitations:[],rows:[1,2],columns:['A'],cells:[{row:2,column:'A',value:'30'}]};
 const valid={claim_id:'actual-total',value:'30',unit:'CNY',sources:[{path:file,rows:[2],columns:['A']}]},completion={id:'actual-completion',command_id:'actual-command',work_id:'work',purpose:'analysis' as const,executions:[{invocation_id:'actual-invocation',command:'unit fixture',output:JSON.stringify({values:[valid,{...valid,claim_id:'bad-source',sources:[{path:file,rows:[99],columns:['A']}]},{...valid,claim_id:'bad-number',value:'unknown'}]}),exit_code:0,inputs:[{path:file,sha256:source.sha256}],artifacts:[]}]};
 const decoded=reportExecutedResults(completion,subject,[source]);assert.deepEqual(decoded.results.map(r=>r.ref),['r0']);assert.equal(decoded.results[0].value,'30');assert.equal(decoded.limitations.length,2);
 const duplicate=reportExecutedResults({...completion,executions:[{...completion.executions[0],output:JSON.stringify({values:[valid,valid]})}]},subject,[source]);assert.equal(duplicate.results.length,0);assert.ok(duplicate.limitations.length);
 for(const shape of [valid,{bundle:[valid]},{bundle:{values:[valid,'17']}}]){
  const accepted=reportExecutedResults({...completion,executions:[{...completion.executions[0],output:JSON.stringify(shape)}]},subject,[source]);
  assert.equal(accepted.results.filter(r=>!r.evidence).length,1);assert.equal(accepted.results.find(r=>!r.evidence)!.unit,'CNY');assert.deepEqual(accepted.results.find(r=>!r.evidence)!.sources,valid.sources);
 }
 const nestedDuplicate=reportExecutedResults({...completion,executions:[{...completion.executions[0],output:JSON.stringify({one:valid,nested:[valid],normal:'17'})}]},subject,[source]);assert.deepEqual(nestedDuplicate.results.map(r=>r.value),['17']);assert.ok(nestedDuplicate.limitations.length);
 for(const invalid of [[{...valid,sources:[{path:file,rows:[99],columns:['A']}]}],{...valid,sources:[]}]){
  const kept=reportExecutedResults({...completion,executions:[{...completion.executions[0],output:JSON.stringify({values:invalid,total:'30'})}]},subject,[source]);
  assert.deepEqual(kept.results.map(r=>r.evidence?.pointer),['/total'],'invalid explicit evidence cannot leak its bare numbers; unrelated ordinary fields remain available');assert.ok(kept.limitations.length);
 }
 const fact=completion.executions[0],multi=reportExecutedResults({...completion,executions:[{...fact,output:JSON.stringify({values:[valid]})},{...fact,invocation_id:'second-execution',inputs:[{path:file,sha256:'c'.repeat(64)}],output:JSON.stringify({values:[{...valid,value:'99'}]})},{...fact,invocation_id:'third-execution',output:JSON.stringify({values:[{...valid,value:'31'}]})},{...fact,invocation_id:'ordinary-check',output:'normal check done'}]},subject,[source]);
 assert.deepEqual(multi.results.map(r=>[r.ref,r.value]),[['r0','30'],['e2r0','31']],'each successful result has its own actual execution; a different execution cannot lend its input hash');assert.ok(multi.limitations.length>=2);
 const edition=reportEdition('当前金额30元；其他范围99元。'),proposal={number_ref:'n0',result_ref:'r0',reported_unit:'CNY',applicability:'supported',independence:'supported',coverage:'supported',reason:'实际来源和执行覆盖该项。'};
 const bound=reportComparisonRecords([proposal],edition,'核对当前全部样本',[source],decoded.results);assert.equal(bound.inventory.claims[0].unit,'CNY');assert.deepEqual(bound.inventory.claims[0].source_paths,['source/actual']);assert.equal(bound.inventory.uncovered[0].text,'99');assert.equal(bound.bindings[0].result_ref,'r0');
 for(const args of [{...proposal,result_ref:'r99'},{...proposal,number_ref:'n99'},{...proposal,id:'model-invented'},{contract:proposal}])assert.throws(()=>reportComparisonRecords([args],edition,'核对样本',[source],decoded.results));
 assert.throws(()=>reportComparisonRecords([proposal,proposal],edition,'核对样本',[source],decoded.results));
});

test('RP01-01: formal Markdown rejects metadata envelopes without parsing a prose body into a new schema',()=>{
 for(const value of ['{}','[]','{"report_id":"metadata"}','```json\n{"body":"guessed"}\n```','```\n[]\n```','```JSON\n{}\n```','~~~json\n[]\n~~~','````json\n{}\n`````','~~~~JSON\r\n[]\r\n  ~~~~~  ','```json\n{}','~~~json\n[]','~~~~plain\r[]\r  ~~~~~','```JSON\r{}'])assert.throws(()=>requireReportMarkdown(value),{code:'REPORT_MARKDOWN_REQUIRED'});
 for(const value of ['当前有限观察，来源尚待补充。','# 报告\n\n正常正文。\n\n```json\n{"example":1}\n```','# 报告\n\n正常正文。\n\n~~~JSON\n{"example":1}\n~~~'])assert.equal(requireReportMarkdown(value),value);
});

test('PRC02-01/03: declared refs bind exact Unicode occurrences; unknown, duplicate, undeclared and unauthorized inputs fail',()=>{
 const e=reportEdition('📈2027\n\n范围甲30元；范围乙30元。'),c={number_ref:'n1',kind:'derived',definition:'当前范围金额',unit:'CNY',scope:'范围甲',source_paths:['authorized'],prerequisites:[]};
 const value=reportNumberInventory([c],e,['authorized']);
 assert.equal(value.report_sha256,e.sha256);assert.equal(value.claims[0].start,e.text.indexOf('30'));assert.equal(value.claims[0].end,e.text.indexOf('30')+2);assert.equal(value.uncovered.length,2);
 for(const claims of [[{...c,number_ref:'n99'}],[c,c],[{...c,report_sha256:e.sha256}],[{...c,start:0,end:2}],[{...c,source_paths:['other']}],[{contract:c}]])assert.throws(()=>reportNumberInventory(claims,e,['authorized']));
 assert.equal(reportNumberInventory([],e,['authorized']).uncovered.length,3,'no inventory cannot claim zero uncovered');
});

test('PRC02-02: exact quote selects one actual paragraph; ambiguous, wrong, fuzzy and mechanical echoes cannot qualify',()=>{
 const e=reportEdition('发现。\n\n建议补证。'),completion={id:'review-completion',work_id:'review-work',command_id:'review-command',purpose:'conclusion_strategy_review' as const};
 const c={kind:'strategy',paragraph_ref:'p1',quote:'建议补证。',verdict:'conditional',reason:'资料尚不足，只补证。',evidence:[{kind:'condition',quote:'当前样本'}],conditions:[{text:'取得补证资料',status:'unknown',evidence:[]}],limitations:[]};
 const raw={reviewed_paragraphs:['p0','p1'],claims:[c],uncovered:[],limitations:[]};
 const checked=reportTextReview(raw,e,'initial','当前样本',[],completion);
 assert.equal(checked.claims[0].start,e.text.indexOf('建议'));assert.equal(checked.claims[0].eligible,false);assert.equal(checked.phase,'initial');assert.equal(checked.report_sha256,e.sha256);
 for(const x of [{...raw,report_sha256:e.sha256},...['建议 补证。','不存在'].map(quote=>({...raw,claims:[{...c,quote}]})),...['p0','p99'].map(paragraph_ref=>({...raw,claims:[{...c,paragraph_ref}]})),{...raw,claims:[{...c,start:0,end:1}]},{...raw,claims:[{...c,id:'model-choice'}]}])assert.throws(()=>reportTextReview(x,e,'initial','当前样本',[],completion));
 assert.deepEqual(reportTextReview({...raw,reviewed_paragraphs:['p0']},e,'initial','当前样本',[],completion).uncovered,['尚未覆盖段落 p1']);
 const duplicate=reportEdition('发现。\n\n建议补证。建议补证。');assert.throws(()=>reportTextReview(raw,duplicate,'initial','当前样本',[],completion));
 const equalParagraphs=reportEdition('建议补证。\n\n建议补证。');assert.equal(reportTextReview(raw,equalParagraphs,'initial','当前样本',[],completion).claims[0].start,equalParagraphs.text.lastIndexOf('建议'));
});


test('PRC02-V001: numeric location preserves unsupported signs, enclosures and compounds; exact decimal comparison never receives a positive fragment',()=>{
 for(const literal of ['--30','±30','−30','− 30','(30)','（30）','(30 CNY)','﹣30','－30','30/40','1,2','30..40','1e−3','.5','0x10','30\u202f000','30 000','0．30','30 / 2','30*2','30^2','30_000','30 * 2','30 ^ 2','30 ⊗ 2','30 💫 2','(30 / 2)','30 + (2)','(30)+(2)']){const values=reportNumberOccurrences('金额'+literal+'；另有30元。');assert.equal(values[0].text,literal,literal);assert.equal(values[1].text,'30',literal);assert.equal(compareReportNumber(values[0].text,'30'),null,literal);}
 for(const literal of ['-30','+30','1.2','1e-3','1,000'])assert.equal(reportNumberOccurrences('金额'+literal+'元。')[0].text,literal);
 assert.equal(compareReportNumber('-30','30')!.consistent,false);assert.equal(compareReportNumber('-30','30')!.delta,'60');assert.equal(compareReportNumber('1e-3','0.001')!.consistent,true);
 assert.equal(reportNumberOccurrences('- 30元')[0].text,'30','ordinary Markdown bullet is not a negative sign');
 assert.equal(reportNumberOccurrences('金额 - 30元')[0].text,'- 30','ambiguous spaced negative must not certify a positive fragment');
});

test('PRC02-V001: existing Markdown presentation and actual clause/cell/line boundaries preserve supported scalar checks',()=>{
 for(const literal of ['**30元**','`30`元','**金额30**元','* 30元','- **30**元','金额**30**元'])assert.equal(reportNumberOccurrences(literal)[0].text,'30',literal);
 for(const body of ['|30|2|','30\n2','30；2','30、2','30。2'])assert.deepEqual(reportNumberOccurrences(body).map(n=>n.text),['30','2'],body);
 assert.equal(reportNumberOccurrences('**30 / 2**元')[0].text,'30 / 2');assert.equal(reportNumberOccurrences('`30*2`元')[0].text,'30*2');
 assert.equal(reportNumberOccurrences('金额 − **30**元')[0].text,'− **30');
});

test('PRC02-V001: Unicode combining, presentation and format characters remain in the complete occurrence at UTF16 positions',()=>{
 for(const modifier of ['\u0301','\uFE0F','\u{E0100}','\u2060','\u200D'])for(const literal of ['30'+modifier,'30 '+modifier+' 2','−'+modifier+' 30','30 ✖'+modifier+' 2']){
  const body='📈金额'+literal+'；另有30元。',values=reportNumberOccurrences(body);assert.equal(values[0].text,literal,literal);assert.equal(body.slice(values[0].start,values[0].end),literal);assert.equal(values[1].text,'30');assert.equal(compareReportNumber(values[0].text,'30'),null);
 }
});


