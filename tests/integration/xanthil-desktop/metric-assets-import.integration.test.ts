import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {inspectSemanticAsset,sapFingerprints} from '../../../adapters/semantic-assets/sap.ts';
const root=new URL('../../../docs/planning/2026-10-12/change006-metric-assets/attachments/metric-factory-1.1/releases/',import.meta.url);
const release=(version:string)=>readFileSync(new URL(`net-sales-instance/${version}.sap.yaml`,root));
const registry=readFileSync(new URL('index.yaml',root));
test('MF-01/08: no release registry remains an unverified candidate and unknown selected switches cannot execute',()=>{
 const candidate=inspectSemanticAsset(release('1.1.0'));assert.equal(candidate.release_verified,false);assert.equal(candidate.status,'candidate');
 const [bytes,index]=changed(p=>p.metrics.find((m:any)=>m.name==='gmv').caliber_switches.unrecognized_rule=true);assert.equal(inspectSemanticAsset(bytes,index).computability.usable,false);
});
test('MF-01/MFC-01: fixed published SAP becomes a legal candidate with exact dual fingerprints and selected closure',()=>{
 const result:any=inspectSemanticAsset(release('1.1.0'),registry);
 assert.equal(result.status,'candidate');
 assert.equal(result.asset.package_fingerprint,'sha256:140e9ecf1510d3d64bf9f954a2d402cfa55bb88c398452c991ea53dec19dfa5b');
 assert.equal(result.asset.content_fingerprint,'sha256:128bb1dc71a2104a0e11eb37968514c70c94b226eb78383417595a118b775595');
 assert.equal(result.asset.id,'net-sales-instance');assert.equal(result.asset.version,'1.1.0');
 assert.equal(result.metric_count,56);assert.equal(result.unselected_count,50);
 assert.equal(result.computability.usable,true);assert.equal(result.approved,false);
 assert.deepEqual(result.computability.metrics,['gmv','order_count','refund_amount','net_sales','refunded_order_count','refund_rate']);
});
function changed(change:(p:any)=>void){const p=YAML.parse(release('1.1.0').toString());change(p);const fp=sapFingerprints(p);p.package.fingerprint=fp.package_fingerprint;const i=YAML.parse(registry.toString());Object.assign(i.releases.find((r:any)=>r.version==='1.1.0'),fp);return [Buffer.from(YAML.stringify(p)),Buffer.from(YAML.stringify(i))] as const;}
test('MFS-04: original fixed legal packages remain unusable candidates; new completion-attribution is usable',()=>{
 const old=new URL('../../../docs/planning/2026-10-12/change006-metric-assets/attachments/metric-factory/releases/',import.meta.url);
 for(const v of ['1.0.0','1.0.1']){const r=inspectSemanticAsset(readFileSync(new URL(`net-sales-instance/${v}.sap.yaml`,old)),readFileSync(new URL('index.yaml',old)));assert.equal(r.status,'candidate');assert.equal(r.computability.usable,false);assert.equal(r.approved,false);}
 assert.equal(inspectSemanticAsset(release('1.1.1'),registry).computability.usable,true);
});
test('MFC-01: byte tamper, unknown schema/runtime, duplicate metric/scenario and hidden unreviewed LLM reject whole import',()=>{
 assert.throws(()=>inspectSemanticAsset(Buffer.from(release('1.1.0').toString().replace('成交总额','不明金额')),registry),{code:'SAP_FINGERPRINT_MISMATCH'});
 for(const [change,code] of [
  [(p:any)=>p.sap='9.0','SAP_VERSION'],[(p:any)=>p.runtime_state='executable','SAP_RUNTIME_STATE'],
  [(p:any)=>p.metrics.push(structuredClone(p.metrics[0])),'SAP_DUPLICATE_IDENTITY'],[(p:any)=>p.scenarios.push(structuredClone(p.scenarios[0])),'SAP_DUPLICATE_IDENTITY'],
  [(p:any)=>Object.assign(p.metrics.find((m:any)=>m.name==='uv'),{provenance:{origin:'llm',model:'synthetic',prompt_version:'1.0'},review:{required:true}}),'SAP_UNREVIEWED']
 ] as const){const [b,i]=changed(change);assert.throws(()=>inspectSemanticAsset(b,i),{code});}
 const index=YAML.parse(registry.toString());index.releases.push(structuredClone(index.releases.find((r:any)=>r.version==='1.1.0')));assert.throws(()=>inspectSemanticAsset(release('1.1.0'),Buffer.from(YAML.stringify(index))),{code:'SAP_REGISTRY_CONFLICT'});
});
test('MFC-01: duplicate YAML keys, aliases, tags and non-UTF8 never produce a candidate',()=>{
 for(const b of [Buffer.from('sap: "0.1"\nsap: "0.1"\n'),Buffer.from('a: &x 1\nb: *x\n'),Buffer.from('a: !execute 1\n'),Buffer.from([0xff,0xfe])])assert.throws(()=>inspectSemanticAsset(b,registry));
});
test('MFC-02: unsafe/cyclic/dangling selected formula cannot be approved even in a legally re-fingerprinted package',()=>{
 for(const expr of ['net_sales + gmv','gmv - missing_metric','gmv.constructor()','gmv ** 2','gmv * refund_amount']){const [b,i]=changed(p=>p.metrics.find((m:any)=>m.name==='net_sales').type_params.expr=expr);const r=inspectSemanticAsset(b,i);assert.equal(r.status,'candidate');assert.equal(r.computability.usable,false,expr);}
});
