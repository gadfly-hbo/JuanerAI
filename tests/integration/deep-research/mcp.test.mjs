import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const programRoot=process.env.DR_PROGRAM_ROOT,site=process.env.DR_MCP_SITE_PACKAGES,python=process.env.DR_PYTHON;
test('DR C02/C10: fixed MCP server and original stdio codec consume only synthetic search',{skip:!programRoot||!site||!python},async t=>{
 const {mcpWebSearch}=await import(pathToFileURL(join(programRoot,'dist/adapters/mcpSearch.js')));
 const provider=mcpWebSearch({command:python,args:['-I',fileURLToPath(new URL('../../fixtures/deep-research/mcp-synthetic.py',import.meta.url)),site],env:{MINIMAX_API_KEY:'synthetic-only',MINIMAX_API_HOST:'https://synthetic.invalid'},timeoutMs:10000});t.after(()=>provider.close());
 assert.deepEqual(await provider.search('synthetic question','synthetic-mcp:0'),[{url:'https://synthetic.invalid/mcp',title:'合成检索',snippet:'only synthetic'}]);
});
test('DR C01/C03: packaged MCP entry initializes and lists original tools with network denied',{skip:!process.env.DR_BUNDLE_ROOT||!python},async t=>{
 const {spawn}=await import('node:child_process');
 const child=spawn(python,['-I',fileURLToPath(new URL('../../fixtures/deep-research/mcp-entry-probe.py',import.meta.url)),join(process.env.DR_BUNDLE_ROOT,'mcp-entry.py')],{env:{MINIMAX_API_KEY:'synthetic-only',MINIMAX_API_HOST:'https://synthetic.invalid'},stdio:['pipe','pipe','pipe']});
 const stopped=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));t.after(async()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');await stopped;});
 const pending=new Map();let buffer='',errors='';child.stderr.on('data',chunk=>{errors+=chunk;});child.stdout.on('data',chunk=>{buffer+=chunk;let at;while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);try{const value=JSON.parse(line);if(pending.has(value.id)){pending.get(value.id)(value);pending.delete(value.id);}}catch{}}});
 const call=(id,method,params)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP timeout '+errors));},10000);pending.set(id,value=>{clearTimeout(timer);resolve(value);});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});
 const init=await call(1,'initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'offline-verification',version:'1'}});assert.ok(init.result,JSON.stringify(init));
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');const listed=await call(2,'tools/list',{});assert.ok(listed.result.tools.some(tool=>tool.name==='web_search'));assert.ok(!errors.includes('OFFLINE_MCP_NETWORK_DENIED'));
 child.kill('SIGTERM');await stopped;
});
