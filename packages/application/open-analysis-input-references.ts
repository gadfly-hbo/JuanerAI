import type {MemberSourceInspection} from '../ports/member-source.ts';

type RecordValue=Record<string,unknown>;
const record=(v:unknown):v is RecordValue=>!!v&&typeof v==='object'&&!Array.isArray(v);
/** Resolve explicit technical references only; Core still validates the complete proposal. */
export function resolveOpenStepInputReferences(graph:RecordValue,inspection:MemberSourceInspection):RecordValue{
 if(!Array.isArray(graph.steps)||graph.steps.length>24)return graph;
 const issues:{path:string;expected:string;available?:unknown}[]=[],nodes=graph.steps;
 const bad=(path:string,expected:string,available?:unknown)=>{if(issues.length<64)issues.push({path,expected,...(available?{available}:{})});};
 const field=(value:unknown,binding:RecordValue,path:string,grouping=false):unknown=>{
  if(value===null||value===undefined||typeof value!=='string')return value;
  const sheets=inspection.sources.filter(s=>s.source_id===binding.source_id).flatMap(s=>s.sheets.filter(t=>t.sheet_id===binding.sheet_id&&t.state==='visible'));
  if(sheets.length!==1)return value;
  const headers=sheets[0]!.rows.find(r=>r.row===1)?.cells??[];
  if(headers.some(c=>c.column===value))return value;
  const matches=headers.filter(c=>c.type==='string'&&c.value===value);
  if(matches.length===1)return matches[0]!.column;
  bad(path,'actual column ID or exact unique header in this selected source/sheet'+(grouping?'; submit explicit null only when the current method permits no grouping; empty string is not a field or null':''),headers.slice(0,64).map(c=>({column:c.column,header:c.value})));return value;
 };
 const binding=(raw:RecordValue,path:string)=>{
  const next={...raw};
  if(Object.hasOwn(raw,'source_id')){
   const exact=inspection.sources.filter(s=>s.source_id===raw.source_id),matches=exact.length?exact:inspection.sources.filter(s=>s.display_name===raw.source_id);
   if(matches.length===1)next.source_id=matches[0]!.source_id;else bad(`${path}.source_id`,'actual selected source ID or exact unique display_name',inspection.sources.slice(0,64).map(s=>({source_id:s.source_id,display_name:s.display_name})));
   if(matches.length===1&&Object.hasOwn(raw,'sheet_id')){const sheets=matches[0]!.sheets,ids=sheets.filter(s=>s.sheet_id===raw.sheet_id),named=ids.length?ids:sheets.filter(s=>s.state==='visible'&&s.name===raw.sheet_id);if(named.length===1)next.sheet_id=named[0]!.sheet_id;else bad(`${path}.sheet_id`,'actual sheet ID or exact unique visible sheet name',sheets.filter(s=>s.state==='visible').slice(0,64).map(s=>({sheet_id:s.sheet_id,name:s.name})));}
  }
  for(const key of ['column','group_by','weight_column'])if(Object.hasOwn(raw,key))next[key]=field(raw[key],next,`${path}.${key}`,key==='group_by');
  if(Array.isArray(raw.filters))next.filters=raw.filters.map((f,i)=>record(f)?{...f,column:field(f.column,next,`${path}.filters[${i}].column`)}:f);
  if(Array.isArray(raw.value_mappings))next.value_mappings=raw.value_mappings.map((m,i)=>record(m)?{...m,column:field(m.column,next,`${path}.value_mappings[${i}].column`)}:m);
  return next;
 };
 const plan=(raw:unknown,path:string,depth=0):unknown=>{
  if(!record(raw)){bad(path,'executable supported IR object; descriptive/unsupported steps must not use a null plan');return raw;}
  if(depth>2){bad(path,'supported IR without recursive nesting');return raw;}
  const next=binding(raw,path);
  if(raw.version==='1.8')next.base=plan(raw.base,`${path}.base`,depth+1);if(['1.8','2.2'].includes(String(raw.version))){if(record(raw.measure)&&Array.isArray(raw.measure.inputs))next.measure={...raw.measure,inputs:raw.measure.inputs.map((v,i)=>record(v)?binding(v,`${path}.measure.inputs[${i}]`):v)};}
  if(Array.isArray(raw.inputs)){next.inputs=raw.inputs.map((v,i)=>record(v)?binding(v,`${path}.inputs[${i}]`):v);if(record(raw.join)&&Array.isArray(next.inputs)&&record(next.inputs[0])&&record(next.inputs[1]))next.join={...raw.join,order_key:field(raw.join.order_key,next.inputs[0],`${path}.join.order_key`),refund_order_key:field(raw.join.refund_order_key,next.inputs[1],`${path}.join.refund_order_key`),refund_id:field(raw.join.refund_id,next.inputs[1],`${path}.join.refund_id`)};}
  return next;
 };
 const result=nodes.map((node,index)=>{
  if(!record(node))return node;
  const path=`steps[${index}]`,depends_on=Array.isArray(node.depends_on)?node.depends_on.map((ref,i)=>{
   if(nodes.some(n=>record(n)&&n.step_id===ref))return ref;
   const matches=nodes.filter(n=>record(n)&&n.title===ref);
   if(matches.length===1&&record(matches[0]))return matches[0].step_id;
   bad(`${path}.depends_on[${i}]`,'returned step ID or exact unique step title, without a prefix',nodes.filter(record).map(n=>({step_id:n.step_id,title:n.title})));return ref;
  }):node.depends_on;
  return {...node,depends_on,plan:plan(node.plan,`${path}.plan`)};
 });
 if(issues.length)throw Object.assign(new Error('PLAN_INVALID'),{code:'PLAN_INVALID',stack:'PLAN_INVALID',safe_details:{invalid_fields:issues}});
 return {...graph,steps:result};
}

/** Same exact metadata resolution for ordinary framework proposals, without a step graph. */
export function resolveOpenAnalysisInputReferences(proposal:RecordValue,inspection:MemberSourceInspection):RecordValue{
 try{const graph=resolveOpenStepInputReferences({steps:[{plan:proposal}]},inspection);return (graph.steps as {plan:RecordValue}[])[0]!.plan;}catch(error){if((error as {code?:unknown}).code!=='PLAN_INVALID')throw error;throw Object.assign(new Error('BINDING_NOT_FOUND'),{code:'BINDING_NOT_FOUND',stack:'BINDING_NOT_FOUND',safe_details:(error as {safe_details?:unknown}).safe_details});}
}
