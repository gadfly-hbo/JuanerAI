import assert from 'node:assert/strict';
import test from 'node:test';
import {createPiCaseAssistantRuntime} from '../../../adapters/agent-pi/case-assistant.ts';
import type {AssistantTurn} from '../../../packages/contracts/case-assistant.ts';
const payload=JSON.stringify({version:'1.0',source_sha256:'a'.repeat(64),methods:['M1'],semantics:{metric:'membership_repurchase_comparison',currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},status_meanings:'explicitly_confirmed_local'},preparation:{members:'2',orders:'7'},selected_text:null,result:null,tool_result:null});
export const memberTurn=()=>({membership:{version:'1.0'},payload,provider:'synthetic',model:'offline',signal:new AbortController().signal,cost_reservation_microunits:1} as AssistantTurn);
test('P1-A-PROTOCOL-01 actual Pi refuses unsupported membership tools instead of legacy dispatch',async()=>{
 let called=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:10000,max_output_tokens:1000},{async respond(){called++;return {kind:'tool',tool:'arbitrary_sql',revision_id:'private-owner'};}});
 await assert.rejects(()=>runtime.turn(memberTurn()));assert.equal(called,1,'healthy Pi and synthetic transport must actually execute');
});
for(const [name,change] of Object.entries({raw_rows:(p:any)=>({...p,rows:[{member_id:'raw'}]}),group_labels:(p:any)=>({...p,groups:['North']}),paths:(p:any)=>({...p,selected_text:'/Users/private/orders.csv'}),credentials:(p:any)=>({...p,selected_text:'Bearer private-token'}),report_laundering:(p:any)=>({...p,report:'unselected report text'}),wrong_source:(p:any)=>({...p,source_sha256:'not-a-source'})}))test(`P1-A-F1-${name} closed actual Pi boundary rejects forbidden outbound before transport`,async()=>{let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:10000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});await assert.rejects(()=>runtime.turn({...memberTurn(),payload:JSON.stringify(change(JSON.parse(memberTurn().payload)))}));assert.equal(calls,0);});
for(const tool of ['accept_finding','save_closure','save_decision','save_expected','arbitrary_sql','shell','network','spawn_child'])test(`P1-A-TOOLS-${tool} cannot gain formal or arbitrary effects through actual Pi`,async()=>{let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:10000,max_output_tokens:1000},{async respond(){calls++;return {kind:'tool',tool};}});await assert.rejects(()=>runtime.turn(memberTurn()));assert.equal(calls,1);});

const retainedPayload=()=>({authorized_context:{contract_version:'1.0',source:'current',task:null,initial_text:'检查',material:JSON.parse(payload),selected_history:[],selected_reports:[],selected_materials:[],selected_results:[],allowed_references:[],tools:['read_case']},current_attempt_history:[],visible_message:'检查',authorized_tool_result:null});
for(const [name,mutate]of Object.entries({raw_tool:(p:any):unknown=>p.authorized_tool_result={rows:[{member_id:'raw'}]},report_body:(p:any):unknown=>p.authorized_context.selected_reports=[{reference:'report-1',body:'unselected'}],group_material:(p:any):unknown=>p.authorized_context.material.groups=[{revenue:'1'}],raw_reference:(p:any):unknown=>p.authorized_context.allowed_references=[{kind:'case',id:'11111111-1111-4111-8111-111111111111',revision_id:'current',version:null,sha256:null}],credential:(p:any):unknown=>p.visible_message='Bearer secret',new_tool:(p:any):unknown=>p.authorized_context.tools=['shell']}))test(`P1-D004-ADAPTER-${name} actual retained Pi rejects before transport`,async()=>{let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'advice',text:'unused'};}});const p=retainedPayload();mutate(p);await assert.rejects(()=>runtime.turn({retained_membership:{version:'1.0'},payload:JSON.stringify(p),provider:'synthetic',model:'offline',signal:new AbortController().signal,cost_reservation_microunits:1000}));assert.equal(calls,0);});

for(const text of ['请检查 /Volumes/Finance/exports/source.csv','请检查 /tmp/source.csv','/custom-root/source.csv','/财务/资料.csv','C:\\Finance\\source.csv','\\\\server\\share\\source.csv','file:///tmp/source.csv','请检查 %2Ftmp%2Fsource.csv','请检查 exports/source.csv','资料位于/tmp/source.csv','请检查 ../source.csv','请检查 ~/source.csv'])for(const retained of [false,true])test(`F1 actual Pi ${retained?'retained':'new'} refuses general path ${text}`,async()=>{
 let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});const p=retainedPayload();p.visible_message=text;await assert.rejects(()=>runtime.turn(retained?{...memberTurn(),membership:undefined,retained_membership:{version:'1.0'},payload:JSON.stringify(p)}:{...memberTurn(),payload:JSON.stringify({...JSON.parse(payload),selected_text:text})}));assert.equal(calls,0);
});
for(const text of ['复购会员/活跃会员为 1/2；比较 2026/01/01 与 2026/02/01','当前复购率为50%，变化为 -5 个百分点'])test(`F1 safe business text still reaches actual Pi: ${text}`,async()=>{let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'请确认'};}});await runtime.turn({...memberTurn(),payload:JSON.stringify({...JSON.parse(payload),selected_text:text})});assert.equal(calls,1);});

