// Trusted composition only. No HTTP/config surface and no automatic content logging.
import type {Tool,JsonValue} from 'pi-agent-runtime';

type Context={name:string;args:JsonValue;signal:AbortSignal;stop():void};
export type ToolExecutionObserver={
 before?(context:Context):void|Promise<void>;
 after?(context:Context&{outcome:{kind:'returned';value:JsonValue}|{kind:'threw';error:unknown}}):void|Promise<void>;
};

/** Wrap after supplier soft-error conversion, before the SDK captures executors. */
export function observeToolExecutions(tools:Tool[],observer:ToolExecutionObserver|undefined,stop:()=>void):Tool[] {
 if(!observer)return tools;
 return tools.map(tool=>({...tool,async execute(args,signal,invocation){
  const context={name:tool.name,args,signal,stop};
  try{await observer.before?.(context);signal.throwIfAborted();}
  catch(error){stop();throw error;}
  let value:JsonValue;
  try{value=await tool.execute(args,signal,invocation);}
  catch(error){
   try{await observer.after?.({...context,outcome:{kind:'threw',error}});}
   catch{stop();} // Preserve the original execution error if both fail.
   throw error;
  }
  try{await observer.after?.({...context,outcome:{kind:'returned',value}});}
  catch(error){stop();throw error;}
  return value;
 }}));
}
