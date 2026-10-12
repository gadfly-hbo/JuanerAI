/** A durable qualified result is not a receipt for an unfinished tool. */
export function hasSettledOpenCheckpoint(task){
 const cp=task.checkpoint;
 if(task.source?.sources?.length===0){
  if(task.framework||!cp?.messages?.length||cp.calculation||cp.verification||cp.messages.some(m=>m.speaker==='tool'||m.speaker==='assistant'&&m.calls.length))return false;
  const last=cp.messages.at(-1);if(last.speaker!=='assistant')return false;
  try{const reply=JSON.parse(last.text.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/,'$1'));return Object.keys(reply).length===2&&['answer','needs_information'].includes(reply.kind)&&typeof reply.text==='string'&&!!reply.text.trim()&&reply.text.length<=(reply.kind==='needs_information'?12000:100000);}catch{return false;}
 }
 if(!task.framework||!cp?.calculation||!cp.verification||cp.verification.plan_sha256!==cp.calculation.plan_sha256||cp.verification.result_sha256===undefined||cp.verification.inspection_sha256!==task.identity.scope_sha256||!cp.messages.length)return false;
 let pending=new Set();for(const m of cp.messages){
  if(m.speaker==='assistant'){if(pending.size)return false;pending=new Set(m.calls.map(c=>c.id));if(pending.size!==m.calls.length)return false;}
  else if(m.speaker==='tool'){if(!pending.delete(m.call_id))return false;}
  else if(m.speaker==='user'&&pending.size)return false;
 }
 return !pending.size;
}
