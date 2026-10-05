// Static product-attachment checks only; not browser, backend or UI acceptance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(root,'../../../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'source-manifest.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[];
const check=(name,passed,details)=>{checks.push({name,passed,details});};
for(const row of manifest.references){
  const b=fs.readFileSync(path.join(repo,row.reference));
  check('reference-byte-identity:'+path.relative(root,path.join(repo,row.reference)),b.length===row.source_bytes&&sha(b)===row.sha256,{bytes:b.length,sha256:sha(b)});
}
const logo=fs.readFileSync(path.join(root,'clickable/juanerai-logo.png'));
check('approved-logo-byte-identity',logo.length===manifest.brand.bytes&&sha(logo)===manifest.brand.sha256);
for(const file of ['review.js','px004/app.js','px004/data.js','px006/app.js','px006/data.js']){
  const r=spawnSync(process.execPath,['--check',path.join(root,'clickable',file)],{encoding:'utf8'});
  check('javascript-syntax:'+file,r.status===0,r.stderr||undefined);
}
const top=fs.readFileSync(path.join(root,'clickable/index.html'),'utf8');
const pro=fs.readFileSync(path.join(root,'clickable/px004/index.html'),'utf8');
check('professional-is-full-004-not-006-placeholder',top.includes('id="professional-frame"')&&!top.includes('id="h-pro"')&&['home','prepare','process','analysis','report','feedback'].every(s=>pro.includes('id="view-'+s+'"')));
check('default-does-not-load-seeded-demo-scripts',![top,pro].some(s=>/<script src="(?:data|app)\.js/.test(s)));
check('juanerai-wordmark-slogan-and-no-image-logo',!top.includes('juanerai-logo.png')&&top.includes('持续做出更好的决策')&&top.includes('Juaner'));
for(const [file,html] of [['index.html',top],['px004/index.html',pro],['px004/reference.html',fs.readFileSync(path.join(root,'clickable/px004/reference.html'),'utf8')],['px006/reference.html',fs.readFileSync(path.join(root,'clickable/px006/reference.html'),'utf8')]]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  check('unique-html-ids:'+file,ids.length===new Set(ids).size);
  const resources=[...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(s=>!s.startsWith('data:'));
  check('local-static-resources:'+file,resources.every(s=>!/^https?:/.test(s)&&fs.existsSync(path.resolve(root,'clickable',path.dirname(file),s.split('?')[0]))),resources);
}
const overlay=fs.readFileSync(path.join(root,'clickable/review.js'),'utf8');
check('overlay-no-network-credentials-or-persistence',!/(?:fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|sendBeacon|\bapiKey\b)/.test(overlay));
check('review-controls-and-diff-explicit',overlay.includes('review-state')&&overlay.includes('data-apply')&&overlay.includes("const demo = new URLSearchParams(location.search).get('preview') === 'demo'"));
const result={scope:'STATIC_ATTACHMENT_ONLY',device:'MacBook',checks,total:checks.length,passed:checks.filter(c=>c.passed).length,not_run:['Browser pixel/dimension/click checks: file protocol blocked by tool','Provider, credentials, real data, services, backend/engineering tests, user UI acceptance']};
console.log(JSON.stringify(result,null,2));
process.exitCode=checks.every(c=>c.passed)?0:1;
