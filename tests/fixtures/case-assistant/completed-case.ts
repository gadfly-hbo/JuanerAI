import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { DesktopProjection, OwnerRef } from '../../../packages/contracts/xanthil-desktop-ipc.ts';
import { openConfirmedDesktopRevision } from '../xanthil-desktop/desktop-contract-drivers.ts';

/** Reuse the accepted real CSV → DuckDB/Python → finding → closure path. */
export async function completedCase(projectRoot:string,withCandidates=false){
  const setup=await openConfirmedDesktopRevision(projectRoot);
  const app=setup.application as unknown as Record<string,(input:unknown)=>Promise<DesktopProjection>>;
  const owner=setup.owner as OwnerRef;
  let projection=setup.projection as unknown as DesktopProjection;
  const command=()=>({contract_version:'1.0',command_id:randomUUID(),...owner,expected_row_version:projection.revision!.row_version});
  projection=await app.startAnalysis({...command(),confirmation_id:setup.confirmationId});
  for(let count=0;count<200&&projection.runs.some(r=>r.status==='Running');count++){
    await new Promise(resolve=>setTimeout(resolve,25));projection=await app.readProjection(owner);
  }
  assert.equal(projection.revision?.state,'Review','real first Change analysis succeeds before Assistant assertions');
  const finding=projection.findings.at(-1)!;
  projection=await app.acceptFinding({...command(),finding_id:finding.finding_id});
  const candidates=withCandidates?['合成候选：小范围验证','合成候选：保持既有方案'].map(title=>({candidate_id:randomUUID(),title,evidence_basis:projection.findings.at(-1)!.finding_id,risk_or_refutation:'关联不能证明因果；可能没有增益',applicability_conditions:'只适用此合成案例',future_validation_metric:'复购率'})):[];
  projection=await app.saveForm({...command(),form:{kind:'decision_closure',candidates,route:withCandidates?'candidate_comparison':'insufficient_evidence',insufficient_reason:withCandidates?null:'Synthetic causal evidence not available',preferred_candidate_id:withCandidates?candidates[0].candidate_id:null,preferred_reason:withCandidates?'仅作为待独立检验的合成候选':null,disposition:'saved',defer_until:null}});
  projection=await app.completeCase({...command(),acceptance_id:projection.acceptances.at(-1)!.acceptance_id,form_id:projection.forms.at(-1)!.form_id});
  assert.equal(projection.revision?.state,'Completed');
  return {app,owner,projection};
}
