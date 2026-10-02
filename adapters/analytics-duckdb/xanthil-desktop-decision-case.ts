import {plannedSelection,validateMembershipPlan,validateMembershipResult} from '../../packages/product-core/member-analysis.ts';
import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { canonicalDesktopJson, checkedDesktopInteger, desktopMetricChanges, desktopRational, desktopRuleFailure, prepareDesktopData, validateDesktopCalculationResult, type DesktopMetricPeriod, type DesktopSelection } from '../../packages/product-core/xanthil-desktop-decision-case.ts';
import { runAnalysisProcess } from './process.ts';

const sql = `WITH ranked AS (
 SELECT *, row_number() OVER (PARTITION BY period, member_id ORDER BY epoch_seconds, fraction, encode(order_id)) ordinal
 FROM orders
), members AS (
 SELECT period,member_id,group_id,count(*) n,CAST(coalesce(sum(amount_fen) FILTER (WHERE ordinal>=2),0) AS BIGINT) revenue
 FROM ranked GROUP BY period,member_id,group_id
)
SELECT 'period' AS "scope", period, NULL group_id, CAST(count(*) AS VARCHAR) active,
 CAST(count(*) FILTER (WHERE n>=2) AS VARCHAR) AS "repeat",
 CAST(CAST(coalesce(sum(revenue),0) AS BIGINT) AS VARCHAR) revenue FROM members GROUP BY period
UNION ALL
SELECT 'group',period,group_id,'0','0',CAST(CAST(coalesce(sum(revenue),0) AS BIGINT) AS VARCHAR)
 FROM members GROUP BY period,group_id ORDER BY "scope",period,group_id;
`;
// The M1 materialization omits both the member group key and the M2 aggregate.
const m1Sql = sql.split('UNION ALL')[0].replaceAll('period,member_id,group_id', 'period,member_id') + 'ORDER BY period;\n';
const python = String.raw`import sys,json,csv,io,base64,datetime
from zoneinfo import ZoneInfo
from fractions import Fraction

MAX=9223372036854775807
MIN=-9223372036854775808
def checked(x):
    if not MIN<=x<=MAX: raise ValueError('overflow')
    return x
def ratio(n,d):
    checked(n); checked(d)
    if d<=0: raise ValueError('denominator')
    f=Fraction(n,d)
    return {'numerator':str(f.numerator),'denominator':str(f.denominator)}
def change(a,b):
    delta=checked(b-a)
    return {'absolute_delta':str(delta),'relative_change':'not_applicable' if a==0 else ratio(delta,a)}
def csv_rows(encoded):
    rows=list(csv.reader(io.StringIO(base64.b64decode(encoded,validate=True).decode('utf-8-sig'),newline=''),strict=True))
    head=rows.pop(0)
    if len(head)!=len(set(head)) or any(x=='' for x in head) or any(len(x)!=len(head) for x in rows): raise ValueError('csv')
    return [dict(zip(head,row)) for row in rows]
def instant(text):
    import re
    m=re.fullmatch(r'(\d{4}-\d{2}-\d{2})(?:[Tt](\d{2}:\d{2}:\d{2})(?:\.(\d+))?([Zz]|[+-]\d{2}:\d{2})?)?',text)
    if not m: raise ValueError('time')
    base=datetime.datetime.fromisoformat(m[1]+'T'+(m[2] or '00:00:00'))
    zone=m[4]
    if zone:
        if zone.upper()=='Z': aware=base.replace(tzinfo=datetime.timezone.utc)
        else:
            sign=1 if zone[0]=='+' else -1
            hours=int(zone[1:3]); minutes=int(zone[4:6])
            if hours>23 or minutes>59: raise ValueError('offset')
            aware=base.replace(tzinfo=datetime.timezone(sign*datetime.timedelta(hours=hours,minutes=minutes)))
    else:
        candidates={}
        for fold in (0,1):
            dt=base.replace(tzinfo=ZoneInfo('Asia/Shanghai'),fold=fold)
            utc=dt.astimezone(datetime.timezone.utc)
            if utc.astimezone(ZoneInfo('Asia/Shanghai')).replace(tzinfo=None)==base:
                candidates[utc]=dt
        if len(candidates)!=1: raise ValueError('ambiguous')
        aware=next(iter(candidates.values()))
    epoch=aware.astimezone(datetime.timezone.utc)-datetime.datetime(1970,1,1,tzinfo=datetime.timezone.utc)
    return epoch.days*86400+epoch.seconds,(m[3] or '').rstrip('0'),aware.astimezone(ZoneInfo('Asia/Shanghai')).date().isoformat()
request=json.load(sys.stdin); contract=request['contract']; mapping=contract['column_mapping']
members=csv_rows(request['members']); orders=csv_rows(request['orders']); plan=contract.get('execution_plan'); grouped=contract['selected_group_mode']=='mapped' and (plan is None or 'M2' in plan['methods'])
member_groups={}
for row in members:
    key=row[mapping['member_id_column']]
    if key=='' or key in member_groups: raise ValueError('member')
    member_groups[key]=row[mapping['member_group_column']] if grouped else None
windows={'comparison':contract['comparison_period'],'current':contract['current_period']}
selected={'comparison':{},'current':{}}; seen=set()
for row in orders:
    oid=row[mapping['order_id_column']]; mid=row[mapping['order_member_id_column']]
    if oid=='' or oid in seen or mid=='' or mid not in member_groups: raise ValueError('identity')
    seen.add(oid)
    if row[mapping['currency_column']]!='CNY': raise ValueError('currency')
    import re
    amount=row[mapping['amount_column']]
    if not re.fullmatch(r'\d+(?:\.\d{1,2})?',amount): raise ValueError('amount')
    whole,_,fraction=amount.partition('.'); fen=checked(int(whole)*100+int(fraction.ljust(2,'0')))
    if fen<=0: raise ValueError('amount')
    seconds,fraction,date=instant(row[mapping['paid_at_column']])
    if row[mapping['status_column']] not in contract['valid_statuses']: continue
    for name,period in windows.items():
        if period['start_date']<=date<period['end_date']:
            selected[name].setdefault(mid,[]).append((seconds,fraction,oid.encode('utf-8'),fen))
periods={}; groups={}
for name,by_member in selected.items():
    total=0; repeat=0
    for member,items in by_member.items():
        items.sort(key=lambda x:x[:3])
        revenue=0
        for item in items[1:]: revenue=checked(revenue+item[3])
        total=checked(total+revenue)
        if len(items)>=2: repeat=checked(repeat+1)
        if grouped:
            gid=request['groups'][member_groups[member]]
            g=groups.setdefault(gid,{'comparison':0,'current':0})
            g[name]=checked(g[name]+revenue)
    active=checked(len(by_member))
    periods[name]={'active_member_count':str(active),'repeat_member_count':str(repeat),'repurchase_rate':ratio(repeat,active) if active else ratio(0,1),'repeat_revenue_fen':str(total)}
a=periods['comparison']; b=periods['current']
changes={key:change(int(a[key]),int(b[key])) for key in ('active_member_count','repeat_member_count','repeat_revenue_fen')}
old=a['repurchase_rate']; new=b['repurchase_rate']
n=checked(checked(int(new['numerator'])*int(old['denominator']))-checked(int(old['numerator'])*int(new['denominator'])))
d=checked(int(new['denominator'])*int(old['denominator']))
absolute=ratio(n,d)
relative='not_applicable' if int(old['numerator'])==0 else ratio(checked(int(absolute['numerator'])*int(old['denominator'])),checked(int(absolute['denominator'])*int(old['numerator'])))
changes['repurchase_rate']={'absolute_delta':absolute,'relative_change':relative}
m2={'status':'not_selected' if plan is not None and 'M2' not in plan['methods'] else 'not_applicable'}
if grouped:
    values=[{'group_id':key,'comparison_repeat_revenue_fen':str(value['comparison']),'current_repeat_revenue_fen':str(value['current']),'absolute_delta':str(checked(value['current']-value['comparison']))} for key,value in sorted(groups.items())]
    total=0
    for value in values: total=checked(total+int(value['absolute_delta']))
    if total!=int(changes['repeat_revenue_fen']['absolute_delta']): raise ValueError('reconciliation')
    m2={'status':'applicable','groups':values}
if plan is not None:
    if not selected['comparison'] and not selected['current']: raise ValueError('empty')
    unavailable=False
    for period in periods.values():
        if period['active_member_count']=='0':
            period['repurchase_rate']='not_applicable'; unavailable=True
    if unavailable:
        changes['repurchase_rate']={'absolute_delta':'not_applicable','relative_change':'not_applicable'}
        if grouped: m2={'status':'not_applicable'}
print(json.dumps({'periods':periods,'changes':changes,'m2':m2},sort_keys=True,separators=(',',':')))
`;
const sha = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const bytes = (text: string) => Object.freeze({ bytes: new TextEncoder().encode(text), sha256: sha(text), byte_length: String(Buffer.byteLength(text)) });
const method = Object.freeze({ id: 'membership_repurchase_comparison', version: '1.0', code_identity: sha(canonicalDesktopJson({ method_id: 'membership_repurchase_comparison', method_version: '1.0', primary_sql_sha256: sha(sql), python_verifier_sha256: sha(python) })) });
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]) { if (!record(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value,key))) desktopRuleFailure(); return value; }
type Request = Readonly<{ run_id: string; expected_code_identity: string; contract: DesktopSelection & Record<string, unknown>; snapshot: { members_bytes: Uint8Array; orders_bytes: Uint8Array }; group_pseudonym_map: Record<string,string> | null; cancellation_signal: AbortSignal; deadline_seconds: number }>;
function request(value: unknown): Request {
  const x = exact(value,['run_id','expected_code_identity','contract','snapshot','group_pseudonym_map','cancellation_signal','deadline_seconds']);
  if (typeof x.run_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x.run_id) || !(x.cancellation_signal instanceof AbortSignal) || !Number.isInteger(x.deadline_seconds) || Number(x.deadline_seconds)<0 || Number(x.deadline_seconds)>30) desktopRuleFailure();
  if (x.cancellation_signal.aborted) desktopRuleFailure('CANCELLED');
  if (x.deadline_seconds===0) desktopRuleFailure('DEADLINE_EXCEEDED');
  exact(x.snapshot,['members_bytes','orders_bytes']); if (!record(x.contract)) desktopRuleFailure();
  if (Object.hasOwn(x.contract,'schema_version') || Object.hasOwn(x.contract,'execution_plan')) plannedSelection(x.contract,x.snapshot as Request['snapshot']);
  if(x.expected_code_identity!==selectedMethod(x as Request).code_identity)desktopRuleFailure('SOURCE_CHANGED');
  return x as Request;
}
type Row = {scope:string;period:string;group_id:string|null;active:string;repeat:string;revenue:string};
function metric(row?: Row): DesktopMetricPeriod {
  const active=checkedDesktopInteger(BigInt(row?.active??'0')),repeat=checkedDesktopInteger(BigInt(row?.repeat??'0')),revenue=checkedDesktopInteger(BigInt(row?.revenue??'0'));
  if(active<0n||repeat<0n||repeat>active||revenue<0n)desktopRuleFailure('CALCULATION_FAILED');
  return Object.freeze({active_member_count:String(active),repeat_member_count:String(repeat),repurchase_rate:active===0n?desktopRational(0n,1n):desktopRational(repeat,active),repeat_revenue_fen:String(revenue)});
}
function plannedMethods(x:Request): readonly string[]|null { return record(x.contract.execution_plan)?x.contract.execution_plan.methods as readonly string[]:null; }
function selectedSql(x:Request):string { return plannedMethods(x)?.length===1?m1Sql:sql; }
function selectedMethod(x:Request){return {...method,code_identity:sha(canonicalDesktopJson({method_id:method.id,method_version:method.version,primary_sql_sha256:sha(selectedSql(x)),python_verifier_sha256:sha(python)}))};}
function envelope(x:Request,implementation:'duckdb_primary'|'python_independent',result:unknown) {
 const plan=x.contract.execution_plan,chosen=selectedMethod(x);
 const validated=plan?validateMembershipResult(result,validateMembershipPlan(plan)):validateDesktopCalculationResult(result);
 return plan?{schema_version:'2.0',run_id:x.run_id,implementation,method:chosen,plan_sha256:sha(canonicalDesktopJson(plan)),materialization:{primary_sql_sha256:sha(selectedSql(x)),python_verifier_sha256:sha(python)},result:validated}:{schema_version:'1.0',run_id:x.run_id,implementation,method,result:validated};
}
const literal=(value:string)=>"'"+value.replaceAll("'","''")+"'";
export function createDuckDbPythonDesktopLocalAnalysisExecution(config: unknown) {
 const settings=exact(config,['duckdbExecutable','duckdbVersion','pythonExecutable','pythonVersion']);
 if(typeof settings.duckdbExecutable!=='string'||!isAbsolute(settings.duckdbExecutable)||settings.duckdbVersion!=='1.5.2'||typeof settings.pythonExecutable!=='string'||!isAbsolute(settings.pythonExecutable)||typeof settings.pythonVersion!=='string'||!/^3\.(?:9|[1-9]\d)\.\d+$/.test(settings.pythonVersion))desktopRuleFailure();
 const duckdb=settings.duckdbExecutable,pythonPath=settings.pythonExecutable,pythonVersion=settings.pythonVersion;
 async function run(command:string,args:readonly string[],input:string,signal:AbortSignal,seconds:number){try{return await runAnalysisProcess(command,args,signal,seconds,input);}catch(error){const code=(error as {code?:string}).code;desktopRuleFailure(code==='TIMEOUT'?'DEADLINE_EXCEEDED':code==='CANCELLED'?'CANCELLED':'CALCULATION_FAILED');}}
 return Object.freeze({
  async describeImplementation(input:unknown){const value=exact(input,record(input)&&Object.hasOwn(input,'execution_plan')?['execution_plan']:[]);const plan=value.execution_plan?validateMembershipPlan(value.execution_plan):null,selected=plan?.methods.length===1?m1Sql:sql;const code_identity=sha(canonicalDesktopJson({method_id:method.id,method_version:method.version,primary_sql_sha256:sha(selected),python_verifier_sha256:sha(python)}));return Object.freeze({method_id:method.id,method_version:method.version,code_identity,duckdb_version:'1.5.2',python_version:pythonVersion,primary_sql:bytes(selected),python_verifier:bytes(python)});},
  async calculate(input:unknown){
   const x=request(input),prepared=prepareDesktopData(x.snapshot,x.contract),mapped=x.contract.selected_group_mode==='mapped';
   if(mapped?!record(x.group_pseudonym_map):x.group_pseudonym_map!==null)desktopRuleFailure();
   const groupIds=new Set<string>();
   if(mapped)for(const group of new Set(prepared.member_groups.values())){if(typeof group!=='string'||!Object.hasOwn(x.group_pseudonym_map!,group))desktopRuleFailure();const id=x.group_pseudonym_map![group];if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)||groupIds.has(id))desktopRuleFailure();groupIds.add(id);}
   const values=prepared.orders.map(row=>'('+[literal(row.period),literal(row.member_id),mapped?literal(x.group_pseudonym_map![row.group!]):'NULL',literal(row.order_id),String(row.epoch_seconds),literal(row.fraction),String(row.amount_fen)].join(',')+')').join(',');
   const source="SET autoinstall_known_extensions=false; SET autoload_known_extensions=false; CREATE TABLE orders(period VARCHAR,member_id VARCHAR,group_id VARCHAR,order_id VARCHAR,epoch_seconds BIGINT,fraction VARCHAR,amount_fen BIGINT); INSERT INTO orders VALUES "+values+";\n"+selectedSql(x);
   const output=await run(duckdb,['-init','/dev/null','-json',':memory:'],source,x.cancellation_signal,x.deadline_seconds);
   let rows:Row[];try{rows=JSON.parse(output);}catch{desktopRuleFailure('CALCULATION_FAILED');}if(!Array.isArray(rows))desktopRuleFailure('CALCULATION_FAILED');
   const periods={comparison:metric(rows.find(r=>r.scope==='period'&&r.period==='comparison')),current:metric(rows.find(r=>r.scope==='period'&&r.period==='current'))},changes=desktopMetricChanges(periods.comparison,periods.current);
   let m2:unknown={status:plannedMethods(x)?.length===1?'not_selected':'not_applicable'};
   if(mapped&&(!plannedMethods(x)||plannedMethods(x)!.includes('M2'))){const ids=[...new Set(rows.filter(r=>r.scope==='group').map(r=>r.group_id!))].sort();const groups=ids.map(group_id=>{const old=BigInt(rows.find(r=>r.scope==='group'&&r.group_id===group_id&&r.period==='comparison')?.revenue??'0'),now=BigInt(rows.find(r=>r.scope==='group'&&r.group_id===group_id&&r.period==='current')?.revenue??'0');return {group_id,comparison_repeat_revenue_fen:String(old),current_repeat_revenue_fen:String(now),absolute_delta:String(checkedDesktopInteger(now-old))};});let sum=0n;for(const g of groups)sum=checkedDesktopInteger(sum+BigInt(g.absolute_delta));if(String(sum)!==changes.repeat_revenue_fen.absolute_delta)desktopRuleFailure('CALCULATION_FAILED');m2={status:'applicable',groups};}
   let result:unknown={periods,changes,m2};
   if(plannedMethods(x)){
    const unavailable=periods.comparison.active_member_count==='0'||periods.current.active_member_count==='0';
    result={periods:Object.fromEntries(Object.entries(periods).map(([name,p])=>[name,{...p,repurchase_rate:p.active_member_count==='0'?'not_applicable':p.repurchase_rate}])),changes:{...changes,repurchase_rate:unavailable?{absolute_delta:'not_applicable',relative_change:'not_applicable'}:changes.repurchase_rate},m2:unavailable&&plannedMethods(x)!.includes('M2')?{status:'not_applicable'}:m2};
   }
   return Object.freeze(envelope(x,'duckdb_primary',result));
  },
  async verify(input:unknown){
   const x=request(input);
   const payload=JSON.stringify({contract:x.contract,members:Buffer.from(x.snapshot.members_bytes).toString('base64'),orders:Buffer.from(x.snapshot.orders_bytes).toString('base64'),groups:x.group_pseudonym_map});
   const output=await run(pythonPath,['-I','-B','-c',python],payload,x.cancellation_signal,x.deadline_seconds);
   let result:unknown;try{result=JSON.parse(output);}catch{desktopRuleFailure('CALCULATION_FAILED');}
   return Object.freeze(envelope(x,'python_independent',result));
  }
 });
}
