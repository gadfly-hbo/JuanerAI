// A2 真实数据层（替换 demo 的 analysis-model.js 合成模型）。
// 全局变量供 app.js 使用（script 顺序：api.js 先于 app.js）——接口名对齐 demo 便于视图层零改动。
// 数据全部来自服务端 JSON API（引擎校验/落盘/发布为真实语义）。

// R2：4 条示例需求保留为产品文案（引导文案，非数据），内容照抄评审原型。
const analysisExamples = [
  {name:"把经营问题拆清楚",hint:"自然语言生成分析草稿，先看目的与证据，再补指标。",text:"我们是服饰电商品牌，最近两个季度销售额在涨但利润在跌。帮我把这件事拆清楚：增长来自哪里、质量怎么样、利润去哪了，给我一套可以每周复盘的指标和诊断方法。"},
  {name:"为重大选择建立依据",hint:"比较候选道路的假设、证据与重审条件。",text:"我们在考虑未来三年的投入方向：继续开店、建设供应链，还是深耕会员复购。希望有一套比较依据和检验假设的方法，而不是只看哪个季度数据好看。"},
  {name:"独立研究一个数据问题",hint:"先明确资料能支持什么判断，再设计对照。",text:"上个月发了一批优惠券，领券客户的复购率比未领券的高。我想弄清楚这是优惠券带来的增量，还是本来更活跃的客户才去领券。"},
  {name:"建立可复用的指标体系",hint:"自然语言生成指标草稿，再补充用途、场景与分析方法。",text:"我们是服饰电商品牌，希望建立一套经营指标体系。重点看净销售额、退款和客户复购，按渠道与品类做每周复盘，知道增长有没有质量。"}
];
const sampleNeed = analysisExamples[3].text;

// 合成预设（inferAnalysisPreset/makeAnalysisBlueprint 等）已随 analysis-model.js 移除：
// 生成走 /api/instances/create-job（真实 LLM job），见 app.js generate 动作。

// 检查函数五件套（自评审原型 analysis-model.js 逐字移植——作用于 system DTO 的纯函数，
// 属交互层：检查行明细文案由此生成；引擎侧 designIssues 的事实面经 DTO 汇入（T4/T6 对齐））。
function blueprintIssues(s){
  const b=s.blueprint,issues=[];
  if(!b.purpose.trim())issues.push("业务目的尚未说明。");
  if(!b.questions.length)issues.push("还没有把问题拆成可以研究的部分。");
  if(!b.hypotheses.length)issues.push("还没有需要检验的关键假设。");
  for(const h of b.hypotheses)if(!h.support.trim()||!h.counter.trim()||!h.change.trim())issues.push("有假设缺少支持证据、反对证据或改变判断的条件。");
  if(!b.evidence.length||b.evidence.some(e=>!e.source.trim()||!e.check.trim()||!e.failure.trim()))issues.push("证据计划缺少来源、核验办法或不足处置。");
  return issues;
}
function prototypeMetricIssues(s){
  const issues=[];
  for(const m of s.metrics){
    if(!m.formula.trim())issues.push(`${m.name} 缺少计算关系。`);
  }
  return issues;
}
function missingRequiredBindings(s){return s.scenes.flatMap(sc=>sc.bindings.filter(b=>b.required!==false&&(!b.metric||!s.metrics.some(m=>m.id===b.metric))));}
function sceneDesignIssues(s){return s.scenes.flatMap(sc=>!sc.purpose.trim()||!sc.steps.length?[`${sc.name}缺少问题或分析步骤。`]:sc.contexts?.length&&!sc.contexts.some(c=>s.blueprint.contexts.includes(c))?[`${sc.name}与当前用途不适配，请核对方法。`]:[]);}
function designReady(s){return blueprintIssues(s).length===0&&prototypeMetricIssues(s).length===0&&sceneDesignIssues(s).length===0&&pendingCount(s)===0&&missingRequiredBindings(s).length===0&&s.confirmed&&(s.scenes.length>0||s.metricOnly);}