for(const text of ['Please check exports/source.csv.','请检查 exports/source.csv!','请检查 exports/source.csv！','“exports/source.csv”？','exports/source.csv…','请检查 exports%2Fsource.csv%21','exports／source.csv。','请检查 exports/source.csv#section','请检查 exports/source.csv?download=1','请检查 exports%2Fsource.csv! 增长50%','exports/%EF%BC%8E%EF%BC%8E/source.csv！','exports/source.csv_backup!','exports/source.csv-backup！'])for(const retained of [false,true])test(`F1-V2 actual Pi ${retained?'retained':'new'} rejects lexical file boundary ${text}`,async()=>{
 let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});const p=retainedPayload();p.visible_message=text;await assert.rejects(()=>runtime.turn(retained?{...memberTurn(),membership:undefined,retained_membership:{version:'1.0'},payload:JSON.stringify(p)}:{...memberTurn(),payload:JSON.stringify({...JSON.parse(payload),selected_text:text})}),{code:'OUTBOUND_FORBIDDEN'});assert.equal(calls,0);
});
for(const text of ['复购率 1 / 2','复购率 1/ 2','复购率 1 /2','比率 1.5 / 2.5；变化 -5 个百分点。','复购会员 / 活跃会员；对比 2026/01/01 与 2026 / 02 / 01','复购率 １ ／ ２！'])for(const retained of [false,true])test(`F1-V2 actual Pi preserves safe business text exactly ${retained}: ${text}`,async()=>{
 let received='';const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(payload){received=payload;return {kind:'question',text:'请确认'};}});const p=retainedPayload();p.visible_message=text;const input=retained?{...memberTurn(),membership:undefined,retained_membership:{version:'1.0' as const},payload:JSON.stringify(p)}:{...memberTurn(),payload:JSON.stringify({...JSON.parse(payload),selected_text:text})};await runtime.turn(input);assert.equal(received,input.payload);
});

const slashPaths=['检查 1 /2026/private','请检查 exports/.env','请检查 exports%2F.env',
 '检查1/2026/private','1 /2026/.env','/2026','1/2.csv','1 / 2 /private',
 '请检查 exports/README','exports/config/secret','exports/2026','exports/.hidden/secret',
 '“exports/.env”！','exports／README。','exports%252F.env','exports%2F%FFsecret',
 './README','../.env','~/secret','资料位于/tmp','C:\\exports\\README','exports\\.env',
 '1 /2026_private','1 /2026@private','1 /2026$private','1 /2026#private'];
function slashTurn(text:string,surface:'new'|'visible'|'history'):AssistantTurn{
 if(surface==='new')return {...memberTurn(),payload:JSON.stringify({...JSON.parse(payload),selected_text:text})};
 const p:any=retainedPayload();if(surface==='visible')p.visible_message=text;else p.authorized_context.selected_history=[{kind:'advice',text}];
 return {...memberTurn(),membership:undefined,retained_membership:{version:'1.0'},payload:JSON.stringify(p)};
}
for(const text of slashPaths)for(const surface of ['new','visible','history'] as const)test(`F1-V3 actual Pi refuses whole path expression ${surface}: ${text}`,async()=>{
 let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});
 await assert.rejects(()=>runtime.turn(slashTurn(text,surface)),{code:'OUTBOUND_FORBIDDEN'});assert.equal(calls,0);
});
for(const text of ['复购率 1 / 2','复购率1/2','复购率为1 / 2。','比率 -1.5 / +2.5！','占比 50% / 100%',
 '比较2026/01/01与2026/02/01','比较 2026 / 01 / 01 与 2026 / 02 / 01。','人均收入/客单价；复购会员 / 活跃会员',
 '１ ／ ２；２０２６／０１／０１','增长50%，金额 ¥1,000。'])for(const surface of ['new','visible','history'] as const)test(`F1-V3 actual Pi preserves whole business expression ${surface}: ${text}`,async()=>{
 let received='';const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(value){received=value;return {kind:'question',text:'请确认'};}});const input=slashTurn(text,surface);await runtime.turn(input);assert.equal(received,input.payload);
});

