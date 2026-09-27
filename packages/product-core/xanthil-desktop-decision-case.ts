/** Pure Desktop business rules. No persistence, process, Runtime or UI capability. */
import type { DesktopProjection, SaveFormInput } from '../contracts/xanthil-desktop-ipc.ts';

/** The three fixed Draft targets, shared by business admission and the Pi boundary. */
export function validateDesktopAssistanceDraft(kind:string,value:unknown,runtime=false):void{
  const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
  const strings=(v:Record<string,unknown>,keys:string[])=>keys.every(k=>typeof v[k]==='string');
  if(kind==='question_fields'){
    if(!exact(value,['question_text','hypothesis_display_title','business_context','alternative_explanations'])||!strings(value,['question_text','hypothesis_display_title','business_context'])||!Array.isArray(value.alternative_explanations)||value.alternative_explanations.some(x=>typeof x!=='string'||! /[^\p{White_Space}]/u.test(x)))desktopRuleFailure();
  }else if(kind==='evidence_explanation'){
    if(!exact(value,['evidence_explanation_text'])||typeof value.evidence_explanation_text!=='string')desktopRuleFailure();
  }else if(kind==='candidates'){
    const fields=['title','evidence_basis','risk_or_refutation','applicability_conditions','future_validation_metric'];
    if(!exact(value,['candidates'])||!Array.isArray(value.candidates)||value.candidates.some(c=>!exact(c,runtime?fields:['candidate_id',...fields])||!strings(c,fields)||!runtime&&(typeof c.candidate_id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.candidate_id))))desktopRuleFailure();
    if(!runtime&&new Set(value.candidates.map(c=>c.candidate_id)).size!==value.candidates.length)desktopRuleFailure();
  }else desktopRuleFailure();
}

export function validateDesktopAssistancePayload(value:unknown):void{
  const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
  if(value===null||typeof value!=='object'||Array.isArray(value))desktopRuleFailure();const p=value as Record<string,unknown>;
  if(p.schema_version!=='1.0')desktopRuleFailure();
  if(p.action_kind==='organize_question'){
    if(!exact(p,['schema_version','action_kind','question_text','hypothesis_display_title','business_context','alternative_explanations','comparison_period','current_period','aggregate_columns']))desktopRuleFailure();
    validateDesktopAssistanceDraft('question_fields',{question_text:p.question_text,hypothesis_display_title:p.hypothesis_display_title,business_context:p.business_context,alternative_explanations:p.alternative_explanations});
    for(const period of [p.comparison_period,p.current_period])if(period!==null&&(!exact(period,['start_date','end_date'])||!['start_date','end_date'].every(k=>typeof period[k]==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(period[k] as string))))desktopRuleFailure();
    if(canonicalDesktopJson(p.aggregate_columns)!==canonicalDesktopJson(['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']))desktopRuleFailure();return;
  }
  if(!['explain_evidence','draft_candidates'].includes(String(p.action_kind))||!exact(p,['schema_version','action_kind','method','confirmed_context','aggregate',...(p.action_kind==='draft_candidates'?['accepted_finding']:[])]))desktopRuleFailure();
  validateDesktopAssistanceDraft('question_fields',p.confirmed_context);
  if(!exact(p.method,['id','version'])||p.method.id!=='membership_repurchase_comparison'||p.method.version!=='1.0'||!exact(p.aggregate,['artifact_id','metrics'])||typeof p.aggregate.artifact_id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.aggregate.artifact_id))desktopRuleFailure();
  validateDesktopCalculationResult(p.aggregate.metrics);
  if(p.action_kind==='draft_candidates'){
    const f=p.accepted_finding;if(!exact(f,['finding_id','judgment','supporting_evidence','refutation','limitations','evidence_refs'])||typeof f.finding_id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(f.finding_id)||!['Confirmed','Rejected','Unknown'].includes(String(f.judgment))||typeof f.refutation!=='string'||!['supporting_evidence','limitations','evidence_refs'].every(k=>Array.isArray(f[k])&&(f[k] as unknown[]).every(x=>typeof x==='string')))desktopRuleFailure();
  }
}

/** Explicit allowlist, not a serialization of a whole Case/Projection. */
export function desktopAssistancePayload(projection: DesktopProjection, action: string) {
  const revision=projection.revision;
  if(!revision||projection.session?.current_revision_id!==revision.revision_id)desktopRuleFailure('STALE_REVISION');
  if(revision.integrity_state!=='ok')desktopRuleFailure('INTEGRITY_BLOCKED');
  if(projection.runs.some(r=>r.status==='Running')||projection.attempts.some(a=>a.status==='Running'))desktopRuleFailure('BUSY');
  const context={question_text:revision.question_text,hypothesis_display_title:revision.hypothesis_display_title,business_context:revision.business_context,alternative_explanations:revision.alternative_explanations};
  if(action==='organize_question'){
    if(!['Draft','Ready'].includes(revision.state))desktopRuleFailure('AUTHORITY_REQUIRED');
    const payload={schema_version:'1.0',action_kind:action,...context,comparison_period:projection.confirmation?.comparison_period??null,current_period:projection.confirmation?.current_period??null,aggregate_columns:['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']};
    return {payload_text:canonicalDesktopJson(payload),categories:['action_schema_labels','user_authored_free_text','period_labels','aggregate_column_names'],aggregate_refs:[] as string[],free_text_present:true};
  }
  if(!['explain_evidence','draft_candidates'].includes(action)||action==='explain_evidence'&&revision.state!=='Review'||action==='draft_candidates'&&!['Review','Completed'].includes(revision.state))desktopRuleFailure('AUTHORITY_REQUIRED');
  const finding=projection.findings.at(-1);if(!finding)desktopRuleFailure('AUTHORITY_REQUIRED');
  if(action==='draft_candidates'&&!projection.acceptances.some(a=>a.finding_id===finding.finding_id))desktopRuleFailure('AUTHORITY_REQUIRED');
  const metrics=validateDesktopCalculationResult(JSON.parse(finding.metrics));
  const payload={schema_version:'1.0',action_kind:action,method:{id:finding.method_id,version:finding.method_version},confirmed_context:context,aggregate:{artifact_id:finding.aggregate_id,metrics},...(action==='draft_candidates'?{accepted_finding:{finding_id:finding.finding_id,judgment:finding.judgment,supporting_evidence:finding.supporting_evidence,refutation:finding.refutation,limitations:finding.limitations,evidence_refs:finding.evidence_refs}}:{})};
  return {payload_text:canonicalDesktopJson(payload),categories:['action_schema_labels','user_authored_free_text','verified_pseudonymous_aggregate','method_label',...(action==='draft_candidates'?['accepted_finding']:[])],aggregate_refs:[finding.aggregate_id],free_text_present:true};
}

