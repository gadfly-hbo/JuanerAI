import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {cp,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createPiCaseAssistantRuntime} from '../../../adapters/agent-pi/case-assistant.ts';
import type {AssistantTurn,AssistantTurnResult} from '../../../packages/contracts/case-assistant.ts';
import {withIsolatedProject} from '../xanthil-desktop/desktop-contract-drivers.ts';
import {completedCase} from './completed-case.ts';
import {config} from './fixtures.ts';
export async function withFork<T>(name:string,work:(setup:Awaited<ReturnType<typeof setupFork>>)=>Promise<T>,kind:'fork'|'subagent'='fork',limits:Partial<typeof config.limits>={}){
 return withIsolatedProject(async root=>{let setup:Awaited<ReturnType<typeof setupFork>>|undefined;try{setup=await setupFork(root,kind,limits);return await work(setup);}finally{await setup?.app.close().catch(()=>undefined);const evidence=process.env.JUANERAI_TEST_EVIDENCE_DIR;if(evidence){await mkdir(evidence,{recursive:true});await cp(root,join(evidence,name),{recursive:true,errorOnExist:true,force:false});}}});
}
async function setupFork(root:string,kind:'fork'|'subagent',limits:Partial<typeof config.limits>){
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),calls:AssistantTurn[]=[];
 let respond:(input:AssistantTurn)=>Promise<AssistantTurnResult['output']>=async()=>({kind:'advice',text:'父已保存模型讨论'});
 let currentInput:AssistantTurn;
 const runtime=createPiCaseAssistantRuntime({provider:config.provider,model:config.model,max_input_bytes:200000,max_output_tokens:4096},{async respond(payload){return respond({...currentInput,payload});}});
 const app=createCaseAssistantApplication({store,config:{...config,limits:{...config.limits,...limits}},clock:()=>new Date(),runtime:{async turn(input){calls.push(input);currentInput=input;return runtime.turn(input);}}});
 async function wait(id:string,status:string){for(let i=0;i<200;i++){const p=await app.read(id);if(p.attempts.at(-1)?.status===status)return p;await new Promise(r=>setTimeout(r,5));}assert.equal((await app.read(id)).attempts.at(-1)?.status,status);return app.read(id);}
 const parent=await app.link(baseline.owner,'合成父对话',randomUUID()),grant=await app.prepare(parent.session.id,'父问题');await app.start(parent.session.id,grant.id,true);const saved=await wait(parent.session.id,'Succeeded');
 const preview=await app.prepareChild(parent.session.id,kind,'检查来源边界',kind==='fork'?saved.events.find(e=>e.kind==='advice')!.id:null,[],[],false),child=await app.createChild(parent.session.id,preview.id,randomUUID(),true);
 const complete=async(input:AssistantTurn):Promise<AssistantTurnResult['output']>=>({kind:'result',summary:'依据不足，保留未知。',references:[JSON.parse(input.payload).authorized_context.allowed_references[0]],limitations:['只有已授权上下文。'],unknowns:['因果未知。']});
 respond=complete;
 return {root,baseline,store,app,parent,child,calls,wait,complete,setResponse(value:typeof respond){respond=value;},async start(){const a=await app.prepareCollaboration(child.session.id,'本次检查',[],[]);await app.start(child.session.id,a.id,true);return a;}};
}
