import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const CONTROL_ROOT = path.join(REPO_ROOT, '.juanerai', 'project-control');
const sets = {
  health: new Set(['active', 'waiting_user', 'blocked', 'validating', 'complete']),
  milestone: new Set(['locked', 'pending', 'active', 'completed', 'blocked']),
  agent: new Set(['controller', 'waiting', 'locked', 'active', 'blocked', 'complete']),
  evidence: new Set(['planned', 'present', 'verified', 'missing', 'failed']),
  risk: new Set(['low', 'medium', 'high', 'critical']),
  event: new Set(['change_started', 'phase_changed', 'task_completed', 'blocker_found', 'decision_requested', 'decision_resolved', 'validation_changed', 'accepted', 'archived', 'status_updated']),
  briefType: new Set(['PRODUCT_SCOPE', 'STRUCTURE_CONTRACT', 'DATA_SECURITY', 'EXTERNAL_EFFECT', 'RISK_EXCEPTION', 'ACTIVATION_ROLLBACK', 'USER_ACCEPTANCE']),
  briefStatus: new Set(['pending', 'resolved', 'cancelled', 'superseded'])
};
const fail = (m) => { throw new Error(`Project control validation failed: ${m}`); };
const exact = (v, keys, label) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${label} must be an object`); const a = Object.keys(v).sort(), e = [...keys].sort(); if (a.length !== e.length || a.some((k, i) => k !== e[i])) fail(`${label} fields must be exactly: ${e.join(', ')}`); };
const str = (v, label) => { if (typeof v !== 'string' || !v.trim()) fail(`${label} must be a non-empty string`); };
const arr = (v, label) => { if (!Array.isArray(v)) fail(`${label} must be an array`); };
const num = (v, label, min = 0) => { if (!Number.isInteger(v) || v < min) fail(`${label} must be an integer >= ${min}`); };
const en = (v, values, label) => { if (!values.has(v)) fail(`${label} has unsupported value: ${v}`); };
const dt = (v, label) => { str(v, label); if (Number.isNaN(Date.parse(v))) fail(`${label} must be an ISO date-time`); };
const actor = (v, label) => { exact(v, ['role', 'session'], label); str(v.role, `${label}.role`); str(v.session, `${label}.session`); };

export function validateStatus(s) {
  exact(s, ['schema_version','project','phase','health','summary','current_objective','next_action','blockers','milestones','agents','metrics','evidence','risks','updated_at','updated_by'], 'status');
  if (s.schema_version !== '1.0') fail('unsupported status schema_version');
  exact(s.project, ['id','name','product'], 'status.project'); Object.entries(s.project).forEach(([k,v]) => str(v, `status.project.${k}`));
  exact(s.phase, ['id','label','ordinal','total'], 'status.phase'); str(s.phase.id,'status.phase.id'); str(s.phase.label,'status.phase.label'); num(s.phase.ordinal,'status.phase.ordinal',1); num(s.phase.total,'status.phase.total',1); if (s.phase.ordinal > s.phase.total) fail('phase ordinal exceeds total');
  en(s.health, sets.health, 'status.health'); ['summary','current_objective','next_action'].forEach(k => str(s[k],`status.${k}`));
  arr(s.blockers,'status.blockers'); s.blockers.forEach((x,i) => { exact(x,['id','label','detail','owner'],`blocker ${i}`); Object.values(x).forEach(v => str(v,`blocker ${i}`)); });
  arr(s.milestones,'status.milestones'); s.milestones.forEach((x,i) => { exact(x,['id','label','status'],`milestone ${i}`); str(x.id,'milestone id'); str(x.label,'milestone label'); en(x.status,sets.milestone,'milestone status'); });
  arr(s.agents,'status.agents'); s.agents.forEach((x,i) => { exact(x,['id','label','model','status','activation'],`agent ${i}`); ['id','label','model','activation'].forEach(k => str(x[k],`agent ${k}`)); en(x.status,sets.agent,'agent status'); });
  arr(s.metrics,'status.metrics'); s.metrics.forEach((x,i) => { exact(x,['id','label','done','total'],`metric ${i}`); str(x.id,'metric id'); str(x.label,'metric label'); num(x.done,'metric done'); num(x.total,'metric total'); if (x.done > x.total) fail('metric done exceeds total'); });
  arr(s.evidence,'status.evidence'); s.evidence.forEach((x,i) => { exact(x,['id','label','path','status'],`evidence ${i}`); ['id','label','path'].forEach(k => str(x[k],`evidence ${k}`)); en(x.status,sets.evidence,'evidence status'); });
  arr(s.risks,'status.risks'); s.risks.forEach((x,i) => { exact(x,['id','label','level','mitigation'],`risk ${i}`); ['id','label','mitigation'].forEach(k => str(x[k],`risk ${k}`)); en(x.level,sets.risk,'risk level'); });
  dt(s.updated_at,'status.updated_at'); actor(s.updated_by,'status.updated_by'); return s;
}
export function validateEvent(e) {
  exact(e,['schema_version','event_id','event_type','occurred_at','actor','summary','status_after','evidence_refs'],'event'); if (e.schema_version !== '1.0') fail('unsupported event version'); str(e.event_id,'event id'); en(e.event_type,sets.event,'event type'); dt(e.occurred_at,'event time'); actor(e.actor,'event actor'); str(e.summary,'event summary'); en(e.status_after,sets.health,'event status'); arr(e.evidence_refs,'event evidence'); e.evidence_refs.forEach((v,i)=>str(v,`event evidence ${i}`)); return e;
}
export function validateBrief(b) {
  exact(b,['schema_version','brief_id','type','status','title','why_now','prompt','options','recommended_option_id','document_refs','cli_instruction','created_at','updated_at','resolution_summary'],'brief'); if (b.schema_version !== '1.0') fail('unsupported brief version'); str(b.brief_id,'brief id'); en(b.type,sets.briefType,'brief type'); en(b.status,sets.briefStatus,'brief status'); ['title','why_now','prompt','recommended_option_id','cli_instruction'].forEach(k=>str(b[k],`brief ${k}`)); arr(b.options,'brief options'); b.options.forEach((x,i)=>{exact(x,['id','label','description'],`option ${i}`); Object.values(x).forEach(v=>str(v,`option ${i}`));}); if(!b.options.some(x=>x.id===b.recommended_option_id)) fail('brief recommendation must reference an option'); arr(b.document_refs,'brief documents'); b.document_refs.forEach((x,i)=>{exact(x,['label','path'],`document ${i}`); str(x.label,'document label'); str(x.path,'document path');}); dt(b.created_at,'brief created_at'); dt(b.updated_at,'brief updated_at'); if(b.resolution_summary!==null) str(b.resolution_summary,'brief resolution'); return b;
}
async function json(file, validator) { return validator(JSON.parse(await readFile(file,'utf8'))); }
export async function readProjectControl() { const status=await json(path.join(CONTROL_ROOT,'status.json'),validateStatus); const events=await Promise.all((await readdir(path.join(CONTROL_ROOT,'events'))).filter(x=>x.endsWith('.json')).sort().reverse().slice(0,50).map(x=>json(path.join(CONTROL_ROOT,'events',x),validateEvent))); const briefs=await Promise.all((await readdir(path.join(CONTROL_ROOT,'decision-briefs'))).filter(x=>x.endsWith('.json')).sort().map(x=>json(path.join(CONTROL_ROOT,'decision-briefs',x),validateBrief))); return {status,events,briefs,served_at:new Date().toISOString()}; }
export async function atomicWriteJson(file,value,validator) { validator(value); await mkdir(path.dirname(file),{recursive:true}); const temp=`${file}.${process.pid}.${Date.now()}.tmp`; await writeFile(temp,`${JSON.stringify(value,null,2)}\n`,{encoding:'utf8',flag:'wx'}); await rename(temp,file); }
export async function appendEvent(event) { validateEvent(event); const name=`${event.occurred_at.replace(/\D/g,'').slice(0,17)}-${event.event_id.replace(/[^A-Za-z0-9_-]/g,'-')}.json`; const file=path.join(CONTROL_ROOT,'events',name); await mkdir(path.dirname(file),{recursive:true}); await writeFile(file,`${JSON.stringify(event,null,2)}\n`,{encoding:'utf8',flag:'wx'}); return file; }
export async function readReferencedDocument(id,index) { if(!/^[A-Za-z0-9_-]+$/.test(id)||!Number.isInteger(index)||index<0) fail('invalid document request'); const brief=await json(path.join(CONTROL_ROOT,'decision-briefs',`${id}.json`),validateBrief); const ref=brief.document_refs[index]; if(!ref) fail('document reference does not exist'); const resolved=path.resolve(REPO_ROOT,ref.path), relative=path.relative(REPO_ROOT,resolved); if(relative.startsWith('..')||path.isAbsolute(relative)) fail('document escapes repository'); if(!['.md','.txt','.json'].includes(path.extname(resolved).toLowerCase())) fail('document type is not allowed'); return {label:ref.label,path:ref.path,content:await readFile(resolved,'utf8')}; }
export function createEvent({type,summary,statusAfter,session='status-cli',evidenceRefs=[]}) { const now=new Date().toISOString(); return validateEvent({schema_version:'1.0',event_id:`EVT-${now.replace(/\D/g,'').slice(0,17)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,event_type:type,occurred_at:now,actor:{role:'controller',session},summary,status_after:statusAfter,evidence_refs:evidenceRefs}); }