export type DesktopReportMaterial=Readonly<{manifest:DesktopRunManifest;contract_text:string;binding_text:string;ir_text:string;primary_sql:string;python_verifier:string}>;

export function desktopReportExportProjection(projection:DesktopProjection,reportId:string,format:'markdown'|'html',verifiedText:string|null,material:DesktopReportMaterial|null,omitted:readonly string[]):Uint8Array{
  const report=projection.reports.find(r=>r.report_id===reportId),revision=projection.revision;if(!report||!revision)desktopRuleFailure('NOT_FOUND');
  const finding=projection.findings.find(f=>f.finding_id===report.finding_id);if(!finding)desktopRuleFailure('INTEGRITY_BLOCKED');
  const marker=[report.state==='draft'?'UNACCEPTED':null,revision.integrity_state!=='ok'||omitted.length?'INTEGRITY_BLOCKED':null].filter(Boolean).join(' / ');
  const facts={authority:'readable_committed_business_facts_not_reconstructed_file_bytes',report_id:reportId,version_sequence:report.version_sequence,source_document_hashes:{markdown:report.markdown_sha256,html:report.html_sha256},project:projection.project,session:projection.session,revision:{revision_id:revision.revision_id,case_name:revision.case_name,question_text:revision.question_text,business_context:revision.business_context,hypothesis_display_title:revision.hypothesis_display_title,alternative_explanations:revision.alternative_explanations,evidence_explanation_text:revision.evidence_explanation_text},snapshot:projection.snapshot,confirmation:projection.confirmation,finding,acceptance:projection.acceptances.find(a=>a.acceptance_id===report.acceptance_id)??null,closure:projection.closures.find(c=>c.closure_id===report.closure_id)??null,forms:projection.forms,omitted:[...omitted]};
  const sections:[string,string][]=[['导出投影标记',marker||'Committed report projection'],['业务事实与来源身份',canonicalDesktopJson(facts)]];
  if(verifiedText!==null)sections.push(['已核验的来源报告正文',verifiedText]);
  if(material)sections.push(['analysis-contract.json',material.contract_text],['binding.json',material.binding_text],['ir.json',material.ir_text],['primary.sql',material.primary_sql],['verify.py',material.python_verifier],['Run integrity manifest',canonicalDesktopJson(material.manifest)]);
  if(report.review_content)for(const e of report.review_content.evidence)sections.push([e.title,e.content]);
  sections.push(['范围','This export is a projection, not a new Finding, acceptance or Closure. No external Action was executed. No Outcome is claimed.']);
  const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const output=format==='markdown'?`# 会员复购报告导出 · ${marker}\n\n${sections.map(([title,body])=>`## ${title}\n\n${body}\n`).join('\n')}`:`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>会员复购报告导出</title><style>body{font:16px system-ui;max-width:960px;margin:32px auto;padding:0 24px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><main><h1>会员复购报告导出 · ${escape(marker)}</h1>${sections.map(([title,body])=>`<section><h2>${escape(title)}</h2><pre>${escape(body)}</pre></section>`).join('')}</main></body></html>`;
  return new TextEncoder().encode(output);
}

