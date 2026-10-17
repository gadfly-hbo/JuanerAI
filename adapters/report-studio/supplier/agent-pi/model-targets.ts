import {MINIMAX_M3,MIMO_FLASH} from './model.js';
/** Public descriptions only: never returns SDK configuration or credentials. */
export function builtinModelTargets(providers:readonly string[]):readonly {provider:string;model:string;endpoint:string;purposes:readonly string[]}[] {
 return [MINIMAX_M3,MIMO_FLASH].filter(model=>providers.includes(model.provider)).map(model=>({provider:model.provider,model:model.id,endpoint:model.endpoint,purposes:['ppt-build','image-understand']}));
}
