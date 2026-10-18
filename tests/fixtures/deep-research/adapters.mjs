// Synthetic external capabilities only. Original handlers, stores and pipeline run unchanged.
export async function syntheticAdapters(programRoot) {
  const {scriptedRunAgent} = await import(new URL('dist/adapters/testing.js', `file://${programRoot}/`));
  const usage = {modelCalls: 1, outputTokens: 16};
  return {
    search: {search: async () => [{url:'https://synthetic.invalid/evidence',title:'合成来源',snippet:''}]},
    page: {fetch: async url => ({url,status:200,contentType:'text/plain',text:'合成市场规模为 12 亿元。'})},
    parser: {parse: async () => ({bodyText:'合成市场规模为 12 亿元。',parseStatus:'ok'})},
    model: {
      extractClaims: async () => ({claims:[{statement:'合成市场规模为 12 亿元',kind:'fact',quote:'合成市场规模为 12 亿元'}],usage}),
      runAgent: scriptedRunAgent(),
      runStage: async stage => ({usage, output: stage === 'plan'
        ? {questions:[{id:'q1',question:'合成市场规模'}]}
        : stage === 'outline' ? {title:'合成研究',sections:[{id:'s1',title:'结果与不足',bullets:[]}]}
        : stage === 'analyze' ? {findings:[],gaps:[]}
        : ['draft','polish'].includes(stage) ? {reportMd:'# 合成研究\n\n## 结果与不足\n仅合成来源，不能用于业务判断。'}
        : {issues:[],counterexampleChecked:true}}),
    },
  };
}
