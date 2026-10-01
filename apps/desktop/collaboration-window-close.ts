/** Main-owned close ordering, shared by the root window and its child windows. */
export function installCollaborationClose(window:{on(event:'close',listener:(event:{preventDefault():void})=>void):unknown;close():void},work:{hasWork():boolean;confirm():Promise<boolean>;persist():Promise<unknown>;afterPersist():void;failed():Promise<unknown>}){
 let closing=false,committed=false;
 window.on('close',event=>{
  if(committed)return;
  event.preventDefault();if(closing)return;closing=true;
  void(async()=>{
   try{
    if(work.hasWork()&&!await work.confirm())return;
    await work.persist();work.afterPersist();committed=true;window.close();
   }catch{await work.failed();}finally{closing=false;}
  })();
 });
 return ()=>committed;
}
