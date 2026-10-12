// Pure presentation of already checked, source-bound facts. Never executes or promotes model explanation.
export function openAnalysisFindings(task){
 const out=task.outcome;if(!out?.identity?.run_id||!out.outcome_id||!out.framework||!out.calculation||!out.verification?.result_sha256)return [];
 const quote=out.verification.grade==='source_attribution',evidence={task_id:task.identity.task_id,revision:task.identity.revision,run_id:out.identity.run_id,outcome_id:out.outcome_id,scope_sha256:task.identity.scope_sha256,plan_sha256:out.verification.plan_sha256,inspection_sha256:out.verification.inspection_sha256,result_sha256:out.verification.result_sha256,method:out.verification.method};
 const limitations=quote?['原文与位置核对不证明资料观点正确，不证明计算或因果。']:['核验只覆盖本版所列指标与范围，计算一致不证明因果、原因或预测或优惠券增量效果。'];
 const finding=(id,claim,value,unit,group=null,rows=out.calculation.rows)=>{const notApplicable=value==='null'&&out.calculation.relation?.total==='0'||value==='null'&&out.calculation.weighted&&(group===null?out.calculation.weighted.weight_total:out.calculation.weighted.groups?.find(g=>g.key===group)?.weight_total)==='0';return ({id:out.outcome_id+':'+id,claim,value:notApplicable?(out.calculation.relation?'不适用（总体金额为零）':'不适用（权重总额为零）'):value,unit:notApplicable?'':unit,group,rows,status:notApplicable?'not_applicable':out.verification.grade,evidence:{...evidence,group},support:{status:'checked',description:notApplicable?(out.calculation.relation?'总体金额为零，未计算占比':'本分组权重总额为零，未计算数值'):quote?'所选原文及位置对应核对':'原资料独立复算与本版计算一致'},counterevidence:{status:'not_checked',description:'尚未取得针对原因解释的合格反证；没有反证不等于原因成立。'},unknowns:['原因或替代解释仍须适用方法及对应证据。'],limitations});};
 if(quote){let values=[];try{values=JSON.parse(out.calculation.value);}catch{}return values.map((q,i)=>finding('quote-'+i,q.source_name+' · '+q.position,String(q.text),'原文',null,1));}
 if(out.calculation.method==='checked_membership_query'){
  let facts;try{facts=JSON.parse(out.calculation.value);}catch{return [];}
  const labels={comparison:'比较期',current:'本期'},records=[];
  for(const key of ['comparison','current']){const p=facts.periods?.[key];if(!p)continue;for(const [field,label,unit] of [['active_member_count','活跃会员','人'],['repeat_member_count','复购会员','人'],['repeat_revenue_fen','复购收入','分']])if(p[field]!==undefined)records.push(finding(key+'-'+field,labels[key]+' · '+label,String(p[field]),unit));}
  return records;
 }
 const groups=out.calculation.groups??[],summary=groups.length?finding('summary',out.framework.goal+(out.calculation.groups.some(g=>g.value==='null')?' · 分组结果与适用性检查':' · 已核验分组结果'),'查看下列分组',out.calculation.unit):finding('metric',out.framework.goal,out.calculation.value,out.calculation.unit);
 return [summary,...groups.map((g,i)=>finding('group-'+i,out.framework.goal+' · '+g.key,g.value,out.calculation.unit,g.key,g.rows))];
}
