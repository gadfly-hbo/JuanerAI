import assert from 'node:assert/strict';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

// Fixed Main resources only. No environment path, directory scanning or source
// checkout dependency in the built application.
const files=['adapters/analytics-duckdb/member-preparation-supervisor.py','apps/browser/index.html','apps/browser/bootstrap.mjs','apps/browser/workspace.mjs','apps/browser/client.mjs','apps/browser/styles.css','apps/desktop/assets/juanerai-logo-slogan.png'];
const modules=['adapters/analytics-duckdb/member-preparation-executor.ts','apps/browser/local-server.ts'];
export function desktopRuntimeResources(){
 const seen=new Set(),root=resolve('.');let active=true;
 return {name:'xanthil-fixed-runtime-resources',enforce:'pre',
  configResolved(config){active=typeof config.build.lib?.entry==='string'&&resolve(root,config.build.lib.entry)===resolve(root,'apps/desktop/main.ts');},
  buildStart(){seen.clear();},
  transform(code,id){if(!active)return;const module=modules.find(path=>resolve(root,path)===id);if(!module)return;
   assert.ok(!seen.has(module),'duplicate resource module');assert.equal(code.split('import.meta.url').length-1,1,'resource module URL shape changed');seen.add(module);
   const prefix=`import {app as __xanthilResourceApp} from 'electron';\nimport {pathToFileURL as __xanthilResourceFileURL} from 'node:url';\nimport {join as __xanthilResourceJoin} from 'node:path';\nconst __xanthilResourceModuleUrl=__xanthilResourceFileURL(__xanthilResourceJoin(__xanthilResourceApp.isPackaged?process.resourcesPath:__dirname,'xanthil-resources',${JSON.stringify(module)})).href;\n`;
   return {code:prefix+code.replace('import.meta.url','__xanthilResourceModuleUrl'),map:null};
  },
  generateBundle(_options,bundle){if(!active)return;assert.equal(seen.size,modules.length,'missing runtime resource consumer');const manifest=[];
   for(const path of files){const file=resolve(root,path),stat=lstatSync(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'resource must be a regular fixed source');const source=readFileSync(file),fileName='xanthil-resources/'+path;assert.ok(!bundle[fileName],'duplicate runtime resource');manifest.push({path,bytes:source.length,sha256:createHash('sha256').update(source).digest('hex')});this.emitFile({type:'asset',fileName,source});}
   assert.ok(!bundle['xanthil-resources/manifest.json']);this.emitFile({type:'asset',fileName:'xanthil-resources/manifest.json',source:JSON.stringify({version:'1.0',files:manifest},null,2)+'\n'});
  }
 };
}
