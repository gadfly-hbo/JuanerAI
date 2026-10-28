import {resolve} from 'node:path';
import {compileOpenAnalysisContext,compileOpenModelReportContract,sourcePathComponent} from '../product-core/open-analysis-context.ts';
import {metricDefinitionResource} from '../product-core/metric-asset-adoption.ts';
import {hashFiniteJson} from '../product-core/member-task.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
import type {OpenTaskIdentity} from '../ports/open-analysis-store.ts';
import type {ProjectMetricAssets} from '../ports/metric-assets.ts';
import type {RequirementDraftContent} from '../product-core/open-requirement-framework.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}

/** Declare real Task files before Pi starts. No virtual read dispatcher or
 * second Agent file API: the Adapter materializes these through its existing
 * local environment and exposes only the SDK's native file tools. */
export function createOpenAnalysisApplication(config:{
 materialRoot:string;
 metricAssets?:ProjectMetricAssets;metricAssetDisclosureAllowed?:boolean;metricAssetChoice?:Readonly<{id:string;version:string}>|null;
 requirementInput?:Readonly<{revision:number;content:RequirementDraftContent}>;
 loadSelectedSource:(identity:OpenTaskIdentity)=>Promise<MemberSourceInspection>;
 isAuthorized:(identity:OpenTaskIdentity)=>boolean;
}){
 return {async prepare(input:{identity:OpenTaskIdentity;question:string;signal:AbortSignal}){
  const identity=Object.freeze(structuredClone(input.identity));
  const check=()=>{if(input.signal.aborted)fail('CANCELLED');if(!config.isAuthorized(identity))fail('AUTHORITY_REQUIRED');};check();
  if(typeof input.question!=='string'||!input.question.trim()||input.question.length>12000)fail('QUESTION_INVALID');
  if(!config.materialRoot||resolve(config.materialRoot)!==config.materialRoot)fail('AUTHORITY_REQUIRED');
  const choice=config.metricAssetChoice,initial=choice===null?null:choice?config.metricAssets?.approved(choice.id,choice.version):config.metricAssets?.approved();
  function currentMetricAsset(){
   if(!initial)return null;const current=config.metricAssets?.approved(initial.asset.id,initial.asset.version);
   if(!current||hashFiniteJson(current.approval)!==hashFiniteJson(initial.approval)||hashFiniteJson(current.asset)!==hashFiniteJson(initial.asset))fail('ASSET_APPROVAL_REVOKED');return current;
  }
  async function source(){check();const current=await config.loadSelectedSource(identity);check();if(hashFiniteJson(current)!==identity.scope_sha256)fail('SOURCE_CHANGED');return current;}
  const selected=await source(),root=resolve(config.materialRoot,'020_clean'),files:Readonly<{path:string;content:string}>[]=[];
  const put=(path:string,content:string)=>{files.push({path,content});return path;},line=(value:unknown)=>JSON.stringify(value);
  const sourcePath=(item:MemberSourceInspection['sources'][number])=>resolve(root,'source',item.source_id,item.sha256);
  const assetCatalog=resolve(root,'metric-asset','catalog.txt');
  for(const item of selected.sources){
   const sheets=item.sheets.filter(s=>s.state==='visible');
   put(resolve(sourcePath(item),'sheets.txt'),sheets.map(sheet=>{const base=resolve(sourcePath(item),'sheet',sourcePathComponent(sheet.sheet_id));return line({source_id:item.source_id,source_sha256:item.sha256,sheet_id:sheet.sheet_id,name:sheet.name,rows:sheet.rows.length,columns_path:resolve(base,'columns.txt'),rows_path:resolve(base,'rows.txt'),table_path:resolve(base,'table.txt')});}).join('\n'));
   for(const sheet of sheets){
    const base=resolve(sourcePath(item),'sheet',sourcePathComponent(sheet.sheet_id)),detail=new Map<string,string>(),rows=sheet.rows.map(row=>line(row));
    put(resolve(base,'table.txt'),[line({kind:'authorized_source_table',source_id:item.source_id,source_sha256:item.sha256,sheet_id:sheet.sheet_id,classification:'SOURCE_FACT',verification:'not_performed'}),...rows].join('\n'));
    // Native read truncates long lines. Preserve complete Unicode/source values
    // in actual paginable files only where a table/header preview needs them.
    for(const row of sheet.rows)for(const cell of row.cells){
     if(Math.max([...cell.value].length,[...(cell.source_value??'')].length)<=(row.row===1?120:512))continue;
     const characters=[...cell.value],original=cell.source_value===undefined?undefined:[...cell.source_value];
     const lines=[line({source_id:item.source_id,source_sha256:item.sha256,sheet_id:sheet.sheet_id,row:row.row,column:cell.column,type:cell.type,...item.document?{document:item.document}:{},unicode_code_points:characters.length,...original?{source_value_code_points:original.length,source_value_equal_to_value:cell.source_value===cell.value}:{},instruction:'后续text片段按field/start码点位置构成原完整值；source_value是原读数，value是已解析值；派生视图不改变原语义引用/核验要求。'})];
     for(const [field,parts]of [['value',characters],...(original&&cell.source_value!==cell.value?[['source_value',original] as const]:[])] as const)for(let start=0;start<parts.length;start+=512)lines.push(line({field,start,text:parts.slice(start,start+512).join('')}));
     detail.set(row.row+'/'+cell.column,put(resolve(base,'cell',String(row.row),sourcePathComponent(cell.column)+'.txt'),lines.join('\n')));
    }
    const cellsPath=rows.some(row=>Buffer.byteLength(row,'utf8')>4096)?put(resolve(base,'cells.txt'),sheet.rows.flatMap(row=>row.cells.flatMap(cell=>{const chars=[...cell.value],values=[line({row:row.row,column:cell.column,type:cell.type,unicode_code_points:chars.length})];for(let start=0;start<chars.length;start+=512)values.push(line({row:row.row,column:cell.column,field:'value',start,text:chars.slice(start,start+512).join('')}));return values;})).join('\n')):null;
    const columns=[...new Set(sheet.rows.flatMap(row=>row.cells.map(cell=>cell.column)))],headers=new Map(sheet.rows.find(row=>row.row===1)?.cells.map(cell=>[cell.column,cell])??[]);
    put(resolve(base,'columns.txt'),columns.map(column=>{const header=headers.get(column),text=String(header?.value??'');return line({column,header_preview:[...text].slice(0,120).join(''),header_truncated:[...text].length>120,header_cell_path:detail.get('1/'+column)??null});}).join('\n'));
    put(resolve(base,'rows.txt'),sheet.rows.flatMap(row=>{const lines:string[]=[];for(let start=0;start<row.cells.length;start+=128)lines.push(line({row:row.row,columns_start:start,column_count:row.cells.length,columns:row.cells.slice(start,start+128).map(cell=>({column:cell.column,cell_path:detail.get(row.row+'/'+cell.column)??null})),table_path:resolve(base,'table.txt'),cells_path:cellsPath}));return lines;}).join('\n'));
   }
  }
  const sourceCatalog=put(resolve(root,'source','catalog.txt'),line({version:selected.version,classification:'DERIVED_SOURCE_VIEW',sources:selected.sources.map(item=>({source_id:item.source_id,sha256:item.sha256,display_name:item.display_name,format:item.format,...item.document?{document:item.document}:{},sheet_count:item.sheets.filter(sheet=>sheet.state==='visible').length,sheet_catalog_path:resolve(sourcePath(item),'sheets.txt')})),metric_asset_catalog_path:assetCatalog}));
  if(!config.metricAssetDisclosureAllowed)put(assetCatalog,line({status:'disclosure_required',calculation_performed:false}));
  else{
   const approved=currentMetricAsset();
   if(!approved)put(assetCatalog,line({status:'no_approved_asset',calculation_performed:false}));
   else{const resource=metricDefinitionResource(approved),path=put(resolve(root,'metric-asset',approved.asset.bytes_sha256,approved.approval.definition_sha256,'definition.txt'),resource.text);put(assetCatalog,line({status:'approved',definition_authority:'project_approved_asset',asset_id:approved.asset.id,asset_version:approved.asset.version,definition:{path,definition_sha256:approved.approval.definition_sha256,package_fingerprint:approved.asset.package_fingerprint},metrics:approved.approval.metrics,calculation_performed:false,formal_outcome_saved:false}));}
  }
  const authorizeResources=async(signal:AbortSignal,path?:string)=>{check();if(signal.aborted)fail('CANCELLED');await source();if(config.metricAssetDisclosureAllowed&&(!path||path.startsWith(resolve(root,'metric-asset')+'/')))currentMetricAsset();check();};
  return {identity,sourceCatalog,materials:files,authorizeResources,modelReportContract:async()=>{const current=await source();return compileOpenModelReportContract(compileOpenAnalysisContext(input.question,current),config.materialRoot,config.requirementInput?{revision:config.requirementInput.revision,text:config.requirementInput.content.text,confirmed:true}:undefined);}};
 }};
}
