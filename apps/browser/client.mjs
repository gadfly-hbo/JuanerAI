/** Transport state only. Business state remains in the local Application and durable Store. */
export function createWorkspaceClient({request=globalThis.fetch,storage=null,control=null}={}) {
 const key='xanthil.pending-command.v1';let pending=null;
 try{const value=JSON.parse(storage?.getItem(key)??'null');if(value&&/^[a-f0-9-]{36}$/.test(value.command_id)&&['create','sources','stop','review_open','review_save','review_submit','model_authorization','clarification'].includes(value.kind))pending=value;}catch{/* A denied storage API grants no control. */}
 const remember=value=>{pending=value;try{if(value)storage?.setItem(key,JSON.stringify(value));else storage?.removeItem(key);}catch{/* Control is never stored; a refreshed page remains read-only. */}};
 async function read(path){const response=await request(path,{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('暂时无法打开，请稍后重试。');return response.json();}
 async function write(kind,path,body){if(!control||pending)throw new Error('目前只能查看，请先确认上次提交的结果。');remember({kind,command_id:body.command_id,task_id:body.task_id??null,definite:false});let response;
  try{response=await request(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-xanthil-control':control},body:JSON.stringify(body)});const result=await response.json();if(!response.ok){if(response.status===403)control=null;remember({...pending,definite:true});throw new Error('请求没有完成，请先查看保存结果。');}remember(null);return result;}
  catch(error){if(response&&!response.ok&&pending)remember({...pending,definite:true});throw error;}
 }
 return {
  session:()=>read('/v1/session'),hasControl:()=>!!control,
  async takeControl(){if(pending)throw new Error('上次提交还没确认，请先查看保存结果。');control=null;const state=await read('/v1/session');const response=await request('/v1/control',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({version:'1.0',command_id:crypto.randomUUID(),generation:state.generation,confirmed:true})});if(!response.ok)throw new Error('操作页面已变化，请查看最新状态后再选择“在此页继续”。');const result=await response.json();if(typeof result.control!=='string'||!result.control)throw new Error('暂时无法在此页操作，仍可以查看。');control=result.control;return control;},
  canWrite:()=>!!control&&!pending,pending:()=>pending?{...pending}:null,
  async copy(taskId,reportId){const response=await request('/v1/tasks/'+taskId+'/reports/'+reportId+'/copy',{credentials:'same-origin',cache:'no-store'});if(!response.ok||!response.headers.get('content-type')?.startsWith('text/html'))throw new Error('下载未完成；服务器报告仍保留，可以稍后重试。');return response.blob();},
  policy:()=>read('/v1/model-policy'),
  answer:(task,question_execution_id,policy_sha256,reply)=>write('clarification','/v1/tasks/'+task.task_id+'/clarification',{version:'1.0',command_id:crypto.randomUUID(),task_id:task.task_id,expected_row_version:task.row_version,epoch:task.epoch,question_execution_id,policy_sha256,reply,confirmed:true}),
  authorizeModel:(task,source_set_id,policy_sha256,disclose_question,disclose_verified_result=false)=>write('model_authorization','/v1/tasks/'+task.task_id+'/model-authorization',{version:'1.0',command_id:crypto.randomUUID(),task_id:task.task_id,epoch:task.epoch,expected_row_version:task.row_version,source_set_id,policy_sha256,disclose_question,disclose_structure:source_set_id!==null,disclose_verified_result,confirmed:true}),
  list:()=>read('/v1/tasks'),read:id=>read('/v1/tasks/'+id),
  create:question=>write('create','/v1/tasks',{version:'1.0',command_id:crypto.randomUUID(),question}),
  select:(task,sources)=>write('sources','/v1/tasks/'+task.task_id+'/sources',{version:'1.0',command_id:crypto.randomUUID(),task_id:task.task_id,expected_row_version:task.row_version,epoch:task.epoch,sources}),
  review:(task,operation,input={})=>write('review_'+operation,'/v1/tasks/'+task.task_id+'/review/'+operation,{version:'1.0',command_id:crypto.randomUUID(),...input,task_id:task.task_id,epoch:task.epoch}),
  stop:task_id=>write('stop','/v1/tasks/'+task_id+'/stop',{version:'1.0',command_id:crypto.randomUUID()}),
  async recover(){if(!pending)return {status:'none'};const value=await read('/v1/commands/'+pending.command_id);if(value&&value.kind!=='task_creation_pending'){remember(null);return {status:'recorded',receipt:value};}if(!value&&pending.definite){remember(null);return {status:'rejected'};}return {status:value?'partial':'unknown',receipt:value};},
 };
}
export async function browserSourceFiles(files){
 if(!files.length||files.length>32||files.some(f=>f.size<1||f.size>8*1024*1024)||files.reduce((n,f)=>n+f.size,0)>32*1024*1024)throw new Error('请选择1至32份资料，每份不超过8 MiB，合计不超过32 MiB。');
 return Promise.all(files.map(async file=>{const format=file.name.toLowerCase().split('.').at(-1);if(!['csv','xlsx','md','pdf','docx','doc','pptx','ppt','png','jpg','jpeg'].includes(format))throw new Error('请选择CSV、Excel、Markdown、PDF、Word、演示文稿或PNG/JPEG图片；不能解析时会说明具体原因。');const bytes=new Uint8Array(await file.arrayBuffer()),parts=[];for(let i=0;i<bytes.length;i+=32768)parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)));return {source_id:crypto.randomUUID(),display_name:file.name,format,base64:btoa(parts.join(''))};}));
}
