import {taskHash} from '../../packages/product-core/member-task.ts';
import type {AnalysisTool} from '../../packages/ports/open-analysis-runtime.ts';

export type AnalysisToolContract=AnalysisTool&Readonly<{
  contract_sha256:string;
  argument_policy:'strict-v1'|'native-pi-v1';
}>;

function freeze<T>(value:T):T {
  if(value&&typeof value==='object'){
    for(const child of Object.values(value))freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Capture the real Application definitions without executing or preparing any
 * arguments. This product-owned view is ready for the delivered SDK stage seam;
 * it does not implement that seam or its batch/feedback/stop mechanisms. */
export function captureAnalysisToolContracts(tools:readonly AnalysisTool[],approvedNativePreparation=false):readonly AnalysisToolContract[] {
  const names=new Set<string>();
  return Object.freeze(tools.map(tool=>{
    if(names.has(tool.name)||!tool.name||typeof tool.execute!=='function'){
      throw Object.assign(new Error('TOOL_POLICY_VIOLATION'),{code:'TOOL_POLICY_VIOLATION'});
    }
    names.add(tool.name);
    const parameters=freeze(structuredClone(tool.parameters));
    const modelParameters=tool.modelParameters?freeze(structuredClone(tool.modelParameters)):undefined;
    // Only the already approved interpretation repair accepts native coercion.
    // Other tools still have their exact strict acceptance policy.
    const argument_policy=approvedNativePreparation&&tool.name==='interpret_meaning'?'native-pi-v1':'strict-v1';
    const contract_sha256=taskHash({version:'juanerai-analysis-tools-v1',name:tool.name,
      description:tool.description,parameters,model_parameters:modelParameters??parameters,argument_policy});
    return Object.freeze({...tool,parameters,...modelParameters?{modelParameters}:{},argument_policy,contract_sha256});
  }));
}
