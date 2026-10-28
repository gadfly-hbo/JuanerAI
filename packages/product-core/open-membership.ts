import {membershipRecord as closed,membershipUuid,membershipBytesHash,membershipHash,validateMembershipResult,type MembershipResult} from './member-analysis.ts';
import {hashFiniteJson} from './member-task.ts';
import {desktopRuleFailure,prepareDesktopData,desktopRational,desktopMetricChanges,type DesktopSelection,type DesktopMetricPeriod} from './xanthil-desktop-decision-case.ts';
import type {MemberSourceInspection,MemberSourceSheet} from '../ports/member-source.ts';

type Binding=Readonly<{source_id:string;sheet_id:string;role:'members'|'orders';columns:Readonly<Record<string,string|null>>}>;
type Semantics=Pick<DesktopSelection,'comparison_period'|'current_period'|'currency'|'time_zone'|'valid_statuses'>;
export type OpenMembershipFramework=Readonly<{version:'1.0';kind:'membership_repurchase';goal:string;methods:readonly ('M1'|'M2')[];bindings:readonly Binding[];semantics:Semantics;inspection_sha256:string;selection:DesktopSelection;materialization:Readonly<{members_sha256:string;orders_sha256:string;lineage_sha256:string}>}>;
const fields={members:['member_id','member_group'],orders:['order_id','order_member_id','paid_at','amount','status','currency']} as const;
function fail(code='PLAN_INVALID'):never{throw Object.assign(new Error(code),{code,stack:code});}
function selected(b:Pick<Binding,'source_id'|'sheet_id'>,inspection:MemberSourceInspection):MemberSourceSheet{
 const sources=inspection.sources.filter(s=>s.source_id===b.source_id),s=sources[0],sheets=s?.sheets.filter(s=>s.sheet_id===b.sheet_id),sheet=sheets?.[0];
 if(sources.length!==1||sheets?.length!==1||!sheet)fail('BINDING_NOT_FOUND');
 if(inspection.version!=='1.0'||!s||!/^[a-f0-9]{64}$/.test(s.sha256)||sheet.state!=='visible'||!sheet.rows.length)fail('SOURCE_UNQUALIFIED');return sheet;
}
function csv(rows:readonly (readonly string[])[]){const quote=(s:string)=>/[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;return Buffer.from(rows.map(r=>r.map(quote).join(',')).join('\n')+'\n','utf8');}
/** Materialize every bound row without changing business values. The absent M1
 * group is an explicitly derived empty field, never an inferred source column. */
function derive(bindings:readonly Binding[],inspection:MemberSourceInspection){
 const lineage:{role:string;source_id:string;sheet_id:string;row:number;columns:Binding['columns']}[]=[],rowsByRole={members:[Array.from(fields.members)] as string[][],orders:[Array.from(fields.orders)] as string[][]};
 for(const b of bindings){const sheet=selected(b,inspection),ids=new Set<number>(),rows=rowsByRole[b.role];
  for(const row of sheet.rows.slice(1)){
   if(!Number.isSafeInteger(row.row)||row.row<=sheet.rows[0]!.row||ids.has(row.row))fail('SOURCE_UNQUALIFIED');ids.add(row.row);
   rows.push(fields[b.role].map(field=>{const column=b.columns[field];if(column===null&&field==='member_group')return '';const cells=row.cells.filter(c=>c.column===column);if(cells.length!==1)fail('ROW_BINDING_INCOMPLETE');const cell=cells[0]!;if(!['string','number','date','blank'].includes(cell.type)||typeof cell.value!=='string'||cell.value.includes('\0'))fail('SOURCE_UNQUALIFIED');return cell.value;}));
   lineage.push({role:b.role,source_id:b.source_id,sheet_id:b.sheet_id,row:row.row,columns:b.columns});
  }

 }
 const bytes={members:csv(rowsByRole.members),orders:csv(rowsByRole.orders)};
 return {snapshot:{members_bytes:bytes.members,orders_bytes:bytes.orders},members_sha256:membershipBytesHash(bytes.members),orders_sha256:membershipBytesHash(bytes.orders),lineage_sha256:hashFiniteJson(lineage),lineage};
}
export function compileOpenMembershipFramework(raw:unknown,inspection:MemberSourceInspection):OpenMembershipFramework{
 const p=closed(raw,['version','goal','methods','bindings','semantics']);
 if(p.version!=='1.0'||typeof p.goal!=='string'||!p.goal.trim()||p.goal.length>2000||!['["M1"]','["M1","M2"]'].includes(JSON.stringify(p.methods))||!Array.isArray(p.bindings)||p.bindings.length<2||p.bindings.length>32)fail();
 const roles=new Set<string>(),pairs=new Set<string>();
 const bindings=p.bindings.map(raw=>{const b=closed(raw,['source_id','sheet_id','role','columns']);if(!membershipUuid(b.source_id)||typeof b.sheet_id!=='string'||!['members','orders'].includes(String(b.role)))fail();const role=b.role as Binding['role'],pair=b.source_id+'/'+b.sheet_id;if(role==='members'&&roles.has(role)||pairs.has(pair))fail();roles.add(role);pairs.add(pair);
  const format=inspection.sources.find(s=>s.source_id===b.source_id)?.format;if(format!=='csv'&&format!=='xlsx')fail('SOURCE_UNQUALIFIED');
  const columns=closed(b.columns,fields[role]),sheet=selected({source_id:b.source_id,sheet_id:b.sheet_id},inspection),used=new Set<string>();
  return {source_id:b.source_id,sheet_id:b.sheet_id,role,columns:Object.fromEntries(Object.entries(columns).map(([field,value])=>{if(value===null&&field==='member_group'&&JSON.stringify(p.methods)==='["M1"]')return [field,null];if(typeof value!=='string'||!value.trim())fail('BINDING_NOT_FOUND');const matches=sheet.rows[0]!.cells.filter(c=>c.column===value||c.type==='string'&&c.value===value);if(matches.length!==1)fail('BINDING_NOT_FOUND');const column=matches[0]!.column;if(used.has(column))fail('BINDING_NOT_FOUND');used.add(column);return [field,column];}))} satisfies Binding;
 }).sort((a,b)=>a.role===b.role?0:a.role==='members'?-1:1);
 if(roles.size!==2)fail();
 const sem=closed(p.semantics,['comparison_period','current_period','currency','time_zone','valid_statuses']);for(const period of ['comparison_period','current_period'])closed(sem[period],['start_date','end_date']);
 const day=(value:unknown)=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail('MEMBER_PERIOD_INVALID');const epoch=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==value)fail('MEMBER_PERIOD_INVALID');return epoch;};
 const periods=['comparison_period','current_period'].map(key=>{const p=sem[key] as Record<string,unknown>;return [day(p.start_date),day(p.end_date)];});const [comparison,current]=periods as [number[],number[]];
 if(comparison[1]!<=comparison[0]!||current[1]!<=current[0]!||comparison[1]!-comparison[0]!==current[1]!-current[0]||!(comparison[1]!<=current[0]!||current[1]!<=comparison[0]!))fail('MEMBER_PERIOD_INVALID');
 const semantics=structuredClone(sem) as Semantics,group=JSON.stringify(p.methods)==='["M1","M2"]'&&bindings[0]!.columns.member_group!==null;
 const selection:DesktopSelection={...semantics,selected_group_mode:group?'mapped':'none',column_mapping:{member_id_column:'member_id',member_group_column:group?'member_group':null,order_id_column:'order_id',order_member_id_column:'order_member_id',paid_at_column:'paid_at',amount_column:'amount',status_column:'status',currency_column:'currency'}};
 const value=derive(bindings,inspection);prepareDesktopData(value.snapshot,selection);
 return {version:'1.0',kind:'membership_repurchase',goal:p.goal,methods:p.methods as OpenMembershipFramework['methods'],bindings,semantics,inspection_sha256:hashFiniteJson(inspection),selection,materialization:{members_sha256:value.members_sha256,orders_sha256:value.orders_sha256,lineage_sha256:value.lineage_sha256}};
}
export function openMembershipProposal(frame:OpenMembershipFramework){return {version:frame.version,goal:frame.goal,methods:frame.methods,bindings:frame.bindings,semantics:frame.semantics};}
export function materializeOpenMembershipFramework(frame:OpenMembershipFramework,inspection:MemberSourceInspection){
 if(frame?.inspection_sha256!==hashFiniteJson(inspection))desktopRuleFailure('SOURCE_CHANGED');
 const checked=compileOpenMembershipFramework(openMembershipProposal(frame),inspection);if(hashFiniteJson(checked)!==hashFiniteJson(frame))desktopRuleFailure('SOURCE_CHANGED');
 const value=derive(checked.bindings,inspection),prepared=prepareDesktopData(value.snapshot,checked.selection);
 return {...value,qualification:{counts:prepared.counts,issues:prepared.reviewable_issues,excluded_sheets:inspection.sources.flatMap(s=>s.sheets.filter(sheet=>!checked.bindings.some(b=>b.source_id===s.source_id&&b.sheet_id===sheet.sheet_id)).map(sheet=>({source_id:s.source_id,sheet_id:sheet.sheet_id,reason:'not_bound'})))}};
}
export function membershipGroupMap(frame:OpenMembershipFramework,inspection:MemberSourceInspection){
 if(!frame.methods.includes('M2'))return null;const value=materializeOpenMembershipFramework(frame,inspection),prepared=prepareDesktopData(value.snapshot,frame.selection);
 return Object.fromEntries([...new Set([...prepared.member_groups.values()].map(g=>g!))].sort().map(label=>{const d=hashFiniteJson({purpose:'membership_group',label});return [label,`${d.slice(0,8)}-${d.slice(8,12)}-4${d.slice(13,16)}-a${d.slice(17,20)}-${d.slice(20,32)}`];}));
}
/** Storage-side deterministic arithmetic check. Production primary and independent
 * proof remain the existing DuckDB and Python implementations. */