/** Builds new evidence-bound bytes, never rewrites a prior draft or its claims. */
export function desktopFinalReport(projection:DesktopProjection,acceptanceId:string,formId:string,closureId:string,completedAt:string,material:DesktopReportMaterial){
  const revision=projection.revision,acceptance=projection.acceptances.find(a=>a.acceptance_id===acceptanceId),form=projection.forms.find(f=>f.form_id===formId),finding=acceptance&&projection.findings.find(f=>f.finding_id===acceptance.finding_id);
  if(!revision||!acceptance||!form||!finding||form.disposition!=='saved'||material.manifest.run_id!==finding.run_id)desktopRuleFailure();
  const source={schema_version:'1.0',run_id:finding.run_id,finding_id:finding.finding_id,...material.manifest.product_context,method:material.manifest.method,acceptance_id:acceptanceId,form_id:formId,closure_id:closureId};
  const sections:[string,string][]=[
    ['分析案例',`Case: ${revision.case_name}\nQuestion: ${revision.question_text}\nHypothesis: ${revision.hypothesis_display_title}\nContext: ${revision.business_context}\nAlternatives: ${canonicalDesktopJson(revision.alternative_explanations)}`],
    ['已接受的 Finding',`Finding: ${finding.finding_id}\nAccepted: ${acceptance.accepted_at}\nJudgment: ${finding.judgment}\nSupport: ${finding.supporting_evidence.join('; ')}\nRefutation: ${finding.refutation}\nLimitations: ${finding.limitations.join('; ')}\nManual evidence explanation: ${revision.evidence_explanation_text??''}`],
    ['精确确定性指标',finding.metrics],
    ['Decision Closure',`Acceptance: ${acceptanceId}\nClosure: ${closureId}\nForm: ${formId}\nRoute: ${form.route}\nCompleted: ${completedAt}\n${form.route==='insufficient_evidence'?`Insufficient evidence: ${form.insufficient_reason}`:form.candidates.map(c=>`Candidate ${c.candidate_id}\nTitle: ${c.title}\nEvidence: ${c.evidence_basis}\nRisk/refutation: ${c.risk_or_refutation}\nApplicability: ${c.applicability_conditions}\nFuture validation: ${c.future_validation_metric}`).join('\n\n')}\nPreferred: ${form.preferred_candidate_id??'none'}\nPreference reason: ${form.preferred_reason??'none'}\nNo external Action was executed. No Outcome is claimed.`],
    ['来源与确认',canonicalDesktopJson({source,snapshot:projection.snapshot,confirmation:projection.confirmation})],
    ['analysis-contract.json',material.contract_text],['binding.json',material.binding_text],['ir.json',material.ir_text],['primary.sql',material.primary_sql],['verify.py',material.python_verifier],
    ['Run integrity manifest',canonicalDesktopJson(material.manifest)],
  ];
  const report=projection.reports.find(r=>r.finding_id===finding.finding_id&&r.review_content!==null);
  if(!report?.review_content)desktopRuleFailure('INTEGRITY_BLOCKED');
  const evidence=report.review_content.evidence;
  const markdown=`# 会员复购分析 · Final\n\n${sections.map(([title,body])=>`## ${title}\n\n${body}\n`).join('\n')}\n## 证据回链\n\n${evidence.map(e=>`[${e.title}](#evidence-${e.evidence_ref.replace(':','-')})`).join(' · ')}\n\n${evidence.map(e=>`## evidence-${e.evidence_ref.replace(':','-')}\n\n${e.title}\n\n${e.content}\n`).join('\n')}`;
  const escape=(text:string)=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>会员复购分析 · Final</title><style>body{font:16px system-ui;max-width:960px;margin:32px auto;padding:0 24px;color:#182826}pre{white-space:pre-wrap;overflow-wrap:anywhere}section{margin:28px 0}a{color:#006c55}details{margin:16px 0}</style></head><body><main><h1>会员复购分析 · Final</h1>${sections.map(([title,body])=>`<section><h2>${escape(title)}</h2><pre>${escape(body)}</pre></section>`).join('')}<nav aria-label="证据回链">${evidence.map(e=>`<a href="#evidence-${e.evidence_ref.replace(':','-')}">${escape(e.title)}</a>`).join(' · ')}</nav>${evidence.map(e=>`<section id="evidence-${e.evidence_ref.replace(':','-')}" tabindex="-1"><h2>${escape(e.title)}</h2><pre>${escape(e.content)}</pre></section>`).join('')}</main></body></html>`;
  return {markdown_bytes:new TextEncoder().encode(markdown),html_bytes:new TextEncoder().encode(html),source,evidence_refs:[...finding.evidence_refs]};
}

/** Predicate-only validation: drafts retain entered text; saved routes are complete. */
export function validateDesktopDecisionForm(form:Extract<SaveFormInput,{kind:'decision_closure'}>):void {
  const meaningful=(value:unknown)=>typeof value==='string'&&/[^\p{White_Space}]/u.test(value);
  if(new Set(form.candidates.map(c=>c.candidate_id)).size!==form.candidates.length)desktopRuleFailure();
  if(form.defer_until!==null&&form.disposition!=='deferred')desktopRuleFailure();
  if(form.preferred_candidate_id!==null&&!form.candidates.some(c=>c.candidate_id===form.preferred_candidate_id))desktopRuleFailure();
  if(form.route===null){if(form.disposition==='saved')desktopRuleFailure();return;}
  if(form.route==='candidate_comparison'){
    if(!form.candidates.length||form.preferred_candidate_id!==null&&form.preferred_reason===null)desktopRuleFailure();
    if(form.disposition==='saved'&&(form.candidates.length<2||form.candidates.some(c=>[c.title,c.evidence_basis,c.risk_or_refutation,c.applicability_conditions,c.future_validation_metric].some(x=>!meaningful(x)))||form.preferred_candidate_id!==null&&!meaningful(form.preferred_reason)))desktopRuleFailure();
  }else if(form.insufficient_reason===null||form.preferred_candidate_id!==null||form.preferred_reason!==null||form.disposition==='saved'&&!meaningful(form.insufficient_reason))desktopRuleFailure();
}

export function desktopRuleFailure(code = 'VALIDATION_FAILED'): never {
  throw Object.assign(new Error(code), { code });
}

export type DesktopCsv = Readonly<{ headers: readonly string[]; rows: readonly (readonly string[])[] }>;

export const DESKTOP_INT64_MAX = 9223372036854775807n;

export function checkedDesktopInteger(value: bigint): bigint {
  if (value < -9223372036854775808n || value > DESKTOP_INT64_MAX) desktopRuleFailure('CALCULATION_FAILED');
  return value;
}

export type DesktopRational = Readonly<{ numerator: string; denominator: string }>;
export function desktopRational(numerator: bigint, denominator: bigint): DesktopRational {
  checkedDesktopInteger(numerator); checkedDesktopInteger(denominator);
  if (denominator <= 0n) desktopRuleFailure('CALCULATION_FAILED');
  if (numerator === 0n) return Object.freeze({ numerator: '0', denominator: '1' });
  let a = numerator < 0n ? -numerator : numerator, b = denominator;
  while (b !== 0n) [a, b] = [b, a % b];
  return Object.freeze({ numerator: String(numerator / a), denominator: String(denominator / a) });
}

export function canonicalDesktopJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item !== null && typeof item === 'object') return Object.fromEntries(Object.keys(item).sort((a, b) => {
      const left = Array.from(a, char => char.codePointAt(0)!), right = Array.from(b, char => char.codePointAt(0)!);
      for (let i = 0; i < Math.min(left.length, right.length); i += 1) if (left[i] !== right[i]) return left[i] - right[i];
      return left.length - right.length;
    }).map(key => [key, normalize((item as Record<string, unknown>)[key])]));
    if (typeof item === 'number' || typeof item === 'bigint' || item === undefined) desktopRuleFailure();
    return item;
  };
  return JSON.stringify(normalize(value));
}

