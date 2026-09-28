import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile, readdir, lstat, readlink, mkdir, writeFile, cp, symlink, chmod } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createPersonalXanthilDesktopProfile } from '../../profiles/personal/xanthil-desktop.ts';
import { openConfirmedDesktopRevision, withIsolatedProject, createControlledDeadlineScheduler } from '../../tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { desktopTestIds, fixedClock } from '../../tests/fixtures/xanthil-desktop/desktop-fixtures.ts';

const resources = process.env.JUANERAI_INSTALL_RESOURCES;
assert.ok(resources, 'dedicated internal-install command must bind prepared resources');
async function identity(root, dir = root) {
  const result = [];
  for (const name of (await readdir(dir)).sort()) {
    const path = join(dir, name), stat = await lstat(path);
    if (stat.isDirectory()) result.push(...await identity(root, path));
    else if (stat.isSymbolicLink()) result.push([relative(root,path), 'link', await readlink(path)]);
    else result.push([relative(root,path), stat.mode & 0o777, stat.size, createHash('sha256').update(await readFile(path)).digest('hex')]);
  }
  return result;
}

test('INSTALL-001/002/003: relative bundled tools calculate real known results without changing runtime; external Project reopens', async () => withIsolatedProject(async projectRoot => {
  const prepared = await openConfirmedDesktopRevision(projectRoot);
  const before = await identity(resources);
  const profile = createPersonalXanthilDesktopProfile({
    toolchainDeployment: { descriptor_path: join(resources,'toolchain-deployment.json') },
    assistanceConfig: null, clock: fixedClock, deadlineScheduler: createControlledDeadlineScheduler().scheduler,
  });
  const open = { contract_version:'1.0', command_id:desktopTestIds.openProjectCommand, projectDirectoryCapability:{projectRoot,display_name:'Synthetic Project'}, display_name:'Synthetic Project' };
  const {application} = await profile.openProject(open);
  const request = {contract_version:'1.0',command_id:desktopTestIds.retryCommand,...prepared.owner,expected_row_version:'2',confirmation_id:prepared.confirmationId};
  let value = await application.startAnalysis(request);
  assert.equal(value.runs[0].status,'Running');
  for(let i=0;i<300 && value.runs[0].status==='Running';i++) {
    await new Promise(resolve=>setTimeout(resolve,10)); value=await application.readProjection(prepared.owner);
  }
  assert.equal(value.runs[0].status,'Succeeded');
  assert.equal(value.revision.state,'Review');
  assert.equal(value.findings[0].judgment,'Rejected');
  const metrics=JSON.parse(value.findings[0].metrics);
  assert.deepEqual(metrics.periods,{
    comparison:{active_member_count:'2',repeat_member_count:'1',repeat_revenue_fen:'2000',repurchase_rate:{numerator:'1',denominator:'2'}},
    current:{active_member_count:'2',repeat_member_count:'1',repeat_revenue_fen:'2500',repurchase_rate:{numerator:'1',denominator:'2'}},
  });
  assert.deepEqual(await identity(resources),before,'runtime resources cannot gain bytecode or change');
  const reopened=await profile.openProject(open);
  assert.deepEqual(await reopened.application.readProjection(prepared.owner),value);
}));

test('INSTALL-002: traversal, wrong runtime identity, extra files and escaped links refuse before a Run and retain manual state', async t => withIsolatedProject(async root=>{
  const copied=join(root,'Resources'); await cp(resources,copied,{recursive:true,errorOnExist:true,force:false,verbatimSymlinks:true});
  const original=JSON.parse(await readFile(join(copied,'toolchain-deployment.json'),'utf8'));
  for(const mode of ['traversal','absolute','wrong-hash','missing-file','extra-file','escaped-link']) await t.test(mode,()=>withIsolatedProject(async projectRoot=>{
    const setup=await openConfirmedDesktopRevision(projectRoot), descriptor=structuredClone(original);
    if(mode==='traversal')descriptor.python.executable_path='toolchain/python/../../../../python';
    if(mode==='absolute')descriptor.python.executable_path='/usr/bin/python3';
    if(mode==='wrong-hash')descriptor.inventory.find(x=>x.path==='toolchain/duckdb').sha256='0'.repeat(64);
    if(mode==='missing-file')descriptor.inventory.push({path:'toolchain/missing',kind:'file',mode:0o755,bytes:0,sha256:'0'.repeat(64)});
    // These last two changes remain in their dedicated fixture: both are rejected.
    if(mode==='extra-file')await writeFile(join(copied,'toolchain','unlisted'),'unexpected',{flag:'wx'});
    if(mode==='escaped-link') {
      descriptor.inventory.push({path:'toolchain/unlisted',kind:'file',mode:0o644,bytes:10,sha256:createHash('sha256').update('unexpected').digest('hex')});
      await symlink(projectRoot,join(copied,'toolchain','escape'));
      descriptor.inventory.push({path:'toolchain/escape',kind:'symlink',target:projectRoot});
    }
    await writeFile(join(copied,'toolchain-deployment.json'),JSON.stringify(descriptor));
    const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(copied,'toolchain-deployment.json')},assistanceConfig:null,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler});
    const {application}=await profile.openProject({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,projectDirectoryCapability:{projectRoot,display_name:'Synthetic Project'},display_name:'Synthetic Project'});
    const before=await application.readProjection(setup.owner),db=await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite'));
    await assert.rejects(()=>application.startAnalysis({contract_version:'1.0',command_id:desktopTestIds.retryCommand,...setup.owner,expected_row_version:'2',confirmation_id:setup.confirmationId}),/TOOLCHAIN_UNAVAILABLE/);
    assert.deepEqual(await application.readProjection(setup.owner),before);
    assert.deepEqual(await readFile(join(projectRoot,'.xanthil','desktop','state.sqlite')),db);
  }));
}));

test('INSTALL-003: bundle and Resources cannot become a Project; rejection creates no SQLite or Session data', async()=>withIsolatedProject(async root=>{
  const appRoot=join(root,'Synthetic.app'), resourceRoot=join(appRoot,'Contents','Resources');
  await mkdir(resourceRoot,{recursive:true});
  await cp(join(resources,'toolchain-deployment.json'),join(resourceRoot,'toolchain-deployment.json'),{errorOnExist:true,force:false});
  const before=await identity(appRoot);
  const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(resourceRoot,'toolchain-deployment.json')},assistanceConfig:null,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler});
  for(const projectRoot of [appRoot,resourceRoot]) {
    await assert.rejects(()=>profile.openProject({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,projectDirectoryCapability:{projectRoot,display_name:'Forbidden'},display_name:'Forbidden'}),/FORBIDDEN/);
    assert.deepEqual(await identity(appRoot),before);
  }
}));

test('INSTALL-003: non-writable external directory refuses without files; writable external directory remains usable',async()=>withIsolatedProject(async root=>{
  const directory=join(root,'external');await mkdir(directory);
  const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(resources,'toolchain-deployment.json')},assistanceConfig:null,clock:fixedClock,deadlineScheduler:createControlledDeadlineScheduler().scheduler});
  const request={contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,projectDirectoryCapability:{projectRoot:directory,display_name:'External'},display_name:'External'};
  await chmod(directory,0o500);
  try{await assert.rejects(()=>profile.openProject(request),/FORBIDDEN/);assert.deepEqual(await readdir(directory),[]);}finally{await chmod(directory,0o700);}
  assert.equal((await profile.openProject(request)).value.project.write_state,'ready');
}));
