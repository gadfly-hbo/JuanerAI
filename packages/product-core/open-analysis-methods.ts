import {membershipRecord as closed} from './member-analysis.ts';
export const openAnalysisMethodCatalog=Object.freeze({version:'1.1',prompts:[
 {id:'professional',name:'专业分析',version:'1.0',purpose:'按结果、依据及限制组织解释。'},
 {id:'brief',name:'简洁说明',version:'1.0',purpose:'用简短中文说明事实与限制，不改变资格或权限。'}
]});
export type OpenAnalysisPreferences=Readonly<{prompt:'professional'|'brief'}>;
export function openAnalysisPreferences(raw:unknown={prompt:'professional'}):OpenAnalysisPreferences{
 const p=closed(raw,['prompt']);if(!openAnalysisMethodCatalog.prompts.some(s=>s.id===p.prompt))throw Object.assign(new Error('METHOD_UNAVAILABLE'),{code:'METHOD_UNAVAILABLE'});return structuredClone(p) as OpenAnalysisPreferences;
}
