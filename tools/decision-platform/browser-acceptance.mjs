// Actual browser seam. Run from the supported CUA Chrome session, never a substitute driver.
// Approval:006r1 UI Gate; DP07/DUI03; F-UI-FOCUS-018 correction.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkPresentationExitFocus(tab,{exit='escape',evidenceDir}){
 const entry=tab.playwright.getByRole('button',{name:'进入汇报模式',exact:true});
 await entry.click();
 const region=tab.playwright.getByRole('region',{name:'汇报模式',exact:true});
 await region.waitFor({state:'visible',timeoutMs:10000});
 if(exit==='button')await tab.playwright.getByRole('button',{name:'退出汇报 · Esc',exact:true}).click();
 else await region.press('Escape');
 await region.waitFor({state:'hidden',timeoutMs:10000});
 await writeFile(join(evidenceDir,'focus-'+exit+'.png'),await tab.screenshot({fullPage:true}));
 const actual=await entry.evaluate(el=>({focusReturned:document.activeElement===el,activeTag:document.activeElement?.tagName,entryDisabled:el.disabled,backgroundInert:!!el.closest('[inert]')}));
 await writeFile(join(evidenceDir,'focus-'+exit+'.json'),JSON.stringify(actual,null,2));
 assert.equal(actual.backgroundInert,false,'board background must become interactive');
 assert.equal(actual.entryDisabled,false,'idle entry must be available');
 assert.equal(actual.focusReturned,true,'exit must return focus to the presentation entry');
 return actual;
}

export async function checkUnknownUploadBlocked(tab,{evidenceDir}){
 const actual={
  unknownVisible:await tab.playwright.getByRole('heading',{name:'原操作结果未知',exact:true}).isVisible(),
  uploadEnabled:await tab.playwright.getByRole('button',{name:'允许并抽取',exact:true}).isEnabled(),
 };
 await writeFile(join(evidenceDir,'unknown-upload.json'),JSON.stringify(actual,null,2));
 assert.equal(actual.unknownVisible,true,'exercise an actual unknown host operation');
 assert.equal(actual.uploadEnabled,false,'UNKNOWN must pause upload admission in the open dialog');
 return actual;
}

// DUI02/06, DP02: exercise the real report-filter consumer, including version disambiguation.
export async function checkReportSourceLabels(tab,{expected,evidenceDir}){
 const actual=await tab.playwright.getByRole('group',{name:'报告',exact:true}).innerText();
 await writeFile(join(evidenceDir,'report-source-labels.json'),JSON.stringify({expected,actual},null,2));
 await writeFile(join(evidenceDir,'report-source-labels.png'),await tab.screenshot({fullPage:true}));
 for(const label of expected)assert.ok(actual.includes(label),'report filter must identify original filename and revision: '+label);
 assert.doesNotMatch(actual,/source-[0-9a-f]{8}-/,'physical filenames must not replace host source labels');
 return actual;
}