export type DesktopMetricPeriod = Readonly<{ active_member_count: string; repeat_member_count: string; repurchase_rate: DesktopRational; repeat_revenue_fen: string }>;
export type DesktopCalculationResult = Readonly<{
  periods: Readonly<{comparison: DesktopMetricPeriod; current: DesktopMetricPeriod}>;
  changes: ReturnType<typeof desktopMetricChanges>;
  m2: Readonly<{status:'not_applicable'}> | Readonly<{status:'applicable'; groups: readonly Readonly<{group_id:string; comparison_repeat_revenue_fen:string; current_repeat_revenue_fen:string; absolute_delta:string}>[]}>;
}>;

export function validateDesktopCalculationResult(value: unknown): DesktopCalculationResult {
  try {
    const result = closed(value,['periods','changes','m2']), periods = closed(result.periods,['comparison','current']);
    const integer = (value: unknown, signed = false): bigint => { if (typeof value !== 'string' || !(signed?/^(?:0|-?[1-9][0-9]*)$/:/^(?:0|[1-9][0-9]*)$/).test(value)) desktopRuleFailure(); return checkedDesktopInteger(BigInt(value)); };
    for (const name of ['comparison','current']) {
      const period = closed(periods[name],['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']);
      const active = integer(period.active_member_count), repeat = integer(period.repeat_member_count), revenue = integer(period.repeat_revenue_fen);
      if (repeat > active || (repeat === 0n) !== (revenue === 0n)) desktopRuleFailure();
      closed(period.repurchase_rate,['numerator','denominator']);
      if (canonicalDesktopJson(period.repurchase_rate) !== canonicalDesktopJson(active === 0n ? desktopRational(0n,1n) : desktopRational(repeat,active))) desktopRuleFailure();
    }
    const comparison = periods.comparison as DesktopMetricPeriod, current = periods.current as DesktopMetricPeriod;
    const expected = desktopMetricChanges(comparison,current);
    if (canonicalDesktopJson(result.changes) !== canonicalDesktopJson(expected)) desktopRuleFailure();
    if (result.m2 === null || typeof result.m2 !== 'object' || Array.isArray(result.m2)) desktopRuleFailure();
    if ((result.m2 as Record<string,unknown>).status === 'not_applicable') closed(result.m2,['status']);
    else {
      const m2 = closed(result.m2,['status','groups']);
      if (m2.status !== 'applicable' || !Array.isArray(m2.groups) || m2.groups.length === 0) desktopRuleFailure();
      let previous = '', oldSum = 0n, newSum = 0n, deltaSum = 0n;
      for (const item of m2.groups) {
        const group = closed(item,['group_id','comparison_repeat_revenue_fen','current_repeat_revenue_fen','absolute_delta']);
        if (!uuidForm(group.group_id,'4') || group.group_id <= previous) desktopRuleFailure(); previous = group.group_id;
        const old = integer(group.comparison_repeat_revenue_fen), now = integer(group.current_repeat_revenue_fen), delta = integer(group.absolute_delta,true);
        if (checkedDesktopInteger(now-old) !== delta) desktopRuleFailure();
        oldSum = checkedDesktopInteger(oldSum+old); newSum = checkedDesktopInteger(newSum+now); deltaSum = checkedDesktopInteger(deltaSum+delta);
      }
      if (String(oldSum) !== comparison.repeat_revenue_fen || String(newSum) !== current.repeat_revenue_fen || String(deltaSum) !== expected.repeat_revenue_fen.absolute_delta) desktopRuleFailure();
    }
    return structuredClone(value) as DesktopCalculationResult;
  } catch { desktopRuleFailure(); }
}

export function desktopJudgment(value: DesktopCalculationResult): 'Confirmed'|'Rejected'|'Inconclusive' {
  const {comparison,current} = value.periods;
  if (comparison.active_member_count === '0' || current.active_member_count === '0') return 'Inconclusive';
  return checkedDesktopInteger(BigInt(current.repurchase_rate.numerator)*BigInt(comparison.repurchase_rate.denominator)) < checkedDesktopInteger(BigInt(comparison.repurchase_rate.numerator)*BigInt(current.repurchase_rate.denominator)) ? 'Confirmed' : 'Rejected';
}

