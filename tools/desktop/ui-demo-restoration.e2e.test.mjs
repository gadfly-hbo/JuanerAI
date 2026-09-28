import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, cp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { _electron } from 'playwright-core';

const bundle=process.env.JUANERAI_INSTALL_APP,evidence=process.env.JUANERAI_INSTALL_E2E,source=process.env.JUANERAI_UI_SYNTHETIC_PROJECT;
assert.ok(bundle&&evidence&&source);
test('UI-RESTORE-001: real review keeps business evidence first and the accepted workbench contained',async()=>{
  await mkdir(evidence);const project=join(evidence,'Project'),cwd=join(evidence,'empty-cwd'),userData=join(evidence,'user-data'),tmp=join(evidence,'tmp');
  await cp(source,project,{recursive:true,errorOnExist:true,force:false});for(const dir of[cwd,userData,tmp])await mkdir(dir);
  const options={executablePath:join(bundle,'Contents/MacOS/Xanthil'),cwd,args:['--user-data-dir='+userData],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',TMPDIR:tmp},chromiumSandbox:true,timeout:30000};
  await writeFile(join(evidence,'launch.json'),JSON.stringify(options,null,2)+'\n',{flag:'wx'});
  const app=await _electron.launch(options);const observations=[];
  try{
    await app.evaluate(({dialog},project)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[project]});},project);
    const page=await app.firstWindow();page.setDefaultTimeout(10000);
    await page.getByRole('button',{name:'专业模式',exact:false}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();
    await page.locator('.session-list button').first().click();await page.getByText('会话已打开',{exact:true}).waitFor();
    const contrasts=await page.evaluate(()=>{
      const luminance=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const rgb=value=>value.match(/[\d.]+/g).map(Number);
      return ['.workspace-description','.workspace-boundary','.drawer-section h3','.context-list dt','.stage-button:not(.active)','.stage-button:not(.active) .stage-number','.rail-section h2'].map(selector=>{
        const element=document.querySelector(selector);let parent=element,background;
        while(parent){const color=getComputedStyle(parent).backgroundColor;if(color!=='rgba(0, 0, 0, 0)'&&color!=='transparent'){background=color;break;}parent=parent.parentElement;}
        const foreground=getComputedStyle(element).color,a=luminance(rgb(foreground)),b=luminance(rgb(background??'rgb(255, 255, 255)'));
        return{selector,foreground,background,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
      });
    });
    await writeFile(join(evidence,'contrast.json'),JSON.stringify(contrasts,null,2)+'\n',{flag:'wx'});
    for(const row of contrasts)assert.ok(row.ratio>=4.5,`${row.selector}: actual text contrast ${row.ratio} < 4.5`);
    for(const size of[{width:1440,height:900},{width:1366,height:768}]){
      await page.setViewportSize(size);
      for(const stage of['新建分析','数据准备','本地处理','循证分析','报告','执行反馈']){
        await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:new RegExp(stage)}).click();
        const observation=await page.evaluate(()=>({height:innerHeight,documentHeight:document.documentElement.scrollHeight,width:innerWidth,documentWidth:document.documentElement.scrollWidth,status:document.querySelector('.statusbar').getBoundingClientRect().toJSON(),stageRect:document.querySelector('.professional-stages').getBoundingClientRect().toJSON(),finding:document.querySelector('.finding-review')?.getBoundingClientRect().toJSON(),provider:document.querySelector('input')?.getBoundingClientRect().toJSON()}));
        observations.push({size,stage,...observation});
        await writeFile(join(evidence,`${size.width}-${stage}.png`),await page.screenshot(),{flag:'wx'});
      }
    }
    await writeFile(join(evidence,'layout.json'),JSON.stringify(observations,null,2)+'\n',{flag:'wx'});
    for(const row of observations){assert.ok(row.documentHeight<=row.height+1,`${row.size.width}/${row.stage}: page overflow ${row.documentHeight}>${row.height}`);assert.ok(row.documentWidth<=row.width+1);assert.ok(row.status.bottom<=row.height+1);}
    const review=observations.filter(x=>x.stage==='循证分析');for(const row of review)assert.ok(row.finding&&row.finding.top<row.height/2,'Business evidence must be visible above optional assistance');
    await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/循证分析/}).click();
    await page.getByLabel('手工证据解释（不改变计算结果）',{exact:true}).focus();
    const focus=await page.getByLabel('手工证据解释（不改变计算结果）',{exact:true}).boundingBox();assert.ok(focus&&focus.y>=142&&focus.y+focus.height<=736,'required editing remains reachable in the center pane');
    await page.locator('details.assistance-panel > summary').click();await page.getByLabel('请求的提供方',{exact:true}).fill('synthetic-no-provider');
    assert.equal(await page.locator('details.assistance-panel').evaluate(el=>el.open),true,'typing must not fold or lose optional controls');
    await page.getByRole('button',{name:'辅助抽屉',exact:true}).click();const drawer=page.getByRole('complementary',{name:'辅助抽屉内容',exact:true});
    assert.match(await drawer.innerText(),/Internal install synthetic/);assert.match(await drawer.innerText(),/members.csv/);assert.match(await drawer.innerText(),/证据不支持/);
    await drawer.getByText('技术身份与运行记录',{exact:true}).click();assert.match(await drawer.innerText(),/Succeeded/);
    await writeFile(join(evidence,'1366-inspector.png'),await page.screenshot(),{flag:'wx'});
    await page.getByRole('button',{name:'关闭辅助抽屉',exact:true}).click();assert.equal(await page.getByRole('button',{name:'辅助抽屉',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.getByRole('button',{name:'快速模式',exact:true}).click();await writeFile(join(evidence,'1366-quick.png'),await page.screenshot(),{flag:'wx'});
    await page.getByRole('button',{name:'Skill · Preview',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button',{name:'Skill · Preview',exact:true}).evaluate(el=>el===document.activeElement),true);
  }finally{await app.close();}
});
