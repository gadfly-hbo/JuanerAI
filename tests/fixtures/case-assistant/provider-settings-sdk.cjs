// Test only: loaded by Electron createRequire, never part of the app bundle.
exports.install=async appRoot=>{
   const g=globalThis;g.psCalls=0;g.psMode='success';
   globalThis.fetch=async()=>{throw Error('PS_OFFLINE_FETCH_FORBIDDEN');};
   const net=require('node:net');net.Socket.prototype.connect=function(){throw Error('PS_OFFLINE_SOCKET_FORBIDDEN');};
   const {pathToFileURL}=require('node:url'),{join}=require('node:path');
   const sdk=await import(pathToFileURL(join(appRoot,'node_modules/@earendil-works/pi-coding-agent/dist/index.js')).href);
   const ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
   sdk.ModelRuntime.prototype.streamSimple=function(model,context,options){
    g.psCalls++;
    if(model.provider!=='xiaomi-token-plan-cn'||model.id!=='mimo-v2.6-pro'||context.systemPrompt!==''||JSON.stringify(context.tools)!=='[]'||context.messages[0].content!=='Reply with OK.'||options.maxRetries!==0||options.maxTokens!==128)throw Error('PS_FIXED_PROBE_BOUNDARY');
    if(g.psMode==='invalid')throw Object.assign(Error('401 synthetic rejection'),{status:401});
    const stream=ai.createAssistantMessageEventStream();const done=()=>stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:'OK.'}],api:model.api,provider:model.provider,model:model.id,usage:{input:10,cacheRead:0,cacheWrite:0,output:2,totalTokens:12,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});
    if(g.psMode==='delay')g.psRelease=done;else queueMicrotask(done);return stream;
   };

};