export function validateDesktopRunEvidence(input: unknown, manifest: DesktopRunManifest, result: DesktopCalculationResult): Record<string,unknown> {
  const evidence = closed(input,['schema_version','run_id','product_context','method','sources','calculations','equality','judgment','m2_applicability','candidate_publications','limitations']);
  const same = (a: unknown,b: unknown) => canonicalDesktopJson(a) === canonicalDesktopJson(b);
  if (evidence.schema_version !== '3.0' || evidence.run_id !== manifest.run_id || !same(evidence.product_context,manifest.product_context) || !same(evidence.method,manifest.method) || !same(evidence.sources,manifest.sources.map(({role,sha256})=>({role,sha256}))) || !same(evidence.calculations,manifest.artifacts.slice(2,4))) desktopRuleFailure();
  if (!same(evidence.equality,{status:'matched',result_sha256:createHash('sha256').update(canonicalDesktopJson(result)).digest('hex')}) || evidence.judgment !== desktopJudgment(result) || evidence.m2_applicability !== result.m2.status || !same(evidence.limitations,['association_not_causation','no_significance_test','confirmed_local_snapshot_only'])) desktopRuleFailure();
  const publications = closed(evidence.candidate_publications,['aggregate','report']), aggregate = closed(publications.aggregate,['artifact_id','locator','sha256','byte_length']), report = closed(publications.report,['report_id','markdown','html']);
  if (!uuidForm(aggregate.artifact_id,'4') || !uuidForm(report.report_id,'4')) desktopRuleFailure();
  const descriptor = (value: Record<string,unknown>, locator: string) => { if (value.locator !== locator || !hashForm(value.sha256) || typeof value.byte_length !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value.byte_length) || BigInt(value.byte_length)>DESKTOP_INT64_MAX) desktopRuleFailure(); };
  descriptor(aggregate,`${manifest.product_context.session_id}/020_clean/${aggregate.artifact_id}/aggregate.json`);
  descriptor(closed(report.markdown,['locator','sha256','byte_length']),`${manifest.product_context.session_id}/060_reports/${report.report_id}/report.md`);
  descriptor(closed(report.html,['locator','sha256','byte_length']),`${manifest.product_context.session_id}/060_reports/${report.report_id}/report.html`);
  return structuredClone(evidence);
}

export function desktopMetricChanges(comparison: DesktopMetricPeriod, current: DesktopMetricPeriod) {
  const integerChange = (before: string, after: string) => {
    const old = BigInt(before), delta = checkedDesktopInteger(BigInt(after) - old);
    return Object.freeze({ absolute_delta: String(delta), relative_change: old === 0n ? 'not_applicable' : desktopRational(delta, old) });
  };
  const old = comparison.repurchase_rate, now = current.repurchase_rate;
  const numerator = checkedDesktopInteger(checkedDesktopInteger(BigInt(now.numerator) * BigInt(old.denominator)) - checkedDesktopInteger(BigInt(old.numerator) * BigInt(now.denominator)));
  const denominator = checkedDesktopInteger(BigInt(now.denominator) * BigInt(old.denominator));
  const absolute = desktopRational(numerator, denominator);
  return Object.freeze({ active_member_count: integerChange(comparison.active_member_count, current.active_member_count), repeat_member_count: integerChange(comparison.repeat_member_count, current.repeat_member_count), repeat_revenue_fen: integerChange(comparison.repeat_revenue_fen, current.repeat_revenue_fen),
    repurchase_rate: Object.freeze({ absolute_delta: absolute, relative_change: BigInt(old.numerator) === 0n ? 'not_applicable' : desktopRational(checkedDesktopInteger(BigInt(absolute.numerator) * BigInt(old.denominator)), checkedDesktopInteger(BigInt(absolute.denominator) * BigInt(old.numerator))) }) });
}

export type DesktopSelection = Readonly<{
  column_mapping: Readonly<{ member_id_column: string | null; member_group_column: string | null; order_id_column: string | null; order_member_id_column: string | null; paid_at_column: string | null; amount_column: string | null; status_column: string | null; currency_column: string | null }>;
  comparison_period: Readonly<{ start_date: string; end_date: string }>;
  current_period: Readonly<{ start_date: string; end_date: string }>;
  currency: 'CNY'; time_zone: 'Asia/Shanghai'; valid_statuses: readonly string[];
  selected_group_mode: 'none' | 'mapped';
}>;
export type DesktopPreparedOrder = Readonly<{ order_id: string; member_id: string; group: string | null; epoch_seconds: bigint; fraction: string; amount_fen: bigint; period: 'comparison' | 'current' }>;
export type DesktopReviewIssue = Readonly<{ code: string; count: string; treatment_options: readonly string[] }>;

export function desktopConfirmationDocuments(context: Readonly<{ project_id: string; session_id: string; case_id: string; revision_id: string; snapshot_id: string; confirmation_id: string }>, choice: DesktopSelection & Readonly<{ issue_treatments: readonly Readonly<{ code: string; count: string; treatment: string }>[]; hypothesis_id: string; method_id: string; method_version: string }>) {
  const encode = (value: unknown) => new TextEncoder().encode(canonicalDesktopJson(value));
  return Object.freeze({
    contract_bytes: encode({ ...context, currency: choice.currency, time_zone: choice.time_zone, comparison_period: choice.comparison_period, current_period: choice.current_period, valid_statuses: choice.valid_statuses, issue_treatments: choice.issue_treatments, selected_group_mode: choice.selected_group_mode, hypothesis_id: choice.hypothesis_id, method_id: choice.method_id, method_version: choice.method_version }),
    binding_bytes: encode(choice.column_mapping),
    ir_bytes: encode({ steps: ['verify_immutable_snapshot', 'duckdb_primary_calculation', 'python_independent_recomputation', 'equality_check', 'evidence_finding_assembly'] }),
  });
}

function dateDay(value: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) desktopRuleFailure();
  const [year, month, day] = value.split('-').map(Number);
  return utcSeconds(year, month, day, 0, 0, 0) / 86400;
}