test('F1-V3 prohibited text never reaches credential construction or transport in any retained material slot',async(t)=>{
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),{join}=await import('node:path');
 const {AuthStorage}=await import(pathToFileURL(join(sdk.getPackageDir(),'dist/core/auth-storage.js')).href);
 const credentials=t.mock.method(AuthStorage,'inMemory',()=>assert.fail('no credential construction'));
 const models=t.mock.method(sdk.ModelRuntime,'create',()=>assert.fail('no credential/model runtime access'));
 let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});
 const slots:((p:any,text:string)=>void)[]=[(p,s)=>p.authorized_context.initial_text=s,(p,s)=>p.authorized_context.task=s,(p,s)=>p.current_attempt_history=[{kind:'question',text:s}],(p,s)=>p.authorized_context.material.selected_text=s,(p,s)=>p.authorized_context.selected_reports=[{reference:'report-1',material:{...JSON.parse(payload),selected_text:s}}],(p,s)=>p.authorized_tool_result={...JSON.parse(payload),selected_text:s},(p,s)=>p.authorized_context.selected_results=[{summary:s,limitations:[],unknowns:[]}],(p,s)=>p.authorized_context.selected_materials=[{classification:'MODEL',summary:'合成意见',limitations:[s],unknowns:[]}]];
 for(const text of slashPaths.slice(0,3))for(const slot of slots){const p=retainedPayload();slot(p,text);await assert.rejects(()=>runtime.turn({...memberTurn(),membership:undefined,retained_membership:{version:'1.0'},payload:JSON.stringify(p)}),{code:'OUTBOUND_FORBIDDEN'});}
 assert.equal(calls,0);assert.equal(credentials.mock.callCount(),0);assert.equal(models.mock.callCount(),0);
});

const unitRatios=['占比 50 % / 100 %','复购会员数（人） / 活跃会员数（人）','金额 100元 / 20人'];
const unsafeUnitRatios=unitRatios.flatMap(text=>[text+'/private',text+'/.env',text+'%2F.env','/tmp/'+text,text+' /2026/private','exports/.env '+text]);
for(const text of [...unitRatios,'占比 -50 %/+100 %！','金额 100 元 / 20 人','收入(元)/人数(人)','（金额 100元 / 20人）'])for(const surface of ['new','visible','history'] as const)test(`F1-V4 actual Pi preserves unit ratio ${surface}: ${text}`,async()=>{
 let received='';const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(value){received=value;return {kind:'question',text:'请确认'};}});const input=slashTurn(text,surface);await runtime.turn(input);assert.equal(received,input.payload);
});
for(const text of unsafeUnitRatios)for(const surface of ['new','visible','history'] as const)test(`F1-V4 actual Pi refuses unsafe unit ratio adjacency ${surface}: ${text}`,async()=>{
 let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});await assert.rejects(()=>runtime.turn(slashTurn(text,surface)),{code:'OUTBOUND_FORBIDDEN'});assert.equal(calls,0);
});
test('F1-V4 safe units remain exact and unsafe adjacency refuses in selected report tool result and adopted material',async(t)=>{
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),{join}=await import('node:path');const {AuthStorage}=await import(pathToFileURL(join(sdk.getPackageDir(),'dist/core/auth-storage.js')).href);
 const credentials=t.mock.method(AuthStorage,'inMemory',()=>assert.fail('no credentials')),models=t.mock.method(sdk.ModelRuntime,'create',()=>assert.fail('no model construction'));let received='',calls=0;
 const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(value){calls++;received=value;return {kind:'question',text:'请确认'};}});
 const slots:((p:any,text:string)=>void)[]=[(p,s)=>p.authorized_context.initial_text=s,(p,s)=>p.authorized_context.task=s,(p,s)=>p.current_attempt_history=[{kind:'advice',text:s}],(p,s)=>p.authorized_context.material.selected_text=s,(p,s)=>p.authorized_context.selected_reports=[{reference:'report-1',material:{...JSON.parse(payload),selected_text:s}}],(p,s)=>p.authorized_tool_result={...JSON.parse(payload),selected_text:s},(p,s)=>p.authorized_context.selected_results=[{summary:s,limitations:[],unknowns:[]}],(p,s)=>p.authorized_context.selected_materials=[{classification:'MODEL',summary:s,limitations:[],unknowns:[]}]];
 for(const slot of slots)for(const text of [...unitRatios,...unsafeUnitRatios]){const p=retainedPayload();slot(p,text);const input={...memberTurn(),membership:undefined,retained_membership:{version:'1.0' as const},payload:JSON.stringify(p)},before=calls;if(unitRatios.includes(text)){await runtime.turn(input);assert.equal(received,input.payload);assert.equal(calls,before+1);}else{await assert.rejects(()=>runtime.turn(input),{code:'OUTBOUND_FORBIDDEN'});assert.equal(calls,before);}}
 assert.equal(credentials.mock.callCount(),0);assert.equal(models.mock.callCount(),0);
});

