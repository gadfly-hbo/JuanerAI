import {DatabaseSync} from 'node:sqlite';
import {readFileSync,lstatSync,realpathSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
/** Fixed upstream view functions are injected by composition; this path never opens a writable DB. */
export function createDecisionHistoryReader(config:{dataRoot:string;sourceCommit:string;board(db:DatabaseSync,projectId:string):unknown;projects(db:DatabaseSync):unknown}){
 function read<T>(work:(db:DatabaseSync)=>T):T{
  const root=config.dataRoot;if(realpathSync(root)!==resolve(root))throw Error('DP_DATA_ROOT');
  const marker=join(root,'.host-identity.json'),file=join(root,'board.db');
  for(const p of [marker,file,...[file+'-wal',file+'-shm'].filter(existsSync)]){const stat=lstatSync(p);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)throw Error('DP_DATA_ROOT');}
  const identity=JSON.parse(readFileSync(marker,'utf8'));if(identity.format!=='juanerai-decision-platform-data-v1'||identity.sourceCommit!==config.sourceCommit)throw Error('DP_DATA_ROOT');
  const db=new DatabaseSync(file,{readOnly:true});try{return work(db);}finally{db.close();}
 }
 return {board:(id:string)=>{if(!/^[a-f0-9-]{36}$/.test(id))throw Error('DP_PROJECT_INVALID');return read(db=>config.board(db,id));},projects:()=>read(config.projects)};
}