export function membershipFrameworkFacts(frame:OpenMembershipFramework,inspection:MemberSourceInspection):MembershipResult{
 const {snapshot}=materializeOpenMembershipFramework(frame,inspection),prepared=prepareDesktopData(snapshot,frame.selection),mapping=membershipGroupMap(frame,inspection),groups=new Map<string,{comparison:bigint;current:bigint}>(),periods={} as Record<'comparison'|'current',DesktopMetricPeriod>;
 for(const period of ['comparison','current'] as const){const members=new Map<string,typeof prepared.orders[number][]>();for(const order of prepared.orders)if(order.period===period){const items=members.get(order.member_id)??[];items.push(order);members.set(order.member_id,items);}let repeat=0n,revenue=0n;
  for(const items of members.values()){items.sort((a,b)=>a.epoch_seconds<b.epoch_seconds?-1:a.epoch_seconds>b.epoch_seconds?1:a.fraction<b.fraction?-1:a.fraction>b.fraction?1:Buffer.compare(Buffer.from(a.order_id),Buffer.from(b.order_id)));if(items.length>1)repeat++;const sum=items.slice(1).reduce((n,o)=>n+o.amount_fen,0n);revenue+=sum;if(mapping){const id=mapping[items[0]!.group!]!,g=groups.get(id)??{comparison:0n,current:0n};g[period]+=sum;groups.set(id,g);}}
  periods[period]={active_member_count:String(members.size),repeat_member_count:String(repeat),repurchase_rate:desktopRational(repeat,BigInt(members.size)||1n),repeat_revenue_fen:String(revenue)};
 }
 const unavailable=Object.values(periods).some(p=>p.active_member_count==='0'),changes=desktopMetricChanges(periods.comparison,periods.current),result={periods:{comparison:{...periods.comparison,repurchase_rate:periods.comparison.active_member_count==='0'?'not_applicable':periods.comparison.repurchase_rate},current:{...periods.current,repurchase_rate:periods.current.active_member_count==='0'?'not_applicable':periods.current.repurchase_rate}},changes:{...changes,...(unavailable?{repurchase_rate:{absolute_delta:'not_applicable',relative_change:'not_applicable'}}:{})},m2:!frame.methods.includes('M2')?{status:'not_selected'}:unavailable?{status:'not_applicable'}:{status:'applicable',groups:[...groups].sort(([a],[b])=>a<b?-1:1).map(([group_id,g])=>({group_id,comparison_repeat_revenue_fen:String(g.comparison),current_repeat_revenue_fen:String(g.current),absolute_delta:String(g.current-g.comparison)}))}};
 return validateMembershipResult(result,{methods:frame.methods});
}

