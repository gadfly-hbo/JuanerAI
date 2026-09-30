import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { DesktopProjection, OwnerRef } from '../../../packages/contracts/xanthil-desktop-ipc.ts';
import { openConfirmedDesktopRevision } from '../xanthil-desktop/desktop-contract-drivers.ts';

/** Reuse the accepted real CSV → DuckDB/Python → finding → closure path. */
export async function completedCase(projectRoot:string){
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
  projection=await app.saveForm({...command(),form:{kind:'decision_closure',candidates:[],route:'insufficient_evidence',insufficient_reason:'Synthetic causal evidence not available',preferred_candidate_id:null,preferred_reason:null,disposition:'saved',defer_until:null}});
  projection=await app.completeCase({...command(),acceptance_id:projection.acceptances.at(-1)!.acceptance_id,form_id:projection.forms.at(-1)!.form_id});
  assert.equal(projection.revision?.state,'Completed');
  return {app,owner,projection};
}
