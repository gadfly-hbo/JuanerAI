import {createHash} from 'node:crypto';
import {parseDocument,visit,isAlias,isScalar} from 'yaml';
import {type MetricAsset,type AssetMetric} from '../../packages/product-core/metric-assets.ts';
function fail(code:string,path=''):never {throw Object.assign(new Error(code),{code,path,stack:code});}
const object=(v:unknown,path:string):Record<string,any>=>{if(!v||typeof v!=='object'||Array.isArray(v))fail('SAP_STRUCTURE',path);return v as Record<string,any>;};
const text=(v:unknown,path:string)=>{if(typeof v!=='string'||!v.trim()||v.length>100000||v.includes('\0'))fail('SAP_STRUCTURE',path);return v;};
const list=(v:unknown,path:string):any[]=>{if(!Array.isArray(v)||v.length>4096)fail('SAP_STRUCTURE',path);return v;};
const strings=(v:unknown,path:string)=>list(v,path).map((x,i)=>text(x,`${path}.${i}`));
const one=(v:unknown,allowed:readonly string[],path:string)=>{if(!allowed.includes(String(v)))fail('SAP_STRUCTURE',path);};
const keys=(o:Record<string,unknown>,allowed:readonly string[],path:string)=>{for(const k of Object.keys(o))if(!allowed.includes(k))fail('SAP_UNKNOWN_FIELD',path+'.'+k);};
const hash=(x:Uint8Array|string)=>createHash('sha256').update(x).digest('hex');
/** Exactly SAP0.1 canonical form: recursive UTF16 key sort/NFC, LF, two-space block YAML. */
export function canonicalSap(value:unknown):string {
 const scalar=(v:unknown):string=>{if(v===null)return 'null';if(typeof v==='boolean')return String(v);if(typeof v==='number'){if(!Number.isFinite(v))fail('SAP_STRUCTURE');return String(v);}if(typeof v!=='string')fail('SAP_STRUCTURE');const s=v.normalize('NFC');return /^[a-z0-9][a-z0-9_.\-/]*$/.test(s)&&! /^(?:null|true|false|[-+]?(?:[0-9]+|0x[\da-fA-F]+|0o[0-7]+)|[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?)$/.test(s)?s:JSON.stringify(s);};
 const block=(v:unknown)=>v!==null&&typeof v==='object'&&(Array.isArray(v)?v.length>0:Object.keys(v).length>0);
 const emit=(v:unknown,indent=0):string[]=>{const pad=' '.repeat(indent);if(Array.isArray(v)){if(!v.length)return [pad+'[]'];return v.flatMap(item=>{const lines=emit(item,indent+2);return [pad+'- '+lines[0]!.slice(indent+2),...lines.slice(1)];});}if(v!==null&&typeof v==='object'){const entries=Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0);if(!entries.length)return [pad+'{}'];return entries.flatMap(([k,x])=>block(x)?[pad+scalar(k)+':',...emit(x,indent+2)]:[pad+scalar(k)+': '+emit(x,indent+2)[0]!.slice(indent+2)]);}return [pad+scalar(v)];};
 return emit(value).join('\n')+'\n';
}
export function sapFingerprints(raw:Readonly<Record<string,unknown>>) {
 const p=object(raw.package,'package'),r=object(raw.review,'review');
 return {package_fingerprint:'sha256:'+hash(canonicalSap({...raw,package:{...p,fingerprint:''}})),content_fingerprint:'sha256:'+hash(canonicalSap({...raw,package:{...p,fingerprint:'',created_at:'',version:'',namespace:''},review:{...r,exported_at:''}}))};
}
function parse(bytes:Uint8Array){
 if(!bytes.byteLength||bytes.byteLength>2*1024*1024)fail('SAP_FILE_SIZE');
 let source:string;try{source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('SAP_ENCODING');}
 const doc=parseDocument(source,{uniqueKeys:true,version:'1.2',schema:'core'});
 if(doc.errors.length||doc.warnings.length)fail('SAP_YAML_INVALID');
 visit(doc,(_key,node)=>{if(isAlias(node)||node&&typeof node==='object'&&'anchor' in node&&node.anchor||isScalar(node)&&node.tag)fail('SAP_YAML_UNSAFE');});
 try{return doc.toJS({maxAliasCount:0});}catch{fail('SAP_YAML_INVALID');}
}
function checkShape(raw:unknown){
 const d=object(raw,'root');keys(d,['sap','package','scenarios','metrics','dimensions','concept_refs','bindings','review','runtime_state'],'root');
 if(d.sap!=='0.1')fail('SAP_VERSION');if(d.runtime_state!=='design_only')fail('SAP_RUNTIME_STATE');
 const p=object(d.package,'package');keys(p,['id','version','kind','created_at','generator','fingerprint','namespace'],'package');
 for(const k of ['id','version','created_at','generator','fingerprint','namespace'])text(p[k],'package.'+k);
 if(!/^[a-z][a-z0-9-]*$/.test(p.id)||!/^\d+\.\d+\.\d+$/.test(p.version)||p.kind!=='instance'||p.namespace!=='mf.'+p.id||!/^sha256:[a-f0-9]{64}$/.test(p.fingerprint))fail('SAP_STRUCTURE','package');
 const dims=strings(d.dimensions,'dimensions'),names=new Set<string>(),concepts=new Set<string>(),scenes=new Set<string>();
 const review=object(d.review,'review');keys(review,['gate','exported_at','unreviewed'],'review');text(review.gate,'review.gate');text(review.exported_at,'review.exported_at');if(strings(review.unreviewed,'review.unreviewed').length)fail('SAP_UNREVIEWED','review');
 for(const [i,v] of list(d.metrics,'metrics').entries()){
  const m=object(v,`metrics.${i}`);keys(m,['name','display_name','display_name_en','type','definition','definition_en','dimensions','time_grains','owner_role','caliber_switches','type_params','aggregation','statistic_object','caliber_type','provenance','review'],`metrics.${i}`);
  for(const k of ['name','display_name','definition','owner_role'])text(m[k],`metrics.${i}.${k}`);
  if(!/^[a-z][a-z0-9_]*$/.test(m.name)||names.has(m.name))fail('SAP_DUPLICATE_IDENTITY',`metrics.${i}`);names.add(m.name);
  for(const k of ['display_name_en','definition_en'])if(m[k]!==undefined)text(m[k],m.name+'.'+k);
  one(m.type,['simple','ratio','derived','cumulative'],m.name);const md=strings(m.dimensions,m.name+'.dimensions');if(md.some(x=>!dims.includes(x)))fail('SAP_STRUCTURE',m.name+'.dimensions');
  const grains=strings(m.time_grains,m.name+'.time_grains');if(!grains.length||grains.some(g=>!['day','week','month','quarter','year'].includes(g)))fail('SAP_STRUCTURE',m.name+'.time_grains');
  const switches=object(m.caliber_switches,m.name+'.switches');if(Object.values(switches).some(v=>typeof v!=='boolean'))fail('SAP_STRUCTURE',m.name+'.switches');
  if(m.type_params){const t=object(m.type_params,m.name+'.params');keys(t,['measure','numerator','denominator','expr','window','grain_to_date'],m.name+'.params');for(const [k,v] of Object.entries(t)){text(v,m.name+'.'+k);if(['measure','numerator','denominator','grain_to_date'].includes(k)&&! /^[a-z][a-z0-9_]*$/.test(String(v)))fail('SAP_STRUCTURE',m.name+'.'+k);}}
  if(m.aggregation){const a=object(m.aggregation,m.name+'.aggregation');keys(a,['allowed_dimensions','disallowed_dimensions','ratio_policy'],m.name+'.aggregation');const yes=strings(a.allowed_dimensions,m.name),no=strings(a.disallowed_dimensions,m.name);if([...yes,...no].some(x=>!md.includes(x))||yes.some(x=>no.includes(x))||!md.length||a.ratio_policy!==undefined&&a.ratio_policy!=='recompute_from_parts')fail('SAP_STRUCTURE',m.name+'.aggregation');}
  if(m.caliber_type){const f=strings(m.caliber_type,m.name);if(new Set(f).size!==f.length||f.some(x=>!['refund_adjustment','fee_composition','scope_inclusion','validity_threshold','attribution_window','proration_rule','cap_anomaly_rule','measurement_anchor'].includes(x)))fail('SAP_STRUCTURE',m.name+'.caliber_type');}
  const provenance=object(m.provenance,m.name+'.provenance');keys(provenance,['origin','template_ref','model','prompt_version','reviewed_by','note'],m.name+'.provenance');one(provenance.origin,['template','llm','manual'],m.name);if(provenance.origin==='template')text(provenance.template_ref,m.name+'.template_ref');
  for(const k of ['template_ref','model','prompt_version','reviewed_by'])if(provenance[k]!==undefined)text(provenance[k],m.name+'.provenance.'+k);if(provenance.note!==undefined&&typeof provenance.note!=='string')fail('SAP_STRUCTURE',m.name+'.provenance.note');
  const mr=object(m.review,m.name+'.review');keys(mr,['required'],m.name+'.review');if(typeof mr.required!=='boolean')fail('SAP_STRUCTURE',m.name+'.review');
  if(provenance.origin==='llm'){text(provenance.model,m.name+'.model');text(provenance.prompt_version,m.name+'.prompt_version');if(mr.required!==true||typeof provenance.reviewed_by!=='string'||!provenance.reviewed_by.trim())fail('SAP_UNREVIEWED',m.name);}
  if(m.statistic_object)checkConcept(m.statistic_object,m.name+'.statistic_object');
 }
 function checkConcept(v:unknown,path:string){const c=object(v,path);keys(c,['id','version','source','role'],path);for(const k of ['id','version','source'])text(c[k],path+'.'+k);if(c.role!==undefined)text(c.role,path+'.role');return [c.id,c.version,c.role??''].join('\0');}
 for(const [i,v] of list(d.concept_refs,'concept_refs').entries()){const key=checkConcept(v,`concept_refs.${i}`);if(concepts.has(key))fail('SAP_DUPLICATE_IDENTITY','concept_refs');concepts.add(key);}
 for(const v of list(d.scenarios,'scenarios')){const s=object(v,'scenarios');keys(s,['id','version','title','decision_purpose','question_tree','metric_usages','method_refs','evidence_requirements','output_spec','review_rules'],'scenarios');for(const k of ['id','version','title','decision_purpose'])text(s[k],'scenarios.'+k);if(!/^[a-z][a-z0-9_]*$/.test(s.id)||!/^\d+\.\d+\.\d+$/.test(s.version))fail('SAP_STRUCTURE','scenarios');const key=s.id+'@'+s.version;if(scenes.has(key))fail('SAP_DUPLICATE_IDENTITY','scenarios');scenes.add(key);
  strings(s.method_refs,'method_refs');for(const k of ['evidence_requirements','output_spec','review_rules'])if(typeof s[k]!=='string')fail('SAP_STRUCTURE',k);
  const nodes=new Map<string,string|undefined>();for(const v of list(s.question_tree,'question_tree')){const n=object(v,'question_tree');keys(n,['id','label','parent','metric'],'question_tree');text(n.id,'node.id');text(n.label,'node.label');if(nodes.has(n.id))fail('SAP_DUPLICATE_IDENTITY','question_tree');nodes.set(n.id,n.parent);if(n.metric!==undefined&&!names.has(n.metric))fail('SAP_DANGLING_REFERENCE','question_tree');}
  for(const [id,parent] of nodes){if(parent!==undefined&&!nodes.has(parent))fail('SAP_DANGLING_REFERENCE','question_tree');let p:string|undefined=id;const seen=new Set<string>();while(p!==undefined){if(seen.has(p))fail('SAP_SCENARIO_CYCLE','question_tree');seen.add(p);p=nodes.get(p);}}
  for(const v of list(s.metric_usages,'metric_usages')){const u=object(v,'metric_usages');keys(u,['metric','role','note'],'metric_usages');if(!names.has(u.metric))fail('SAP_DANGLING_REFERENCE','metric_usages');one(u.role,['outcome','driver','guardrail'],'metric_usages');if(u.note!==undefined)text(u.note,'metric_usages.note');}
 }
 for(const v of list(d.bindings,'bindings')){const b=object(v,'bindings');keys(b,['metric','model','column','agg','confidence','signals','confirmed_by','confirmed_at'],'bindings');for(const k of ['metric','model','column'])text(b[k],'bindings.'+k);if(!names.has(b.metric)||typeof b.confidence!=='number'||b.confidence<0||b.confidence>1)fail('SAP_STRUCTURE','bindings');if(b.agg!==undefined)one(b.agg,['sum','count_distinct','avg','min','max'],'bindings.agg');strings(b.signals,'bindings.signals');for(const k of ['confirmed_by','confirmed_at'])if(b[k]!==undefined)text(b[k],'bindings.'+k);}
 return d;
}
/** Byte-only import. Caller supplies already-authorized bytes; no paths, code, or network. */
export function inspectSemanticAsset(bytes:Uint8Array,registry?:Uint8Array) {
 const d=checkShape(parse(bytes)),p=d.package,fp=sapFingerprints(d);if(fp.package_fingerprint!==p.fingerprint)fail('SAP_FINGERPRINT_MISMATCH');
 let release_verified=false;
 if(registry){
 const index=object(parse(registry),'registry'),records=list(index.releases,'releases'),matches=records.filter(r=>r.package===p.id&&r.version===p.version);
 if(matches.length!==1)fail(matches.length?'SAP_REGISTRY_CONFLICT':'SAP_REGISTRY_MISSING');const record=matches[0];
 if(record.package_fingerprint!==fp.package_fingerprint||record.content_fingerprint!==fp.content_fingerprint||record.created_at!==p.created_at||record.file!==p.id+'/'+p.version+'.sap.yaml')fail('SAP_REGISTRY_MISMATCH');text(record.released_by,'released_by');
 release_verified=true;
 }
 const asset:MetricAsset={id:p.id,version:p.version,namespace:p.namespace,...fp,bytes_sha256:hash(bytes),metrics:structuredClone(d.metrics) as AssetMetric[],scenarios:structuredClone(d.scenarios),document:structuredClone(d)};
 const computability={usable:asset.metrics.length>0,calculation_supported:false as const,metrics:asset.metrics.map(m=>m.name),issues:asset.metrics.length?[]:[{code:'ASSET_NO_DEFINITIONS',path:'metrics'}],definition_sha256:hash(canonicalSap({metrics:asset.metrics,scenarios:asset.scenarios,bindings:d.bindings}))};
 return {status:'candidate' as const,release_verified,asset,metric_count:asset.metrics.length,unselected_count:asset.metrics.length-computability.metrics.length,computability,approved:false as const};
}