/** Qualification of observed native evidence; not creation of formal Case records. */
export function validateOpenMembershipProof(frame:OpenMembershipFramework,inspection:MemberSourceInspection,metrics:MembershipResult,proof:import('../ports/open-membership.ts').OpenMembershipProof,identity:import('../ports/open-analysis-store.ts').OpenTaskIdentity):void{
 const n=proof?.native_evidence;if(!n)fail('VERIFICATION_FAILED');
 closed(proof,['version','grade','inspection_sha256','result_sha256','method','limits','native_evidence']);closed(n,['physical_run_id','task_run_id','attempt_id','code_identity','materialization_sha256','primary_sha256','independent_sha256','group_labels','primary','independent']);
 const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v),same=(a:unknown,b:unknown)=>hashFiniteJson(a)===hashFiniteJson(b);
 if(proof.version!=='1.0'||proof.grade!=='independent_arithmetic'||proof.method!=='native_member_source_recheck'||proof.inspection_sha256!==hashFiniteJson(inspection)||identity.scope_sha256!==proof.inspection_sha256||proof.result_sha256!==hashFiniteJson(metrics)||!Array.isArray(proof.limits)||!proof.limits.length)fail('VERIFICATION_FAILED');
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(n.physical_run_id)||n.task_run_id!==identity.run_id||n.attempt_id!==identity.attempt_id||!hash(n.code_identity)||n.materialization_sha256!==hashFiniteJson(frame.materialization)||n.primary_sha256!==hashFiniteJson(n.primary)||n.independent_sha256!==hashFiniteJson(n.independent))fail('VERIFICATION_FAILED');
 if(!same(metrics,membershipFrameworkFacts(frame,inspection))||!same(n.group_labels,Object.fromEntries(Object.entries(membershipGroupMap(frame,inspection)??{}).map(([label,id])=>[id,label]))))fail('VERIFICATION_FAILED');
 for(const [key,implementation] of [['primary','duckdb_primary'],['independent','python_independent']] as const){
  const e=closed(n[key],['schema_version','run_id','implementation','method','method_contract_sha256','materialization','result']),method=closed(e.method,['id','version','code_identity']),materialization=closed(e.materialization,['primary_sql_sha256','python_verifier_sha256']);
  if(e.schema_version!=='4.0'||e.run_id!==n.physical_run_id||e.implementation!==implementation||method.code_identity!==n.code_identity||typeof method.id!=='string'||!method.id||typeof method.version!=='string'||!method.version||!Object.values(materialization).every(hash)||e.method_contract_sha256!==membershipHash({selection:frame.selection,methods:frame.methods})||!same(e.result,metrics))fail('VERIFICATION_FAILED');
 }
 if(!same(n.primary.method,n.independent.method)||!same(n.primary.materialization,n.independent.materialization)||n.primary_sha256===n.independent_sha256)fail('VERIFICATION_FAILED');
}

