// Explicit local synthetic check of a relocated, pinned candidate. Never installs or invokes a model.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyReportStudioBundle} from '../../adapters/report-studio/bundle.ts';
import {createPersonalReportStudioRuntime} from '../../profiles/personal/report-studio.ts';
const [bundle,identityFile,evidence]=process.argv.slice(2);
assert(bundle&&identityFile&&evidence&&process.argv.length===5);
const identity=JSON.parse(await readFile(identityFile,'utf8'));
const checked=await verifyReportStudioBundle(resolve(bundle),identity);assert.equal(checked.state,'ready');
await mkdir(evidence,{recursive:true});const data=join(resolve(evidence),'data');await mkdir(data,{recursive:true});
const studio=join(resolve(bundle),'studio'),node=join(resolve(bundle),'bin/node'),browser=join(resolve(bundle),'browser');
const instance=createPersonalReportStudioRuntime({bundleRoot:resolve(bundle),identity,dataRoot:data});
try{
 const service=await instance.start();await service.gateway.verify();const nonce=await service.gateway.bootstrap();assert.match(nonce,/^[a-f0-9]{64}$/);
 assert.equal((await fetch(service.origin)).status,200);await instance.close();await assert.rejects(()=>fetch(service.origin));
 const script=`
 import assert from 'node:assert/strict';
 import {mkdir,writeFile,readFile} from 'node:fs/promises';
 import {join} from 'node:path';
 import {renderDeckTool} from './dist/agent/tools/render-deck-tool.js';
 import {shootHtml} from './dist/agent/deck-preview.js';
 import {buildDeckPdf,buildDeckHtml,buildDeckExports} from './dist/agent/export-deck.js';
 import JSZip from 'jszip';
 const root=process.env.SMOKE_OUTPUT;await mkdir(join(root,'deck/pages'),{recursive:true});
 await writeFile(join(root,'deck/pages/page_01.mjs'),'export function buildSlide(pptx){const slide=pptx.addSlide();slide.addText("Synthetic report",{x:1,y:0.1,w:8,h:1});slide.addChart(pptx.ChartType.bar,[{name:"Synthetic",labels:["Q1","Q2","Q3"],values:[100,120,135]}],{x:1,y:1,w:8,h:4});}');
 await writeFile(join(root,'deck/deck.mjs'),"import PptxGenJS from 'pptxgenjs';import {buildSlide} from './pages/page_01.mjs';const p=new PptxGenJS();buildSlide(p);await p.writeFile({fileName:'deck/deck.pptx'});");
 const html='<!doctype html><html><meta charset="utf-8"><body style="font-family:Arial;background:#fff"><h1>合成报告</h1><p>只验证本地渲染，无模型调用。</p></body></html>';
 await writeFile(join(root,'deck/pages/page_01.html'),html);
 const rendered=await renderDeckTool(root).execute({},new AbortController().signal,{});assert.equal(rendered.ok,true,JSON.stringify(rendered));assert.equal(rendered.slides,1);
 const raw=await readFile(join(root,'deck/deck.pptx')),[{artifact}]=await buildDeckExports(root,['pptx']);const deckZip=await JSZip.loadAsync(artifact),workbook=await JSZip.loadAsync(await deckZip.file('ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx').async('nodebuffer'));assert.match(await workbook.file('xl/tables/table1.xml').async('string'),/ref="A1:B4"/);assert.deepEqual(await readFile(join(root,'deck/deck.pptx')),raw);await writeFile(join(root,'report.pptx'),artifact);
 const png=await shootHtml(html);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');await writeFile(join(root,'preview.png'),png);
 const pdf=await buildDeckPdf(root);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');await writeFile(join(root,'report.pdf'),pdf);await writeFile(join(root,'report.html'),await buildDeckHtml(root));
 console.log(JSON.stringify({node:process.version,pptx:(await readFile(join(root,'deck/deck.pptx'))).length,png:png.length,pdf:pdf.length}));`;
 const output=join(resolve(evidence),'synthetic-render');await mkdir(output,{recursive:true});
 const result=await new Promise((accept,reject)=>{
   const child=spawn(node,['--input-type=module','--eval',script],{cwd:studio,env:{PATH:join(resolve(bundle),'bin')+':/usr/bin:/bin',HOME:join(data,'.home'),TMPDIR:join(data,'.tmp'),REPORT_STUDIO_BUILTIN:'1',PLAYWRIGHT_BROWSERS_PATH:browser,SMOKE_OUTPUT:output},stdio:['ignore','pipe','pipe']});
   let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.once('error',reject);child.once('close',code=>accept({code,stdout,stderr}));
 });
 await writeFile(join(evidence,'render-result.json'),JSON.stringify(result,null,2)+'\n');assert.equal(result.code,0,result.stderr);
 const artifacts=[];for(const path of ['deck/deck.pptx','report.pptx','preview.png','report.pdf','report.html']){const bytes=await readFile(join(output,path));artifacts.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 await writeFile(join(evidence,'result.json'),JSON.stringify({identity,resource_files:checked.manifest.files.length,service:'owned-ready-and-closed',render:JSON.parse(result.stdout),artifacts,provider_calls:0,installed_app_acceptance:'NOT_RUN',redistribution_review:'PENDING'},null,2)+'\n');
 console.log(JSON.stringify({service:'PASS',local_render:'PASS',resource_files:checked.manifest.files.length}));
}finally{await instance.close();}
