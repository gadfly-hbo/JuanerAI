import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {createMemberSourcePreparation} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import {fixtureZip,fixtureWorksheet} from '../../fixtures/xanthil-desktop/browser-sources.ts';
import {readDesktopPythonTool} from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function workbook(target:string,mode='Internal'){
 return fixtureZip([
  ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'],
  ['xl/workbook.xml',`<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets><sheet name="Data" sheetId="1" r:id="sheet1"/></sheets></workbook>`],
  ['xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="sheet1" Type="${rel}/worksheet" Target="${target}" TargetMode="${mode}"/></Relationships>`],
  ['xl/worksheets/sheet1.xml',fixtureWorksheet([['label','value'],['synthetic','12']])],
 ]);
}
async function inspect(target:string,mode='Internal'){
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN;
 assert.ok(bin,'explicit local toolchain required');
 return createMemberSourcePreparation(readDesktopPythonTool(bin)).inspectSources({sources:[{source_id:randomUUID(),display_name:'synthetic.xlsx',format:'xlsx',bytes:workbook(target,mode)}],cancellation_signal:new AbortController().signal,deadline_seconds:10});
}
test('XLSX-ROOT-01: package-root worksheet targets preserve the same cells as relative targets',async()=>{
 const relative=await inspect('worksheets/sheet1.xml');
 const rooted=await inspect('/xl/worksheets/sheet1.xml');
 assert.deepEqual(rooted.sources[0].sheets,relative.sources[0].sheets);
 assert.equal(rooted.sources[0].sheets[0].rows[1].cells[1].value,'12');
});
test('XLSX-ROOT-02: unsafe, missing, external and ambiguous relationship targets remain rejected',async t=>{
 for(const target of ['//host/sheet.xml','/xl/../worksheets/sheet1.xml','../worksheets/sheet1.xml','/xl/./worksheets/sheet1.xml','/xl//worksheets/sheet1.xml','/xl/worksheets/missing.xml','/xl/worksheets/sheet1.xml#part','/xl/worksheets/sheet1.xml?x=1','/xl/%2e%2e/sheet.xml','file:///etc/passwd','https://example.invalid/sheet.xml','C:/sheet.xml','xl\\worksheets\\sheet1.xml','']){
  await t.test(target||'empty',()=>assert.rejects(()=>inspect(target),{code:'SOURCE_ARCHIVE_INVALID'}));
 }
 await t.test('external rooted target',()=>assert.rejects(()=>inspect('/xl/worksheets/sheet1.xml','External'),{code:'SOURCE_EXTERNAL_REFERENCE'}));
});
