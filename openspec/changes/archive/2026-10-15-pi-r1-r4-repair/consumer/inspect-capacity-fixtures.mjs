import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.SDK_CONSUMER_ROOT,evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR,fixtures=process.env.R1_LARGE_FIXTURES;assert.ok(root&&evidence&&fixtures);
const {createMemberSourcePreparation}=await import(pathToFileURL(resolve(root,'adapters/analytics-duckdb/member-source-inspection.ts')).href);
const manifest=JSON.parse(await readFile(join(fixtures,'manifest.json'),'utf8'));
const inspector=createMemberSourcePreparation({pythonExecutable:process.env.R1_FIXTURE_PYTHON,pythonVersion:process.env.R1_FIXTURE_PYTHON_VERSION}).inspectSources;
const checks=[];
for(const batch of ['cells-100000','bytes-32MiB']){
 const files=manifest.files.filter(f=>f.batch===batch),sources=await Promise.all(files.map(async f=>({source_id:randomUUID(),display_name:f.path,format:'csv',bytes:new Uint8Array(await readFile(join(fixtures,f.path)))})));
 const inspect=selected=>inspector({sources:selected,cancellation_signal:new AbortController().signal,deadline_seconds:30});
 const parsed=await inspect(sources);assert.equal(parsed.sources.length,files.length);
 parsed.sources.forEach((s,i)=>{assert.equal(s.sha256,files[i].sha256);assert.equal(s.sheets[0].rows.reduce((n,row)=>n+row.cells.length,0),files[i].logical_cells);assert.equal(s.sheets[0].rows.length-1,files[i].data_rows);});
 await writeFile(join(evidence,batch+'-inspection.json'),JSON.stringify(parsed),{flag:'wx'});
 if(batch==='cells-100000'){
  await assert.rejects(()=>inspect([{...sources[0],bytes:Buffer.concat([sources[0].bytes,Buffer.from('x')])}]));
  // Independently small CSV isolates the cell limit from file-byte rejection.
  const cells=Buffer.from(Array.from({length:1001},(_,i)=>Array(i===1000?1:100).fill('x').join(',')).join('\n'));
  await assert.rejects(()=>inspect([{...sources[0],bytes:cells}]),{code:'SOURCE_CAPACITY'});
 }else await assert.rejects(()=>inspect([...sources,{source_id:randomUUID(),display_name:'extra.csv',format:'csv',bytes:new Uint8Array(Buffer.from('x\n'))}]),{code:'SOURCE_CAPACITY'});
 checks.push({batch,files:files.length,bytes:sources.reduce((n,s)=>n+s.bytes.length,0),actualCells:parsed.sources.reduce((n,s)=>n+s.sheets[0].rows.reduce((m,row)=>m+row.cells.length,0),0),positiveAndExcessRejected:true});
}
await writeFile(join(evidence,'capacity-inspection-result.json'),JSON.stringify({checks,scope:'actual existing source inspector only; no SDK admission/read/IR/Outcome claim'},null,2),{flag:'wx'});console.log(JSON.stringify(checks));
