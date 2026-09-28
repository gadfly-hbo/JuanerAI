import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile, readdir, lstat, readlink, mkdir, writeFile, cp } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { _electron } from 'playwright-core';

const bundle=process.env.JUANERAI_INSTALL_APP;
const evidence=process.env.JUANERAI_INSTALL_E2E;
assert.ok(bundle && evidence);
async function identity(root,dir=root){
  const result=[];
  for(const name of (await readdir(dir)).sort()){
    const path=join(dir,name),s=await lstat(path),key=relative(root,path);
    if(s.isDirectory())result.push(...await identity(root,path));
    else if(s.isSymbolicLink())result.push({path:key,mode:s.mode&0o777,link:await readlink(path)});
    else result.push({path:key,mode:s.mode&0o777,bytes:s.size,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
  }
  return result;
}
async function save(name,value){await writeFile(join(evidence,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
function stored(project){
 const db=new DatabaseSync(join(project,'.xanthil/desktop/state.sqlite'),{readOnly:true});
 try{return {runs:db.prepare('SELECT run_id,status FROM analysis_runs').all().map(x=>({...x})),findings:db.prepare('SELECT judgment,metrics_json AS metrics FROM findings').all().map(x=>({...x})),attempts:db.prepare('SELECT count(*) n FROM assistance_attempts').get().n};}finally{db.close();}
}

test('INSTALL-001/003: packaged production UI computes without developer paths; relocated same app reopens external Project',async()=>{
 await mkdir(evidence);
 const resume=process.env.JUANERAI_INSTALL_RESUME_ARTIFACTS;
 const project=join(resume??evidence,'Project'),cwd=join(evidence,'empty-cwd'),temp=join(evidence,'tmp');
 for(const dir of [...(resume?[]:[project]),cwd,temp])await mkdir(dir);
 const members=join(evidence,'members.csv'),orders=join(evidence,'orders.csv');
 for(const [name,destination] of [['members.csv',members],['orders.csv',orders]])await cp(new URL('../../tests/fixtures/xanthil-desktop/'+name,import.meta.url),destination,{errorOnExist:true,force:false});
 const before=await identity(bundle);if(resume)assert.deepEqual(before,JSON.parse(await readFile(join(resume,'package-before.json'),'utf8')));await save('package-before.json',before);
 async function launch(appRoot,label){
   const userData=join(evidence,label+'-user-data');await mkdir(userData);
   // Electron v44.4.3 PreSandboxStartup consumes this before logging/session initialization.
   const env={PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',TMPDIR:temp};
   await save(label+'-launch.json',{executablePath:join(appRoot,'Contents/MacOS/Xanthil'),cwd,args:['--user-data-dir='+userData],env});
   const app=await _electron.launch({executablePath:join(appRoot,'Contents/MacOS/Xanthil'),cwd,args:['--user-data-dir='+userData],env,chromiumSandbox:true,timeout:30000});
   try{
     const observed=await app.evaluate(({app})=>({userData:app.getPath('userData'),sessionData:app.getPath('sessionData'),cwd:process.cwd(),path:process.env.PATH,resources:process.resourcesPath}));
     await save(label+'-observed-paths.json',observed);
     assert.equal(observed.userData,userData);assert.equal(observed.sessionData,userData);assert.equal(observed.cwd,cwd);assert.equal(observed.path,'/usr/bin:/bin');assert.equal(observed.resources,join(appRoot,'Contents/Resources'));
     await app.evaluate(({dialog},value)=>{dialog.showOpenDialog=async(first,second)=>{const options=second??first;if(options.properties?.includes('openDirectory'))return{canceled:false,filePaths:[value.project]};if(options.title==='选择成员 CSV')return{canceled:false,filePaths:[value.members]};if(options.title==='选择订单 CSV')return{canceled:false,filePaths:[value.orders]};throw Error('Unexpected native capability');};},{project,members,orders});
     return app;
   }catch(error){await app.close();throw error;}
 }
 let app;
 if(!resume){
 app=await launch(bundle,'original');
 try{
   const page=await app.firstWindow();page.setDefaultTimeout(10000);
   await page.getByRole('button',{name:'专业模式',exact:false}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();
   await page.getByLabel('分析案例名称',{exact:true}).fill('Internal install synthetic');await page.getByLabel('复购问题',{exact:true}).fill('Is current repurchase lower?');await page.getByLabel('假设显示名称',{exact:true}).fill('Current repurchase rate is lower');await page.getByRole('button',{name:'创建分析',exact:true}).click();await page.getByText('会话已创建',{exact:true}).waitFor();
   const stages=page.getByRole('navigation',{name:'专业模式阶段',exact:true});await stages.getByRole('button',{name:/数据准备/}).click();await page.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).click();await page.getByText('请显式选择映射、期间与有效状态。',{exact:true}).waitFor();
   for(const[label,value]of [['成员 ID 列','member_id'],['成员分组列','member_group'],['订单 ID 列','order_id'],['订单成员 ID 列','order_member_id'],['支付时间列','paid_at'],['金额列','amount'],['订单状态列','status'],['币种列','currency']])await page.getByLabel(label,{exact:true}).selectOption(value);
   for(const[label,value]of [['对比期开始','2026-01-01'],['对比期结束（不含）','2026-01-29'],['当前期开始','2026-02-01'],['当前期结束（不含）','2026-03-01'],['有效状态（每行一个精确值）','paid']])await page.getByLabel(label,{exact:true}).fill(value);
   await page.getByRole('button',{name:'核对数据范围',exact:true}).click();await page.getByText('数据范围已核对，请逐项确认。',{exact:true}).waitFor();
   const treatments=page.locator('.issue-treatment select');for(let i=0;i<await treatments.count();i++)await treatments.nth(i).selectOption({index:1});
   for(const label of ['我有权将这两份本地数据用于本次分析','我已核对每项数据问题的数量与处理方式','我确认映射、期间、有效状态与分析定义'])await page.getByLabel(label,{exact:true}).check();
   await page.getByRole('button',{name:'确认数据快照',exact:true}).click();await page.getByText('不可变数据快照已确认',{exact:true}).waitFor();
   await stages.getByRole('button',{name:/本地处理/}).click();await page.getByRole('button',{name:'开始本地处理',exact:true}).click();await page.getByText('独立复核完成 · 可审阅结果',{exact:true}).waitFor({timeout:30000});
   await stages.getByRole('button',{name:/循证分析/}).click();await page.getByText('证据不支持',{exact:true}).waitFor();await page.getByRole('table',{name:'两期复购指标',exact:true}).waitFor();
   await writeFile(join(evidence,'original-review.png'),await page.screenshot({fullPage:true}),{flag:'wx'});
 }finally{await app.close();}
 }
 const state=stored(project);assert.equal(state.runs.length,1);assert.equal(state.runs[0].status,'Succeeded');assert.equal(state.findings.length,1);assert.equal(state.findings[0].judgment,'Rejected');assert.equal(state.attempts,0);
 assert.deepEqual(JSON.parse(state.findings[0].metrics).periods,{comparison:{active_member_count:'2',repeat_member_count:'1',repeat_revenue_fen:'2000',repurchase_rate:{numerator:'1',denominator:'2'}},current:{active_member_count:'2',repeat_member_count:'1',repeat_revenue_fen:'2500',repurchase_rate:{numerator:'1',denominator:'2'}}});await save('actual-business-state.json',state);
 assert.deepEqual(await identity(bundle),before,'production execution must not mutate runtime or package');
 const relocated=join(evidence,'Moved install','Xanthil.app');await mkdir(join(evidence,'Moved install'));await cp(bundle,relocated,{recursive:true,verbatimSymlinks:true,errorOnExist:true,force:false});assert.deepEqual(await identity(relocated),before);
 app=await launch(relocated,'relocated');
 try{const page=await app.firstWindow();page.setDefaultTimeout(10000);await page.getByRole('button',{name:'专业模式',exact:false}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.getByRole('button',{name:'Internal install synthetic',exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/循证分析/}).click();await page.getByText('证据不支持',{exact:true}).waitFor();await writeFile(join(evidence,'relocated-review.png'),await page.screenshot({fullPage:true}),{flag:'wx'});}finally{await app.close();}
 assert.deepEqual(stored(project),state,'relocation/reopen must not start a new Run or lose the original Finding');
 assert.deepEqual(await identity(bundle),before);assert.deepEqual(await identity(relocated),before);await save('package-after.json',await identity(bundle));
 console.log(JSON.stringify({packageFiles:before.length,project,state,relocated,developerPath:false,userDataIsolated:true,nativeChooserManual:false}));
});
