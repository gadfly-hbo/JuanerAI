import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createDecisionMaterialPolicy,verifySavedDecisionReport,type DecisionMaterialGrant,type SavedDecisionReport} from '../../../adapters/decision-platform/material-policy.ts';
const content=Buffer.from('# 纯合成报告\n');
const report:SavedDecisionReport={projectId:'project-a',taskId:'task-a',sourceId:'saved-report-a',revision:'1',format:'md',filename:'合成报告.md',sha256:createHash('sha256').update(content).digest('hex'),bytes:content.length};
const base:DecisionMaterialGrant={report,teachSha256:'a'.repeat(64),recipients:[{provider:'synthetic',model:'primary',configurationSha256:'b'.repeat(64)},{provider:'synthetic',model:'fallback',configurationSha256:'c'.repeat(64)}],expiresAt:200};
test('DP-MATERIAL-01: exact saved bytes and active per-report recipient grant',()=>{
 verifySavedDecisionReport(report,content);const policy=createDecisionMaterialPolicy(()=>100);const permit=policy.grant(base);assert.equal(permit.allows(base),true);
 assert.equal(permit.allows({...base,recipients:[base.recipients[1]]}),true);
});
test('DP-MATERIAL-01: changed bytes, source, project, task, revision, teach or recipients refused',()=>{
 assert.throws(()=>verifySavedDecisionReport(report,Buffer.from('different')),/DP_SOURCE_CHANGED/);
 const permit=createDecisionMaterialPolicy(()=>100).grant(base);
 for(const patch of [{projectId:'project-b'},{taskId:'task-b'},{sourceId:'saved-report-b'},{revision:'2'},{sha256:'d'.repeat(64)},{bytes:1},{filename:'other.md'},{format:'pdf' as const}])assert.equal(permit.allows({...base,report:{...report,...patch}}),false);
 assert.equal(permit.allows({...base,teachSha256:'d'.repeat(64)}),false);
 assert.equal(permit.allows({...base,recipients:[{...base.recipients[0],configurationSha256:'d'.repeat(64)}]}),false);
 assert.equal(permit.allows({...base,recipients:[{...base.recipients[0],model:'other'}]}),false);
 assert.equal(permit.allows({...base,recipients:[{...base.recipients[0],provider:'other'}]}),false);
 assert.equal(permit.allows({...base,recipients:[]}),false);
});
test('DP-MATERIAL-01: revocation, expiry and caller mutation cannot revive or widen grant',()=>{
 let now=100;const mutable={...base,report:{...base.report},recipients:base.recipients.map(r=>({...r}))};const permit=createDecisionMaterialPolicy(()=>now).grant(mutable);
 mutable.report.taskId='changed';mutable.recipients.push({provider:'other',model:'extra',configurationSha256:'e'.repeat(64)});
 assert.equal(permit.allows(base),true);assert.equal(permit.allows(mutable),false);
 now=200;assert.equal(permit.allows(base),false);now=100;permit.revoke();assert.equal(permit.allows(base),false);
});
test('DP-MATERIAL-01: unsupported source and malformed authority fail closed without implicit defaults',()=>{
 const invalid=[{...report,format:'html'},{...report,filename:'../report.md'},{...report,sha256:'unknown'},{...report,bytes:-1},{...report,revision:''}];
 for(const value of invalid)assert.throws(()=>verifySavedDecisionReport(value as SavedDecisionReport,content));
 const p=createDecisionMaterialPolicy(()=>100);
 for(const value of [{...base,recipients:[]},{...base,expiresAt:100},{...base,teachSha256:''},{...base,recipients:[{provider:'x',model:'x',configurationSha256:''}]}])assert.throws(()=>p.grant(value));
});