export type OpenMemberReviewSource=Readonly<{version:'1.0';kind:'open_member_evidence';task_id:string;revision:string;task_run_id:string;attempt_id:string;outcome_id:string;outcome_sha256:string;scope_sha256:string;result_sha256:string;physical_run_id:string;primary_sha256:string;independent_sha256:string}>;
export type OpenMemberSourceRecord=Readonly<{version:'1.0';origin_id:string;command_id:string;owner:import('../contracts/xanthil-desktop-ipc.ts').OwnerRef;source:OpenMemberReviewSource;task:import('../ports/open-analysis-store.ts').OpenStoredTask;created_at:string;sha256:string}>;
export function openMemberOriginCommand(owner:OpenMemberSourceRecord['owner'],source:OpenMemberReviewSource):string{
 const hash=hashFiniteJson({kind:'open_member_source',version:'1.0',owner,source});
 return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-8${hash.slice(17,20)}-${hash.slice(20,32)}`;
}
export function validateOpenMemberSourceRecord(record:OpenMemberSourceRecord):OpenMemberSourceRecord{
 closed(record,['version','origin_id','command_id','owner','source','task','created_at','sha256']);closed(record.owner,['project_id','session_id','case_id','revision_id']);
 if(record.version!=='1.0'||![record.origin_id,record.command_id,...Object.values(record.owner)].every(membershipUuid)||typeof record.created_at!=='string'||!Number.isFinite(Date.parse(record.created_at))||new Date(record.created_at).toISOString()!==record.created_at)fail('SOURCE_UNQUALIFIED');
 const source=qualifyOpenMemberReviewSource(record.task),{sha256,...body}=record;
 if(hashFiniteJson(source)!==hashFiniteJson(record.source)||record.command_id!==openMemberOriginCommand(record.owner,source)||sha256!==hashFiniteJson(body))fail('SOURCE_CHANGED');
 return record;
}
export function qualifyOpenMemberReviewSource(task:import('../ports/open-analysis-store.ts').OpenStoredTask):OpenMemberReviewSource{
 const o=task.outcome,m=o?.membership;
 if(task.state!=='saved'||task.pending_stop_epoch!==null||!o||!m||!membershipUuid(o.outcome_id))fail('SOURCE_UNQUALIFIED');
 if(hashFiniteJson(o.identity)!==hashFiniteJson(task.identity)||hashFiniteJson(m.identity)!==hashFiniteJson(task.identity)||task.identity.scope_sha256!==hashFiniteJson(task.source)||m.version!=='1.0')fail('SOURCE_CHANGED');
 validateOpenMembershipProof(m.framework,task.source,m.metrics,m.verification,task.identity);const n=m.verification.native_evidence;
 return {version:'1.0',kind:'open_member_evidence',task_id:task.identity.task_id,revision:task.identity.revision,task_run_id:task.identity.run_id,attempt_id:task.identity.attempt_id,outcome_id:o.outcome_id,outcome_sha256:hashFiniteJson(o),scope_sha256:task.identity.scope_sha256,result_sha256:hashFiniteJson(m.metrics),physical_run_id:n.physical_run_id,primary_sha256:n.primary_sha256,independent_sha256:n.independent_sha256};
}

/** Facts for the genuine native origin, never a legacy confirmed hypothesis.
 * Publication and human review are separate Application/storage operations. */
export type OpenMemberFindingFacts=Readonly<{version:'3.0';judgment:'Verified';owner:OpenMemberSourceRecord['owner'];origin:Readonly<{kind:'open_member_source';origin_id:string;source_record_sha256:string}>;source:OpenMemberReviewSource;methods:readonly ('M1'|'M2')[];semantics:OpenMembershipFramework['semantics'];metrics:MembershipResult;causal_claim:'not_verified'}>;
export function openMemberFindingFacts(input:OpenMemberSourceRecord):OpenMemberFindingFacts{
 const record=validateOpenMemberSourceRecord(input);
 return structuredClone({version:'3.0',judgment:'Verified',owner:record.owner,origin:{kind:'open_member_source',origin_id:record.origin_id,source_record_sha256:hashFiniteJson(record)},source:record.source,methods:record.task.outcome!.membership!.framework.methods,semantics:record.task.outcome!.membership!.framework.semantics,metrics:record.task.outcome!.membership!.metrics,causal_claim:'not_verified'});
}
export function validateOpenMemberFindingFacts(raw:unknown,record:OpenMemberSourceRecord):OpenMemberFindingFacts{
 closed(raw,['version','judgment','owner','origin','source','methods','semantics','metrics','causal_claim']);const expected=openMemberFindingFacts(record);
 if(hashFiniteJson(raw)!==hashFiniteJson(expected))fail('VERIFICATION_FAILED');return expected;
}

export type OpenMemberFindingReceipt=Readonly<{version:'1.0';saved:true;kind:'native_member_finding';command_id:string;origin_id:string;owner:OpenMemberSourceRecord['owner'];finding_id:string;report_id:string;expected_row_version:string;row_version:string;source_record_sha256:string}>;
