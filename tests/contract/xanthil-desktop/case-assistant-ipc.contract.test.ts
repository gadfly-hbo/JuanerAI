import assert from 'node:assert/strict';
import test from 'node:test';
import {createCaseAssistantHandler} from '../../../apps/desktop/case-assistant-main.ts';
import {source} from '../../fixtures/case-assistant/fixtures.ts';

test('AC-01/02/10 bounded IPC validates sender and closed request before Application effect',async()=>{
 let calls=0;const application={async link(){calls++;return {linked:true};}};
 const handler=createCaseAssistantHandler({senderPolicy:(sender:unknown)=>sender==='main',getApplication:()=>application as unknown as NonNullable<ReturnType<Parameters<typeof createCaseAssistantHandler>[0]['getApplication']>>,exportReport:async()=>{throw new Error('must not export');}});
 const request={version:'1.0',operation:'link',owner:source.owner,title:'合成Case',command_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'};
 assert.deepEqual(await handler('main',request),{ok:true,value:{linked:true}});assert.equal(calls,1);
 for(const [sender,input] of [['other',request],['main',{...request,path:'/private'}],['main',{...request,operation:'shell'}],['main',{...request,version:'2.0'}],['main',{...request,owner:{...source.owner,revision_id:'other'}}]])assert.equal((await handler(sender,input)).ok,false);
 assert.equal(calls,1);
});
