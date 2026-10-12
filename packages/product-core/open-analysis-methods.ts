import {membershipRecord as closed} from './member-analysis.ts';
import type {OpenAnalysisIR} from './open-analysis-ir.ts';
export const openAnalysisMethodCatalog=Object.freeze({version:'1.0',skills:[
 {id:'general',name:'一般分析',version:'1.0',purpose:'根据问题自主选择本地计算、生成Python探索与独立核验。',requirements:'选定可读取的资料；方法与业务含义必须明确。'},
 {id:'group-summary',name:'分组汇总',version:'1.0',purpose:'按明确字段分组，比较实际计算并独立核验的结果。',requirements:'存在可绑定的分组字段；必须执行真实分组查询。'}
],prompts:[
 {id:'professional',name:'专业分析',version:'1.0',purpose:'按结果、依据及限制组织解释。'},
 {id:'brief',name:'简洁说明',version:'1.0',purpose:'用简短中文说明事实与限制，不改变计算或权限。'}
]});
export type OpenAnalysisPreferences=Readonly<{skill:'general'|'group-summary';prompt:'professional'|'brief'}>;
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function openAnalysisPreferences(raw:unknown={skill:'general',prompt:'professional'}):OpenAnalysisPreferences{
 const p=closed(raw,['skill','prompt']);if(!openAnalysisMethodCatalog.skills.some(s=>s.id===p.skill)||!openAnalysisMethodCatalog.prompts.some(s=>s.id===p.prompt))fail('METHOD_UNAVAILABLE');return structuredClone(p) as OpenAnalysisPreferences;
}
export function checkOpenAnalysisMethod(preferences:OpenAnalysisPreferences,plan:Pick<OpenAnalysisIR,'version'|'group_by'>){
 openAnalysisPreferences(preferences);void plan;
}
export function openAnalysisExpression(preferences:OpenAnalysisPreferences){
 const p=openAnalysisPreferences(preferences);return (p.skill==='group-summary'?'可选方法为分组汇总：建议绑定真实分组字段比较结果；必要的总体基线、其他合法方法及生成Python探索不受此偏好限制。':'根据实际问题选择已支持的合法方法，不固定会员模板。')+(p.prompt==='brief'?'最终用简洁中文说明核验事实、模型解释和限制。':'最终按核验结果、资料依据、模型解释与限制组织中文报告。');
}
