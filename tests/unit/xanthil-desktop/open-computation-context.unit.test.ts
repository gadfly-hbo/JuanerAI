import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {compileOpenAnalysisContext,compileOpenBusinessProposal,validateOpenAnalysisContext} from '../../../packages/product-core/open-analysis-context.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
function fixture():MemberSourceInspection{return {version:'1.0',sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'12',sheets:[{sheet_id:'orders',name:'orders',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'amount'}]},{row:2,cells:[{column:'A',type:'number',value:'3'}]}]},{sheet_id:'notes',name:'notes',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'memo'}]}]}]}]};}

test('RI-R01: authorized structural context starts without business semantics, asset, plan or verification',()=>{
 const source=fixture(),context=compileOpenAnalysisContext('先看资料；期间与单位稍后确认。',source);
 assert.equal(context.inspection_sha256,taskHash(source));
 assert.deepEqual(context.source_facts.map(f=>[f.source_id,f.sheet_id,f.data_rows]),[[source.sources[0]!.source_id,'orders',1],[source.sources[0]!.source_id,'notes',0]]);
 assert.equal(context.business,undefined);assert.equal(context.semantics,undefined);
 assert.equal(context.source_facts[0]!.classification,'SOURCE_FACT');
 assert.ok(context.unknowns.length);
});

test('RI-R01/G02: current explicit sheet scope is selected without a finite filter/operator plan',()=>{
 const source=fixture(),business=compileOpenBusinessProposal({purpose:'探索分布',object:'获准数量',scope:'订单工作表',deliverables:['有限观察'],hypotheses:[],unknowns:['单位未确认'],execution_scope:[{source_id:source.sources[0]!.source_id,sheet_id:'orders'}]});
 const context=compileOpenAnalysisContext('先做结构与分布探索。',source,business);
 assert.deepEqual(context.source_facts.map(f=>f.sheet_id),['orders']);
 assert.deepEqual(context.business,business);
 assert.throws(()=>compileOpenAnalysisContext('先看资料',source,{...business,execution_scope:[{source_id:randomUUID(),sheet_id:'orders'}]}),{code:'BINDING_NOT_FOUND'});
});

test('RI-R04: context validation rejects changed real source facts instead of silently rebuilding a different context',()=>{
 const source=fixture(),question='先核对现有资料';const context=compileOpenAnalysisContext(question,source);
 assert.deepEqual(validateOpenAnalysisContext(context,source,[question]),context);
 assert.throws(()=>validateOpenAnalysisContext({...context,source_facts:context.source_facts.map(f=>({...f,data_rows:999}))},source,[question]),{code:'CONTEXT_CHANGED'});
 assert.throws(()=>validateOpenAnalysisContext(context,source,['另一问题']),{code:'CONTEXT_CHANGED'});
});
