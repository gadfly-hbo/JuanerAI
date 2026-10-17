/* BUI-20261015 synthetic contract model. No imports, network or persistence. */
'use strict';
globalThis.ContractModel = (() => {
  const rows = [
    {id:'S01',name:'虹桥店',before:420000,after:345000},
    {id:'S02',name:'徐汇店',before:360000,after:311400},
    {id:'S03',name:'静安店',before:280000,after:259000},
    {id:'S04',name:'浦东店',before:220000,after:211000}
  ];
  const original = '销售下降主要集中在虹桥与徐汇两家门店，建议先复核这两家门店的客流与成交结构，再判断是否需要调整经营动作。现有数据只能定位下降分布，不能证明下降原因。';
  const suggestion = '优先复核虹桥、徐汇两家门店的客流与成交结构。当前证据说明下降集中在哪里，尚不足以判断原因或直接决定经营动作。';
  const factText = '9月净销售额1,126,400元，较8月1,280,000元下降12.0%。虹桥与徐汇合计下降123,600元，占总降幅80.5%。';
  function makeTask(id,title,project,ready=true) {
    return {id,title,project,analysis:1,snapshot:ready?'合成快照 2026-10-10':'资料尚未选择',status:ready?'saved':'waiting',ready,readonly:false,
      doc:{v:ready?1:0,text:ready?original:'',extra:false,origin:ready?'MODEL':'NONE'},draft:ready?original:'',conflict:null,citations:[],pending:null,confirmations:[],history:[],events:[],messages:[],error:null,failNext:false,unknownSave:false,planConfirmed:ready};
  }
  function create() {return {sales:makeTask('sales','9月销售下降，应该先看哪里？','零售经营'),member:makeTask('member','会员复购：先把需求想清楚','会员运营',false)};}
  const dirty = t => t.draft !== t.doc.text;
  const currentConfirmation = t => t.confirmations.findLast(c => c.v===t.doc.v && c.analysis===t.analysis && !c.invalid);
  function confirmBlock(t) {
    if(!t.ready)return '还没有当前已保存报告';
    if(t.readonly)return '当前只读，不能写入';
    if(t.status==='unknown')return '请求结果未知，请先读回';
    if(!['saved','partial','stopped'].includes(t.status))return '当前请求尚未稳定，请先读回已保存状态';
    if(t.conflict)return '有版本冲突，请先选择保留草稿用于重新编辑或放弃';
    if(dirty(t))return '有未保存表达，请先保存或放弃';
    if(t.pending)return '请先应用或放弃待审建议';
    return '';
  }
  function invalidate(t,reason) {for(const c of t.confirmations)if(!c.invalid)c.invalid=reason;}
  function write(t,text,reason,extra=t.doc.extra,external=false,origin='USER') {
    if(t.readonly)return '当前只读，未写入';
    if(t.status==='unknown')return '结果未知，先读回，未重复提交';
    if(text===t.doc.text&&extra===t.doc.extra)return '内容未变化，没有新版本';
    const localDraft=t.draft,hadDirty=dirty(t);
    t.history.push({...t.doc,analysis:t.analysis});
    invalidate(t,reason);
    t.doc={v:t.doc.v+1,text,extra,origin:text===t.doc.text?t.doc.origin:origin};
    if(external&&hadDirty){t.draft=localDraft;t.conflict={localDraft,serverText:text,serverV:t.doc.v};}
    else t.draft=text;
    t.events.push(`内容 v${t.doc.v}：${reason}`);
    return `合成保存成功 · 内容 v${t.doc.v}；旧内容确认不再适用`;
  }
  function save(t) {
    if(t.conflict)return '先处理版本冲突；本地草稿未丢失，未覆盖当前稿';
    if(t.readonly)return '当前只读，草稿保留';
    if(t.status==='unknown')return '结果未知，先读回，草稿保留';
    if(t.failNext){t.failNext=false;t.error='合成保存失败：尚未写入，草稿保留';return t.error;}
    t.error=null;return write(t,t.draft,'用户保存了不同表达');
  }
  function generate(t) {
    const blocked=confirmBlock({...t,pending:null});if(blocked)return blocked;
    t.pending={v:t.doc.v,analysis:t.analysis,base:t.doc.text,text:suggestion};
    return '固定合成建议已准备；尚未修改报告，没有模型调用';
  }
  const staleSuggestion = t => !!t.pending&&(t.pending.v!==t.doc.v||t.pending.analysis!==t.analysis||t.pending.base!==t.doc.text||dirty(t));
  function apply(t) {
    if(!t.pending)return '没有待应用建议';
    if(staleSuggestion(t))return '建议已过期，未应用；请放弃或在新版重新生成';
    const p=t.pending;const result=write(t,p.text,'用户应用了段落改写建议',t.doc.extra,false,'MODEL_SUGGESTION_USER_APPLIED');
    if(!t.readonly&&t.status!=='unknown')t.pending=null;
    return result;
  }
  function confirm(t) {
    const block=confirmBlock(t);if(block)return block;
    if(currentConfirmation(t))return '这版内容已经确认，没有新增记录';
    t.confirmations.push({v:t.doc.v,analysis:t.analysis,partial:t.status==='partial',invalid:null});
    return `合成确认 · 内容 v${t.doc.v}${t.status==='partial'?' 的部分结果与限制':''}；不代表业务决定或行动`;
  }
  function citeRows(t,ids) {
    if(!t.ready||t.id!=='sales')return '当前任务无可引用的结果；没有使用其他任务资料';
    const chosen=rows.filter(r=>ids.includes(r.id));if(!chosen.length)return '先勾选结果行';
    t.citations.push({kind:'rows',analysis:t.analysis,snapshot:t.snapshot,ids:chosen.map(r=>r.id),label:chosen.map(r=>r.name).join('、'),task:t.id});
    return `已引用 ${chosen.length} 行合成结果；未发送`;
  }
  function citeText(t,text,part='interpretation') {
    if(!t.ready)return '当前任务没有已保存报告，不可引用另一任务正文';
    if(!text.trim())return '先选中当前段文字，或使用“引用此段”';
    if(text.length>1500)return '超过1500字，请缩小选区；没有截断发送';
    if(!['interpretation','facts'].includes(part))return '只能引用单一可定位段落';
    if(!(part==='facts'?factText:t.doc.text).includes(text))return '选区不属于当前保存段落，请重新选择';
    t.citations.push({kind:'text',analysis:t.analysis,v:t.doc.v,task:t.id,part,label:text});
    return '已加入本任务引用卡；未发送、未扩大资料权限';
  }
  const staleCitation = (t,c) => c.task!==t.id||c.analysis!==t.analysis||(c.kind==='text'&&c.v!==t.doc.v);
  function send(t,text) {
    if(t.readonly)return '当前只读，未发送';
    if(t.status==='unknown')return '请求结果未知，请先读回';
    if(t.citations.some(c=>staleCitation(t,c)))return '存在过期引用，请移除并在当前来源重新选择';
    if(!text.trim())return '请写下本次追问';
    t.messages.push({text,citations:t.citations.map(c=>({...c}))});t.citations=[];
    return '合成消息已加入本任务；没有发送给模型或后台';
  }
  function refreshSource(t) {
    t.history.push({...t.doc,analysis:t.analysis});invalidate(t,'分析／来源版本变化');
    t.analysis++;t.snapshot=`合成更新快照 r${t.analysis}`;t.doc={...t.doc,v:t.doc.v+1};
    t.events.push('合成来源更新：旧引用／建议／确认不自动沿用');
    return '合成分析／来源已换版；保留旧稿与旧引用，需重新审阅';
  }
  function readback(t) {
    if(t.status!=='unknown')return '合成读回：当前状态已知，没有恢复执行';
    t.status='saved';t.unknownSave=false;return '合成读回确认：未知保存未发生，草稿保留；未自动重试／续跑';
  }
  return {rows,original,suggestion,factText,create,dirty,currentConfirmation,confirmBlock,write,save,generate,apply,confirm,citeRows,citeText,staleCitation,staleSuggestion,send,refreshSource,readback};
})();
