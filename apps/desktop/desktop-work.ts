import type {DesktopProjection} from '../../packages/contracts/xanthil-desktop-ipc.ts';
type ProfessionalStage='新建分析'|'数据准备'|'本地处理'|'循证分析'|'报告'|'执行反馈';
/** Read-only presentation of already-committed work; never admits or resumes it. */
export function summarizeDesktopWork(running: boolean, attempt: Pick<DesktopProjection['attempts'][number], 'status' | 'action_kind'> | undefined, disclosures: number, hasSessionRun = false): Readonly<{label:string;target:ProfessionalStage|null;modelBoundary:string}> {
  const modelBoundary=disclosures>0?'按逐次披露记录':'无';
  if(running)return{label:'本地处理中',target:'本地处理',modelBoundary};
  if(attempt?.status==='Running')return{label:'模型辅助处理中',target:attempt.action_kind==='organize_question'?'新建分析':attempt.action_kind==='explain_evidence'?'循证分析':'执行反馈',modelBoundary};
  return{label:'空闲',target:hasSessionRun?'本地处理':null,modelBoundary};
}

