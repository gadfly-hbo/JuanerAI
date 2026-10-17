import {createRequire} from 'node:module';
import {resolve} from 'node:path';
// Explicit command-local tool paths; no install or package-manager side effects.
const require=createRequire(import.meta.url),check=process.argv[2]==='--check';
const [esbuildPath,dependencyRoot]=check?[require.resolve('esbuild'),resolve('node_modules')]:process.argv.slice(2);if(!esbuildPath||!dependencyRoot)throw Error('usage: build-ui.mjs /absolute/esbuild /absolute/node_modules, or --check');
const esbuild=require(resolve(esbuildPath));
await esbuild.build({entryPoints:['apps/browser/decision-platform/board.tsx'],outfile:'apps/browser/decision-platform/board.js',bundle:true,write:!check,format:'esm',platform:'browser',jsx:'automatic',nodePaths:[resolve(dependencyRoot)],minify:true,legalComments:'eof',define:{'process.env.NODE_ENV':'"production"'}});
