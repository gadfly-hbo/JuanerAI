import {compileOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from '../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from './open-analysis-verification.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../packages/ports/member-source.ts';
import type {OpenAnalysisVerification} from '../../packages/ports/open-analysis-verifier.ts';
function fail():never{throw Object.assign(new Error('VERIFICATION_FAILED'),{code:'VERIFICATION_FAILED',stack:'VERIFICATION_FAILED'});}
/** Existing independent original-source sum audit, then inverse ratio equations. */
export function verifyOpenShareIR(p:OpenAnalysisIR,c:OpenAnalysisValue,source:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(p),source);}catch{fail();}
 if(taskHash(bound)!==taskHash(p)||c.method!=='checked_share_query'||c.version!=='1.0'||c.plan_sha256!==taskHash(p)||c.inspection_sha256!==taskHash(source)||c.source_sha256!==p.source_sha256||c.unit!=='%'||!p.base||!c.relation||!c.groups)fail();
 const original=c.relation.amounts;verifyOpenAnalysisIntegerSum(p.base,original,source);
 if(c.rows!==original.rows||!original.groups||original.groups.length!==c.groups.length||JSON.stringify(c.groups)!==c.value)fail();
 const rational=(s:string)=>{if(!/^-?\d+(\/\d+)?$/.test(s))fail();const [n,d='1']=s.split('/');if(BigInt(d)<=0n)fail();return {n:BigInt(n!),d:BigInt(d)};};
 // Addition without primary reduction or division; totals compared by cross product.
 let numerator=0n,denominator=1n;for(let i=original.groups.length-1;i>=0;i--){const q=rational(original.groups[i]!.value);numerator=numerator*q.d+q.n*denominator;denominator*=q.d;let a=numerator<0n?-numerator:numerator,b=denominator;while(b){const r=a%b;a=b;b=r;}numerator/=a;denominator/=a;}
 const total=rational(c.relation.total);if(total.n*denominator!==numerator*total.d)fail();
 for(let i=0;i<c.groups.length;i++){const g=c.groups[i]!,o=original.groups[i]!;if(g.key!==o.key||g.rows!==o.rows)fail();if(numerator===0n){if(g.value!=='null')fail();continue;}const ratio=rational(g.value),amount=rational(o.value);if(ratio.n*amount.d*numerator!==ratio.d*amount.n*denominator*100n)fail();}
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),result_sha256:taskHash(c),value:c.value,rows:c.rows};
}
