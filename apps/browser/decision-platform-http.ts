import type {IncomingMessage,ServerResponse} from 'node:http';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import type {createPersonalDecisionWorkspace} from '../../profiles/personal/decision-platform.ts';
import type {DecisionCommand,DecisionMaterialScope} from '../../packages/ports/decision-platform.ts';
export type DecisionHttpServices={project(id:string):ReturnType<typeof createPersonalDecisionWorkspace>};
type Context={services?:DecisionHttpServices;canWrite:boolean;json(req:IncomingMessage,maximum?:number):Promise<unknown>;reply(res:ServerResponse,status:number,value:unknown):void;reject(status:number):never};
/** Host session/origin authentication is owned by local-server; no native API proxy. */
export async function decisionPlatformHttp(req:IncomingMessage,res:ServerResponse,deps:Context){
 const path=req.url??'';
 if(path==='/v1/decision-platform/status'&&req.method==='GET'){deps.reply(res,200,{available:!!deps.services});return;}
 if(req.method!=='GET'&&!deps.canWrite)deps.reject(403);
 if(!deps.services){deps.reply(res,503,{error:'DP_MODULE_UNAVAILABLE',reason:'决策看板尚未配置；已保存报告保留。'});return;}
 const m=/^\/v1\/decision-platform\/projects\/([a-f0-9-]{36})\/tasks\/([a-f0-9-]{36})\/(catalog|board|permission|grant|revoke|send|write|reconcile)$/.exec(path);
 if(!m||!membershipUuid(m[1])||!membershipUuid(m[2]))deps.reject(404);
 const workspace=deps.services.project(m[1]);if(workspace.projectId!==m[1])deps.reject(409);
 const check=()=>{if(deps.services!.project(m[1])!==workspace)deps.reject(409);};
 try{
 let value:unknown;
 if(req.method==='GET'&&m[3]==='catalog')value=workspace.catalog(m[2]);
 else if(req.method==='GET'&&m[3]==='board')value=await workspace.board(m[2]);
 else if(req.method==='POST'){
  const keys={permission:['selectionId'],grant:['selectionId','scope'],revoke:[],send:['selectionId','operationId'],write:['operationId','command'],reconcile:['operationId']} as const;
  if(!Object.hasOwn(keys,m[3]))deps.reject(405);
  const body=closed(await deps.json(req,65536),[...keys[m[3] as keyof typeof keys]]);check();
  if('selectionId' in body&&!membershipUuid(body.selectionId)||'operationId' in body&&!membershipUuid(body.operationId))deps.reject(400);
  if(m[3]==='permission')value=await workspace.permission(m[2],String(body.selectionId));
  else if(m[3]==='grant')value=await workspace.grant(m[2],String(body.selectionId),body.scope as DecisionMaterialScope);
  else if(m[3]==='revoke')value=workspace.revoke(m[2]);
  else if(m[3]==='send')value=await workspace.send(m[2],String(body.selectionId),String(body.operationId));
  else if(m[3]==='write')value=await workspace.write(m[2],String(body.operationId),body.command as DecisionCommand);
  else value=await workspace.reconcile(m[2],String(body.operationId));
 }else deps.reject(405);
 check();deps.reply(res,200,value);
 }catch(error){const code=(error as Error).message;
 const reasons:Record<string,string>={DP_EFFECT_UNKNOWN:'原操作结果未知，请核对原回执；不要重复提交。',DP_BUSY_OR_UNKNOWN:'操作仍在进行或结果未知，本项目暂停写入。',DP_PERMISSION_REQUIRED:'请核对报告、项目纠错和接收方后允许本次抽取。',DP_PERMISSION_CHANGED:'材料或接收方已有变化，请重新核对。',DP_SOURCE_MISSING:'原来源不可用；已保存历史保留。',DP_ADOPTION_REQUIRED:'请先采纳建议，再建立执行任务。',DP_OPERATION_CONFLICT:'此操作的内容与原请求不一致，请查回原操作。'};
 if(Object.hasOwn(reasons,code))deps.reply(res,409,{error:code,reason:reasons[code]});else throw error;
 }
}