/** Validate every source row before filters; invalid rows cannot disappear as exclusions. */
export function prepareDesktopData(snapshot: Readonly<{ members_bytes: Uint8Array; orders_bytes: Uint8Array }>, selection: DesktopSelection) {
  const members = parseDesktopCsv(snapshot.members_bytes), orders = parseDesktopCsv(snapshot.orders_bytes);
  if (selection.currency !== 'CNY' || selection.time_zone !== 'Asia/Shanghai' || !Array.isArray(selection.valid_statuses) || selection.valid_statuses.length === 0 || selection.valid_statuses.some(x => typeof x !== 'string' || x.length === 0) || new Set(selection.valid_statuses).size !== selection.valid_statuses.length) desktopRuleFailure();
  const periods = [selection.comparison_period, selection.current_period].map(period => [dateDay(period.start_date), dateDay(period.end_date)]);
  if (periods[0][1] <= periods[0][0] || periods[1][1] <= periods[1][0] || periods[0][1] - periods[0][0] !== periods[1][1] - periods[1][0] || !(periods[0][1] <= periods[1][0] || periods[1][1] <= periods[0][0])) desktopRuleFailure();
  const mapping = selection.column_mapping;
  if (!mapping || !['none', 'mapped'].includes(selection.selected_group_mode) || (mapping.member_group_column === null) !== (selection.selected_group_mode === 'none')) desktopRuleFailure();
  const column = (table: DesktopCsv, name: string | null) => { if (typeof name !== 'string' || !table.headers.includes(name)) desktopRuleFailure(); return table.headers.indexOf(name); };
  const mi = column(members, mapping.member_id_column), mg = mapping.member_group_column === null ? null : column(members, mapping.member_group_column);
  const oi = column(orders, mapping.order_id_column), om = column(orders, mapping.order_member_id_column), ot = column(orders, mapping.paid_at_column), oa = column(orders, mapping.amount_column), os = column(orders, mapping.status_column), oc = column(orders, mapping.currency_column);
  const issueCounts = new Map<string, bigint>();
  const issue = (code: string, count = 1n) => issueCounts.set(code, (issueCounts.get(code) ?? 0n) + count);
  const edgeWhitespace = (value: string) => /^\p{White_Space}|\p{White_Space}$/u.test(value);
  const memberGroups = new Map<string, string | null>();
  for (const row of members.rows) {
    const id = row[mi];
    if (id.length === 0 || memberGroups.has(id)) desktopRuleFailure();
    memberGroups.set(id, mg === null ? null : row[mg]);
    if (mg !== null && row[mg] === '') issue('missing_optional_group');
    if (edgeWhitespace(id)) issue('exact_whitespace');
  }
  const orderIds = new Set<string>(), selected: DesktopPreparedOrder[] = [], observedStatuses = new Set<string>(), localDates: string[] = [];
  for (const row of orders.rows) {
    const id = row[oi], member = row[om];
    if (id.length === 0 || member.length === 0 || orderIds.has(id) || !memberGroups.has(member) || row[oc] !== 'CNY') desktopRuleFailure();
    orderIds.add(id);
    const time = parseDesktopPaidAt(row[ot]), amount = parseDesktopFen(row[oa]);
    observedStatuses.add(row[os]); localDates.push(time.local_date);
    if ([id, member, row[os]].some(edgeWhitespace)) issue('exact_whitespace');
    const day = dateDay(time.local_date), period = periods.findIndex(([start, end]) => start <= day && day < end);
    const statusIncluded = selection.valid_statuses.includes(row[os]);
    if (period < 0) issue('outside_periods');
    if (!statusIncluded) issue('excluded_status');
    if (period >= 0 && statusIncluded) selected.push(Object.freeze({ order_id: id, member_id: member, group: memberGroups.get(member)!, epoch_seconds: time.epoch_seconds, fraction: time.fraction, amount_fen: amount, period: period === 0 ? 'comparison' : 'current' }));
  }
  if (selected.length === 0) desktopRuleFailure();
  const memberColumns = [mapping.member_id_column, mapping.member_group_column], orderColumns = [mapping.order_id_column, mapping.order_member_id_column, mapping.paid_at_column, mapping.amount_column, mapping.status_column, mapping.currency_column];
  if (members.headers.some(name => !memberColumns.includes(name))) issue('unmapped_columns', BigInt(members.rows.length));
  if (orders.headers.some(name => !orderColumns.includes(name))) issue('unmapped_columns', BigInt(orders.rows.length));
  const ties = new Map<string, bigint>();
  for (const order of selected) { const key = JSON.stringify([order.period, order.member_id, order.epoch_seconds.toString(), order.fraction]); ties.set(key, (ties.get(key) ?? 0n) + 1n); }
  for (const count of ties.values()) if (count > 1n) issue('paid_at_tie', count);
  const treatments = [['outside_periods', 'exclude'], ['excluded_status', 'exclude'], ['missing_optional_group', 'include_missing_group'], ['exact_whitespace', 'preserve_exact'], ['unmapped_columns', 'ignore_unmapped'], ['paid_at_tie', 'order_id_utf8']] as const;
  const reviewable_issues: DesktopReviewIssue[] = treatments.filter(([code]) => (issueCounts.get(code) ?? 0n) > 0n).map(([code, treatment]) => Object.freeze({ code, count: String(issueCounts.get(code)), treatment_options: Object.freeze([treatment]) }));
  return Object.freeze({ members, source_orders: orders, orders: Object.freeze(selected), member_groups: memberGroups,
    observed_statuses: Object.freeze([...observedStatuses]), local_dates: Object.freeze(localDates.sort()), reviewable_issues: Object.freeze(reviewable_issues),
    counts: Object.freeze({ included_member_count: String(members.rows.length), excluded_member_count: '0', included_order_count: String(selected.length), excluded_order_count: String(orders.rows.length - selected.length) }) });
}

