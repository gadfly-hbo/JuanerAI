// Diagnostic-only boundary; not imported by the product or supplier bundle.
export function createDiagnosticGate({now=Date.now,stopFault}) {
  let forwarded=0,started=null,stopped=false,firstStop=null;
  const knownTools=new Set(['read','write','edit','bash','propose_outline','render_deck','qa_deck','export_deck','look_page']);
  function record(reason,phase,tool=null){stopped=true;firstStop??={reason,phase,dispatch:forwarded,tool};}
  function stop(reason,phase,tool=null){record(reason,phase,tool);throw stopFault();}
  return {
    summary:()=>({forwarded,stopped,stop:firstStop?{...firstStop}:null}),
    wrap:transport=>async request=>{
      if(stopped)throw stopFault();
      if(request.signal.aborted)stop('cancelled','request');
      if(forwarded>=6)stop('dispatch_limit','request');
      const model=request.model;
      if(model.provider!=='xiaomi-token-plan-cn'||model.id!=='mimo-v2.6-flash'||model.protocol!=='openai-completions'||
         model.endpoint!=='https://token-plan-cn.xiaomimimo.com/v1'||model.maxOutputTokens!==16384)stop('model_outside_scope','request');
      started??=now();const remaining=600000-(now()-started);if(remaining<=0)stop('deadline','request');
      forwarded++;
      let reply;
      try{reply=await transport({...request,signal:AbortSignal.any([request.signal,AbortSignal.timeout(Math.ceil(remaining))])});}
      catch(error){record(request.signal.aborted?'cancelled':now()-started>=600000?'deadline':'transport_failure','reply');throw error;}
      if(request.signal.aborted)stop('cancelled','reply');
      if(now()-started>=600000)stop('deadline','reply');
      // Preserve SDK-owned validation of unknown names, ID reuse and argument schemas.
      // A recognized tool outside this diagnostic scope must not take effect.
      const declared=new Set(request.messages.flatMap(message=>(message.tools??[]).map(tool=>tool.name)));
      const outside=Array.isArray(reply.content)?reply.content.find(call=>call.kind==='tool'&&declared.has(call.name)&&!['read','propose_outline'].includes(call.name)):null;
      if(outside)stop('tool_outside_scope','reply',knownTools.has(outside.name)?outside.name:'other');
      return reply;
    },
  };
}
