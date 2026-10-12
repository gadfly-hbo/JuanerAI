import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,lstatSync,symlinkSync,linkSync} from 'node:fs';
import {join} from 'node:path';
import * as executor from '../../../adapters/analytics-duckdb/member-preparation-executor.ts';

test('OA-C01/RT02: analysis result admission uses a fixed JSON output and preserves isolation file negatives',()=>{
 const read=Reflect.get(executor,'readAnalysisCodeOutput');
 assert.equal(typeof read,'function','actual analysis output consumer is missing');
 const root=mkdtempSync('/Users/bendandebaba/JuanerAI-artifacts/n01-n02/controller/v11-web-runtime-001/code-output-');
 for(const variant of ['valid','extra','malformed','oversize','symlink','hardlink','identity']){
  const directory=join(root,variant);mkdirSync(directory);
  const content=variant==='malformed'?'{':variant==='oversize'?'x'.repeat(1048577):'{"value":"9","rows":2}';
  if(variant==='symlink'||variant==='hardlink'){
   const outside=join(root,variant+'.json');writeFileSync(outside,content);
   if(variant==='symlink')symlinkSync(outside,join(directory,'result.json'));else linkSync(outside,join(directory,'result.json'));
  }else writeFileSync(join(directory,'result.json'),content);
  if(variant==='extra')writeFileSync(join(directory,'unrequested.txt'),'extra');
  const id=lstatSync(directory),identity={dev:id.dev,ino:id.ino+(variant==='identity'?1:0)};
  if(variant==='valid')assert.deepEqual(read(directory,identity).value,{value:'9',rows:2});
  else assert.throws(()=>read(directory,identity),{code:'PREPARATION_OUTPUT_INVALID'},variant);
 }
});