// One-factor boundary coverage plus combined controls: bounded, deterministic,
// and independent of the implementation's inspection normalizer.
const operandSpaces=['',' ','  ','\u3000','\u00a0'];
const annotationText=(g:string[],wide:boolean)=>`复购会员数${g[0]}${wide?'（':'('}${g[1]}人${g[2]}${wide?'）':')'}${g[3]}${wide?'／':'/'}${g[4]}活跃会员数${g[5]}${wide?'（':'('}${g[6]}人${g[7]}${wide?'）':')'}`;
const annotationVariants=new Set<string>();
for(const wide of [false,true]){for(let boundary=0;boundary<8;boundary++)for(const space of operandSpaces){const gaps=Array<string>(8).fill('');gaps[boundary]=space;annotationVariants.add(annotationText(gaps,wide));}for(const space of operandSpaces)annotationVariants.add(annotationText(Array<string>(8).fill(space),wide));}
const quantityVariants=new Set<string>();
for(const suffix of [['%','%'],['元','人']])for(let boundary=0;boundary<4;boundary++)for(const space of operandSpaces){const gaps=Array<string>(4).fill('');gaps[boundary]=space;quantityVariants.add(`100${gaps[0]}${suffix[0]}${gaps[1]}/${gaps[2]}20${gaps[3]}${suffix[1]}`);}
function ratioSlots(text:string):AssistantTurn[]{
 const turns=(['new','visible','history'] as const).map(surface=>slashTurn(text,surface));
 const slots:((p:any)=>void)[]=[p=>p.authorized_context.initial_text=text,p=>p.authorized_context.task=text,p=>p.current_attempt_history=[{kind:'advice',text}],p=>p.authorized_context.material.selected_text=text,p=>p.authorized_context.selected_reports=[{reference:'report-1',material:{...JSON.parse(payload),selected_text:text}}],p=>p.authorized_tool_result={...JSON.parse(payload),selected_text:text},p=>p.authorized_context.selected_results=[{summary:text,limitations:[],unknowns:[]}],p=>p.authorized_context.selected_materials=[{classification:'MODEL',summary:text,limitations:[],unknowns:[]}]];
 for(const slot of slots){const p=retainedPayload();slot(p);turns.push({...memberTurn(),membership:undefined,retained_membership:{version:'1.0'},payload:JSON.stringify(p)});}return turns;
}
for(const [family,variants]of [['annotation',annotationVariants],['quantity',quantityVariants]] as const)test(`F1-V5 actual Pi whitespace invariance ${family} across eleven selected material slots`,async()=>{
 let received='',calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(value){calls++;received=value;return {kind:'question',text:'请确认'};}});
 for(const text of variants)for(const [slot,input]of ratioSlots(text).entries()){const before=calls;await assert.doesNotReject(()=>runtime.turn(input),JSON.stringify({text,slot}));assert.equal(received,input.payload);assert.equal(calls,before+1);}assert.ok(variants.size>20,'exercise independent formatting boundaries');
});
test('F1-V5 annotation whitespace cannot conceal adjacent or embedded path material before credentials or transport',async(t)=>{
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),{join}=await import('node:path');const {AuthStorage}=await import(pathToFileURL(join(sdk.getPackageDir(),'dist/core/auth-storage.js')).href);const credentials=t.mock.method(AuthStorage,'inMemory',()=>assert.fail('no credentials')),models=t.mock.method(sdk.ModelRuntime,'create',()=>assert.fail('no model construction'));let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:16000,max_output_tokens:1000},{async respond(){calls++;return {kind:'question',text:'unexpected'};}});
 for(const space of operandSpaces){const safe=annotationText(Array<string>(8).fill(space),true);for(const text of [safe+'/private',safe+'/.env',safe+'%252F.env','/tmp/'+safe,'exports/README '+safe,safe+' /2026/private',safe.replace('人',space+'/tmp'+space),safe.replace('人',space+'exports%2F.env'+space)])for(const input of ratioSlots(text))await assert.rejects(()=>runtime.turn(input),{code:'OUTBOUND_FORBIDDEN'},text);}
 assert.equal(calls,0);assert.equal(credentials.mock.callCount(),0);assert.equal(models.mock.callCount(),0);
});
