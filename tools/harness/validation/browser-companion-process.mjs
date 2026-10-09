/** Host-driver receipt bound immediately after launch, before any quit action. */
export function observeCompanion(app) {
 const child=app.process();
 const exited=new Promise(resolve=>{
  child.once('exit',(code,signal)=>resolve({code,signal}));
  child.once('error',error=>resolve({code:null,signal:null,error:error.message}));
  if(child.exitCode!==null||child.signalCode!==null)resolve({code:child.exitCode,signal:child.signalCode});
 });
 return {child,exited,async cleanup(){
  if(child.exitCode!==null||child.signalCode!==null)return;
  try{await app.close();}catch{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');}
  await exited;
 }};
}

/** Normalize only the SQLite row prototype; preserve every field and value. */
export const snapshotSqliteRows=rows=>rows.map(row=>({...row}));
