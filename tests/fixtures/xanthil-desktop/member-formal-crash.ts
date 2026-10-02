// Owned synthetic subprocess only; no Provider, native app, or external service.
import {readFileSync} from 'node:fs';
import {createLocalMembershipTaskStore} from '../../../adapters/storage-local/member-task.ts';
const [root,inputPath,point]=process.argv.slice(2);
const input=JSON.parse(readFileSync(inputPath,'utf8'));
const store=createLocalMembershipTaskStore(root,{formalFault(at,db){if(at==='transaction_started'){db.exec('PRAGMA main.cache_size=1;PRAGMA assistant.cache_size=1');process.stdout.write(JSON.stringify({synthetic_cache_pages:1,journal:'DELETE',sync:'FULL'})+'\n');}if(at===point){process.stdout.write(JSON.stringify({at,pid:process.pid})+'\n');process.kill(process.pid,'SIGKILL');}}});
try{const result=await store.submitReview(input);process.stdout.write(JSON.stringify({receipt:result.review_receipts.at(-1)})+'\n');}catch(error){process.stderr.write(String(error)+'\n');process.exitCode=1;}
