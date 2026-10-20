// IO isolation only: the actual entry/service/Profile/Workspace/SDK stay intact.
// The normal entry still forwards its production environment allowlist. In this
// synthetic test only, attach the same preload to that real child service.
import cp from 'node:child_process';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {appendFileSync} from 'node:fs';
import {join,basename} from 'node:path';
import {syncBuiltinESMExports} from 'node:module';
import net from 'node:net';
import tls from 'node:tls';
const self=fileURLToPath(import.meta.url),originalSpawn=cp.spawn;
cp.spawn=function(command,args=[],options){
 if(command===process.execPath&&String(args[0]).endsWith('/tools/browser/service.mjs'))return originalSpawn(command,['--import',self,...args],options);
 if(basename(String(command))==='xanthil-keychain'){
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();
  child.stdin=new Writable({write(_chunk,_encoding,callback){callback();},final(callback){child.stdout.end(JSON.stringify({status:'found',key:'synthetic-offline-only'}));callback();setImmediate(()=>child.emit('close',0));}});
  child.kill=()=>false;return child;
 }
 return originalSpawn(command,args,options);
};
const local=h=>['localhost','127.0.0.1','::1','[::1]'].includes(String(h));
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){const o=args[0];if(o&&typeof o==='object'){if(!o.path&&!local(o.host??'localhost'))throw Error('OFFLINE_EGRESS_DENIED');}else if(typeof o==='number'&&typeof args[1]==='string'&&!local(args[1]))throw Error('OFFLINE_EGRESS_DENIED');return Reflect.apply(connect,this,args);};
tls.connect=()=>{throw Error('OFFLINE_TLS_DENIED');};
syncBuiltinESMExports();
if(String(process.argv[1]).endsWith('/tools/browser/service.mjs')){
 Object.assign(process.env,{LLM_API_KEY:'synthetic-offline-only',LLM_MODEL:'MiniMax-M3',LLM_BASE_URL:'https://api.minimaxi.com/anthropic'});
 const fetchOriginal=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{
  const target=new URL(input instanceof Request?input.url:String(input));if(local(target.hostname))return fetchOriginal(input,init);
  if(!['api.minimaxi.com','token-plan-cn.xiaomimimo.com'].includes(target.hostname))throw Error('OFFLINE_EGRESS_DENIED');
  const body=JSON.parse(String(init?.body));appendFileSync(join(process.env.JUANERAI_DESKTOP_DEV_ROOT,'synthetic-provider.jsonl'),JSON.stringify({url:target.href,body})+'\n');
  const text='这是独立合成入口参数测试，不形成业务成果或核验。';
  if(target.hostname==='api.minimaxi.com'){
   const events=[['message_start',{type:'message_start',message:{id:'ne-http',type:'message',role:'assistant',content:[],model:'MiniMax-M3',usage:{input_tokens:10,output_tokens:0}}}],['content_block_start',{type:'content_block_start',index:0,content_block:{type:'text',text:''}}],['content_block_delta',{type:'content_block_delta',index:0,delta:{type:'text_delta',text}}],['content_block_stop',{type:'content_block_stop',index:0}],['message_delta',{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:10}}],['message_stop',{type:'message_stop'}]];
   return new Response(events.map(([e,d])=>'event: '+e+'\ndata: '+JSON.stringify(d)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
  }
  const chunks=[{id:'ne-http',object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta:{role:'assistant',content:text},finish_reason:null}]},{id:'ne-http',object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:7,completion_tokens:3,total_tokens:10}}];
  return new Response(chunks.map(x=>'data: '+JSON.stringify(x)+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 };
}
