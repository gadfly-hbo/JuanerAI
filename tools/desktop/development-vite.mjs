import {resolve, sep} from 'node:path';
import {realpathSync} from 'node:fs';
export const origin = 'http://127.0.0.1:5173';
const rendererFiles = new Set(['/', '/index.html', '/renderer.tsx', '/case-assistant-workspace.tsx', '/provider-settings.tsx', '/desktop-work.ts', '/styles.css', '/assets/juanerai-logo-slogan.png', '/@vite/client', '/@react-refresh']);
const coreFile=resolve('packages/product-core/case-assistant.ts');
const deps=resolve('node_modules/.vite');
const client=resolve('node_modules/vite/dist/client');
export function allowedDevelopmentRequest(raw, host, requestOrigin) {
  if(host!=='127.0.0.1:5173' || (requestOrigin!==undefined && requestOrigin!==origin))return false;
  let path;try{path=decodeURIComponent(new URL(raw,origin).pathname);}catch{return false;}
  if(rendererFiles.has(path))return true;
  if(!path.startsWith('/@fs/'))return false;
  const file=path.slice(4);
  try {const actual=realpathSync(file);return actual===coreFile || actual.startsWith(deps+sep) || actual===client+'/env.mjs';}catch{return false;}
}
export function developmentServerBoundary(){
 return {
  name:'xanthil-development-boundary',apply:'serve',
  configureServer(server){
   server.httpServer?.prependListener('upgrade',(req,socket)=>{
    if(req.headers.host!=='127.0.0.1:5173'||req.headers.origin!==origin)socket.destroy();
   });
   server.middlewares.use((req,res,next)=>{
    if(!allowedDevelopmentRequest(req.url,req.headers.host,req.headers.origin)){res.statusCode=403;res.end('Forbidden');return;}next();
   });
   // Vite HMR may update safe modules/CSS. A fallback page reload would lose the
   // current UI operation; retain the window and require an explicit restart.
   const send=server.ws.send.bind(server.ws);
   server.ws.send=(payload,...args)=>{
    if(typeof payload==='object' && payload.type==='full-reload'){
     server.config.logger.warn('Renderer update requires restart: Ctrl-C, then npm run desktop:start');return;
    }
    return send(payload,...args);
   };
  },
  transformIndexHtml:{order:'pre',handler(html){return html
   .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
   .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
   .replace("connect-src 'none'", "connect-src 'self' ws://127.0.0.1:5173")
   .replace('<title>Xanthil Desktop</title>','<title>Xanthil Desktop · 开发版</title>');}},
 };
}

// Vite mergeConfig ignores null, so Forge's watch:{} must be disabled after
// its config merge. This hook runs before Vite resolves/builds either target.
export function explicitDesktopRestart(){
 return {name:'xanthil-explicit-desktop-restart',config(config){config.build??={};config.build.watch=null;}};
}