export function parseDesktopFen(value: string): bigint {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) desktopRuleFailure();
  const [whole, fraction = ''] = value.split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (result < 1n || result > DESKTOP_INT64_MAX) desktopRuleFailure();
  return result;
}

const shanghai = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', era: 'short' });

function utcSeconds(year: number, month: number, day: number, hour: number, minute: number, second: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day); date.setUTCHours(hour, minute, second, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) desktopRuleFailure();
  return date.getTime() / 1000;
}

function localParts(seconds: number): readonly number[] {
  const parts = Object.fromEntries(shanghai.formatToParts(new Date(seconds * 1000)).map(part => [part.type, part.value]));
  const year = Number(parts.year);
  return [parts.era === 'BC' ? 1 - year : year, Number(parts.month), Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)];
}

/** Fraction digits stay exact; Date is used only for integral calendar seconds. */
export function parseDesktopPaidAt(value: string): Readonly<{ epoch_seconds: bigint; fraction: string; local_date: string }> {
  if (typeof value !== 'string') desktopRuleFailure();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?([Zz]|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (!match) desktopRuleFailure();
  const wanted = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4] ?? 0), Number(match[5] ?? 0), Number(match[6] ?? 0)];
  const seconds = utcSeconds(wanted[0], wanted[1], wanted[2], wanted[3], wanted[4], wanted[5]);
  const zone = match[8];
  let instant: number;
  if (zone) {
    let offset = 0;
    if (!/^[Zz]$/.test(zone)) {
      const hour = Number(zone.slice(1, 3)), minute = Number(zone.slice(4, 6));
      if (hour > 23 || minute > 59) desktopRuleFailure();
      offset = (hour * 3600 + minute * 60) * (zone[0] === '+' ? 1 : -1);
    }
    instant = seconds - offset;
  } else {
    const offsets = new Set<number>();
    for (const delta of [-86400, 0, 86400]) {
      const candidate = seconds + delta, local = localParts(candidate);
      offsets.add(utcSeconds(local[0], local[1], local[2], local[3], local[4], local[5]) - candidate);
    }
    const matches = [...offsets].map(offset => seconds - offset).filter(candidate => localParts(candidate).every((part, i) => part === wanted[i]));
    if (matches.length !== 1) desktopRuleFailure();
    instant = matches[0];
  }
  const local = localParts(instant);
  return Object.freeze({ epoch_seconds: BigInt(instant), fraction: (match[7] ?? '').replace(/0+$/, ''), local_date: local.slice(0, 3).map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0')).join('-') });
}

/** Strict whole-file RFC4180 parsing: byte authority is never normalized. */
export function parseDesktopCsv(bytes: Uint8Array): DesktopCsv {
  if (!(bytes instanceof Uint8Array)) desktopRuleFailure();
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { desktopRuleFailure(); }
  if (text.length === 0) desktopRuleFailure();
  const rows: string[][] = [];
  let row: string[] = [], value = '', state: 'start' | 'unquoted' | 'quoted' | 'closed' = 'start';
  const field = () => { row.push(value); value = ''; state = 'start'; };
  const line = () => { field(); rows.push(row); row = []; };
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (state === 'quoted') {
      if (ch === '"') {
        if (text[index + 1] === '"') { value += '"'; index += 1; }
        else state = 'closed';
      } else value += ch;
      continue;
    }
    if (ch === ',') { field(); continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r') { if (text[index + 1] !== '\n') desktopRuleFailure(); index += 1; }
      line(); continue;
    }
    if (state === 'closed') desktopRuleFailure();
    if (ch === '"') { if (state !== 'start') desktopRuleFailure(); state = 'quoted'; }
    else { value += ch; state = 'unquoted'; }
  }
  if (state === 'quoted') desktopRuleFailure();
  if (state !== 'start' || row.length > 0) line();
  const headers = rows.shift();
  if (!headers || headers.some(name => name.length === 0) || new Set(headers).size !== headers.length || rows.some(item => item.length !== headers.length)) desktopRuleFailure();
  return Object.freeze({ headers: Object.freeze(headers), rows: Object.freeze(rows.map(item => Object.freeze(item))) });
}
import { createHash } from 'node:crypto';

export type DesktopFileDescriptor = Readonly<{path: string; sha256: string; byte_length: string}>;
export type DesktopRunArtifact = DesktopFileDescriptor & Readonly<{artifact_id: string; kind: string}>;
export type DesktopRunManifest = Readonly<{
  schema_version: '3.0'; run_id: string; analysis_kind: 'membership_repurchase_decision_case'; status: 'in_progress' | 'succeeded' | 'failed' | 'cancelled'; started_at: string; ended_at?: string;
  product_context: Readonly<{project_id: string; session_id: string; case_id: string; revision_id: string; confirmation_id: string; snapshot_id: string}>;
  application: Readonly<{id: 'xanthil-desktop'; version: '0.1.0'}>; profile: Readonly<{id: 'personal-desktop'}>; execution: Readonly<{kind: 'deterministic_local'; model_usage: 'none'}>;
  method: Readonly<{id: 'membership_repurchase_comparison'; version: '1.0'; code_identity: string}>;
  tools: Readonly<{duckdb_version: '1.5.2'; python_version: string}>;
  confirmation: Readonly<{contract: DesktopFileDescriptor; binding: DesktopFileDescriptor; ir: DesktopFileDescriptor}>;
  sources: readonly (DesktopFileDescriptor & Readonly<{role: 'members' | 'orders'; snapshot_id: string; display_name: string; confirmed_at: string}>)[];
  artifacts: readonly DesktopRunArtifact[]; evidence?: DesktopFileDescriptor; terminal_detail?: Readonly<{reason: string}>;
}>;

