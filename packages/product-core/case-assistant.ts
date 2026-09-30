import type { AssistantSource, DecisionFields } from '../contracts/case-assistant.ts';
export function assistantFailure(code = 'VALIDATION_FAILED'): never { throw Object.assign(new Error(code), { code }); }
export function assistantRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)))
        assistantFailure();
    return value as Record<string, unknown>;
}
export function assistantText(value: unknown): value is string { return typeof value === 'string' && /[^\p{White_Space}]/u.test(value); }
export function validateAssistantDecision(input: unknown, source: AssistantSource): DecisionFields {
    const d = assistantRecord(input, ['choice', 'candidate_id', 'rationale', 'owner', 'confirmed_at', 'evidence_refs', 'finding_refs', 'alternatives', 'limitations', 'defer_trigger', 'defer_owner', 'outcome']);
    if (!['candidate', 'no_action', 'defer'].includes(String(d.choice)) || !['rationale', 'owner', 'confirmed_at', 'alternatives', 'limitations'].every(k => assistantText(d[k])))
        assistantFailure();
    const time = String(d.confirmed_at), parts = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d):(\d\d)(?:\.(\d{1,3}))?(Z|[+-](\d\d):(\d\d))$/.exec(time);
    // Check local calendar fields before applying the offset: Date.parse rolls
    // impossible days and 24:00 into a different date.
    if (!parts || Number(parts[2]) > 23 || Number(parts[3]) > 59 || Number(parts[4]) > 59 || Number(parts[7] ?? 0) > 23 || Number(parts[8] ?? 0) > 59 || !Number.isFinite(Date.parse(time)) || new Date(parts[1] + 'T00:00:00Z').toISOString().slice(0, 10) !== parts[1])
        assistantFailure();
    for (const [key, allowed] of [['evidence_refs', source.evidence_refs], ['finding_refs', [source.finding_id]]] as const) {
        const refs = d[key];
        if (!Array.isArray(refs) || refs.length === 0 || new Set(refs).size !== refs.length || refs.some(ref => typeof ref !== 'string' || !allowed.includes(ref)))
            assistantFailure();
    }
    if (d.choice === 'candidate' ? !source.candidates.some(c => c.candidate_id === d.candidate_id) : d.candidate_id !== null)
        assistantFailure();
    if (typeof d.defer_trigger !== 'string' || typeof d.defer_owner !== 'string' || d.choice === 'defer' && (!assistantText(d.defer_trigger) || !assistantText(d.defer_owner)))
        assistantFailure();
    const o = assistantRecord(d.outcome, ['applicable', 'baseline', 'baseline_source', 'observation_object', 'metric', 'expectation', 'observation_window', 'guardrails', 'result_source', 'result_owner', 'assessment', 'assessment_owner', 'not_applicable_reason', 'reassess_trigger', 'reassess_owner']);
    if (typeof o.applicable !== 'boolean' || Object.entries(o).some(([k, v]) => k !== 'applicable' && typeof v !== 'string'))
        assistantFailure();
    const required = o.applicable ? ['baseline', 'baseline_source', 'observation_object', 'metric', 'expectation', 'observation_window', 'guardrails', 'result_source', 'result_owner', 'assessment', 'assessment_owner'] : ['not_applicable_reason', 'reassess_trigger', 'reassess_owner'];
    if (required.some(k => !assistantText(o[k])) || !o.applicable && d.choice === 'candidate')
        assistantFailure();
    return { ...structuredClone(input) as DecisionFields, confirmed_at: new Date(time).toISOString() };
}

/** Stable labeled view of one immutable record; never substitutes the current head. */
export function formalDecisionSections(record: import('../contracts/case-assistant.ts').FormalDecision): readonly {title:string;rows:readonly (readonly [string,string])[]}[] {
 const d=record.fields,o=d.outcome;
 return [
  {title:'Decision Record',rows:[['正式决定',d.choice==='candidate'?'选择已有候选':d.choice==='no_action'?'不行动':'暂缓'],['候选身份',d.candidate_id??'不适用'],['决策理由',d.rationale],['决策责任人',d.owner],['确认时间',d.confirmed_at],['Evidence 引用',d.evidence_refs.join('\n')],['Finding 引用',d.finding_refs.join('\n')],['已比较的替代项',d.alternatives],['限制与仍未知事项',d.limitations],['暂缓条件与重新评估触发点',d.defer_trigger],['暂缓责任人',d.defer_owner]]},
  {title:'Expected Outcome',rows:[['适用性',o.applicable?'适用':'不适用'],['基线',o.baseline],['基线来源',o.baseline_source],['观察对象',o.observation_object],['观察指标',o.metric],['预期方向、范围或明确不确定性',o.expectation],['观察窗口',o.observation_window],['Guardrails',o.guardrails],['未来结果来源',o.result_source],['结果来源 Owner',o.result_owner],['后续评估安排',o.assessment],['评估责任人',o.assessment_owner],['不适用原因',o.not_applicable_reason],['重新评估触发条件',o.reassess_trigger],['重新评估责任人',o.reassess_owner]]},
  {title:'来源与采纳记录',rows:[['Decision Record',record.id],['Expected Outcome',record.outcome_id],['报告身份',record.report_id],['正式决定版本',String(record.sequence)],['Project',record.source.project_id],['专业 Session',record.source.session_id],['Case',record.source.case_id],['来源 revision',record.source.revision_id],['来源 final report',record.source_report_id],['前一正式决定',record.previous_id??'无'],['来源草案',record.draft_id],['草案版本',String(record.draft_version)],['采纳人',record.actor],['采纳时间',record.adopted_at]]},
 ];
}
