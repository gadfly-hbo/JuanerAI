// Planning prototype checks only. No browser, Provider, product service, storage or calculation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const checks=[];
function check(name,fn){fn();checks.push(name);}
const docElements=new Map();let doc;
function element(id,dataset={}){
  return {id,dataset,innerHTML:'',textContent:'',value:'',hidden:id==='drawer',isConnected:true,inert:false,attributes:{},listeners:{},
    classList:{toggle(){}},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},
    addEventListener(k,f){this.listeners[k]=f;},focus(){doc.activeElement=this;},querySelectorAll(){return []}};
}
doc={activeElement:null,listeners:{},getElementById(id){if(!docElements.has(id))docElements.set(id,element(id));return docElements.get(id);},
  querySelector(q){return this.getElementById(q);},querySelectorAll(q){return q==='[data-stage]'?stages:q==='[data-tab]'?tabs:[];},addEventListener(k,f){this.listeners[k]=f;}};
const stages=Array.from({length:6},(_,i)=>element('stage'+(i+1),{stage:String(i+1)}));
const tabs=['meaning','plan','materials','evidence','execution'].map(n=>element('tab-'+n,{tab:n}));
for(const t of tabs)docElements.set(t.id,t);
const win={matchMedia(){return {matches:false};},addEventListener(){}};
const ctx=vm.createContext({document:doc,window:win,structuredClone});
vm.runInContext(fs.readFileSync(path.join(root,'clickable/authority.js'),'utf8'),ctx);
const api=ctx.change007DeliveryPreview,$=id=>doc.getElementById(id);
function action(a,extra={}){$('thread').listeners.click({target:{closest(){return {dataset:{action:a,...extra}};}}});}
check('完整B保留核对主行动、解释和原成本',()=>{assert($('thread').innerHTML.includes('核对所选退款与订单归属'));assert($('thread').innerHTML.includes('没有证明退款与订单一一匹配'));assert($('thread').innerHTML.includes('≤200 元'));});
check('附加动作不拼入正式样例或导出预览',()=>{api.reset('extra');action('export');assert(!$('thread').innerHTML.includes('立即扩大促销。'));assert($('thread').innerHTML.includes('核对所选退款与订单归属'));});
check('原稿原句可查但无选择入口',()=>{action('source');assert($('detail').innerHTML.includes('立即扩大促销。'));assert(!$('detail').innerHTML.includes('data-action="choose"'));assert($('detail').innerHTML.includes('不是正式成果'));});
check('关闭来源不改变正式资格',()=>{api.closeDrawer();assert.equal($('drawer').hidden,true);});
check('必需内容缺失不能用来源补成完成',()=>{api.reset('gap');action('source');api.closeDrawer();action('choose');action('export');assert.equal(api.state.selected,false);assert($('thread').innerHTML.includes('尚未完整交付'));});
check('能安排必须先重审才可选',()=>{api.reset('conditional');action('answer',{answer:'yes'});assert.equal(api.state.data.phase,'reviewing');action('choose');assert.equal(api.state.selected,false);$('advance').listeners.click();action('choose');assert.equal(api.state.selected,true);});
check('不能安排是冲突且不可选',()=>{api.reset('conditional');action('answer',{answer:'no'});$('advance').listeners.click();action('choose');action('report');assert.equal(api.state.selected,false);assert($('thread').innerHTML.includes('存在冲突'));assert(!$('thread').innerHTML.includes('有条件支持 · 时间待确认'));});
check('R2：已答未知后问题实际收起而非仅播报',()=>{api.reset('conditional');assert($('thread').innerHTML.includes('品类A负责人能在未来3天安排2小时核对吗？'));action('answer',{answer:'unknown'});assert.equal(api.state.data.answeredUnknown,true);assert(!$('thread').innerHTML.includes('品类A负责人能在未来3天安排2小时核对吗？'));assert(!$('thread').innerHTML.includes('data-answer="unknown"'));assert($('thread').innerHTML.includes('你已表示时间仍未知'));assert($('thread').innerHTML.includes('补证／暂缓'));assert.equal(api.state.data.ready,false);});
check('R2：用户主动更新才重新展开问题',()=>{action('update-time');assert.equal(api.state.data.answeredUnknown,false);assert($('thread').innerHTML.includes('品类A负责人能在未来3天安排2小时核对吗？'));assert.equal(api.state.data.ready,false);});
check('新期间无旧数值或当前建议资格',()=>{api.reset('material');action('report');assert(!$('thread').innerHTML.includes('240元'));assert(!$('thread').innerHTML.includes('当前可选择的具体建议'));assert($('thread').innerHTML.includes('尚未导入'));});
check('已有上限等义表达保留正确完整建议',()=>{api.reset('cost');action('cost');action('report');assert($('thread').innerHTML.includes('费用不超过200元'));assert(api.state.data.ready);action('cost');assert($('thread').innerHTML.includes('≤200 元'));});
check('A可决策示例有独立的自然内容',()=>{api.reset('sales');action('report');assert($('thread').innerHTML.includes('品类B增加'));assert($('thread').innerHTML.includes('核查退货原因'));assert(!$('thread').innerHTML.includes('退款与订单归属'));});
check('失败或需重审不发布本版建议资格',()=>{for(const n of ['failed','stale']){api.reset(n);action('choose');action('report');assert.equal(api.state.selected,false);assert(!$('thread').innerHTML.includes('当前可选择的具体建议'));}});
check('专业第6阶段共享同版人的下一步',()=>{api.reset('complete');$('professional').listeners.click();stages[5].listeners.click();assert($('thread').innerHTML.includes('人的下一步 · 同版内容'));});
check('自然输入仅安全显示不执行',()=>{$('message').value='<img src=x onerror=alert(1)>';const before=api.state.scene;$('composer').listeners.submit({preventDefault(){}});assert($('thread').innerHTML.includes('&lt;img'));assert.equal(api.state.scene,before);});
check('合成停止后不产生新建议资格',()=>{api.reset('complete');$('stop').listeners.click();action('choose');action('report');assert.equal(api.state.selected,false);assert(!$('thread').innerHTML.includes('当前可选择的具体建议'));});
let references=0;
check('本候选相对引用可取得',()=>{for(const file of ['product-addendum-v0.1.md','ui-addendum-v0.1.md','acceptance-basis.md','verification.md','clickable/index.html']){const s=fs.readFileSync(path.join(root,file),'utf8');const refs=file.endsWith('.html')?[...s.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]):[...s.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]);for(const ref of refs){if(/^(?:[a-z]+:|#)/i.test(ref))continue;assert(fs.existsSync(path.resolve(root,path.dirname(file),ref.split(/[?#]/)[0])),file+': '+ref);references++;}}});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
let bodies=0;
check('R1：既有协议、标准与合成输入逐字节保持',()=>{const bundle=JSON.parse(fs.readFileSync(path.join(root,'attachments/formal-acceptance-originals.json'),'utf8'));for(const f of bundle.files){const b=Buffer.from(f.content_utf8,'utf8');assert.equal(b.length,f.bytes,f.key);assert.equal(digest(b),f.sha256,f.key);bodies++;}const p=bundle.files.find(f=>f.key==='formal001/protocol001.json');assert.equal(p.sha256,'bd04da6bfae168f5ba4aa781fb302960fdd7a4f83aba113141c7f26c887d1a65');assert.equal(JSON.parse(p.content_utf8).cases.length,12);});
let originalFiles=0;
check('原007冻结33项输入未改变',()=>{const old=path.resolve(root,'../../2026-10-13/change007-conclusion-strategy-review');const frozen=JSON.parse(fs.readFileSync(path.join(old,'frozen-inputs-2026-10-13.json'),'utf8'));for(const f of frozen.files){const b=fs.readFileSync(path.join(old,f.path));assert.equal(b.length,f.bytes,f.path);assert.equal(digest(b),f.sha256,f.path);originalFiles++;}});
console.log(JSON.stringify({kind:'STATIC_AND_MOCK_DOM_ONLY_NOT_BROWSER_OR_PRODUCT',checksPassed:checks.length,checks,relativeReferences:references,exactHistoricalSourceBodies:bodies,frozenOriginalsUnchanged:originalFiles,browser:'NOT_RUN: file URL security policy',providerCalls:false},null,2));
