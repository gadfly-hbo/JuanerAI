// Actual existing product source inspector, independent from new SDK behavior.
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.SDK_CONSUMER_ROOT,evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR,fixtures=process.env.R1_LARGE_FIXTURES;
assert.ok(root&&evidence&&fixtures);
const {createMemberSourcePreparation}=await import(pathToFileURL(resolve(root,'adapters/analytics-duckdb/member-source-inspection.ts')).href);
const manifest=JSON.parse(await readFile(join(fixtures,'manifest.json'),'utf8'));
const prep=createMemberSourcePreparation({pythonExecutable:process.env.R1_FIXTURE_PYTHON,pythonVersion:process.env.R1_FIXTURE_PYTHON_VERSION});
const checks=[];
for(const [name,format] of [['wide','csv'],['many','xlsx']]){
 const files=manifest.files.filter(f=>f.format===format);
 const sources=await Promise.all(files.map(async f=>({source_id:randomUUID(),display_name:f.path,format:f.format,bytes:new Uint8Array(await readFile(join(fixtures,f.path)))})));
 const actual=await prep.inspectSources({sources,cancellation_signal:new AbortController().signal,deadline_seconds:20});assert.equal(actual.sources.length,files.length);
 actual.sources.forEach((s,i)=>assert.equal(s.sha256,files[i].sha256));const sheets=actual.sources.flatMap(s=>s.sheets);
 if(name==='wide'){assert.equal(sheets[0].rows[0].cells.length,10000);assert.equal(sheets[0].rows[1].cells[0].value.length,32767);}
 else{assert.equal(sheets.length,2048);assert.ok(sheets.every(s=>s.state==='visible'&&s.rows.length===2));}
 await writeFile(join(evidence,name+'-fixture-inspection.json'),JSON.stringify(actual),{flag:'wx'});
 checks.push({case:name,sources:actual.sources.length,sheets:sheets.length,pass:true});
}
await writeFile(join(evidence,'fixture-inspection-result.json'),JSON.stringify({checks,scope:'actual source parsing only; catalog/read/guard/Outcome still pending'},null,2),{flag:'wx'});
console.log(JSON.stringify(checks));
