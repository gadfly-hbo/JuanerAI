import type {IncomingMessage} from 'node:http';
import {randomBytes, timingSafeEqual} from 'node:crypto';

const random=()=>randomBytes(32).toString('hex');
const equal=(a:unknown,b:string)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function deny():never {throw Object.assign(new Error('RS_LOCAL_REQUEST_REJECTED'),{code:'RS_LOCAL_REQUEST_REJECTED',statusCode:403});}

/** Per-instance loopback access only; grants neither local execution nor model disclosure. */
export function createReportStudioLocalAccess(config:{origin():string;ownerToken:string;now?:()=>number}) {
  if(!/^[a-f0-9]{64}$/.test(config.ownerToken))deny();
  const now=config.now??Date.now,bootstraps=new Map<string,number>(),session=random(),cookie='studio_'+randomBytes(8).toString('hex');
  let closed=false,sessionAdmitted=false;
  function authorize(req:IncomingMessage):'public'|'bootstrap'|'owner'|'browser' {
    if(closed)deny();
    const origin=config.origin();
    if(!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(origin)||Number(new URL(origin).port)>65535)deny();
    const names=req.rawHeaders.filter((_,i)=>i%2===0).map(name=>name.toLowerCase());
    if(['host','origin','cookie','x-studio-owner','content-type','content-length','transfer-encoding'].some(name=>names.filter(n=>n===name).length>1))deny();
    if(req.socket.remoteAddress!=='127.0.0.1'||req.headers.host!==origin.slice(7)||req.headers['sec-fetch-site']==='cross-site'
      ||req.headers.origin!==undefined&&req.headers.origin!==origin)deny();
    if(!['GET','POST','PUT','DELETE'].includes(req.method??''))deny();
    const raw=req.url??'',path=raw.split('?')[0];
    if(!raw.startsWith('/')||raw.includes('#')||!path.split('/').slice(1).every(p=>/^[A-Za-z0-9_.-]*$/.test(p)&&p!=='.'&&p!=='..'))deny();
    if(path.startsWith('/api/builtin/bridge/')) {
      if(req.headers.origin!==undefined||req.headers.cookie!==undefined||req.headers['sec-fetch-site']!==undefined
        ||!equal(req.headers['x-studio-owner'],config.ownerToken))deny();
      return 'owner';
    }
    if(req.headers['x-studio-owner']!==undefined)deny();
    if(req.method!=='GET') {
      if(req.headers.origin!==origin||req.headers['content-encoding']!==undefined)deny();
      const bodyRequired=req.method==='POST'||req.method==='PUT'||Number(req.headers['content-length']??0)>0||req.headers['transfer-encoding']!==undefined;
      if(bodyRequired&&!/^application\/json(?:;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']??'')))deny();
    }
    if(path==='/api/builtin/session') {if(req.method!=='POST')deny();return 'bootstrap';}
    if(req.method==='GET'&&(path==='/'||path==='/builtin-bootstrap.js'||/^\/assets\/[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:js|css|woff2?|png|svg|ico)$/.test(path)))return 'public';
    const values=typeof req.headers.cookie==='string'?req.headers.cookie.split(';').map(c=>c.trim()).filter(c=>c.startsWith(cookie+'=')):[];
    if(!sessionAdmitted||values.length!==1||!equal(values[0],cookie+'='+session))deny();
    return 'browser';
  }
  return {authorize,
    issueBootstrap() {
      if(closed)deny();
      for(const [token,until]of bootstraps)if(until<=now())bootstraps.delete(token);
      if(bootstraps.size>=32)deny();
      const token=random();bootstraps.set(token,now()+60000);return token;
    },
    acceptBootstrap(token:unknown) {
      if(closed||typeof token!=='string')deny();
      const until=bootstraps.get(token);bootstraps.delete(token);
      if(until===undefined||until<=now())deny();
      sessionAdmitted=true;return `${cookie}=${session}; HttpOnly; SameSite=Strict; Path=/`;
    },
    close(){closed=true;sessionAdmitted=false;bootstraps.clear();},
  };
}