const Api = {
  async workspace() { return (await fetch("/api/workspace")).json(); },
  async templates() { return (await fetch("/api/templates")).json(); },
  async instance(id) {
    const res = await fetch(`/api/instances/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `加载实例失败（${res.status}）`);
    return res.json();
  },
  async llmStatus() { return (await fetch("/api/llm-status")).json(); },
  async createJob(need) {
    const res = await fetch("/api/instances/create-job", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ need }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `生成未能启动（${res.status}）`);
    return res.json();
  },
  async job(jobId) {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `任务查询失败（${res.status}）`);
    return res.json();
  },
  // ---- T5 写路径（失败抛 ApiError：{errors} 结构化）----
  async write(path, method, body) {
    const res = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error((data.errors ?? [data.error]).join("；"));
      err.payload = data;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  },
  patchBlueprint(id, patch) { return Api.write(`/api/instances/${encodeURIComponent(id)}/blueprint`, "PATCH", patch); },
  patchHypothesis(id, hid, patch) { return Api.write(`/api/instances/${encodeURIComponent(id)}/blueprint/hypotheses/${hid}`, "PATCH", patch); },
  patchEvidence(id, eid, patch) { return Api.write(`/api/instances/${encodeURIComponent(id)}/blueprint/evidence/${eid}`, "PATCH", patch); },
  patchMetric(id, name, patch) { return Api.write(`/api/instances/${encodeURIComponent(id)}/metrics/${name}`, "PATCH", patch); },
  async deleteMetricIntent(id, name) {
    const res = await fetch(`/api/instances/${encodeURIComponent(id)}/metrics/${name}`, { method: "DELETE" });
    return res.json().catch(() => ({})); // 200 {blocked:false} / 409 {blocked:true,references}
  },
  deleteMetric(id, name) { return Api.write(`/api/instances/${encodeURIComponent(id)}/metrics/${name}?confirm=1`, "DELETE"); },
  patchScene(id, sid, patch) { return Api.write(`/api/instances/${encodeURIComponent(id)}/scenes/${sid}`, "PATCH", patch); },
  patchBindings(id, sid, bindings) { return Api.write(`/api/instances/${encodeURIComponent(id)}/scenes/${sid}/bindings`, "PATCH", { bindings }); },
  saveAsMethod(id, sid, body) { return Api.write(`/api/instances/${encodeURIComponent(id)}/scenes/${sid}/save-as-method`, "POST", body); },
  resolve(id, body) { return Api.write(`/api/instances/${encodeURIComponent(id)}/resolve`, "POST", body); },
  approveMetric(id, name) { return Api.write(`/api/instances/${encodeURIComponent(id)}/approve-metric`, "POST", { name }); },
  rejectMetric(id, name) { return Api.write(`/api/instances/${encodeURIComponent(id)}/reject-metric`, "POST", { name }); },
  confirmReview(id) { return Api.write(`/api/instances/${encodeURIComponent(id)}/confirm-review`, "POST", {}); },
  createRefineJob(id, instruction) { return Api.write(`/api/instances/${encodeURIComponent(id)}/refine-job`, "POST", { instruction }); },
  async refineProposal(id) {
    const res = await fetch(`/api/instances/${encodeURIComponent(id)}/refine-proposal`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "没有待采纳的建议");
    return res.json();
  },
  applyRefine(id) { return Api.write(`/api/instances/${encodeURIComponent(id)}/apply-refine`, "POST", {}); },
  discardRefine(id) { return Api.write(`/api/instances/${encodeURIComponent(id)}/discard-refine`, "POST", {}); },
  createScene(id, methodId, purpose) { return Api.write(`/api/instances/${encodeURIComponent(id)}/scenes`, "POST", { methodId, purpose }); },
  createFromTemplate(templateId) { return Api.write(`/api/templates/use`, "POST", { templateId }); },
  createFromUserTemplate(id) { return Api.write(`/api/templates/user/preview`, "POST", { id }); },
  saveUserTemplate(body) { return Api.write(`/api/templates/user`, "POST", body); },
  async deliver(id) {
    const res = await fetch(`/api/instances/${encodeURIComponent(id)}/deliver`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    if (!res.ok) { const data = await res.json().catch(() => ({})); const err = new Error((data.errors ?? [data.error]).join("；")); err.payload = data; throw err; }
    return res.json();
  }
};
