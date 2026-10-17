import {createHash} from 'node:crypto';
import type {SavedDecisionReport,DecisionRecipient,DecisionMaterialScope,DecisionMaterialGrant} from '../../packages/ports/decision-platform.ts';
export type {SavedDecisionReport,DecisionRecipient,DecisionMaterialScope,DecisionMaterialGrant} from '../../packages/ports/decision-platform.ts';
const digest=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const text=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&!/[\u0000-\u001f\u007f]/.test(value);
function validReport(r:SavedDecisionReport):boolean{
 return !!r&&[r.projectId,r.taskId,r.sourceId,r.revision,r.filename].every(text)
  &&['md','pdf','pptx'].includes(r.format)&&!/[\\/]/.test(r.filename)&&r.filename.endsWith('.'+r.format)
  &&digest(r.sha256)&&Number.isSafeInteger(r.bytes)&&r.bytes>0;
}
function validScope(value:DecisionMaterialScope):boolean{
 return !!value&&validReport(value.report)&&digest(value.teachSha256)&&Array.isArray(value.recipients)&&value.recipients.length>0
  &&value.recipients.every(r=>r&&text(r.provider)&&text(r.model)&&digest(r.configurationSha256));
}
const reportKey=(r:SavedDecisionReport)=>JSON.stringify([r.projectId,r.taskId,r.sourceId,r.revision,r.format,r.filename,r.sha256,r.bytes]);
const recipientKey=(r:DecisionRecipient)=>JSON.stringify([r.provider,r.model,r.configurationSha256]);

/** A grant is supplied by host authority; constructing this policy grants nothing. */
export function createDecisionMaterialPolicy(now:()=>number=Date.now){
 return {grant(value:DecisionMaterialGrant){
  const instant=now();
  if(!validScope(value)||!Number.isFinite(value.expiresAt)||!Number.isFinite(instant)||value.expiresAt<=instant)throw Error('DP_PERMISSION_INVALID');
  const snapshot=structuredClone(value),source=reportKey(snapshot.report),recipients=new Set(snapshot.recipients.map(recipientKey));
  let revoked=false;
  return {
   revoke(){revoked=true;},
   allows(current:DecisionMaterialScope):boolean{
    const instant=now();if(!Number.isFinite(instant)||instant>=snapshot.expiresAt)revoked=true;
    return !revoked&&validScope(current)&&reportKey(current.report)===source&&current.teachSha256===snapshot.teachSha256
     &&current.recipients.every(r=>recipients.has(recipientKey(r)));
   },
  };
 }};
}
export function verifySavedDecisionReport(report:SavedDecisionReport,bytes:Uint8Array):void{
 if(!validReport(report)||!(bytes instanceof Uint8Array)||bytes.byteLength!==report.bytes
  ||createHash('sha256').update(bytes).digest('hex')!==report.sha256)throw Error('DP_SOURCE_CHANGED');
}
