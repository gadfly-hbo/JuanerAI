import type {MetricCopies,MetricPublication} from '../ports/metric-factory.ts';
/** Host retains exact published bytes. This never installs or executes a SAP. */
export function createMetricDelivery(copies:MetricCopies,check:()=>void){
 return {
  save(value:MetricPublication){check();const receipt=copies.save(value),read=copies.read(value.packageId,value.version);check();if(read.receipt.sha256!==receipt.sha256||read.bytes.length!==receipt.bytes)throw Error('MF_COPY_UNKNOWN');return receipt;},
  read(packageId:string,version:string){check();return copies.read(packageId,version);},
 };
}
