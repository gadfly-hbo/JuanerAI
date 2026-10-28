

import type { OpenStoredTask } from '../ports/open-analysis-store.ts';
import { hashFiniteJson } from '../product-core/member-task.ts';
import { membershipUuid } from '../product-core/member-analysis.ts';


import { projectReportContent } from '../product-core/browser-report-content.ts';
import { reportPostCopy } from '../product-core/report-postprocessing.ts';
import type { ReportStudioMaterial, ReportStudioMaterialCatalog, ReportStudioMaterialSnapshot, ReportStudioSource } from '../contracts/report-studio.ts';

function fail(code: string): never {throw Object.assign(new Error(code), {code});}
export function reportStudioMaterialCatalog(projectId: string, task: OpenStoredTask, revision: string): ReportStudioMaterialCatalog {
  if (!membershipUuid(projectId) || typeof revision !== 'string' || !/^[1-9][0-9]*$/.test(revision)) fail('RS_SOURCE_UNAVAILABLE');
  const matches = [task, ...(task.history ?? [])].filter(t => t.identity.task_id === task.identity.task_id && t.identity.revision === revision);
  if (matches.length !== 1) fail('RS_SOURCE_UNAVAILABLE');
  const version = matches[0], result = version.model_report;
  if (version.state !== 'saved' || !result || !membershipUuid(result.outcome_id)
    || !membershipUuid(version.identity.task_id) || !/^[a-f0-9]{64}$/.test(version.identity.scope_sha256)) fail('RS_SOURCE_UNAVAILABLE');
  const source: ReportStudioSource = {project_id: projectId, task_id: version.identity.task_id, revision,
    outcome_id: result.outcome_id, outcome_sha256: hashFiniteJson(result), scope_sha256: version.identity.scope_sha256};
  const content=projectReportContent(version),text=content?.text;
  if (typeof text !== 'string' || !text.trim()) fail('RS_SOURCE_UNAVAILABLE');
  const general = '制作中的报告可以编辑，新增内容未经原分析核验；报告不是正式决定。';
  const materials: ReportStudioMaterial[] = [{material_id: 'conclusion', label: '本版模型解释', text, classification: 'MODEL_EXPLANATION', source,
    verification: 'not_performed', limitations: ['模型解释本身不是独立核验或因果证明。', general]}];
  if(version.model_report&&content?.postprocessing)materials[0]={...materials[0],text:materials[0].text+'\n\n'+reportPostCopy(content.postprocessing)};
  return {schema_version: '1', title: version.question, source, materials};
}
/** Caller supplies its own freshly read catalog, never accepts a client-authored catalog. */
export function selectReportStudioMaterials(catalog: ReportStudioMaterialCatalog, selected: readonly string[]): ReportStudioMaterialSnapshot {
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length
    || selected.some(id => !catalog.materials.some(material => material.material_id === id))) fail('RS_SELECTION_INVALID');
  const snapshot = structuredClone({...catalog, materials: catalog.materials.filter(material => selected.includes(material.material_id))});
  return {...snapshot, snapshot_sha256: hashFiniteJson(snapshot)};
}
