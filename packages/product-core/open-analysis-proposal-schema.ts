export {};
// One native JSON Schema for the existing business proposal versions.
// Shared constraints live once; each closed branch preserves its exact fields.
const str={type:'string',minLength:1};
const list=(items:unknown,minItems=0,maxItems=32)=>({type:'array',items,minItems,maxItems});
const object=(properties:Record<string,unknown>,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const enumeration=(...values:string[])=>({type:'string',enum:values});
const filter=object({column:str,operator:enumeration('eq','ne','ge','le'),value:{type:'string'}});
const group={anyOf:[{type:'null'},str]},fields={source_id:str,sheet_id:str,column:str};
const binding=object({...fields,group_by:group,filters:list(filter,0,16)});
const numeric=enumeration('integer','decimal'),operation=enumeration('sum','count','min','max','mean');
const period=object({start_date:str,end_date:str});
const memberBindings=list({anyOf:['members','orders'].map(role=>object({source_id:str,sheet_id:str,role:enumeration(role),columns:object(Object.fromEntries((role==='members'?['member_id','member_group']:['order_id','order_member_id','paid_at','amount','status','currency']).map(k=>[k,k==='member_group'?group:str])))}))},2,32);
const membership=object({version:enumeration('1.0'),goal:str,methods:list(enumeration('M1','M2'),1,2),bindings:memberBindings,semantics:object({comparison_period:period,current_period:period,currency:enumeration('CNY'),time_zone:enumeration('Asia/Shanghai'),valid_statuses:list(str,1,32)})});
const measure=object({currency:str,inputs:list(object({...fields,scale:str}),1,16),output_scale:str,output_label:str});
const common={version:{type:'string'},goal:str,...fields,unit:str,operation:{type:'string'},group_by:group,filters:list(filter,0,16),numeric_mode:numeric,combination:enumeration('union_all'),inputs:list(binding,2,32),membership,
 value_mappings:list(object({column:str,pairs:list(object({from:{type:'string'},to:{type:'string'}}),1,256)}),1,16),
 references:list(object({source_id:str,sheet_id:str,row:{type:'integer',minimum:2},column:enumeration('B')}),1,32),
 join:object({kind:enumeration('refund_net'),order_key:str,refund_order_key:str,refund_id:str}),
 weight_column:{...str,description:"实际同一行权重字段；计算sum(value*weight)/sum(weight)，不能用sum(value)/sum(weight)代替。权重不使用金额度量。"},
 input_unit:str,comparison_label:str,current_label:str,
 rounding:object({decimals:{type:'integer',minimum:0,maximum:6},method:enumeration('largest_remainder'),tie_break:enumeration('object_key')}),measure,
 left_label:str,right_label:str,grain:enumeration('one_row_per_key'),cardinality:enumeration('one_to_one')};
// These are declarative business version contracts, not a schema converter.
// Empty properties share root constraints; each branch remains closed.
const variant=(version:string,names:string[],overrides:Record<string,unknown>={},required=names)=>object({version:enumeration(version),...Object.fromEntries(names.map(name=>[name,{}])),...overrides},['version',...required]);
const single=['goal','source_id','sheet_id','column','unit'],query=[...single,'operation','group_by','filters'],pairInputs={minItems:2,maxItems:2};
const versions=[
 variant('1.0',[...single,'operation'],{operation:enumeration('sum')}),
 variant('1.1',query,{operation}),
 variant('1.2',[...query,'numeric_mode'],{operation,numeric_mode:enumeration('decimal')}),
 variant('1.3',['goal','unit','combination','numeric_mode','operation','inputs'],{operation}),
 variant('1.4',['membership']),
 variant('1.5',[...query,'numeric_mode','value_mappings'],{operation}),
 variant('1.6',['goal','operation','references'],{operation:enumeration('source_quotes')}),
 variant('1.7',['goal','unit','numeric_mode','inputs','join'],{inputs:pairInputs}),
 variant('1.9',[...single,'operation','weight_column','group_by','filters'],{operation:enumeration('weighted_mean')}),
 variant('2.0',[...single,'operation','input_unit','group_by','filters'],{operation:enumeration('group_share'),unit:enumeration('%'),group_by:str}),
 variant('2.1',['operation','goal','unit','comparison_label','current_label','inputs'],{operation:enumeration('group_change'),inputs:{...pairInputs,description:"inputs[0]比较期，inputs[1]当期；分别绑定真实期间筛选和相同分组。"}}),
 variant('2.2',['operation','goal','unit','inputs','rounding','measure'],{operation:enumeration('proportional_allocation'),inputs:{...pairInputs,description:"inputs[0]成本池金额，group_by:null；inputs[1]权重数值，group_by实际对象键。不是相反顺序。权重无货币换算。"}},['operation','goal','unit','inputs','rounding']),
 variant('2.3',['operation','goal','unit','left_label','right_label','grain','cardinality','inputs'],{operation:enumeration('reconcile'),inputs:{...pairInputs,description:"左右表实际金额和关联键，每个键一行；差值=左-右。金额度量先bind_measurement，不能在2.3额外添加measure。存在漏配/差异如实呈现，核验通过不是账目一致。"}}),
];
const {membership:_membership,references:_references,rounding:_rounding,measure:_measure,input_unit:_inputUnit,...baseProperties}=common;
const measuredBase={type:'object',properties:baseProperties,anyOf:versions.filter((_p,i)=>![4,6,9,11].includes(i))};
export const openAnalysisProposalSchema={type:'object',properties:{...common,base:measuredBase},anyOf:[...versions,variant('1.8',['base','measure'])]};
