import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

test('INSTALL-004 normal LaunchServices entry opens the exact isolated app without a trust bypass',async t=>{
 const app=process.env.JUANERAI_INSTALL_APP,evidence=process.env.JUANERAI_LAUNCHSERVICES_EVIDENCE;assert.ok(app&&evidence);await mkdir(evidence);const userData=join(evidence,'user-data'),cwd=join(evidence,'empty-cwd');await mkdir(userData);await mkdir(cwd);
 const env={PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'};
 const jxa=script=>execFileSync('/usr/bin/osascript',['-l','JavaScript','-e',script],{env,cwd,encoding:'utf8',timeout:10000});
 const running=()=>JSON.parse(jxa(`ObjC.import('AppKit'); JSON.stringify($.NSWorkspace.sharedWorkspace.runningApplications.js.filter(a=>ObjC.unwrap(a.bundleURL.path)===${JSON.stringify(app)}).map(a=>({pid:Number(a.processIdentifier),path:ObjC.unwrap(a.bundleURL.path)})));`));
 assert.deepEqual(running(),[],'the exclusive installed bundle has no pre-existing process');
 let owned,browser;
 t.after(async()=>{if(browser)await browser.close();if(owned&&running().some(x=>x.pid===owned.pid))jxa(`ObjC.import('AppKit'); $.NSRunningApplication.runningApplicationWithProcessIdentifier(${owned.pid}).terminate;`);});
 const argv=['-n','-a',app,'--args','--user-data-dir='+userData,'--remote-debugging-port=0','--remote-debugging-address=127.0.0.1'];
 await writeFile(join(evidence,'command.json'),JSON.stringify({argv:['/usr/bin/open',...argv],cwd,env,debugging:'local CDP only for observing the normal LaunchServices window; no alternate Main or transport'},null,2),{flag:'wx'});
 execFileSync('/usr/bin/open',argv,{env,cwd,encoding:'utf8',timeout:30000});
 for(let n=0;n<100;n++){const apps=running();if(apps.length){assert.equal(apps.length,1);owned=apps[0];break;}await new Promise(r=>setTimeout(r,100));}assert.ok(owned,'LaunchServices registered exact copied bundle');
 let endpoint;for(let n=0;n<100;n++){try{const [port,path]=(await readFile(join(userData,'DevToolsActivePort'),'utf8')).trim().split('\n');assert.match(port,/^\d+$/);assert.match(path,/^\/devtools\/browser\//);endpoint='ws://127.0.0.1:'+port+path;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(endpoint,'normal launch exposes its owned renderer');
 browser=await chromium.connectOverCDP(endpoint);const page=browser.contexts()[0].pages()[0];await page.getByRole('button',{name:'专业模式',exact:true}).waitFor();await page.getByRole('heading',{name:'Case Assistant',exact:true}).waitFor();await page.screenshot({path:join(evidence,'launchservices.png')});assert.equal(await page.evaluate(()=>document.title),'Xanthil Desktop');
 await browser.close();browser=undefined;jxa(`ObjC.import('AppKit'); $.NSRunningApplication.runningApplicationWithProcessIdentifier(${owned.pid}).terminate;`);
 for(let n=0;n<100&&running().some(x=>x.pid===owned.pid);n++)await new Promise(r=>setTimeout(r,100));assert.equal(running().some(x=>x.pid===owned.pid),false,'normal owned app quit completed');
 await writeFile(join(evidence,'result.json'),JSON.stringify({pass:true,owned,launchservices:true,window:true,normal_quit:true,quarantine_modified:false,trust_bypass:false},null,2),{flag:'wx'});
});
