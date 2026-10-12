import {Check} from 'typebox/value';
import type {TSchema} from 'typebox';
import type {OpenAnalysisRun} from '../../packages/ports/open-analysis-runtime.ts';

type BusinessTool=OpenAnalysisRun['tools'][number];
/** Private native-object wire only. Valid explicit choices are mapped, never repaired. */
export function nativeDelegationWire(tool:BusinessTool):BusinessTool{
 const original=tool.parameters as {properties?:Record<string,any>};
 const properties=original.properties;
 if(tool.name!=='delegate_analysis'||!properties?.instruction?.anyOf||!properties.material_ids)return tool;
 const instruction=properties.instruction.anyOf.find((s:any)=>s.properties?.reference_paths&&s.properties?.completion_reference_paths);
 if(!instruction)return tool;
 const modelProperties=(tool.modelParameters as {properties?:Record<string,unknown>}|undefined)?.properties;
 const viewProducer=!!modelProperties?.view_refs&&!modelProperties.material_ids&&!modelProperties.instruction;
 // This is the existing business limit, expressed before effect in the native schema.
 // Lists are common to all selected materials, not one positional path per material.
 const selectionLimits=Array.from({length:8},(_,index)=>{const count=index+1,maximum=Math.floor(12/count);return {type:'object',properties:{material_ids:{type:'array',minItems:count,maxItems:count},reference_paths:{type:'array',maxItems:maximum},completion_reference_paths:{type:'array',maxItems:maximum}}};});
 const parameters={type:'object',properties:{kind:properties.kind,task:properties.task,business_question:properties.business_question,action:instruction.properties.action,view_refs:properties.view_refs,material_ids:properties.material_ids,reference_paths:{...instruction.properties.reference_paths,uniqueItems:true},completion_reference_paths:{...instruction.properties.completion_reference_paths,uniqueItems:true}},required:['kind','task','action'],additionalProperties:false,anyOf:selectionLimits,allOf:[{anyOf:[{required:['view_refs'],properties:{material_ids:{not:{}},reference_paths:{not:{}},completion_reference_paths:{not:{}}}},{required:['material_ids','reference_paths','completion_reference_paths'],properties:{view_refs:{not:{}}}}]}]};
 return {...tool,parameters,...(tool.modelParameters?{modelParameters:viewProducer?tool.modelParameters:parameters}:{}),description:viewProducer?'Read read_delegation_materials, explicitly select its actual view_refs and action. Submit kind, task, action, view_refs and optional bounded business_question only. Each view maps exactly to its displayed material/path and includes real descendants. No material IDs or path-building fields in this producer. Unique references, at most12 actual references and8 materials; no guessing, repair or automatic selection. task stays private locally; business_question must be a newly drafted selected-material question, not copied private purpose/root/history/secrets. MODEL opinion is not independently verified fact. Do distinct business work only, not repeated ancestor work or artificial layers. Yield after queued and consume actual returned opinions. Preserve authority, stop, late/UNKNOWN and accounting boundaries.':'先read_delegation_materials，优先选择实际view_refs并提交action；各视图已绑定材料和完整真实路径，不再抄写路径；不得与旧material_ids/reference_paths/completion_reference_paths混用。旧路径入口兼容：明确选择本轮所需material:短引用。仅用平铺字段kind、task、business_question(可选)、action、material_ids、reference_paths、completion_reference_paths；不要instruction、indices、material_id或additional_materials。两组路径是所有选中材料共用的列表，绝不是按材料位置一一配对；路径不得重复，且必须在每份选中材料真实存在。每组总引用数=材料数×该组路径数，均最多12；最多8份材料。例如8份材料时每组只能有1个共同路径，2份材料时每组最多6个。选择真实父对象已包含其子字段，无须逐字段枚举；completion仅限所选对象或真实子字段。目录是可选范围，不是遍历清单；不同材料需不同路径时分成实际不同子问题委派，不猜路径、不自动选材料、不扩大权限。task是本机私有目的，不传给子模型；business_question须重新草拟选定材料内的具体业务问题，不直接透传根原话、私有目的、未选历史或秘密，不把假设当事实。selected_material_ids回执才是实际完整材料集合。协作形成业务判断、反例或缺证，MODEL不是核验事实；hash仅标识来源版本，不自动是业务矛盾。已有材料足以回答就形成意见，只对确有不同待解决问题继续委派，不为层级拆字段、不重复祖先同一工作。queued后让出原生运行，再读取真实返回意见推进；保留全部授权、停止和未知效果边界。',execute:async(args,signal)=>{
  // The dispatcher validates the flat schema first. Retain the original contract too.
  const business={kind:args.kind,task:args.task,...(Object.hasOwn(args,'business_question')?{business_question:args.business_question}:{}),...(Object.hasOwn(args,'view_refs')?{action:args.action,view_refs:args.view_refs}:{material_ids:args.material_ids,instruction:{action:args.action,reference_paths:args.reference_paths,completion_reference_paths:args.completion_reference_paths}})};
  if(!Check(tool.parameters as TSchema,business))throw Object.assign(new Error('TOOL_ARGUMENT_INVALID'),{code:'TOOL_ARGUMENT_INVALID'});
  return tool.execute(business,signal);
 }};
}
