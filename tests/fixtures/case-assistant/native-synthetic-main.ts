/** Test-only injection into a real packaged Electron Main. Never imported by product. */
import {ipcMain,BrowserWindow} from 'electron';
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {createCaseAssistantHandler} from '../../../apps/desktop/case-assistant-main.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createPiCaseAssistantRuntime} from '../../../adapters/agent-pi/case-assistant.ts';
import {config,decision} from './fixtures.ts';
import type {DecisionFields} from '../../../packages/contracts/case-assistant.ts';

let delayedSession='',held=false,release=()=>{};
let turnMode: 'normal'|'draft'|'hold'='normal', turnHeld=false, releaseTurn=()=>{};
let delayedOperation='', operationHeld=false, releaseOperation=()=>{};
const operations:string[]=[];
let firstUserFailure=false,exportPath='';
export function setExportPath(path:string){exportPath=path;}
export function failNextFirstUserEvent(){firstUserFailure=true;}
export function setTurnMode(mode: typeof turnMode){turnMode=mode;turnHeld=false;}
export function isTurnHeld(){return turnHeld;}
export function releaseHeldTurn(){releaseTurn();}
export function holdResponse(operation:string){delayedOperation=operation;operationHeld=false;}
export function isResponseHeld(){return operationHeld;}
export function releaseHeldResponse(){releaseOperation();}
export function observedOperations(){return [...operations];}

export function holdNextRead(id:string){delayedSession=id;held=false;}
export function readIsHeld(){return held;}
export function releaseHeldRead(){release();}

export async function install(input:{projectRoot:string;exportPath:string;packageRoot:string},writer:{writeAndReadBack(capability:unknown,bytes:Uint8Array):Promise<unknown>}){
 registerHooks({resolve(specifier,context,next){if(specifier==='@earendil-works/pi-coding-agent')return {url:pathToFileURL(join(input.packageRoot,'node_modules/@earendil-works/pi-coding-agent/dist/index.js')).href,shortCircuit:true};return next(specifier,context);}});
 exportPath=input.exportPath;
 let calls=0;const payloads:string[]=[];
 const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:200000,max_output_tokens:4096},{async respond(payload){calls++;payloads.push(payload);const p=JSON.parse(payload),history=p.current_attempt_history as {kind:string;text:string}[],context=p.authorized_context;
  if(turnMode==='hold'){turnHeld=true;await new Promise<void>(resolve=>{releaseTurn=resolve;});}
  if(turnMode==='normal'&&!history.some(e=>e.kind==='question'))return {kind:'question',text:'由谁负责后续复核？'};
  if(turnMode==='normal'&&!history.some(e=>e.kind==='tool'))return {kind:'tool',tool:'read_evidence',revision_id:context.source.owner.revision_id};
  const fields:DecisionFields={...decision,choice:'no_action',candidate_id:null,owner:'合成用户',rationale:'合成证据尚不足以确定干预效果，先不行动。',evidence_refs:context.source.evidence_refs,finding_refs:[context.source.finding_id],outcome:{...decision.outcome,baseline_source:context.source.evidence_refs[0]}};
  return {kind:'draft',fields};
 }});
 const store=createLocalCaseAssistantStore({projectRoot:input.projectRoot});
 const app=createCaseAssistantApplication({store:{...store,async appendEvent(id,event,signal){if(firstUserFailure&&event.kind==='user'){firstUserFailure=false;throw Object.assign(new Error('SQLITE_BUSY'),{code:'SQLITE_BUSY'});}return store.appendEvent(id,event,signal);}},runtime,config,clock:()=>new Date()});await app.reopen();
 ipcMain.removeHandler('xanthil-case-assistant:v1');const handler=createCaseAssistantHandler({senderPolicy(sender){const event=sender as {sender:unknown;senderFrame:unknown};return BrowserWindow.getAllWindows().some(w=>event.sender===w.webContents&&event.senderFrame===w.webContents.mainFrame);},getApplication:()=>app,async exportReport(application,sessionId,reportId){const p=await application.read(sessionId),r=p.reports.find(x=>x.id===reportId);if(!r)throw new Error('NOT_FOUND');return writer.writeAndReadBack({path:exportPath},new TextEncoder().encode(r.html));}});
 ipcMain.handle('xanthil-case-assistant:v1',async(event,value)=>{operations.push(value?.operation);const result=await handler(event,value);if(value?.operation===delayedOperation){delayedOperation='';operationHeld=true;await new Promise<void>(resolve=>{releaseOperation=resolve;});}if(value?.operation==='read'&&value.session_id===delayedSession){delayedSession='';held=true;await new Promise<void>(resolve=>{release=resolve;});}return result;});
 return {kind:'synthetic-installed-pi-sdk',network:false};
}
