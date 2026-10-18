import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,mkdirSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {verifyResearchBundle,sha256,SOURCE_COMMIT} from '../../../adapters/deep-research/bundle.mjs';
test('DR C01: malformed, altered, linked and unlisted executable resources fail before use',()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-manifest-')));
 const files=['node','child.mjs','server.mjs','runtime.mjs','mcp-entry.py','mcp-identity.json','dist/server/routes/projectsRuns.js','ui-dist/plugin.js','ui-dist/plugin.css','THIRD-PARTY-NOTICES.txt'].map(path=>{mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),'synthetic');return {path,bytes:9,sha256:sha256('synthetic')};});
 const manifest=JSON.stringify({version:1,commit:SOURCE_COMMIT,files});writeFileSync(join(root,'manifest.json'),manifest);const hash=sha256(manifest);
 assert.equal(verifyResearchBundle(root,hash).commit,SOURCE_COMMIT);assert.throws(()=>verifyResearchBundle(root,'0'.repeat(64)),/MISMATCH/);
 writeFileSync(join(root,'extra.mjs'),'unexpected');assert.throws(()=>verifyResearchBundle(root,hash),/UNLISTED/);
 writeFileSync(join(root,'node'),'bad');assert.throws(()=>verifyResearchBundle(root,hash),/BYTES_MISMATCH/);
 const linked=realpathSync(mkdtempSync(join(tmpdir(),'dr-link-')));symlinkSync(join(root,'manifest.json'),join(linked,'manifest.json'));assert.throws(()=>verifyResearchBundle(linked,hash),/INVALID/);
});
