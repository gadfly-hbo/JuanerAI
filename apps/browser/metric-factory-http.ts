import type {IncomingMessage,ServerResponse} from 'node:http';
import type {MetricWorkspace} from '../../packages/ports/metric-factory.ts';
export async function metricFactoryHttp(req:IncomingMessage,res:ServerResponse,deps:{workspace?:MetricWorkspace;check():void;reply(res:ServerResponse,status:number,value:unknown):void;json(req:IncomingMessage,maximum?:number):Promise<unknown>;reject(status:number):never}){
 if(req.method==='GET'&&req.url==='/v1/metric-factory/status'){deps.reply(res,200,await deps.workspace?.status()??{available:false});return;}
 if(req.method!=='POST'||req.url!=='/v1/metric-factory/open')deps.reject(404);
 deps.check();const body=await deps.json(req,128);if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length)deps.reject(400);
 if(!deps.workspace||!(await deps.workspace.status()).available)deps.reject(503);
 deps.reply(res,200,await deps.workspace.open(deps.check));
}
