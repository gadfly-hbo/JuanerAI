// Read-only planning diagnostic, not a SAP consumer or production test.
// Supply the path of an already-installed yaml module; no install or network.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {strict as assert} from 'node:assert';
import {packageFingerprint, contentFingerprint} from '../attachments/metric-factory/src/sap/canonical.ts';
const {parseDocument} = await import(pathToFileURL(process.argv[2]).href);
const supplier = process.argv[3]; // Optional, explicitly supplied read-only Git source.
const root = fileURLToPath(new URL('../', import.meta.url));
const commit = '8f47913c954f5650c8718a341add9feeea50d5d0';
const oldCommit = 'a7c08185ee1691e641011b53d5bb87374d0b5b89';
const tree = '47672b4110444190afecbfdc841d26bfa301ee76';
const paths = ['releases/net-sales-instance/1.1.0.sap.yaml', 'releases/net-sales-instance/1.1.1.sap.yaml', 'releases/index.yaml', 'docs/net-sales-method-refs-v0.1.md', 'docs/sap-consumption-guide.md', 'examples/net-sales-instance.yaml', 'test/unit/net-sales-oracle.test.ts'];
const git = (...args) => execFileSync('git', ['-C', supplier, ...args]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const blob = bytes => createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const bytes = path => readFileSync(resolve(root, path));
const parse = path => {const doc = parseDocument(bytes(path).toString('utf8'), {uniqueKeys:true}); assert.equal(doc.errors.length, 0); return doc.toJS({maxAliasCount:0});};
if (supplier) assert.equal(git('rev-parse', commit+'^{tree}').toString().trim(), tree);
const attachments = paths.map(path => {
  const localPath = 'attachments/metric-factory-1.1/'+path;
  const b = bytes(localPath);
  if (supplier) assert.ok(b.equals(git('show', commit+':'+path)), path+' copy mismatch');
  return {source_path:path, local_path:localPath, bytes:b.length, sha256:sha(b), git_blob:blob(b), byte_identical_to_fixed_source:supplier?true:null};
});
const expected = [
  ['1.1.0',42363,'5fec3d3f9695b690066b397b79f25d80aa6d649b845dd842482ced340cd13363','902cb8a7d9960fa3ef3d634fe752e28d42ebd118'],
  ['1.1.1',42364,'5a926e16240b1a10828967d91544d06df5dc1f57c52971299c20e2e5637fa67e','5bbed6284acd4fe8265246855982c362e29dcbde']
];
for (const [v,n,h,b] of expected) {const a=attachments.find(x=>x.source_path.endsWith(v+'.sap.yaml')); assert.deepEqual([a.bytes,a.sha256,a.git_blob],[n,h,b]);}
const index = parse('attachments/metric-factory-1.1/releases/index.yaml');
const oldIndex = parse('attachments/metric-factory/releases/index.yaml');
assert.deepEqual(index.releases.slice(0,2), oldIndex.releases);
assert.equal(index.releases.length,4);
const closure = ['gmv','order_count','refund_amount','net_sales','refunded_order_count','refund_rate'];
const snapshots = expected.map(([v])=>parse('attachments/metric-factory-1.1/releases/net-sales-instance/'+v+'.sap.yaml'));
const packages = snapshots.map((p,i)=>{
  const v=expected[i][0], by=new Map(p.metrics.map(m=>[m.name,m]));
  assert.equal(p.sap,'0.1'); assert.equal(p.runtime_state,'design_only'); assert.equal(p.package.kind,'instance'); assert.equal(p.package.version,v);
  assert.equal(p.package.id,'net-sales-instance'); assert.equal(p.bindings.length,0); assert.equal(p.review.unreviewed.length,0);
  assert.equal(by.size,p.metrics.length); assert.equal(p.metrics.length,56);
  const visiting=new Set(), done=new Set(), deps={};
  for(const name of closure) {
    const m=by.get(name); assert.ok(m); assert.ok(m.dimensions.includes('category')); assert.ok(m.time_grains.includes('week'));
    const tp=m.type_params??{}; deps[name]=[tp.measure,tp.numerator,tp.denominator,...(tp.expr?.match(/[a-z_][a-z0-9_]*/g)??[])].filter(Boolean);
    for(const d of deps[name]) assert.ok(closure.includes(d), name+' outside closure: '+d);
  }
  function visit(n) {assert.ok(!visiting.has(n),'cycle: '+n); if(done.has(n))return; visiting.add(n); for(const d of deps[n])visit(d); visiting.delete(n);done.add(n);}
  for(const n of closure)visit(n);
  assert.equal(by.get('gmv').type,'simple'); assert.equal(by.get('gmv').type_params,undefined); assert.equal(by.get('gmv').caliber_switches.include_refund,true);
  assert.equal(by.get('order_count').caliber_switches.include_refund,true); assert.equal(by.get('net_sales').type_params.expr,'gmv - refund_amount');
  assert.deepEqual(by.get('refund_rate').type_params,{denominator:'order_count',numerator:'refunded_order_count'});
  assert.equal(by.get('refund_rate').aggregation.ratio_policy,'recompute_from_parts'); assert.equal(by.get('refund_amount').caliber_switches.include_pending_refund,false);
  assert.equal(by.get('refund_amount').caliber_switches.refund_to_payment_period,i===0);
  const scene=p.scenarios.find(s=>s.id==='net_sales_review'); assert.equal(scene.version,'0.2.0');
  assert.deepEqual(scene.method_refs,['dame.descriptive_delta_decomposition@0.1.0']);
  const method=bytes('attachments/metric-factory-1.1/docs/net-sales-method-refs-v0.1.md').toString(); assert.ok(method.includes(scene.method_refs[0]));
  assert.ok(scene.evidence_requirements.includes('13 周')); assert.ok(scene.evidence_requirements.includes('category')); assert.ok(scene.output_spec.includes('受限'));
  const pf=packageFingerprint(p), cf=contentFingerprint(p), entry=index.releases.find(e=>e.package===p.package.id&&e.version===v);
  assert.equal(pf,p.package.fingerprint); assert.equal(pf,entry.package_fingerprint); assert.equal(cf,entry.content_fingerprint); assert.equal(entry.file,'net-sales-instance/'+v+'.sap.yaml');
  return {id:p.package.id,version:v,package_fingerprint:pf,content_fingerprint:cf,generator:p.package.generator,metrics:p.metrics.length,scenarios:p.scenarios.length,bindings:p.bindings.length,selected_closure:closure,unselected_metric_count:p.metrics.length-closure.length,dependencies:deps,scenario:scene.id+'@'+scene.version,method:scene.method_refs[0]};
});
const diffs=[];
function walk(a,b,path='') {if(Object.is(a,b))return; if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[k],b[k],path?path+'.'+k:k);}else diffs.push({path,from:a??null,to:b??null});}
walk(snapshots[0],snapshots[1]);
const businessDiffs=diffs.filter(d=>!['package.version','package.created_at','package.fingerprint','review.exported_at'].includes(d.path));
assert.deepEqual(businessDiffs,[{path:'metrics.'+snapshots[0].metrics.findIndex(m=>m.name==='refund_amount')+'.caliber_switches.refund_to_payment_period',from:true,to:false}]);
const unchanged=[];
const original=JSON.parse(bytes('source-readback.json'));
for(const a of original.attachments) {
  const b=bytes(a.local_path); assert.equal(sha(b),a.sha256); assert.equal(b.length,a.bytes);
  if(supplier && !['docs/sap-consumption-guide.md','releases/index.yaml'].includes(a.source_path)) {assert.ok(b.equals(git('show',commit+':'+a.source_path))); unchanged.push(a.source_path);}
}
if(supplier)for(const v of ['1.0.0','1.0.1'])assert.ok(git('show',commit+':releases/net-sales-instance/'+v+'.sap.yaml').equals(git('show',oldCommit+':releases/net-sales-instance/'+v+'.sap.yaml')));
console.log(JSON.stringify({kind:'READ_ONLY_SUPPLIER_IDENTITY_AND_SELECTED_CLOSURE_CHECK',prepared_on:'2026-10-13',consumer_baseline:'4df7604621fff2c8ec27281d59cf4a788deae47b',supplier_commit:commit,supplier_tree:tree,source_mode:'fixed_git_objects_only',attachments,packages,pair_full_diff:diffs,pair_business_diff:businessDiffs,old_release_bytes_preserved:true,old_first_two_registry_entries_preserved:true,original_11_attachments_preserved:true,old_authority_sources_unchanged_at_new_commit:unchanged,diagnostic:'PASS',limits:['No supplier test/CLI or consumer execution','No complete producer schema validation rerun','No IR/compute/independent consumer verification','No Provider, real data, service or Git mutation'],supplier_count_correction:'56 total minus 6 selected equals 50 unselected, not the handoff stated 49'},null,2));
