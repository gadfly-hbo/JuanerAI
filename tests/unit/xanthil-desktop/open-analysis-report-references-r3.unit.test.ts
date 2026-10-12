import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {taskHash} from '../../../packages/product-core/member-task.ts';import {compileNumericReport,validateNumericReport} from '../../../packages/product-core/open-analysis-numeric-report.ts';
const f=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/operating-r3-report-synthetic.json',import.meta.url),'utf8')),context={identity:f.identity,sources:f.source};
test('VC-08/VU: grounded parent references can explain their actual child values and actual rounding metadata without inventing facts',()=>{
 const report=compileNumericReport(JSON.stringify(f.document),f.evidence,context);assert.equal(report.status,'complete',JSON.stringify(report.issues));assert.match(report.text,/比较期金额|本期金额/);assert.match(report.text,/保留2位小数/);assert.deepEqual(validateNumericReport(f.historical_report,f.evidence,context),f.historical_report);
 for(const edit of [(d:any)=>d.interpretations[2].interpretation=d.interpretations[2].interpretation.replace('F4/比较期金额','F4/虚构字段'),(d:any)=>d.interpretations[3].interpretation=d.interpretations[3].interpretation.replace('2位小数','5位小数')]){const d=structuredClone(f.document);edit(d);assert.equal(compileNumericReport(JSON.stringify(d),f.evidence,context).status,'partial');}
});

test('V13-METADATA01: actual referenced method scales are parameters, not unbound business amounts',()=>{
 const doc=(text:string,refs=['F1'])=>JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:refs,interpretation:text}]});
 for(const text of ['输入倍率与输出倍率均为1。','输入倍率为1，输出倍率为1。']){
  const report=compileNumericReport(doc(text),f.evidence,context);assert.equal(report.status,'complete',JSON.stringify(report.issues));assert.match(report.text,/倍率/);assert.deepEqual(validateNumericReport(report,f.evidence,context),report);
 }
 for(const [text,refs] of [['输入倍率与输出倍率均为2。',['F1']],['输入倍率为1。',[]],['输入倍率为1。',['F2']],['收入1元。',['F1']],['输入倍率为1，有1笔订单。',['F1']],['输出倍率为10000。',['F1']]] as [string,string[]][]){
  const report=compileNumericReport(doc(text,refs),f.evidence,context);assert.equal(report.status,'partial',text);assert.equal(report.issues[0]?.code,'REPORT_UNBOUND_NUMBER');
 }
 assert.deepEqual(validateNumericReport(f.historical_report,f.evidence,context),f.historical_report);
});


test('V13-METADATA02: unequal input scales cannot be called one shared input multiplier; real non-unit output remains explainable',()=>{
 const evidence=structuredClone(f.evidence);const first=evidence.verified_calculations[0],plan=first.execution_plan;plan.measure.inputs.push({...plan.measure.inputs[0],column:'another',scale:'10000'});plan.measure.output_scale='10000';
 first.calculation.plan_sha256=taskHash(plan);first.verification.plan_sha256=taskHash(plan);first.verification.result_sha256=taskHash(first.calculation);
 const doc=(text:string)=>JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1'],interpretation:text}]});
 assert.equal(compileNumericReport(doc('输出倍率为10000。'),evidence,context).status,'complete');
 for(const text of ['输入倍率为1。','输入倍率为10000。','输入倍率与输出倍率均为10000。','输出倍率为1。'])assert.equal(compileNumericReport(doc(text),evidence,context).status,'partial',text);
});


test('NR06: stored 1.9 parameter rejection stays unchanged while new 2.0 explains actual metadata',()=>{
 const doc=JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1'],interpretation:'输入倍率与输出倍率均为1。'}]});
 const old=compileNumericReport(doc,f.evidence,{...context,includeMeasureParameters:false});assert.equal(old.scope_contract,'1.9');assert.equal(old.status,'partial');const bytes=JSON.stringify(old);assert.deepEqual(validateNumericReport(old,f.evidence,context),old);assert.equal(JSON.stringify(old),bytes);
 const current=compileNumericReport(doc,f.evidence,context);assert.equal(current.scope_contract,'2.0');assert.equal(current.status,'complete');assert.notEqual(current.report_sha256,old.report_sha256);
});


test('V13-REPORT-JSON01: advertised production output and derivation examples are strict JSON consumed without parser repairs',async()=>{
 const {numericReportEditSystem}=await import('../../../packages/product-core/open-analysis-numeric-report.ts');
 const advertised=numericReportEditSystem.match(/严格只输出完整JSON，无围栏或前后说明：(.*?)。解释/s)?.[1];assert.ok(advertised);
 const document=JSON.parse(advertised);document.interpretations=[{references:['F1'],interpretation:'当前结果{{F1}}，原因需要更多资料。'}];
 const report=compileNumericReport(JSON.stringify(document),f.evidence,context);assert.equal(report.status,'complete',JSON.stringify(report.issues));assert.deepEqual(validateNumericReport(report,f.evidence,context),report);
 const example=numericReportEditSystem.match(/例如derivations:(.*?)。op仅/s)?.[1];assert.ok(example);const derived=JSON.parse(example);assert.equal(derived.length,2);assert.equal(derived[0].expression.op,'subtract');assert.equal(derived[1].expression.op,'divide');
 assert.throws(()=>compileNumericReport('{version:"1.3",status:"ready",derivations:[],interpretations:[]}',f.evidence,context));
});
