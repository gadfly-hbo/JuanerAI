import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,cpSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import * as origins from '../../../adapters/storage-local/browser-project-origin.ts';
import {createPersonalBrowserMembershipWorkspace} from '../../../profiles/personal/browser-membership.ts';
import {createLocalModelAccess} from '../../../packages/application/provider-settings.ts';
import {approvedMembershipPolicy} from '../../../packages/product-core/member-model-policy.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

test('BF-R01/08: project catalog resolves only registered identities, never directory discovery or caller paths',async()=>{
 const list=Reflect.get(origins,'listBrowserProjects');assert.equal(typeof list,'function');
 const parent=mkdtempSync(join(browserEvidenceRoot,'web-catalog-')),originDirectory=join(parent,'origins');mkdirSync(originDirectory);
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,projectRoot=join(parent,'project');
 const project=await createPersonalBrowserMembershipWorkspace({projectRoot,originDirectory,display_name:'Synthetic saved project',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('no dispatch');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}});
 const id=project.project_id;await project.close();
 cpSync(projectRoot,join(parent,'unregistered-copy'),{recursive:true});
 const before=readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite'));
 assert.deepEqual(list(originDirectory),[{project_id:id,display_name:'Synthetic saved project',root:projectRoot}]);
 assert.deepEqual(readFileSync(join(projectRoot,'.xanthil/desktop/state.sqlite')),before);
});

test('BF-R01/08: web project name/opaque selection creates once and rejects paths, with passive settings',async()=>{
 const module=await import('../../../profiles/personal/browser-membership.ts'),create=Reflect.get(module,'createPersonalBrowserServiceWorkspace');assert.equal(typeof create,'function');
 const parent=mkdtempSync(join(browserEvidenceRoot,'web-manager-')),originDirectory=join(parent,'profile'),projectsRoot=join(parent,'Projects');mkdirSync(originDirectory);mkdirSync(projectsRoot);
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,config={originDirectory,projectsRoot,toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('no dispatch');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}};
 const manager=await create(config);const {randomUUID}=await import('node:crypto'),command={version:'1.0',command_id:randomUUID(),name:'网页合成项目'};
 try{
  for(const bad of [{...command,path:parent},{...command,name:'../outside'},{...command,name:'/tmp/project'}])await assert.rejects(()=>manager.select(bad));
  const created=await manager.select(command);assert.equal(typeof created.project_id,'string');assert.equal('root'in created,false);assert.deepEqual(await manager.select(command),created);
  const catalog=await manager.projects();assert.equal(catalog.projects.length,1);assert.equal(catalog.projects[0].display_name,command.name);assert.equal('root'in catalog.projects[0],false);
  assert.deepEqual(await manager.workspace.list(),{tasks:[]});
  await assert.rejects(()=>manager.select({...command,name:'different'}));
 }finally{await manager.close();}
 const reopened=await create(config);try{const list=await reopened.projects();assert.equal(list.current,null);await reopened.select({version:'1.0',command_id:randomUUID(),project_id:list.projects[0].project_id});assert.deepEqual(await reopened.workspace.list(),{tasks:[]});}finally{await reopened.close();}
});
