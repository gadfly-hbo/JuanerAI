import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createDecisionEffectsGateway} from '../../../adapters/decision-platform/effects-gateway.ts';import type {DecisionStore,DecisionCommand} from '../../../packages/ports/decision-platform.ts';
test('DP-WRITE-02 no object or two matching creations remain unknown; project membership and exact fields required',async()=>{
 const project=randomUUID(),action=randomUUID();let posts=0;const tasks:Record<string,unknown>[]=[];
 const board={project:{id:project},reports:[],actionItems:[{id:action,projectId:project,status:'adopted',tasks}]};
 const gateway=createDecisionEffectsGateway({store:{} as DecisionStore,board:async()=>board,state:async()=>({active:false,unknown:false}),request:async()=>{posts++;return {};}});
 const fields={title:'test',owner:'',dueDate:'',status:'todo' as const,priority:'medium' as const,note:''},command:DecisionCommand={type:'task-create',actionId:action,fields},effect=await gateway.prepare(project,command);
 assert.equal(await gateway.confirm(project,effect),null);tasks.push({id:randomUUID(),actionItemId:action,...fields,owner:null,dueDate:null});assert.ok(await gateway.confirm(project,effect));tasks.push({...tasks[0],id:randomUUID()});assert.equal(await gateway.confirm(project,effect),null);assert.equal(posts,0);
 await assert.rejects(gateway.prepare(project,{...command,actionId:randomUUID()}),/DP_ADOPTION_REQUIRED/);tasks[0].actionItemId=randomUUID();await assert.rejects(gateway.confirm(project,effect),/DP_BOARD_INVALID/);
});
