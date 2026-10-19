import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareToolArguments} from 'pi-agent-runtime';
import {openAnalysisProposalSchema} from '../../../packages/product-core/open-analysis-proposal-schema.ts';
const previous=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/analysis-proposal-schema-before-simplification.json',import.meta.url),'utf8'));
function example(schema:any):any {
 if(schema.enum)return schema.enum[0];
 if(schema.anyOf)return example(schema.anyOf[0]);
 if(schema.type==='object')return Object.fromEntries((schema.required??[]).map((k:string)=>[k,example(schema.properties[k])]));
 if(schema.type==='array')return Array.from({length:schema.minItems??0},()=>example(schema.items));
 if(schema.type==='integer'||schema.type==='number')return schema.minimum??0;
 if(schema.type==='null')return null;
 if(schema.type==='boolean')return false;
 return 'synthetic';
}
async function accepted(schema:any,plan:import('pi-agent-runtime').JsonValue){
 try{await prepareToolArguments({type:'object',properties:{plan:schema},required:['plan'],additionalProperties:false},{plan});return true;}catch{return false;}
}
test('AH-04 native preparation retains every fixed proposal version, closed fields and required/typed negatives',async()=>{
 for(const branch of previous.anyOf){
  const plan=example(branch);assert.equal(await accepted(previous,plan),true,JSON.stringify(plan));assert.equal(await accepted(openAnalysisProposalSchema,plan),true,plan.version);
  const variants=[{...plan,unexpected:'must reject'},...Object.keys(plan).map(key=>{const x=structuredClone(plan);delete x[key];return x;}),...Object.keys(plan).map(key=>({...plan,[key]:['wrong','shape']}))];
  if(plan.inputs){variants.push({...plan,inputs:[...plan.inputs,{...plan.inputs[0],unexpected:'must reject'}]});variants.push({...plan,inputs:[]});}
  for(const candidate of variants)assert.equal(await accepted(openAnalysisProposalSchema,candidate),await accepted(previous,candidate),JSON.stringify(candidate));
 }
 assert.ok(Buffer.byteLength(JSON.stringify(openAnalysisProposalSchema))<Buffer.byteLength(JSON.stringify(previous)),'contract bytes are actually reduced');
});
