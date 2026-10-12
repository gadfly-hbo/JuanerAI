import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {encodeTask,taskHash} from '../../../packages/product-core/member-task.ts';

// Retained pre-AC116 ordering is the persisted byte compatibility oracle.
function original(value:unknown):string{
 const normalize=(v:unknown):unknown=>{
  if(Array.isArray(v))return v.map(normalize);
  if(v!==null&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort((a,b)=>{
   const x=Array.from(a,c=>c.codePointAt(0)!),y=Array.from(b,c=>c.codePointAt(0)!);
   for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];
   return x.length-y.length;
  }).map(k=>[k,normalize(Reflect.get(v,k))]));
  return v;
 };return JSON.stringify(normalize(value));
}
test('AC116: Unicode keys and nested values retain exact historical bytes and SHA',()=>{
 const keys=['z','a','aa','10','2','','\uE000','\u{10000}','\u{1F600}','\uD800','\uDC00','a\u{10000}','a\uE000','金额','金额单位'];
 for(let shift=0;shift<keys.length;shift++){
  const rotated=[...keys.slice(shift),...keys.slice(0,shift)];
  const value={history:Array.from({length:20},(_,revision)=>Object.fromEntries(rotated.map((key,i)=>[key,[revision,{value:i,unit:'人民币元'},null,true]])))};
  const expected=original(value);assert.equal(encodeTask(value),expected);
  assert.equal(taskHash(value),createHash('sha256').update(expected).digest('hex'));
 }
});
test('AC116: changed values are freshly encoded and unsupported inputs remain rejected',()=>{
 const value={a:{amount:10},history:[{amount:9}]};const old=taskHash(value);value.a.amount=11;
 assert.notEqual(taskHash(value),old);assert.equal(encodeTask(value),original(value));
 for(const invalid of [undefined,NaN,Infinity,1.5,9007199254740992,1n,()=>1,new Date(),Object.create(null),{a:undefined},{a:1.5}])assert.throws(()=>encodeTask(invalid));
});
