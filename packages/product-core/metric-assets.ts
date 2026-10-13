import {taskHash} from './member-task.ts';
import {parseMetricExpression,expressionReferences,expressionDimension,type MetricDimension} from './metric-expression.ts';
export const netSalesMetrics=['gmv','order_count','refund_amount','net_sales','refunded_order_count','refund_rate'] as const;
export type MetricName=typeof netSalesMetrics[number];
export type AssetMetric=Readonly<{name:string;display_name:string;type:'simple'|'ratio'|'derived'|'cumulative';definition:string;dimensions:readonly string[];time_grains:readonly string[];owner_role:string;caliber_switches:Readonly<Record<string,boolean>>;type_params?:Readonly<{measure?:string;numerator?:string;denominator?:string;expr?:string;window?:string;grain_to_date?:string}>;aggregation?:Readonly<{allowed_dimensions:readonly string[];disallowed_dimensions:readonly string[];ratio_policy?:'recompute_from_parts'}>}>;
export type MetricAsset=Readonly<{id:string;version:string;namespace:string;package_fingerprint:string;content_fingerprint:string;bytes_sha256:string;metrics:readonly AssetMetric[];scenarios:readonly Readonly<{id:string;version:string;method_refs:readonly string[];metric_usages:readonly Readonly<{metric:string;role:string}>[];evidence_requirements:string;output_spec:string;review_rules:string}>[];document:Readonly<Record<string,unknown>>}>;
export type AssetIssue=Readonly<{code:string;path:string}>;
/** Runtime projection: original 56-item bytes remain only in the project store. */
export function selectedNetSalesAsset(asset:MetricAsset):MetricAsset {
 return {...asset,metrics:asset.metrics.filter(m=>netSalesMetrics.includes(m.name as MetricName)),scenarios:asset.scenarios.filter(s=>s.id==='net_sales_review'&&s.version==='0.2.0'),document:{}};
}
export type AssetComputability=Readonly<{usable:boolean;metrics:readonly MetricName[];issues:readonly AssetIssue[];definition_sha256:string}>;
/** Import legality is distinct from this consumer's supported six-metric closure. */
export function assessNetSalesAsset(asset:MetricAsset):AssetComputability {
 const issues:AssetIssue[]=[],map=new Map(asset.metrics.map(m=>[m.name,m]));
 const issue=(code:string,path:string)=>issues.push({code,path});
 const switches:Record<MetricName,readonly string[]>={gmv:['exclude_inner_channel','include_refund','include_shipping'],order_count:['include_refund'],refund_amount:['include_pending_refund','refund_to_payment_period'],net_sales:[],refunded_order_count:['include_pending_refund'],refund_rate:['include_pending_refund']};
 const parameters:Record<MetricName,readonly string[]>={gmv:[],order_count:[],refund_amount:[],net_sales:['expr'],refunded_order_count:[],refund_rate:['numerator','denominator']};
 for(const name of netSalesMetrics){const m=map.get(name);if(!m){issue('METRIC_MISSING',name);continue;}
  if(Object.keys(m.caliber_switches).some(k=>!switches[name].includes(k))||Object.keys(m.type_params??{}).some(k=>!parameters[name].includes(k)))issue('SELECTED_SEMANTICS_UNSUPPORTED',name);
  if(!m.dimensions.includes('category')||!m.time_grains.includes('week')||m.aggregation?.disallowed_dimensions.includes('category')||m.aggregation?.allowed_dimensions.length&&!m.aggregation.allowed_dimensions.includes('category'))issue('AGGREGATION_UNSUPPORTED',name);
 }
 const g=map.get('gmv'),o=map.get('order_count'),r=map.get('refund_amount'),n=map.get('net_sales'),c=map.get('refunded_order_count'),ratio=map.get('refund_rate');
 if(g?.type!=='simple'||g.caliber_switches.include_refund!==true||g.caliber_switches.include_shipping!==false||g.caliber_switches.exclude_inner_channel!==true)issue('GROSS_DEFINITION_UNSUPPORTED','gmv');
 if(o?.type!=='simple'||o.caliber_switches.include_refund!==true)issue('ORDER_QUEUE_UNSUPPORTED','order_count');
 if(r?.type!=='simple'||typeof r.caliber_switches.refund_to_payment_period!=='boolean'||r.caliber_switches.include_pending_refund!==false)issue('REFUND_DEFINITION_UNSUPPORTED','refund_amount');
 if(c?.type!=='simple'||c.caliber_switches.include_pending_refund!==false)issue('REFUND_QUEUE_UNSUPPORTED','refunded_order_count');
 if(n?.type!=='derived'||!n.type_params?.expr)issue('EXPRESSION_MISSING','net_sales');
 const resolving=new Set<string>(),done=new Map<string,MetricDimension>();
 const dimension=(name:string):MetricDimension=>{if(resolving.has(name))throw new Error('ASSET_EXPRESSION_CYCLE');const m=map.get(name);if(!m||!netSalesMetrics.includes(name as MetricName))throw new Error('ASSET_EXPRESSION_REFERENCE');if(done.has(name))return done.get(name)!;resolving.add(name);let unit:MetricDimension;
  if(m.type==='derived'){const ast=parseMetricExpression(m.type_params?.expr??'');for(const ref of expressionReferences(ast))dimension(ref);unit=expressionDimension(ast,dimension);}
  else if(m.type==='ratio'){if(!m.type_params?.numerator||!m.type_params.denominator)throw new Error('ASSET_RATIO_PARTS');const a=dimension(m.type_params.numerator),b=dimension(m.type_params.denominator);unit=[a[0]-b[0],a[1]-b[1]];}
  else if(m.type==='simple')unit=['gmv','refund_amount'].includes(name)?[1,0]:[0,1];else throw new Error('ASSET_OPERATOR_UNSUPPORTED');
  resolving.delete(name);done.set(name,unit);return unit;};
 try{for(const name of netSalesMetrics){const u=dimension(name),expected:MetricDimension=['gmv','refund_amount','net_sales'].includes(name)?[1,0]:name==='refund_rate'?[0,0]:[0,1];if(u[0]!==expected[0]||u[1]!==expected[1])throw new Error('ASSET_EXPRESSION_UNIT');}}catch{issue('EXPRESSION_CLOSURE_UNSUPPORTED','metrics');}
 if(ratio?.type!=='ratio'||ratio.type_params?.numerator!=='refunded_order_count'||ratio.type_params?.denominator!=='order_count'||ratio.aggregation?.ratio_policy!=='recompute_from_parts'||ratio.caliber_switches.include_pending_refund!==false)issue('RATIO_PARTS_UNSUPPORTED','refund_rate');
 const scene=asset.scenarios.find(s=>s.id==='net_sales_review'&&s.version==='0.2.0');
 if(!scene||scene.method_refs.length!==1||scene.method_refs[0]!=='dame.descriptive_delta_decomposition@0.1.0'||scene.metric_usages.some(u=>!netSalesMetrics.includes(u.metric as MetricName))||netSalesMetrics.some(k=>!scene.metric_usages.some(u=>u.metric===k)))issue('SCENARIO_METHOD_UNSUPPORTED','net_sales_review');
 const chosen=netSalesMetrics.map(k=>map.get(k)).filter(Boolean);
 return {usable:issues.length===0,metrics:netSalesMetrics,issues,definition_sha256:taskHash({metrics:chosen,scene:scene??null})};
}
