// Two bounded synthetic probes of the fixed supplier test helper, not its test suite.
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const source=readFileSync(new URL('../attachments/metric-factory-1.1/test/unit/net-sales-oracle.test.ts',import.meta.url),'utf8');
const start=source.indexOf('class BlockError'), end=source.indexOf('// ---------- 固定合成数据');
if(start<0||end<start)throw new Error('Fixed helper boundary missing');
const js=stripTypeScriptTypes(source.slice(start,end),{mode:'transform'});
const context=vm.createContext({});
vm.runInContext(js,context,{timeout:1000});
const paid={order_id:'CURRENT',status:'paid',paid_at:'2026-09-05T00:00:00Z',amount:100,currency:'CNY',category:'a'};
const past={order_id:'HIST',status:'paid',paid_at:'2026-08-05T00:00:00Z',amount:100,currency:'USD',category:'a'};
const refund={refund_id:'R',order_id:'HIST',status:'completed',completed_at:'2026-09-06T00:00:00Z',amount:30,currency:'USD'};
const invalid={order_id:'UNPAID',status:'created',amount:100,currency:'CNY',category:'a'};
function probe(records) {
  context.records=records;
  try{return {accepted:true,rows:vm.runInContext('[...computeSeries(records,[{label:"P",start:"2026-09-01T00:00:00Z",end:"2026-10-01T00:00:00Z"}],{attribution:"completion",cutoff:"2026-10-01T00:00:00Z"}).values()]',context,{timeout:1000})};}
  catch(e){return {accepted:false,code:e.code};}
}
console.log(JSON.stringify({kind:'SUPPLIER_ORACLE_REFERENCE_LIMITATIONS',scope:'Two synthetic in-memory negative probes of the fixed test helper; no original test suite or consumer execution',probes:{cross_component_currencies:probe({orders:[paid,past],refunds:[refund]}),completed_refund_of_unqualified_order:probe({orders:[paid,invalid],refunds:[{...refund,order_id:'UNPAID',currency:'CNY'}]})}},null,2));