function closed(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value,key))) desktopRuleFailure();
  return value as Record<string, unknown>;
}
const hashForm = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const uuidForm = (value: unknown, version: '4'|'7'): value is string => typeof value === 'string' && new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${version}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).test(value);
const timestampForm = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

/** Pure closed Desktop 3.0 authority; old Run1/2 validators remain separate. */
export function validateDesktopRunManifest(value: unknown): DesktopRunManifest {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) desktopRuleFailure();
  const status = (value as Record<string, unknown>).status;
  if (!['in_progress','succeeded','failed','cancelled'].includes(String(status))) desktopRuleFailure();
  const run = closed(value, ['schema_version','run_id','analysis_kind','status','started_at','product_context','application','profile','execution','method','tools','confirmation','sources','artifacts', ...(status === 'in_progress' ? [] : ['ended_at', status === 'succeeded' ? 'evidence' : 'terminal_detail'])]);
  if (run.schema_version !== '3.0' || !uuidForm(run.run_id,'7') || run.analysis_kind !== 'membership_repurchase_decision_case' || !timestampForm(run.started_at) || status !== 'in_progress' && (!timestampForm(run.ended_at) || run.ended_at < run.started_at)) desktopRuleFailure();
  const context = closed(run.product_context,['project_id','session_id','case_id','revision_id','confirmation_id','snapshot_id']);
  if (!Object.values(context).every(x => uuidForm(x,'4'))) desktopRuleFailure();
  const application = closed(run.application,['id','version']), profile = closed(run.profile,['id']), execution = closed(run.execution,['kind','model_usage']);
  if (application.id !== 'xanthil-desktop' || application.version !== '0.1.0' || profile.id !== 'personal-desktop' || execution.kind !== 'deterministic_local' || execution.model_usage !== 'none') desktopRuleFailure();
  const method = closed(run.method,['id','version','code_identity']), tools = closed(run.tools,['duckdb_version','python_version']);
  if (method.id !== 'membership_repurchase_comparison' || method.version !== '1.0' || !hashForm(method.code_identity) || tools.duckdb_version !== '1.5.2' || typeof tools.python_version !== 'string' || !/^3\.(?:9|[1-9][0-9]+)\.[0-9]+$/.test(tools.python_version)) desktopRuleFailure();
  const descriptor = (input: unknown, path: string, extra: readonly string[] = []) => {
    const file = closed(input,[...extra,'path','sha256','byte_length']);
    if (file.path !== path || !hashForm(file.sha256) || typeof file.byte_length !== 'string' || !/^(0|[1-9][0-9]*)$/.test(file.byte_length) || BigInt(file.byte_length) > DESKTOP_INT64_MAX) desktopRuleFailure();
    return file;
  };
  const confirmation = closed(run.confirmation,['contract','binding','ir']);
  for (const [name,path] of [['contract','analysis-contract.json'],['binding','binding.json'],['ir','ir.json']]) descriptor(confirmation[name],path);
  if (!Array.isArray(run.sources) || run.sources.length !== 2) desktopRuleFailure();
  for (const [index,role] of ['members','orders'].entries()) {
    const file = descriptor(run.sources[index],`${context.session_id}/010_draw/${context.snapshot_id}/${role}.csv`,['role','snapshot_id','display_name','confirmed_at']);
    if (file.role !== role || file.snapshot_id !== context.snapshot_id || typeof file.display_name !== 'string' || !file.display_name || /[/\\\u0000-\u001f]/.test(file.display_name) || ['.','..'].includes(file.display_name) || !timestampForm(file.confirmed_at) || file.confirmed_at > run.started_at) desktopRuleFailure();
  }
  if (!Array.isArray(run.artifacts) || (status === 'succeeded' ? run.artifacts.length !== 6 : ![2,3,4].includes(run.artifacts.length))) desktopRuleFailure();
  const identities = [['primary-query','query','assets/primary.sql'],['independent-verifier','verifier','assets/verify.py'],['duckdb-result','calculation_output','outputs/duckdb.json'],['python-result','verification_output','outputs/python.json'],['run-summary','summary','summary.md'],['run-evidence','evidence_document','evidence.md']];
  for (const [index,input] of run.artifacts.entries()) {
    const [id,kind,path] = identities[index], file = descriptor(input,path,['artifact_id','kind']);
    if (file.artifact_id !== id || file.kind !== kind) desktopRuleFailure();
  }
  const code = createHash('sha256').update(canonicalDesktopJson({method_id: method.id, method_version: method.version, primary_sql_sha256: run.artifacts[0].sha256, python_verifier_sha256: run.artifacts[1].sha256})).digest('hex');
  if (method.code_identity !== code) desktopRuleFailure();
  if (status === 'succeeded') descriptor(run.evidence,'evidence.json');
  else if (status !== 'in_progress') {
    const terminal = closed(run.terminal_detail,['reason']);
    if (status === 'cancelled' ? terminal.reason !== 'user_cancelled' : !['source_changed','toolchain_unavailable','calculation_failed','validation_mismatch','run_artifact_failed','publication_failed','deadline_exceeded','interrupted','integrity_blocked'].includes(String(terminal.reason))) desktopRuleFailure();
  }
  return structuredClone(value) as DesktopRunManifest;
}
