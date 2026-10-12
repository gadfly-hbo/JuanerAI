import {compileOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from '../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from './open-analysis-verification.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../packages/ports/member-source.ts';
import type {OpenAnalysisVerification} from '../../packages/ports/open-analysis-verifier.ts';
function fail():never{throw Object.assign(new Error('VERIFICATION_FAILED'),{code:'VERIFICATION_FAILED',stack:'VERIFICATION_FAILED'});}
export function verifyOpenAllocationIR(p:OpenAnalysisIR,c:OpenAnalysisValue,source:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(p),source);}catch{fail();}
 if(taskHash(bound)!==taskHash(p)||c.method!=='checked_allocation_query'||c.version!=='1.0'||c.plan_sha256!==taskHash(p)||c.inspection_sha256!==taskHash(source)||c.source_sha256!==p.source_sha256||c.unit!==p.unit||p.inputs?.length!==2||!p.rounding||!c.allocation||!c.groups||c.value!==JSON.stringify(c.groups))fail();
 const {pool,weights}=c.allocation;verifyOpenAnalysisIntegerSum(p.inputs[0]!,pool,source);verifyOpenAnalysisIntegerSum(p.inputs[1]!,weights,source);if(!weights.groups||weights.groups.length!==c.groups.length||c.rows!==pool.rows+weights.rows)fail();
 type Q={n:bigint;d:bigint};const fraction=(s:string):Q=>{if(!/^-?\d+(\/\d+)?$/.test(s))fail();const [n,d='1']=s.split('/');if(BigInt(d)<=0n)fail();return {n:BigInt(n!),d:BigInt(d)};};
 let sum:Q={n:0n,d:1n};for(const w of weights.groups){if(w.rows!==1||!w.key.trim())fail();const v=fraction(w.value);if(v.n<0n)fail();sum={n:sum.n*v.d+v.n*sum.d,d:sum.d*v.d};let a=sum.n,b=sum.d;while(b){const r=a%b;a=b;b=r;}sum={n:sum.n/a,d:sum.d/a};}
 const total=fraction(c.allocation.weight_total),amount=fraction(pool.value);if(total.n<=0n||total.n*sum.d!==sum.n*total.d)fail();const factor=10n**BigInt(p.rounding.decimals);if(amount.n*factor%amount.d)fail();const target=amount.n*factor/amount.d;
 type Ranked={key:string;n:bigint;d:bigint};const preferred=(a:Ranked,b:Ranked)=>{const diff=a.n*b.d-b.n*a.d;return diff>0n||diff===0n&&a.key<b.key;};let worstSelected:Ranked|null=null,bestUnselected:Ranked|null=null,allocated=0n;
 for(let i=0;i<c.groups.length;i++){const g=c.groups[i]!,w=weights.groups[i]!;if(g.key!==w.key||g.rows!==w.rows)fail();const value=fraction(g.value);if(value.n*factor%value.d)fail();const quantum=value.n*factor/value.d,weight=fraction(w.value),n=target*weight.n*total.d,d=weight.d*total.n;let lower=n/d;if(n<0n&&n%d!==0n)lower--;const extra=quantum-lower;if(extra!==0n&&extra!==1n||weight.n===0n&&extra!==0n)fail();allocated+=quantum;const rank={key:g.key,n:n-lower*d,d};if(extra===1n){if(!worstSelected||preferred(worstSelected,rank))worstSelected=rank;}else if(!bestUnselected||preferred(rank,bestUnselected))bestUnselected=rank;}
 if(allocated!==target||worstSelected&&bestUnselected&&preferred(bestUnselected,worstSelected))fail();
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),result_sha256:taskHash(c),value:c.value,rows:c.rows};
}
