import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

// SDK authorization objects stay inside this Adapter. No prompts, tool arguments,
// session objects or credentials cross the host policy boundary.
const admission=request=>({kind:request.kind,operation:request.kind==='tool'?request.name:request.kind==='control'?'control':request.kind,taskId:request.taskId,runId:request.runId});
export async function createResearchModel({programRoot,dataRoot,authorize,configs=[],candidates}){
 if(typeof authorize!=='function')throw Error('DR_AUTHORITY_REQUIRED');
 const {piRuntimeModel}=await import(pathToFileURL(join(programRoot,'dist/adapters/piRuntime.js')).href);
 return piRuntimeModel(configs,{dataDir:dataRoot,...(candidates?{candidates}:{}),authorize:async request=>{
  try{return await authorize('runtime',admission(request))===true;}catch{return false;}
 }});
}

/** Prepare code only; configuration is read at each new run, never a global app directory. */
export async function configuredResearchFactory({programRoot,dataRoot,authorize,pythonExecutable}){
 const load=path=>import(pathToFileURL(join(programRoot,'dist/adapters',path)).href);
 const [{livePage,liveParser,httpSearch},{searchWithFallback},{xiaomiWebSearch},{piRuntimeModel},{mcpWebSearch}]=await Promise.all([load('live.js'),load('searchFailover.js'),load('xiaomiSearch.js'),load('piRuntime.js'),load('mcpSearch.js')]);
 const openMcp=new Set();
 const factory=()=>{
  let config;try{config=JSON.parse(readFileSync(join(dataRoot,'config.json'),'utf8'));}catch{throw Error('DR_CONFIGURATION_REQUIRED');}
  if(!config.model||!config.search)throw Error('DR_CONFIGURATION_REQUIRED');
  const chain=Array.isArray(config.search)?config.search:[config.search];
  const providers=chain.map(value=>{
   if(value.type==='minimax-mcp'){
    if(!pythonExecutable)throw Error('DR_MCP_PYTHON_REQUIRED');
    const provider=mcpWebSearch({command:pythonExecutable,args:['-I',join(programRoot,'mcp-entry.py')],env:{MINIMAX_API_HOST:'https://api.minimaxi.com',MINIMAX_API_KEY:process.env.MINIMAX_API_KEY??process.env.MINIMAX_CN_API_KEY??''},timeoutMs:60000});openMcp.add(provider);return provider;
   }
   if(value.type==='xiaomi-websearch'){const apiKey=process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY;if(!apiKey)throw Error('DR_CREDENTIAL_REQUIRED');return xiaomiWebSearch({apiKey});}
   return httpSearch(value);
  });
  if(!providers.length)throw Error('DR_CONFIGURATION_REQUIRED');
  const model=piRuntimeModel(config.model,{dataDir:dataRoot,authorize:async request=>{try{return await authorize('runtime',admission(request))===true;}catch{return false;}}});
  return {model,page:livePage(),parser:liveParser(),search:providers.length>1?searchWithFallback(providers):providers[0]};
 };
 factory.close=async()=>{for(const provider of openMcp)await provider.close();openMcp.clear();};return factory;
}
