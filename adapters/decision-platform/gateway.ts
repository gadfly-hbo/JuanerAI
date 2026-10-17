import {createHash} from 'node:crypto';
import {constants,openSync,closeSync,fstatSync,readFileSync,realpathSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import type {DecisionPlatformGateway,DecisionReportReceipt} from '../../packages/ports/decision-platform.ts';
const uuid=(s:unknown):s is string=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(s);
const filename=(s:string)=>/^source-[a-f0-9-]{36}\.(md|pdf|pptx)$/.test(s);
const fail=():never=>{throw Error('DP_EFFECT_UNKNOWN');};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:fail();
export function createDecisionGateway(config:{dataRoot:string;projects?():Promise<unknown>;board?(projectId:string):Promise<unknown>;request(path:string,method?:'GET'|'POST'|'PATCH',body?:unknown):Promise<unknown>}):DecisionPlatformGateway{
 const root=realpathSync(config.dataRoot);if(root!==resolve(config.dataRoot))fail();
 function project(value:unknown){const p=object(value);if(!uuid(p.id)||typeof p.purpose!=='string'||!p.purpose.startsWith('JuanerAI:')||!uuid(p.purpose.slice(9)))return fail();return {id:p.id,marker:p.purpose.slice(9)};}
 return {
  async findProject(marker){if(!uuid(marker)||!config.projects)return null;const value=await config.projects();if(!Array.isArray(value))return fail();const matches=value.map(object).filter(p=>p.purpose==='JuanerAI:'+marker);return matches.length===1?project(matches[0]):null;},
  async createProject(title,marker){if(!uuid(marker)||!title.trim())return fail();const p=project(await config.request('/api/projects','POST',{title,purpose:'JuanerAI:'+marker}));if(p.marker!==marker)return fail();return p;},
  async project(id){if(!uuid(id))return fail();const p=project(await config.request(`/api/projects/${id}`));if(p.id!==id)return fail();return p;},
  async uploadReport(projectId,physicalName,content){
   if(!uuid(projectId)||!filename(physicalName)||!(content instanceof Uint8Array)||content.length===0)return fail();
   const result=object(await config.request(`/api/projects/${projectId}/reports`,'POST',{files:[{filename:physicalName,contentBase64:Buffer.from(content).toString('base64')}]}));
   if(!Array.isArray(result.results)||result.results.length!==1)return fail();const row=object(result.results[0]);if(row.filename!==physicalName||row.ok!==true||row.status!=='accepted')return fail();
  },
  async report(projectId,physicalName):Promise<DecisionReportReceipt|null>{
   if(!uuid(projectId)||!filename(physicalName))return fail();
   const board=object(await (config.board?config.board(projectId):config.request(`/api/projects/${projectId}/board`)));if(object(board.project).id!==projectId||!Array.isArray(board.reports))return fail();
   const matches=board.reports.map(object).filter(r=>r.filename===physicalName);if(!matches.length)return null;if(matches.length!==1)return fail();const row=matches[0];
   if(row.projectId!==projectId||typeof row.id!=='number'||!Number.isSafeInteger(row.id)||row.id<1||!['pending','extracting','done','failed'].includes(String(row.status)))return fail();
   const path=join(root,'projects',projectId,'reports',physicalName);
   if(realpathSync(path)!==path||lstatSync(path).isSymbolicLink())return fail();
   const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{
    const before=fstatSync(fd);if(!before.isFile()||before.nlink!==1)return fail();const bytes=readFileSync(fd),after=fstatSync(fd);
    if(before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||bytes.length!==before.size)return fail();
    return {projectId,physicalName,reportId:String(row.id),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,status:row.status as DecisionReportReceipt['status']};
   }finally{closeSync(fd);}
  },
 };
}
