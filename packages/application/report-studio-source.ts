import type {OpenStoredTask} from '../ports/open-analysis-store.ts';
import {taskHash} from '../product-core/member-task.ts';
import {membershipUuid} from '../product-core/member-analysis.ts';
import {numericReportCopy} from '../product-core/open-analysis-numeric-report.ts';
import {openAnalysisReadableText} from '../product-core/open-analysis-report.ts';
import type {ReportStudioMaterial, ReportStudioMaterialCatalog, ReportStudioMaterialSnapshot, ReportStudioSource} from '../contracts/report-studio.ts';

function fail(code: string): never {throw Object.assign(new Error(code), {code});}
export function reportStudioMaterialCatalog(projectId: string, task: OpenStoredTask, revision: string): ReportStudioMaterialCatalog {
  if (!membershipUuid(projectId) || typeof revision !== 'string' || !/^[1-9][0-9]*$/.test(revision)) fail('RS_SOURCE_UNAVAILABLE');
  const matches = [task, ...(task.history ?? [])].filter(t => t.identity.task_id === task.identity.task_id && t.identity.revision === revision);
  if (matches.length !== 1) fail('RS_SOURCE_UNAVAILABLE');
  const version = matches[0], result = version.outcome ?? version.conversation_outcome;
  if (version.state !== 'saved' || !result || !membershipUuid(result.outcome_id)
    || !membershipUuid(version.identity.task_id) || !/^[a-f0-9]{64}$/.test(version.identity.scope_sha256)) fail('RS_SOURCE_UNAVAILABLE');
  const source: ReportStudioSource = {project_id: projectId, task_id: version.identity.task_id, revision,
    outcome_id: result.outcome_id, outcome_sha256: taskHash(result), scope_sha256: version.identity.scope_sha256};
  const outcome = version.outcome;
  const report = outcome ? [...(version.revision_previews ?? [])].reverse().find(p => p.state === 'answered'
    && p.report?.outcome_id === outcome.outcome_id && p.report.outcome_sha256 === source.outcome_sha256)?.report?.numeric_report ?? outcome.numeric_report : null;
  const text = outcome ? openAnalysisReadableText(report ? numericReportCopy(report) : outcome.explanation.text) : version.conversation_outcome!.text;
  if (typeof text !== 'string' || !text.trim()) fail('RS_SOURCE_UNAVAILABLE');
  const general = '制作中的报告可以编辑，新增内容未经原分析核验；报告不是正式决定。';
  const materials: ReportStudioMaterial[] = [{material_id: 'conclusion', label: '本版模型解释', text, classification: 'MODEL_EXPLANATION', source,
    verification: 'not_performed', limitations: ['模型解释本身不是独立核验或因果证明。', general]}];
  if (outcome) {
    const calculation = outcome.calculation, grade = outcome.verification.grade;
    if (!['independent_arithmetic', 'source_attribution'].includes(grade) || typeof calculation.value !== 'string'
      || typeof calculation.unit !== 'string' || !Number.isSafeInteger(calculation.rows) || calculation.rows < 0) fail('RS_SOURCE_UNAVAILABLE');
    // Deliberate field projection: never serialize Task, source.rows or the whole Outcome.
    const groups = (calculation.groups ?? []).map(({key, value, rows}) => ({key, value, rows}));
    materials.push({material_id: 'table', label: '本版主要汇总表', text: JSON.stringify({value: calculation.value, unit: calculation.unit, rows: calculation.rows, groups}),
      classification: 'ANALYSIS_CALCULATION', source, verification: grade,
      limitations: [grade === 'source_attribution' ? '核对只覆盖所选资料原文及位置，不证明资料观点或独立计算。' : '核验只覆盖本版列明计算，不证明模型解释或因果主张。', general]});
  }
  return {schema_version: '1', title: version.question, source, materials};
}
/** Caller supplies its own freshly read catalog, never accepts a client-authored catalog. */
export function selectReportStudioMaterials(catalog: ReportStudioMaterialCatalog, selected: readonly string[]): ReportStudioMaterialSnapshot {
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length
    || selected.some(id => !catalog.materials.some(material => material.material_id === id))) fail('RS_SELECTION_INVALID');
  const snapshot = structuredClone({...catalog, materials: catalog.materials.filter(material => selected.includes(material.material_id))});
  return {...snapshot, snapshot_sha256: taskHash(snapshot)};
}
