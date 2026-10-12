import {compileOpenAnalysisIR,openAnalysisProposal,type OpenAnalysisIR,type OpenAnalysisValue} from '../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from './open-analysis-verification.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {MemberSourceInspection} from '../../packages/ports/member-source.ts';
import type {OpenAnalysisVerification} from '../../packages/ports/open-analysis-verifier.ts';
function fail():never{throw Object.assign(new Error('VERIFICATION_FAILED'),{code:'VERIFICATION_FAILED',stack:'VERIFICATION_FAILED'});}
export function verifyOpenContributionIR(p:OpenAnalysisIR,c:OpenAnalysisValue,source:MemberSourceInspection):OpenAnalysisVerification{
 let bound;try{bound=compileOpenAnalysisIR(openAnalysisProposal(p),source);}catch{fail();}
 if(taskHash(bound)!==taskHash(p)||c.version!=='1.0'||c.method!=='checked_contribution_query'||c.plan_sha256!==taskHash(p)||c.source_sha256!==p.source_sha256||c.inspection_sha256!==taskHash(source)||c.unit!==p.unit||p.inputs?.length!==2||!c.comparison||!c.groups||c.value!==JSON.stringify(c.groups))fail();
 const x=c.comparison;verifyOpenAnalysisIntegerSum(p.inputs[0]!,x.baseline,source);verifyOpenAnalysisIntegerSum(p.inputs[1]!,x.current,source);if(c.rows!==x.baseline.rows+x.current.rows||!x.baseline.groups||!x.current.groups)fail();
 type Q={n:bigint;d:bigint};const fraction=(s:string):Q=>{if(!/^-?\d+(\/\d+)?$/.test(s))fail();const [n,d='1']=s.split('/');if(BigInt(d)<=0n)fail();return {n:BigInt(n!),d:BigInt(d)};},sum=(a:Q,b:Q):Q=>{let n=a.n*b.d+b.n*a.d,d=a.d*b.d,g=n<0n?-n:n,h=d;while(h){const next=g%h;g=h;h=next;}return {n:n/g,d:d/g};};
 const old=new Map(x.baseline.groups.map(g=>[g.key,g])),now=new Map(x.current.groups.map(g=>[g.key,g])),keys=[...new Set([...old.keys(),...now.keys()])].sort((a,b)=>a<b?-1:a>b?1:0),total=fraction(x.total_change);if(keys.length!==c.groups.length||keys.length!==x.groups.length)fail();
 let delta:Q={n:0n,d:1n},beforeTotal:Q={n:0n,d:1n},afterTotal:Q={n:0n,d:1n};
 for(let i=keys.length-1;i>=0;i--){const key=keys[i]!,g=c.groups[i]!,o=x.groups[i]!,before=old.get(key),after=now.get(key);if(g.key!==key||o.key!==key||g.rows!==(before?.rows??0)+(after?.rows??0)||o.baseline!==(before?.value??'0')||o.current!==(after?.value??'0')||o.change!==g.value)fail();const b=fraction(o.baseline),a=fraction(o.current),d=fraction(o.change);if(d.n*a.d*b.d!==d.d*(a.n*b.d-b.n*a.d))fail();
 if(total.n===0n){if(o.share!=='null')fail();}else{const ratio=fraction(o.share);if(ratio.n*d.d*total.n!==ratio.d*d.n*total.d*100n)fail();}
 delta=sum(delta,d);beforeTotal=sum(beforeTotal,b);afterTotal=sum(afterTotal,a);}
 if(delta.n*total.d!==total.n*delta.d||total.n*afterTotal.d*beforeTotal.d!==total.d*(afterTotal.n*beforeTotal.d-beforeTotal.n*afterTotal.d))fail();
 return {version:'1.0',grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:taskHash(p),inspection_sha256:taskHash(source),result_sha256:taskHash(c),value:c.value,rows:c.rows};
}
