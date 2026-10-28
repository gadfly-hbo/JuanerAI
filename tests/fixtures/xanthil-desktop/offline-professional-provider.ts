import assert from 'node:assert/strict';
import type {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
/** Bottom Provider fixture only. No tool dispatcher, business execution, runtime,
 * Session, retry, validation or permission decisions live in this fixture. */
export function offlineResponse(n:number,calls:readonly {name:string;args:unknown}[]=[],text='合成回复；没有认证因果或执行现实行动。'){
 const delta=calls.length?{role:'assistant',tool_calls:calls.map((call,index)=>({index,id:'owned-'+n+'-'+index,type:'function',function:{name:call.name,arguments:JSON.stringify(call.args)}}))}:{role:'assistant',content:text};
 return new Response('data: '+JSON.stringify({id:'owned-'+n,object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:calls.length?'tool_calls':'stop'}],usage:{prompt_tokens:7,completion_tokens:3,total_tokens:10}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
}
export const offlineCredentials:Parameters<typeof createPiProfessionalAgent>[0]['credentials']={withCredential:async(provider,run)=>{assert.ok(provider==='minimax-cn'||provider==='xiaomi-token-plan-cn');return run({key:'owned-offline-provider-key-not-in-prompts',provider,model:provider==='minimax-cn'?'MiniMax-M3':'mimo-v2.6-flash',endpoint:provider==='minimax-cn'?'https://api.minimaxi.com/anthropic':'https://token-plan-cn.xiaomimimo.com/v1'});}};
export function packet(dto:any,marker:string):any|undefined{
 const content=(m:any)=>typeof m.content==='string'?m.content:Array.isArray(m.content)?m.content.filter((v:any)=>v.type==='text'&&typeof v.text==='string').map((v:any)=>v.text).join('\n'):'';const message=[...dto.messages].reverse().find((m:any)=>m.role==='user'&&content(m).includes(marker+'\n'));if(!message)return undefined;const text=content(message);return JSON.parse(text.slice(text.indexOf(marker+'\n')+marker.length+1));
}
/** Synthetic generation consumes actual product fact identities. It never
 * calculates facts or creates receipts/permissions; real product code does that.
 * These replies verify delivery mechanics, not model judgment quality. */
export function syntheticFormation(dto:any,n:number):Response|undefined{
 const review=packet(dto,'JuanerAI.conclusion-strategy-review.v1');
 if(review)return offlineResponse(n,[],JSON.stringify({version:'1.2',snapshot_sha256:review.snapshot_sha256,completeness:{verdict:'complete',reason:'合成机制用例只审阅所提供的有限观察。'},requirement_coverage:review.requirements.map((r:any)=>({requirement_id:r.id,claim_ids:review.current_proposal.units.map((u:any)=>u.id),verdict:'fulfilled'})),claims:review.current_proposal.units.map((u:any)=>({claim_id:u.id,kind:u.kind==='strategy'?'strategy':'conclusion',level:u.kind==='strategy'?'hypothesis':'observation',verdict:'supported',evidence_refs:u.fact_refs,counterevidence:[],reason:'合成有限观察；真实模型质量未执行。',limitations:[],conditions:[],strategy:u.strategy}))}));
 const p=packet(dto,'JuanerAI.report-edit.v1');if(!p)return undefined;
 if(p.output_contract==='1.5'){const refs=p.numeric_facts.map((f:any)=>f.reference_id);return offlineResponse(n,[],JSON.stringify({version:'1.5',status:'ready',interpretations:Array.from({length:Math.max(1,Math.ceil(refs.length/32))},(_,i)=>({fact_refs:refs.slice(i*32,(i+1)*32),interpretation:'仅当前资料的有限观察；原因、推广和现实行动均未得到认证。'}))}));}
 if(p.output_contract==='reviewable-document/1.4')return offlineResponse(n,[],JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units:[{kind:'observation',text:'仅当前资料的有限观察；原因、推广和现实行动均未得到认证。',fact_refs:p.baseline_evidence.report.values.filter((f:any)=>f.status==='verified').map((f:any)=>f.id),source_refs:[],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}},...(p.baseline_evidence.report.values.some((f:any)=>f.status!=='verified')?[{kind:'limitation',text:'部分所选主张缺少可核验数值；缺失不等于零，相关风险及整个场景仍未核验。',fact_refs:[],source_refs:['Q'],method:null,strategy:null,content:{materials:[],proposal:null,quantities:[]}}]:[])]}));
 assert.fail('unhandled actual formation contract '+p.output_contract);
}

export function offlineAnthropicResponse(n:number,call?:{name:string;args:unknown},text='owned completed',inputTokens=7){
 const events=[['message_start',{type:'message_start',message:{id:'owned-'+n,type:'message',role:'assistant',content:[],model:'MiniMax-M3',usage:{input_tokens:inputTokens,output_tokens:0}}}],['content_block_start',{type:'content_block_start',index:0,content_block:call?{type:'tool_use',id:'owned-'+n,name:call.name,input:{}}:{type:'text',text:''}}],['content_block_delta',{type:'content_block_delta',index:0,delta:call?{type:'input_json_delta',partial_json:JSON.stringify(call.args)}:{type:'text_delta',text}}],['content_block_stop',{type:'content_block_stop',index:0}],['message_delta',{type:'message_delta',delta:{stop_reason:call?'tool_use':'end_turn'},usage:{output_tokens:3}}],['message_stop',{type:'message_stop'}]];
 return new Response(events.map(([event,data])=>'event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
}

/** Test-only wire serialization for a synthetic reply; product SDK/transport
 * preparation, schema, execution, accounting and permissions are unchanged. */
export async function syntheticWireResponse(dto:any,response:Response,n:number){
 if(!String(dto.model).startsWith('MiniMax-'))return response;
 const text=await response.text(),first=text.split('\n').find(line=>line.startsWith('data: '))!,chunk=JSON.parse(first.slice(6)),delta=chunk.choices[0].delta,calls=(delta.tool_calls??[]).map((c:any)=>({name:c.function.name,args:JSON.parse(c.function.arguments)}));
 if(calls.length<=1)return offlineAnthropicResponse(n,calls[0],delta.content??'合成请求正常结束。');
 const events:any[]=[['message_start',{type:'message_start',message:{id:'owned-'+n,type:'message',role:'assistant',content:[],model:dto.model,usage:{input_tokens:7,output_tokens:0}}}]];
 calls.forEach((call:any,index:number)=>events.push(['content_block_start',{type:'content_block_start',index,content_block:{type:'tool_use',id:'owned-'+n+'-'+index,name:call.name,input:{}}}],['content_block_delta',{type:'content_block_delta',index,delta:{type:'input_json_delta',partial_json:JSON.stringify(call.args)}}],['content_block_stop',{type:'content_block_stop',index}]));events.push(['message_delta',{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:3}}],['message_stop',{type:'message_stop'}]);return new Response(events.map(([event,data])=>'event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
}
