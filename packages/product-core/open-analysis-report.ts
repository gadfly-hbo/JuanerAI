import type {OpenAnalysisOutcome} from '../ports/open-analysis-store.ts';
import {computationClaimValue,computationNumber,computationSourceAttribution} from './open-computation.ts';
/** Actual qualified claim values and their per-computation limitations, never an
 * old method/IR formatter or a model-provided certification. */
export function openAnalysisFactsText(outcome:OpenAnalysisOutcome):string{
 const cell=(v:unknown)=>String(v??'').replace(/[<>|\r\n]/g,' '),lines=['## 本版逐主张证据（资格分别列示）','','| 主张 | 实际值 | 单位 | 当前条件 |','| --- | --- | --- | --- |'];
 for(const f of outcome.computations)for(const c of f.calculation.claims)lines.push('| '+[c.label,c.qualification==='source_attribution'?String(computationClaimValue(f.calculation.value,c.path)):computationClaimValue(f.calculation.value,c.path)===null?'不适用（无数值，未核验）':computationNumber(f.calculation.value,c.path),c.unit,[...c.conditions,c.qualification==='source_attribution'?'来源原文对应，所引观点未核验':computationClaimValue(f.calculation.value,c.path)===null?'not_performed':'独立算术核验'].join('；')].map(cell).join(' | ')+' |');
 if(outcome.membership){const m=outcome.membership;lines.push('', '## 会员复购专业事实（独立算术核验）');for(const period of ['comparison','current'] as const){const v=m.metrics.periods[period],scope=m.framework.semantics[period==='comparison'?'comparison_period':'current_period'];lines.push('期间：'+scope.start_date+' — '+scope.end_date,'活跃会员数：'+v.active_member_count,'复购会员数：'+v.repeat_member_count,'复购率（精确比值）：'+JSON.stringify(v.repurchase_rate),'复购收入（分，'+m.framework.semantics.currency+'）：'+v.repeat_revenue_fen);}lines.push('分组专业结果：'+JSON.stringify(m.metrics.m2),'实际物理执行：'+m.verification.native_evidence.physical_run_id,...m.verification.limits,'这些专业数字不认证模型解释、企业因果或人的决定。');}
 lines.push('');for(const f of outcome.computations)lines.push('主执行：'+f.calculation.execution_id,'独立原始取证：'+f.verification.independent.execution_id,...f.verification.limits);
 return lines.join('\n');
}

/** Presentation-only known grade labels; immutable model evidence is retained. */
export function openAnalysisReadableText(text:string):string{return text.replace(/\bsource_attribution\b/g,'资料原文对应核对').replace(/\bindependent_arithmetic\b/g,'独立算术核验');}

/** Explorer charts have their own explicit coverage, separate from qualified arithmetic. */
export function openAnalysisExplorationsText(records:readonly import('../ports/open-analysis-store.ts').OpenExplorationRecord[]):string{
 const cell=(v:unknown)=>String(v??'').replace(/[<>|\r\n]/g,c=>({'<':'&lt;','>':'&gt;','|':'\\|','\r':' ','\n':' '})[c]!);
 return records.map(e=>['## 探索结果（尚未独立核验）','',cell(e.value.summary),...(e.total_check?['有限检查：'+(e.total_check.status==='passed'?'合计一致':'合计不一致（检查失败）')+' · '+cell(e.total_check.chart_title),cell(e.total_check.limitation)]:[]),...e.value.observations.map(cell),'',...e.value.charts.flatMap(c=>['### '+cell(c.title)+' · '+cell(c.unit),'| 对象 | 探索值 |','| --- | --- |',...c.points.map(p=>'| '+cell(p.label)+' | '+p.value+' |')]),'',`代码身份：${e.receipt.code_sha256}`,'仅保存实际探索输出；代码成功不证明统计方法、业务解释或因果。关键事实核验范围按独立证据另列。',''].join('\n')).join('\n');
}
