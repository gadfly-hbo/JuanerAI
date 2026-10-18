import {createResearchServer} from './server.mjs';
import {pathToFileURL} from 'node:url';
let server,initialized=false,closed=false;
const pending=new Map();
let sequence=0;
function authorize(request){return new Promise(resolve=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);resolve(false);},5000);pending.set(id,{resolve,timer});process.send?.({kind:'authorize',id,request});});}
process.on('message',async message=>{
 try{
  if(message?.kind==='authority'){const p=pending.get(message.id);if(p){clearTimeout(p.timer);pending.delete(message.id);p.resolve(message.allowed===true);}return;}
  if(message?.kind==='initialize'&&!initialized){
   initialized=true;
   // Optional test factory is only supplied by the owning parent, never an HTTP request.
   const makeAdapters=message.fixtureModule?()=>import(pathToFileURL(message.fixtureModule).href).then(m=>m.syntheticAdapters(message.programRoot)):undefined;
   server=await createResearchServer({...message,authorize,makeAdapters});
   process.send?.({kind:'ready',nonce:message.nonce,origin:server.origin});return;
  }
  if(message?.kind==='launch'){process.send?.({kind:'reply',id:message.id,value:server.launch()});return;}
  if(message?.kind==='state'){process.send?.({kind:'reply',id:message.id,value:server.state()});return;}
  if(message?.kind==='close'){await server.close();closed=true;process.send?.({kind:'reply',id:message.id,value:{closed:true}},()=>process.disconnect());return;}
 }catch{process.send?.({kind:'error',id:message?.id,code:'DR_CHILD_REQUEST_FAILED'});}
});
process.on('disconnect',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.resolve(false);}pending.clear();if(closed)process.exit(0);if(!server)process.exit(1);void server.close().then(()=>process.exit(0),()=>process.exit(1));});
