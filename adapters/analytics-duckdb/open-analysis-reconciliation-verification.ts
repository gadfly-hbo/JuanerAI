import {compileOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from '../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from './open-analysis-verification.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../packages/ports/member-source.ts';
import type {OpenAnalysisVerification} from '../../packages/ports/open-analysis-verifier.ts';
function fail():never{throw Object.assign(new Error('VERIFICATION_FAILED'),{code:'VERIFICATION_FAILED',stack:'VERIFICATION_FAILED'});}
export function verifyOpenReconciliationIR(p:OpenAnalysisIR,c:OpenAnalysisValue,source:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(p),source);}catch{fail();}
 if(taskHash(bound)!==taskHash(p)||c.version!=='1.0'||c.method!=='checked_reconciliation_query'||c.plan_sha256!==taskHash(p)||c.source_sha256!==p.source_sha256||c.inspection_sha256!==taskHash(source)||c.unit!==p.unit||p.inputs?.length!==2||!c.reconciliation||!c.groups||c.value!==JSON.stringify(c.groups))fail();
 const x=c.reconciliation;verifyOpenAnalysisIntegerSum(p.inputs[0]!,x.left,source);verifyOpenAnalysisIntegerSum(p.inputs[1]!,x.right,source);if(c.rows!==x.left.rows+x.right.rows||!x.left.groups||!x.right.groups)fail();
 const left=new Map(x.left.groups.map(g=>[g.key,g])),right=new Map(x.right.groups.map(g=>[g.key,g])),keys=[...new Set([...left.keys(),...right.keys()])].sort((a,b)=>a<b?-1:a>b?1:0);if(keys.length!==c.groups.length||keys.length!==x.entries.length)fail();
 const number=(s:string)=>{if(!/^-?\d+(\/[1-9]\d*)?$/.test(s))fail();const [n,d='1']=s.split('/');return [BigInt(n!),BigInt(d)] as const;};let balanced=true;
 for(let i=keys.length-1;i>=0;i--){const key=keys[i]!,a=left.get(key),b=right.get(key),e=x.entries[i]!,g=c.groups[i]!;if(!key.trim()||a&&a.rows!==1||b&&b.rows!==1||e.key!==key||g.key!==key||e.left!==(a?.value??null)||e.right!==(b?.value??null)||e.left_rows!==(a?.rows??0)||e.right_rows!==(b?.rows??0)||g.rows!==e.left_rows+e.right_rows||e.difference!==g.value)fail();
 const [an,ad]=number(a?.value??'0'),[bn,bd]=number(b?.value??'0'),[dn,dd]=number(e.difference);if(dn*ad*bd+bn*dd*ad!==an*dd*bd)fail();const state=!a?'right_only':!b?'left_only':dn===0n?'matched':'difference';if(e.state!==state)fail();balanced&&=state==='matched';}
 if(x.balanced!==balanced)fail();
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),result_sha256:taskHash(c),value:c.value,rows:c.rows};
}
