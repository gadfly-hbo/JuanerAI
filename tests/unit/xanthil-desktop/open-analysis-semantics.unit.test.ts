import test from 'node:test';
import assert from 'node:assert/strict';
import * as context from '../../../packages/product-core/open-analysis-context.ts';
const raw={definitions:[{dimension:'metric',value:'净销售额',user_quote:null}],conflicts:[{dimension:'metric',question:'订单金额还是扣除退款后的净销售额？',alternatives:['订单金额','净销售额'],resolution_quote:null}]};
function compile(){const fn=Reflect.get(context,'compileOpenSemanticAssessment');assert.equal(typeof fn,'function','FM-A01: real task-local meaning assessment is required');return fn;}
test('FM-A01: model meaning remains a proposal and a critical conflict cannot disappear in a later tool update',()=>{const f=compile(),a=f(raw,'分析销售额');assert.equal(a.scope,'current_task');assert.equal(a.definitions[0].classification,'MODEL_CANDIDATE');assert.equal(a.conflicts[0].state,'unresolved');const b=f({definitions:[],conflicts:[]},'分析销售额',a);assert.deepEqual(b.conflicts,a.conflicts);});
test('FM-A01: only the current actual user choice resolves a critical conflict; fabricated confirmation rejects',()=>{const f=compile(),a=f(raw,'分析销售额');assert.throws(()=>f({...raw,conflicts:[{...raw.conflicts[0],resolution_quote:'本次使用净销售额'}]},'分析销售额',a),{code:'SEMANTIC_CONFIRMATION_INVALID'});const b=f({definitions:[{dimension:'metric',value:'净销售额',user_quote:'本次使用净销售额'}],conflicts:[{...raw.conflicts[0],resolution_quote:'本次使用净销售额'}]},'本次使用净销售额',a);assert.equal(b.conflicts[0].state,'resolved');assert.equal(b.conflicts[0].selected,'净销售额');assert.equal(b.definitions[0].classification,'USER_CONFIRMED');assert.throws(()=>f({definitions:[],conflicts:[{...raw.conflicts[0],resolution_quote:'订单金额和净销售额'}]},'订单金额和净销售额',a),{code:'SEMANTIC_CONFIRMATION_INVALID'});});
test('FM-A01: no invented enterprise/project version, source authority or hypothesis confirmation is accepted',()=>{const f=compile();assert.throws(()=>f({...raw,scope:'project-v2'},'分析销售额'),{code:'VALIDATION_FAILED'});assert.throws(()=>f({definitions:[{dimension:'metric',value:'净销售额',user_quote:'分析销售额',classification:'SOURCE_FACT'}],conflicts:[]},'分析销售额'),{code:'VALIDATION_FAILED'});});

test('Q11-UX-C03: actual free-text unit definition resolves model alternatives without forcing option repetition',()=>{
 const f=compile(),prior=f({definitions:[],conflicts:[{dimension:'unit',question:'金额数值是否带币种？',alternatives:['按字符串直接转为十进制数值（视为同一货币单位）','币种未知，暂不标注具体货币单位'],resolution_quote:null},{dimension:'period',question:'哪一年？',alternatives:['2024','2025'],resolution_quote:null}]},'销售额扣除退款后是多少');
 const body={definitions:[{dimension:'unit',value:'万，人民币',user_quote:'万，人民币'}],conflicts:[]},current=f(body,'万，人民币',prior);
 assert.equal(current.conflicts[0].state,'resolved');assert.equal(current.conflicts[0].selected,'万，人民币');assert.equal(current.conflicts[0].resolution_quote,'万，人民币');assert.equal(current.conflicts[0].user_question,'万，人民币');assert.deepEqual(current.conflicts[0].alternatives,[...prior.conflicts[0].alternatives,'万，人民币']);assert.equal(current.conflicts[1].state,'unresolved');assert.equal(prior.conflicts[0].state,'unresolved');
 assert.equal(f({definitions:[{dimension:'unit',value:'万元人民币',user_quote:null}],conflicts:[]},'万，人民币',prior).conflicts[0].state,'unresolved');
 assert.throws(()=>f({definitions:[{dimension:'unit',value:'万元人民币',user_quote:'万，人民币'}],conflicts:[]},'万，人民币',prior),{code:'SEMANTIC_CONFIRMATION_INVALID'});
 assert.throws(()=>f(body,'不确定',prior),{code:'SEMANTIC_CONFIRMATION_INVALID'});
});

test('Q11-UX-C03: citing both mutually exclusive options is not an unambiguous new user definition',()=>{const f=compile(),prior=f(raw,'分析销售额');assert.throws(()=>f({definitions:[{dimension:'metric',value:'订单金额和净销售额',user_quote:'订单金额和净销售额'}],conflicts:[]},'订单金额和净销售额',prior),{code:'SEMANTIC_CONFIRMATION_INVALID'});});

test('Q11-UX-C03: a more specific literal answer survives persisted readback and later updates',()=>{
 const f=compile(),validate=Reflect.get(context,'validateOpenSemanticAssessment');
 for(const [dimension,alternatives,value] of [['unit',['元','其他货币'],'万元人民币'],['metric',['订单金额','净销售额'],'净销售额（含税）']]){
  const prior=f({definitions:[],conflicts:[{dimension,question:'请选择口径',alternatives,resolution_quote:null}]},'分析销售额');
  const current=f({definitions:[{dimension,value,user_quote:value}],conflicts:[]},value,prior);
  assert.deepEqual(validate(current,['分析销售额',value]),current);
  const later=f({definitions:[],conflicts:[]},'继续',current);
  assert.deepEqual(validate(later,['分析销售额',value,'继续']),later);
  const tampered=structuredClone(current);tampered.conflicts[0].resolution_quote=alternatives.join('和');tampered.conflicts[0].user_question=alternatives.join('和');
  assert.throws(()=>validate(tampered,[...alternatives,alternatives.join('和')]),{code:'CONTEXT_CHANGED'});
 }
});

test('Q11-UX-C03: independently mentioned overlapping alternatives are still ambiguous',()=>{
 const f=compile();
 for(const [dimension,alternatives,value] of [['unit',['元','美元'],'元和美元'],['metric',['订单金额','含税订单金额'],'订单金额和含税订单金额']]){
  const pending={dimension,question:'选哪个？',alternatives,resolution_quote:null},prior=f({definitions:[],conflicts:[pending]},'分析');
  assert.throws(()=>f({definitions:[{dimension,value,user_quote:value}],conflicts:[]},value,prior),{code:'SEMANTIC_CONFIRMATION_INVALID'});
  assert.throws(()=>f({definitions:[],conflicts:[{...pending,resolution_quote:value}]},value,prior),{code:'SEMANTIC_CONFIRMATION_INVALID'});
 }
});

test('Q11-UX-C03: a longer quote cannot hide an independently named alternative to the new definition',()=>{
 const f=compile(),prior=f({definitions:[],conflicts:[{dimension:'unit',question:'单位？',alternatives:['元','其他货币'],resolution_quote:null}]},'分析');
 assert.throws(()=>f({definitions:[{dimension:'unit',value:'万元人民币',user_quote:'元和万元人民币'}],conflicts:[]},'元和万元人民币',prior),{code:'SEMANTIC_CONFIRMATION_INVALID'});
});
