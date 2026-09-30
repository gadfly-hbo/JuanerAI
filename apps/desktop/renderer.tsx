import {ProviderSettingsProvider,ProviderSettingsEntry,useProviderSettings} from './provider-settings.tsx';
import type {ProviderSettingsApi} from '../../packages/contracts/provider-settings.ts';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createRoot } from 'react-dom/client';
import type { AssistanceDraftContent, CaseFieldsInput, ConfirmationInput, DesktopFailure, DesktopProjection, DisclosurePreview, ImportInspection, InspectionConfiguration, ProjectOpenValue, SaveFormInput, SessionSummary, XanthilDesktopApi } from '../../packages/contracts/xanthil-desktop-ipc.ts';
import type { DesktopCalculationResult } from '../../packages/product-core/xanthil-desktop-decision-case.ts';

import {formalDecisionSections} from '../../packages/product-core/case-assistant.ts';
import {CaseAssistantWorkspace, DecisionFieldsView} from './case-assistant-workspace.tsx';
import type {CaseAssistantApi,AssistantProjection,AssistantSession} from '../../packages/contracts/case-assistant.ts';

type XanthilDesktopAppProps = Readonly<{ api: XanthilDesktopApi }>;
type Mode = 'quick' | 'professional';
type DialogKind = 'search' | 'skill' | 'prompt' | null;

const revisionLabel: Record<string,string> = {Draft:'准备中',Ready:'待计算',Review:'待审阅',NeedsAttention:'需要处理',Completed:'已完成'};
const runLabel: Record<string,string> = {Running:'处理中',Succeeded:'成功',Failed:'失败',Cancelled:'已取消'};

const professionalStages = [
  '新建分析',
  '数据准备',
  '本地处理',
  '循证分析',
  '报告',
  '执行反馈',
] as const;

const stylesUrl = new URL('./styles.css', import.meta.url).href;

type ProfessionalStage = (typeof professionalStages)[number];

/** Read-only presentation of already-committed work; never admits or resumes it. */
export function summarizeDesktopWork(running: boolean, attempt: Pick<DesktopProjection['attempts'][number], 'status' | 'action_kind'> | undefined, disclosures: number, hasSessionRun = false): Readonly<{label:string;target:ProfessionalStage|null;modelBoundary:string}> {
  const modelBoundary=disclosures>0?'按逐次披露记录':'无';
  if(running)return{label:'本地处理中',target:'本地处理',modelBoundary};
  if(attempt?.status==='Running')return{label:'模型辅助处理中',target:attempt.action_kind==='organize_question'?'新建分析':attempt.action_kind==='explain_evidence'?'循证分析':'执行反馈',modelBoundary};
  return{label:'空闲',target:hasSessionRun?'本地处理':null,modelBoundary};
}

const professionalPanels: Readonly<Record<ProfessionalStage, Readonly<{ title: string; description: string; boundary: string }>>> = {
  新建分析: {
    title: '从业务问题开始',
    description: '保留分析案例名称、复购问题和假设卡的位置。当前不会创建分析案例或会话。',
    boundary: '界面层级已就绪 · 尚未调用业务能力',
  },
  数据准备: {
    title: '数据范围与口径',
    description: '选择成员与订单 CSV，核对映射、期间、有效状态及每项质量处理，再显式确认不可变快照。',
    boundary: '原始数据保持本地 · 不发送给模型',
  },
  本地处理: {
    title: '本地处理与可见范围',
    description: 'DuckDB 主计算与 Python 独立复算只使用已确认的本地快照；一致后才发布证据。',
    boundary: '模型可见范围为空 · 不自动重试',
  },
  循证分析: {
    title: '支持证据、反证与限制',
    description: '查看已提交的 H1 判断、支持证据、反证与限制。分析成功不等于结果已被接受。',
    boundary: '关联不等于因果 · 不作行动声明',
  },
  报告: {
    title: '可追溯报告',
    description: '查看当前修订的报告版本与证据身份；草稿不是已接受的决策报告。',
    boundary: '报告形成、接受、闭环与导出是四个独立事实',
  },
  执行反馈: {
    title: '决策闭环与后续验证',
    description: '比较候选或明确证据不足；保存路线后仍须单独完成分析案例。暂缓、补证和不采纳不构成闭环。',
    boundary: '分析闭环不执行外部行动，也不声明 Outcome',
  },
};

declare global {
  interface Window {
    xanthilDesktopApi: XanthilDesktopApi;
    xanthilCaseAssistantApi: CaseAssistantApi;
    xanthilProviderSettingsApi?: ProviderSettingsApi;
  }
}

export function XanthilDesktopApp({ api }: XanthilDesktopAppProps) { return <ProviderSettingsProvider api={window.xanthilProviderSettingsApi}><XanthilDesktopContent api={api}/></ProviderSettingsProvider>; }
function XanthilDesktopContent({ api }: XanthilDesktopAppProps) {
  const assistantApi=window.xanthilCaseAssistantApi;
  const [assistant,setAssistant]=useState<AssistantProjection|null>(null);
  const [formalState,setFormal]=useState<AssistantProjection|null>(null);
  const [mode, setMode] = useState<Mode>('quick');
  const [selectedStage, setSelectedStage] = useState<ProfessionalStage>('新建分析');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogKind>(null);
  const [previewNotice, setPreviewNotice] = useState('Preview · 模拟：当前界面不创建会话、任务、报告或后台工作。');
  const [project, setProject] = useState<ProjectOpenValue['project'] | null>(null);
  const [sessions, setSessions] = useState<readonly SessionSummary[]>([]);
  const [projection, setProjection] = useState<DesktopProjection | null>(null);
  const formal=associatedFormal(projection,formalState);
  const historical = !!projection?.revision && projection.session?.current_revision_id !== projection.revision.revision_id;
  const caseReadonly = !!projection && !projection.capabilities.can_save_case_fields;
  const [caseName, setCaseName] = useState('');
  const [fields, setFields] = useState<CaseFieldsInput>({ question_text: '', hypothesis_display_title: '', business_context: '', alternative_explanations: [] });
  const invalidAlternatives = fields.alternative_explanations.some(item => !/[^\p{White_Space}]/u.test(item));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [businessNotice, setBusinessNotice] = useState('选择本地项目后创建专业会话；不会调用模型。');
  const [businessError, setBusinessError] = useState<DesktopFailure | null>(null);
  const [evidenceText,setEvidenceText]=useState('');
  const [exportNotice,setExportNotice]=useState('外部导出目标未检查；已有回执不代表目标当前仍存在。');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogReturnRef = useRef<HTMLElement | null>(null);
  const pendingRestoreRef = useRef<HTMLElement | null>(null);

  function acceptProjection(value: DesktopProjection) {
    setProjection(value);
    setEvidenceText(value.revision?.evidence_explanation_text??'');
    if (value.revision) { setCaseName(value.revision.case_name); setFields({ question_text: value.revision.question_text, hypothesis_display_title: value.revision.hypothesis_display_title, business_context: value.revision.business_context, alternative_explanations: value.revision.alternative_explanations }); }
  }
  function showBusinessError(error: DesktopFailure) { setBusinessError(error); if (error.code === 'RESULT_PENDING') setPending(true); }
  async function businessAction(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setBusinessError(null);
    try { await action(); }
    catch { setPending(true); setBusinessNotice('结果待核对：连接未返回可靠结果，请重新打开项目；不会自动重发。'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function chooseProject() {
    await businessAction(async () => {
      const result = await api.selectProject({ contract_version: '1.0', command_id: crypto.randomUUID() });
      if (!result.ok) { showBusinessError(result.error); return; }
      setProject(result.value.project); setSessions(result.value.sessions); setProjection(null); setAssistant(null); setFormal(null); setPending(false);
      setCaseName(''); setFields({ question_text: '', hypothesis_display_title: '', business_context: '', alternative_explanations: [] });
      setBusinessNotice('项目已打开。选择已保存的会话，或创建新的专业会话。');
    });
  }
  async function openSession(session: SessionSummary) {
    if (!project || pending) return;
    await businessAction(async () => {
      const result = await api.openSession({ contract_version: '1.0', project_id: project.project_id, session_id: session.session_id });
      if (!result.ok) { showBusinessError(result.error); return; }
      acceptProjection(result.value); setSelectedStage('新建分析'); setBusinessNotice('会话已打开');
    });
  }
  async function readRevision(revision_id: string) {
    if (!projection?.session || pending) return;
    const session = projection.session;
    await businessAction(async () => {
      const result = await api.readProjection({ contract_version: '1.0', project_id: session.project_id, session_id: session.session_id, case_id: session.case_id, revision_id });
      if (!result.ok) { showBusinessError(result.error); return; }
      acceptProjection(result.value); setBusinessNotice('修订已读取；历史内容只读，不产生新命令。');
    });
  }
  async function submitCase() {
    if (!project || pending || invalidAlternatives) return;
    const revision = projection?.revision, session = projection?.session;
    const frozenFields = { ...fields, alternative_explanations: [...fields.alternative_explanations] };
    await businessAction(async () => {
      const result = revision && session
        ? await api.saveForm({ contract_version: '1.0', command_id: crypto.randomUUID(), project_id: project.project_id, session_id: session.session_id, case_id: session.case_id, revision_id: revision.revision_id, expected_row_version: revision.row_version, form: { kind: 'case_fields', fields: frozenFields } })
        : await api.createSession({ contract_version: '1.0', command_id: crypto.randomUUID(), project_id: project.project_id, display_name: caseName, case_name: caseName, fields: frozenFields });
      if (!result.ok) { showBusinessError(result.error); return; }
      acceptProjection(result.value); setBusinessNotice(revision ? '案例字段已保存' : '会话已创建');
      const listed = await api.listSessions({ contract_version: '1.0', project_id: project.project_id });
      if (listed.ok) setSessions(listed.value); else showBusinessError(listed.error);
    });
  }
  const running = projection?.runs.find(run => run.status === 'Running');
  const activeAttempt = projection?.attempts.find(attempt => attempt.status === 'Running');
  const workSummary=summarizeDesktopWork(!!running,activeAttempt,projection?.disclosures.length??0,(projection?.runs.length??0)>0);
  useEffect(() => {
    if ((!running&&!activeAttempt) || !projection?.session || !projection.revision || pending) return;
    const owner = {contract_version:'1.0' as const,project_id:projection.session.project_id,session_id:projection.session.session_id,case_id:projection.session.case_id,revision_id:projection.revision.revision_id};
    let stopped=false;
    const timer=setTimeout(async()=>{
      try { const result=await api.readProjection(owner);if(stopped)return;if(result.ok)acceptProjection(result.value);else showBusinessError(result.error); }
      catch {if(!stopped){setPending(true);setBusinessNotice('结果待核对，请重新打开项目；不会自动重发。');}}
    },250);
    return()=>{stopped=true;clearTimeout(timer);};
  },[api,projection,running,activeAttempt,pending]);
  async function analysisAction(kind:'start'|'cancel'|'draft') {
    if(!projection?.session||!projection.revision||pending)return;
    const command={contract_version:'1.0' as const,command_id:crypto.randomUUID(),project_id:projection.session.project_id,session_id:projection.session.session_id,case_id:projection.session.case_id,revision_id:projection.revision.revision_id,expected_row_version:projection.revision.row_version};
    await businessAction(async()=>{
      const result=kind==='draft'?await api.createDraftRevision(command):kind==='cancel'&&running?await api.cancelAnalysis({...command,run_id:running.run_id}):projection.confirmation?await api.startAnalysis({...command,confirmation_id:projection.confirmation.confirmation_id}):null;
      if(!result)return;if(!result.ok){showBusinessError(result.error);return;}acceptProjection(result.value);
      if(kind==='draft'){setSelectedStage('数据准备');setBusinessNotice('新修订已创建，原修订和证据保留。');}
    });
  }
  async function reviewAction(kind:'accept'|'save'|'complete',value?:string|SaveFormInput){
    if(!projection?.session||!projection.revision||pending)return;
    const command={contract_version:'1.0' as const,command_id:crypto.randomUUID(),project_id:projection.session.project_id,session_id:projection.session.session_id,case_id:projection.session.case_id,revision_id:projection.revision.revision_id,expected_row_version:projection.revision.row_version};
    const acceptance=projection.acceptances.findLast(a=>!projection.closures.some(c=>c.acceptance_id===a.acceptance_id)),form=projection.forms.at(-1);
    await businessAction(async()=>{
      const result=kind==='accept'&&typeof value==='string'?await api.acceptFinding({...command,finding_id:value}):kind==='save'&&typeof value==='object'?await api.saveForm({...command,form:value}):kind==='complete'&&acceptance&&form?await api.completeCase({...command,acceptance_id:acceptance.acceptance_id,form_id:form.form_id}):null;
      if(!result)return;if(!result.ok){showBusinessError(result.error);return;}acceptProjection(result.value);
      setBusinessNotice(kind==='accept'?'已接受本次分析结果；尚未完成分析案例。':kind==='complete'?'分析案例已完成，已生成不可变最终报告；未执行外部行动。':'表单已保存；保存不等于接受或完成。');
    });
  }
  async function exportReport(reportId:string){
    if(!projection?.session||!projection.revision||pending)return;
    const owner={project_id:projection.session.project_id,session_id:projection.session.session_id,case_id:projection.session.case_id,revision_id:projection.revision.revision_id};
    await businessAction(async()=>{
      const result=await api.exportReport({contract_version:'1.0',command_id:crypto.randomUUID(),...owner,report_id:reportId});
      if(!result.ok){showBusinessError(result.error);setExportNotice('本次导出没有确认成功回执；请按错误说明处理，不自动重发。');return;}
      setExportNotice(result.value.status==='already_recorded'?'该命令已有成功回执；未再次选择或写入目标，也未检查目标当前是否存在。':`已写入并独立读回 ${result.value.file_name} · ${result.value.byte_length} bytes · SHA-256 ${result.value.sha256}。导出不改变接受或闭环。`);
    });
  }
  function newSession() {
    if (mode === 'quick') { setPreviewNotice('Preview · 模拟：新建快速会话尚未激活，未创建会话或目录。'); return; }
    if (busy || pending) return;
    setProjection(null); setFormal(null); setCaseName(''); setFields({ question_text: '', hypothesis_display_title: '', business_context: '', alternative_explanations: [] }); setSelectedStage('新建分析');
    setBusinessNotice('填写案例后点击创建分析；此时尚未创建任何记录。');
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (activeDialog !== null) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
    const target = pendingRestoreRef.current;
    pendingRestoreRef.current = null;
    target?.focus();
  }, [activeDialog]);

  async function openAssistantSource(owner: NonNullable<AssistantProjection>['session']['source']) {
    await businessAction(async()=>{const r=await api.readProjection({contract_version:'1.0',...owner});if(!r.ok){showBusinessError(r.error);return;}acceptProjection(r.value);setSelectedStage('执行反馈');setMode('professional');});
  }
  useEffect(()=>{setFormal(null);if(!projection?.session||!assistantApi)return;let current=true;const session=projection.session;
    void assistantApi.request<readonly AssistantSession[]>({version:'1.0',operation:'list',project_id:session.project_id}).then(async r=>{if(!r.ok)return;const linked=r.value.find(x=>x.source.case_id===session.case_id&&x.source.revision_id===projection.revision?.revision_id);if(!linked){if(current)setFormal(null);return;}const result=await assistantApi.request<AssistantProjection>({version:'1.0',operation:'read',session_id:linked.id});if(current&&result.ok)setFormal(associatedFormal(projection,result.value));});return()=>{current=false;};
  },[projection?.projection_token,assistant?.current_decision_id,mode]);
  async function beginCaseAssistant(){if(!projection?.session||!projection.revision)return;await businessAction(async()=>{
    const s=projection.session!;const r=await assistantApi.request<AssistantProjection>({version:'1.0',operation:'link',owner:{project_id:s.project_id,session_id:s.session_id,case_id:s.case_id,revision_id:projection.revision!.revision_id},title:projection.revision!.case_name+' · 决策',command_id:crypto.randomUUID()});if(!r.ok){setBusinessNotice(r.error.message);return;}setAssistant(r.value);setMode('quick');});}

  function selectMode(nextMode: Mode) {
    if (nextMode === 'professional' && mode === 'quick' && assistant) {
      void openAssistantSource(assistant.session.source);
      return;
    }
    setMode(nextMode);
    setPreviewNotice(nextMode === 'quick'
      ? '快速模式 · Preview：保留对话与能力入口，不创建会话或后台工作。'
      : '专业模式：保留六阶段工作台；未激活时不创建分析案例、不读取数据。');
  }

  function openDialog(kind: Exclude<DialogKind, null>, trigger: HTMLElement | null) {
    dialogReturnRef.current = trigger;
    setActiveDialog(kind);
  }

  function closeDialog() {
    pendingRestoreRef.current = dialogReturnRef.current;
    setActiveDialog(null);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    drawerTriggerRef.current?.focus();
  }

  function trapModalFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const dialogTitle = activeDialog === 'search'
    ? '全局搜索'
    : activeDialog === 'skill'
      ? 'Skill · Preview'
      : 'Prompt · Preview';

  return (
    <div className="xanthil-shell" aria-label="Xanthil Desktop">
      <link href={stylesUrl} rel="stylesheet" />
      <header className="titlebar">
        <div className="identity" aria-label="JuanerAI，持续做出更好的决策；Xanthil Desktop">
          <span className="juaner-brand"><img src={new URL('./assets/juanerai-logo-slogan.png',import.meta.url).href} alt="" /></span><span className="juaner-brand-copy"><strong>JuanerAI</strong><small>持续做出更好的决策</small></span>
          <strong className="product-name">Xanthil Desktop</strong>
        </div>
        <nav className="mode-switch" aria-label="工作模式">
          <button aria-pressed={mode === 'quick'} className={mode === 'quick' ? 'mode-button active' : 'mode-button'} onClick={() => selectMode('quick')} type="button">快速模式 <span aria-hidden="true">Quick</span></button>
          <button aria-pressed={mode === 'professional'} className={mode === 'professional' ? 'mode-button active' : 'mode-button'} onClick={() => selectMode('professional')} type="button">专业模式 <span aria-hidden="true">Professional</span></button>
        </nav>
        <div className="command-actions"><ProviderSettingsEntry/>
          <button className="project-button" title={project?.display_name ?? '打开本地项目'} disabled={busy} onClick={chooseProject} type="button">{project ? '重新打开项目' : '选择项目'}</button>
          <button className="icon-button" aria-label="全局搜索" title="全局搜索" onClick={() => openDialog('search', searchTriggerRef.current)} ref={searchTriggerRef} type="button">⌕<span aria-hidden="true">Global Search</span></button>
          <button aria-label="辅助抽屉" title="辅助抽屉" aria-controls="auxiliary-drawer" aria-expanded={drawerOpen} className="icon-button" onClick={() => setDrawerOpen((open) => !open)} ref={drawerTriggerRef} type="button">☷</button>
        </div>
      </header>

      {mode==='quick'?<CaseAssistantWorkspace api={assistantApi} projectId={project?.project_id??null} sources={sessions} initial={assistant} onChange={setAssistant} onOpenSource={owner=>void openAssistantSource(owner)} onChooseProject={()=>void chooseProject()}/>:<div className="desktop-layout">
        <aside aria-label="Project and Session navigation" className="session-rail pro-nav">
          <p className="eyebrow">PROFESSIONAL SESSION</p>
          <h2>{projection?.revision?.case_name ?? '专业分析'}</h2>
          <p className="revision-line">{projection?.revision ? `Case revision r${projection.revision.revision_sequence}` : '尚未打开 Case'}</p>
          <ProfessionalStages selectedStage={selectedStage} onSelectStage={setSelectedStage}/>
          <section className="professional-sessions" aria-label="项目与专业会话">
            <p className="eyebrow">{project?.display_name ?? '尚未选择项目'}</p>
            <button className="new-session-button" disabled={busy || pending} onClick={newSession} type="button">＋ 新建专业会话</button>
            <ul className="session-list">{sessions.map(session => <li key={session.session_id}><button aria-current={projection?.session?.session_id === session.session_id ? 'page' : undefined} disabled={busy || pending} onClick={() => openSession(session)} type="button">{session.display_name}</button></li>)}</ul>
            {!sessions.length && <p>暂无专业会话。选择项目后可创建分析。</p>}
          </section>
          <details className="recent-runs"><summary>最近运行 · {workSummary.label}</summary>{projection?.runs.length ? <ul className="session-list">{projection.runs.map((run,index) => <li key={run.run_id}>本地处理 {index+1} · {runLabel[run.status]}</li>)}</ul> : <p>没有本地处理记录</p>}</details>
        </aside>

        <main aria-label="Workspace" className="workspace" id="main-workspace">
          {mode === 'professional'
            ? <ProfessionalWorkspace selectedStage={selectedStage} workLabel={workSummary.label} onOpenQuick={formal ? ()=>{setAssistant(formal);setMode('quick');} : undefined}>
              {projection?.revision && projection.session && (selectedStage!=='执行反馈'||historical||projection.revision.previous_revision_id||projection.revision.integrity_state!=='ok') && <nav className="revision-navigation" aria-label="案例修订历史">
                <p>{historical ? '历史修订 · 只读' : '当前修订'} {projection.revision.revision_sequence} <span className="quiet-chip">{revisionLabel[projection.revision.state]}</span></p>
                {projection.revision.previous_revision_id && <button type="button" className="secondary-button" disabled={busy || pending} onClick={()=>void readRevision(projection.revision!.previous_revision_id!)}>查看上一修订</button>}
                {historical && <button type="button" className="secondary-button" disabled={busy || pending} onClick={()=>void readRevision(projection.session!.current_revision_id)}>返回当前修订</button>}
                {projection.revision.integrity_state !== 'ok' && <p role="status">此修订的引用证据损坏；原始字节和可读历史已保留。受损内容不可使用，可返回当前修订创建新的干净 Draft。</p>}
              </nav>}
              {selectedStage !== '新建分析' && businessError && <div role="alert"><strong>{businessError.message}</strong><p>{businessError.what_did_not_happen}</p><p>{businessError.preserved_authority}</p><p>{businessError.recovery_action}</p></div>}
              {selectedStage !== '新建分析' && pending && <p role="alert">结果待核对，写入已停用；请重新打开项目，不要重复发送。</p>}
              {selectedStage === '新建分析' && <form aria-busy={busy} className="case-form" onSubmit={event => { event.preventDefault(); void submitCase(); }}>
                <p aria-live="polite" id="case-status">{businessNotice}</p>
                {businessError && <div role="alert" id="case-error"><strong>{businessError.code === 'RESULT_PENDING' ? '结果待核对' : businessError.message}</strong><p>{businessError.what_did_not_happen}</p><p>{businessError.preserved_authority}</p><p>{businessError.recovery_action}</p></div>}
                {pending && <p role="alert">结果待核对，创建与保存已停用；请重新打开项目，不要重复发送。</p>}
                <div><label htmlFor="case-name">分析案例名称</label><input id="case-name" disabled={busy || pending || projection !== null} required value={caseName} onChange={event => setCaseName(event.target.value)} /></div>
                <div><label htmlFor="case-question">复购问题</label><textarea id="case-question" disabled={busy || pending || caseReadonly} rows={3} value={fields.question_text} onChange={event => setFields({ ...fields, question_text: event.target.value })} /></div>
                <div><label htmlFor="case-hypothesis">假设显示名称</label><input id="case-hypothesis" disabled={busy || pending || caseReadonly} value={fields.hypothesis_display_title} onChange={event => setFields({ ...fields, hypothesis_display_title: event.target.value })} /></div>
                <div><label htmlFor="case-context">业务背景</label><textarea id="case-context" disabled={busy || pending || caseReadonly} rows={2} value={fields.business_context} onChange={event => setFields({ ...fields, business_context: event.target.value })} /></div>
                <div><label htmlFor="case-alternatives">替代解释（每行一项）</label><textarea id="case-alternatives" aria-invalid={invalidAlternatives} aria-describedby={invalidAlternatives ? 'case-alternatives-error' : undefined} disabled={busy || pending || caseReadonly} rows={2} value={fields.alternative_explanations.join('\n')} onChange={event => setFields({ ...fields, alternative_explanations: event.target.value === '' ? [] : event.target.value.split('\n') })} />{invalidAlternatives && <p id="case-alternatives-error" role="alert">每项替代解释须包含非空白文字，请修改空白行；也可清空整个字段，不填写替代解释。</p>}</div>
                <p>{projection?.revision ? `${revisionLabel[projection.revision.state]} · 修订 ${projection.revision.revision_sequence}` : '创建本地分析案例，不开始计算。'}</p>
                <button aria-describedby="case-status" className="primary-button" disabled={busy || pending || invalidAlternatives || !project || !caseName.trim() || !!projection && !projection.capabilities.can_save_case_fields} type="submit">{busy ? '正在处理…' : projection ? '保存案例字段' : '创建分析'}</button>
                {!project && <p>请先选择项目。</p>}
              </form>}
              {selectedStage==='数据准备' && <DataPreparation key={projection?.revision?.revision_id??'none'} api={api} projection={projection} disabled={busy||pending} onProjection={acceptProjection} onFailure={showBusinessError} onUnknown={()=>{setPending(true);setBusinessNotice('结果待核对，请重新打开项目；不会自动重发。');}} />}
              {selectedStage==='本地处理' && <section className="workbench-card" aria-label="确定性本地分析">
                <h2>本地计算与独立复核</h2><p>使用两种独立方法核对同一快照；只有结果一致才生成分析证据。</p>
                <p role="status">{projection?.revision?.state==='Review'?'独立复核完成 · 可审阅结果':running?'本地处理运行中':projection?.confirmation?'已确认快照，等待显式开始':'尚无已确认快照，请先完成数据准备。'}</p>
                <button type="button" className="primary-button" disabled={busy||pending||!projection?.capabilities.can_start_analysis} onClick={()=>void analysisAction('start')}>开始本地处理</button>
                {running&&<button type="button" disabled={busy||pending||!projection?.capabilities.can_cancel_analysis} onClick={()=>void analysisAction('cancel')}>取消本地处理</button>}
                <ul className="run-history">{projection?.runs.map((run,index)=><li key={run.run_id}><strong>本地处理 {index+1} · {runLabel[run.status]}</strong><details><summary>运行身份与方法</summary>{run.status} · {run.run_id} · {run.terminal_reason??'无终止原因'} · DuckDB / Python · 最长 300 秒 · 自动重试 0</details>{(run.status==='Failed'||run.status==='Cancelled')&&<RunTerminalFailure run={run}/>}</li>)}</ul>
              </section>}
              {selectedStage!=='新建分析'&&<><p role="status" className={selectedStage==='执行反馈' && /^(项目已打开|会话已打开|选择本地项目)/.test(businessNotice)?'visually-hidden':undefined}>{businessNotice}</p>{businessError&&<div role="alert"><strong>{businessError.message}</strong><p>{businessError.what_did_not_happen}</p><p>{businessError.preserved_authority}</p><p>{businessError.recovery_action}</p></div>}{pending&&<p role="alert">结果待核对，写入已停用，请重新打开项目；不会自动重发。</p>}</>}
              {selectedStage==='循证分析' && <section className="workbench-card"><h2>已提交的分析证据</h2>{projection?.findings.length?projection.findings.map(finding=><section key={finding.finding_id}><FindingReview finding={finding}/><p>{projection.acceptances.some(a=>a.finding_id===finding.finding_id)?'本次结果已显式接受':'本次结果尚未接受'}</p><button type="button" className="primary-button" disabled={busy||pending||!projection.capabilities.can_accept_finding||projection.acceptances.some(a=>a.finding_id===finding.finding_id)} onClick={()=>void reviewAction('accept',finding.finding_id)}>接受本次分析结果</button></section>):<p>暂无可审阅的分析结果；失败或不一致不会产生判断。</p>}
                <label htmlFor="manual-evidence">手工证据解释（不改变计算结果）</label><textarea id="manual-evidence" rows={4} value={evidenceText} disabled={busy||pending||!projection?.capabilities.can_save_evidence_explanation} onChange={e=>setEvidenceText(e.target.value)}/><button type="button" disabled={busy||pending||!projection?.capabilities.can_save_evidence_explanation} onClick={()=>void reviewAction('save',{kind:'evidence_explanation',evidence_explanation_text:evidenceText})}>保存证据解释</button>
              </section>}
              {selectedStage==='报告'&&<section className="workbench-card"><h2>本地报告版本</h2><p role="status">{exportNotice}</p>{projection?.reports.length?<ReportVersions key={projection.projection_token} projection={projection} exportDisabled={busy||pending||!projection.capabilities.can_export_report} onExport={exportReport}/>:<p>暂无报告版本。</p>}</section>}
              {selectedStage==='执行反馈'&&<ProfessionalDecision projection={projection} formal={formal} disabled={busy||pending||historical} onBegin={()=>void beginCaseAssistant()} onRevise={()=>void businessAction(async()=>{if(!formal)return;const r=await assistantApi.request<AssistantProjection>({version:'1.0',operation:'revise',session_id:formal.session.id,decision_id:formal.current_decision_id!});if(r.ok){setAssistant(r.value);setMode('quick');}else setBusinessNotice(r.error.message);})} onExport={report_id=>void businessAction(async()=>{if(!formal)return;const r=await assistantApi.request({version:'1.0',operation:'export',session_id:formal.session.id,report_id,command_id:crypto.randomUUID()});setBusinessNotice(r.ok?'正式报告已导出。':r.error.message);})}/>}
              {selectedStage==='执行反馈'&&<details className="workbench-card original-closure" open={projection?.revision?.state!=='Completed'}><summary>手工决策路线 · 原 Decision Closure</summary><p>{projection?.revision?.state==='Completed'?'当前已有已完成闭环；后续重跑不会自动替换旧权威。':'先审阅并接受分析结果，再保存候选比较或证据不足路线，最后单独完成案例。'}</p><DecisionClosureEditor key={projection?.projection_token??'none'} initial={projection?.forms.at(-1)??null} disabled={busy||pending||!projection?.capabilities.can_save_decision_closure} canComplete={!!projection?.capabilities.can_complete_case&&!busy&&!pending} onSave={form=>reviewAction('save',form)} onComplete={()=>reviewAction('complete')}/><h3>决策表单处置历史</h3><ul aria-label="决策表单处置历史">{projection?.forms.map(form=><li key={form.form_id}>表单 {form.form_sequence} · {({draft:'已保存草稿',saved:'已保存闭环路线（不等于完成）',not_adopted:'不采纳此候选方案',deferred:'暂缓决策',more_evidence:'需要补证'})[form.disposition]}{form.disposition==='deferred'?` · ${form.defer_until??'未指定日期'}`:''} · {form.updated_at}</li>)}</ul><ul aria-label="闭环历史">{projection?.closures.map(closure=><li key={closure.closure_id}>{closure.route==='candidate_comparison'?'候选比较':'证据不足'} · {closure.completed_at} · 已完成分析案例（不是已执行行动）</li>)}</ul></details>}
              {projection?.revision&&['数据准备','本地处理','循证分析','报告'].includes(selectedStage)&&<p><button type="button" disabled={busy||pending||!projection.capabilities.can_create_draft_revision} onClick={()=>void analysisAction('draft')}>创建新数据修订</button> 修改数据选择将使用新修订；旧快照和证据保留。</p>}
              {projection?.revision&&projection.session&&['新建分析','循证分析','执行反馈'].includes(selectedStage)&&<AssistancePanel key={projection.revision.revision_id} api={api} projection={projection} stage={selectedStage} disabled={busy||pending||historical||projection.revision.integrity_state!=='ok'} onProjection={acceptProjection} onFailure={showBusinessError} onUnknown={()=>setPending(true)}/>}
              <div aria-label="专业模式能力" className="capability-row"><button type="button" onClick={event=>openDialog('skill',event.currentTarget)}>Skill · 会员复购分析</button><button type="button" onClick={event=>openDialog('prompt',event.currentTarget)}>Prompt · 循证分析措辞</button></div>
            </ProfessionalWorkspace>
            : <QuickWorkspace onOpenDialog={openDialog} onPreview={setPreviewNotice} previewNotice={previewNotice} />}
        </main>

        {drawerOpen ? (
          <aside aria-label="辅助抽屉内容" className="auxiliary-drawer" id="auxiliary-drawer">
            <div className="drawer-heading"><h2>辅助抽屉</h2><button aria-label="关闭辅助抽屉" className="icon-button" onClick={closeDrawer} type="button">×</button></div>
            <ContextInspector mode={mode} projection={projection} stage={selectedStage} projectName={project?.display_name} expanded />
            <p className="drawer-note">关闭抽屉后，主工作区、状态与返回入口仍可直接使用。</p>
          </aside>
        ) : (
          <aside aria-label="Inspector 概览" className="inspector-summary">
            {selectedStage==='执行反馈'?<ProfessionalControl projection={projection} formal={formal} onOriginalReport={()=>setSelectedStage('报告')} onFormalReport={id=>{const detail=document.getElementById('formal-report-'+id) as HTMLDetailsElement|null;if(detail){detail.open=true;detail.scrollIntoView({block:'start'});detail.querySelector('summary')?.focus();}}}/>:<><div className="drawer-heading"><h2>上下文</h2><button className="text-button" onClick={() => setDrawerOpen(true)} type="button">展开详情</button></div><ContextInspector mode={mode} projection={projection} stage={selectedStage} projectName={project?.display_name} expanded={false}/></>}
          </aside>
        )}
      </div>}

      {mode==='quick'&&drawerOpen&&<aside aria-label="辅助抽屉内容" className="auxiliary-drawer quick-auxiliary" id="auxiliary-drawer"><div className="drawer-heading"><h2>辅助抽屉</h2><button aria-label="关闭辅助抽屉" className="icon-button" onClick={closeDrawer} type="button">×</button></div><ContextInspector mode={mode} projection={projection} stage={selectedStage} projectName={project?.display_name} expanded/><p className="drawer-note">关闭抽屉后，主工作区、状态与返回入口仍可直接使用。</p></aside>}

      <footer aria-label="Status" className="statusbar">
        <span><span className="status-dot online" />离线 · 本地模式</span><span>当前模式：<strong>{mode === 'quick' ? '快速模式' : '专业模式'}</strong></span><span>模型可见边界：{workSummary.modelBoundary}</span><span>运行状态：{workSummary.label}</span><button className="return-button" type="button" disabled={!workSummary.target} onClick={()=>{if(workSummary.target){setMode('professional');setSelectedStage(workSummary.target);}}}>返回后台工作 · {workSummary.target?(activeAttempt?'模型辅助':'本地处理'):'无活动项'}</button>
      </footer>

      <dialog aria-labelledby="desktop-dialog-title" aria-modal="true" className="desktop-dialog" onCancel={(event) => { event.preventDefault(); closeDialog(); }} onKeyDown={trapModalFocus} ref={dialogRef}>
        <div className="dialog-heading"><h2 id="desktop-dialog-title">{dialogTitle}</h2><button aria-label={`关闭${dialogTitle}`} className="icon-button" onClick={closeDialog} type="button">×</button></div>
        {activeDialog === 'search' ? <SearchDialog /> : null}
        {activeDialog === 'skill' ? <CapabilityDialog capability="Skill" /> : null}
        {activeDialog === 'prompt' ? <CapabilityDialog capability="Prompt" /> : null}
        <div className="dialog-actions"><button className="secondary-button" onClick={closeDialog} type="button">关闭</button></div>
      </dialog>
    </div>
  );
}

function AssistancePanel({api,projection,stage,disabled,onProjection,onFailure,onUnknown}:{api:XanthilDesktopApi;projection:DesktopProjection;stage:ProfessionalStage;disabled:boolean;onProjection:(p:DesktopProjection)=>void;onFailure:(e:DesktopFailure)=>void;onUnknown:()=>void}){
  const settings=useProviderSettings();
  const [legacyProvider,setProvider]=useState(''),[legacyModel,setModel]=useState(''),[preview,setPreview]=useState<DisclosurePreview|null>(null),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('可选辅助只产生待审草稿；未配置模型时继续手工编辑。');
  const provider=settings.managed?'xiaomi-token-plan-cn':legacyProvider,model=settings.managed?'mimo-v2.6-pro':legacyModel;
  const [expanded,setExpanded]=useState(projection.assistance_drafts.some(d=>d.disposition==='pending'));
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null),active=useRef(false),restoreFocus=useRef(false);
  const revision=projection.revision!,session=projection.session!,running=projection.attempts.find(a=>a.status==='Running');
  const action=stage==='新建分析'?'organize_question':stage==='循证分析'?'explain_evidence':'draft_candidates';
  useEffect(()=>{if(running||projection.assistance_drafts.some(d=>d.disposition==='pending'))setExpanded(true);},[running,projection.assistance_drafts]);
  const label=action==='organize_question'?'帮我整理问题':action==='explain_evidence'?'帮我解释证据':'帮我起草候选';
  const eligible=action==='organize_question'?['Draft','Ready'].includes(revision.state)&&projection.findings.length===0:action==='explain_evidence'?revision.state==='Review':revision.state==='Review'&&projection.acceptances.some(a=>a.finding_id===projection.findings.at(-1)?.finding_id);
  const owner={project_id:session.project_id,session_id:session.session_id,case_id:session.case_id,revision_id:revision.revision_id};
  const command=()=>({contract_version:'1.0' as const,command_id:crypto.randomUUID(),...owner,expected_row_version:revision.row_version});
  const close=()=>{restoreFocus.current=true;setPreview(null);dialog.current?.close();};
  useEffect(()=>{if(!busy&&!preview&&restoreFocus.current){restoreFocus.current=false;trigger.current?.focus();}},[busy,preview]);
  const execute=async(fn:()=>Promise<void>)=>{if(active.current)return;active.current=true;setBusy(true);try{await fn();}catch{onUnknown();setNotice('结果待核对；不会自动重发，请重新打开项目。');}finally{active.current=false;setBusy(false);}};
  useEffect(()=>{if(preview){dialog.current?.showModal();}},[preview]);
  const prepare=(element:HTMLElement)=>void execute(async()=>{trigger.current=element;const result=await api.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:revision.row_version,action_kind:action,requested_provider:provider,requested_model:model});if(!result.ok){onFailure(result.error);return;}setConfirmed(false);setPreview(result.value);});
  const decide=(decision:'accepted'|'refused')=>void execute(async()=>{if(!preview)return;const result=await api.decideAssistanceDisclosure({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision,free_text_confirmed:decision==='accepted'&&confirmed});if(!result.ok){onFailure(result.error);return;}onProjection(result.value);close();setNotice(decision==='refused'?'已拒绝；未创建 Attempt，继续手工编辑。':'已记录披露；尚未发送。');});
  const accepted=projection.disclosures.findLast(d=>d.decision==='accepted'&&d.action_kind===action&&!projection.attempts.some(a=>a.disclosure_id===d.disclosure_id));
  return <details className="workbench-card assistance-panel" aria-label="可选模型辅助" aria-busy={busy} open={expanded} onToggle={event=>setExpanded(event.currentTarget.open)}><summary>可选模型辅助 · 人工审阅后采用</summary><p role="status">{notice}</p><p>仅发送已保存的案例字段；编辑后请先保存，再重新核对披露。模型接入与此次任务的数据授权分开处理。</p>
    {settings.managed?<p>Xiaomi Token Plan · MiMo 2.6 Pro · {settings.label} <button type="button" onClick={e=>settings.open(e.currentTarget)}>模型接入</button></p>:<><label>请求的提供方<input value={provider} disabled={busy||disabled} onChange={e=>setProvider(e.target.value)}/></label><label>请求的模型<input value={model} disabled={busy||disabled} onChange={e=>setModel(e.target.value)}/></label></>}
    <button type="button" disabled={(settings.managed&&settings.status?.state!=='configured')||disabled||busy||!eligible||!!running||projection.runs.some(r=>r.status==='Running')||!provider.trim()||!model.trim()} onClick={e=>prepare(e.currentTarget)}>{label}</button>
    {accepted&&<button type="button" disabled={disabled||busy||!!running} onClick={()=>void execute(async()=>{const result=await api.startAssistance({...command(),disclosure_id:accepted.disclosure_id});if(!result.ok){onFailure(result.error);return;}onProjection(result.value);setNotice('请求已准入；取消不能撤回已发送内容。');})}>发送本次已确认请求</button>}
    {running&&<button type="button" disabled={disabled||busy} onClick={()=>void execute(async()=>{const result=await api.cancelAssistance({...command(),attempt_id:running.attempt_id});if(!result.ok){onFailure(result.error);return;}onProjection(result.value);setNotice('已取消后续采用；已发送载荷无法撤回。');})}>取消辅助请求</button>}
    <ul aria-label="辅助请求历史">{projection.attempts.map(a=><li key={a.attempt_id}>{a.action_kind} · {a.status} · {a.terminal_reason??'无终止原因'} · 请求 {a.requested_provider}/{a.requested_model} · 实得 {a.actual_provider??'未观察'}/{a.actual_model??'未观察'}{(a.status==='Failed'||a.status==='Cancelled')&&<AssistanceTerminalFailure attempt={a}/>}</li>)}</ul>
    {projection.assistance_drafts.filter(d=>d.draft_kind===({organize_question:'question_fields',explain_evidence:'evidence_explanation',draft_candidates:'candidates'} as const)[action]).map(d=><AssistanceDraftEditor key={`${d.draft_id}:${d.disposition}`} draft={d} disabled={disabled||busy||!!running||!eligible} onDispose={(disposition,edited_content)=>execute(async()=>{const result=await api.disposeAssistanceDraft({...command(),draft_id:d.draft_id,disposition,edited_content});if(!result.ok){onFailure(result.error);return;}onProjection(result.value);setNotice(disposition==='adopted'?'草稿已采用；没有接受 Finding 或完成案例。':'草稿已拒绝；手工字段保持不变。');})}/>)}
    <dialog ref={dialog} aria-labelledby="assistance-disclosure-title" className="desktop-dialog" onCancel={e=>{e.preventDefault();if(!busy)close();}} onKeyDown={e=>{if(e.key!=='Tab')return;const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])')),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}>
      <h2 id="assistance-disclosure-title">逐次模型披露</h2>{preview&&<><p>请求 {preview.requested_provider} / {preview.requested_model}</p><p>{preview.irretractability_notice}</p><p>成本：{preview.cost_notice??'未知，尚无报价'}</p><p>类别：{preview.categories.join('、')}</p><pre aria-label="精确发送载荷" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{preview.payload_text}</pre><code aria-label="载荷 SHA-256">{preview.payload_sha256}</code><label><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>我已检查自由文本，不含不应发送的敏感内容</label><button type="button" disabled={busy||(preview.free_text_present&&!confirmed)} onClick={()=>decide('accepted')}>确认此次披露</button><button type="button" disabled={busy} onClick={()=>decide('refused')}>拒绝此次发送</button></>}
    </dialog>
  </details>;
}

function RunTerminalFailure({run}:{run:DesktopProjection['runs'][number]}){
  const reasons:Record<string,string>={user_cancelled:'本地处理已取消。',deadline_exceeded:'本地处理已达到时间上限。',interrupted:'本地处理因运行中断而结束。',source_changed:'计算输入源发生变化。',toolchain_unavailable:'所需本地计算工具不可用。',calculation_failed:'本地计算失败。',validation_mismatch:'DuckDB 与 Python 独立复核结果不一致。',run_artifact_failed:'运行证据未能完整写入或核验。',publication_failed:'结果证据发布失败。',integrity_blocked:'运行输入或证据完整性校验失败。'};
  return <div><p>原因：{reasons[run.terminal_reason??'']??'本地处理未成功完成。'}</p><p>未发生：本次失败未产生可接受的新 Finding，不会自动重试、接受结果或完成案例。</p><p>保留：确认快照、失败 Run 和已有证据保留；既有成功结果及人工决策不会被这次失败替换。</p><p>下一步：核对原因和确认快照；需要再次计算时明确启动新的 Run，不重发旧命令或清理历史。</p></div>;
}

function AssistanceTerminalFailure({attempt}:{attempt:DesktopProjection['attempts'][number]}){
  const reason=attempt.terminal_reason==='user_cancelled'?'辅助请求已取消。':attempt.terminal_reason==='deadline_exceeded'?'辅助请求已达到时间上限。':attempt.terminal_reason==='interrupted'?'辅助请求因运行中断而结束。':attempt.terminal_reason==='validation_failed'?'模型返回未通过草稿格式与内容校验。':'模型请求失败，未获得可用草稿。';
  return <div><p>原因：{reason}</p><p>未发生：该 Attempt 未形成可采用的成功草稿，不会自动重试；已发送内容不能撤回。</p><p>保留：披露和 Attempt 终态保留；已有手工内容、计算结果及人工决策不由这次失败改写。</p><p>下一步：继续手工编辑；若要再次请求，先重新核对并明确确认新的披露。</p></div>;
}

function AssistanceDraftEditor({draft,disabled,onDispose}:{draft:DesktopProjection['assistance_drafts'][number];disabled:boolean;onDispose:(d:'adopted'|'rejected',content:AssistanceDraftContent)=>Promise<void>}){
  const [content,setContent]=useState<AssistanceDraftContent>(draft.edited_content??draft.generated_content);
  const title=({question_fields:'问题草稿',evidence_explanation:'证据解释草稿',candidates:'候选草稿'})[draft.draft_kind],status=({pending:'待审',adopted:'已采用',rejected:'已拒绝'})[draft.disposition],locked=disabled||draft.disposition!=='pending';
  return <section aria-label={`${title} · ${status}`} className="workbench-card"><h3>{title} · {status}</h3><p>模型建议不可信，须人工核对。采用只更新表单，不改变计算、Finding、接受、首选项或闭环。</p>
    <fieldset disabled={locked}><legend>编辑辅助草稿</legend>
      {'question_text' in content&&<><label>草稿复购问题<textarea aria-label="草稿复购问题" value={content.question_text} onChange={e=>setContent({...content,question_text:e.target.value})}/></label><label>草稿假设显示名称<input aria-label="草稿假设显示名称" value={content.hypothesis_display_title} onChange={e=>setContent({...content,hypothesis_display_title:e.target.value})}/></label><label>草稿业务背景<textarea aria-label="草稿业务背景" value={content.business_context} onChange={e=>setContent({...content,business_context:e.target.value})}/></label><label>草稿替代解释（每行一项）<textarea aria-label="草稿替代解释（每行一项）" value={content.alternative_explanations.join('\n')} onChange={e=>setContent({...content,alternative_explanations:e.target.value===''?[]:e.target.value.split('\n')})}/></label></>}
      {'evidence_explanation_text' in content&&<label>草稿证据解释<textarea aria-label="草稿证据解释" value={content.evidence_explanation_text} onChange={e=>setContent({...content,evidence_explanation_text:e.target.value})}/></label>}
      {'candidates' in content&&content.candidates.map((candidate,index)=><fieldset key={candidate.candidate_id}><legend>草稿候选 {index+1}</legend>{([['title','草稿候选标题'],['evidence_basis','草稿证据依据'],['risk_or_refutation','草稿风险或反证'],['applicability_conditions','草稿适用条件'],['future_validation_metric','草稿后续验证指标']] as const).map(([key,label])=><label key={key}>{label}<textarea aria-label={label} value={candidate[key]} onChange={e=>setContent({candidates:content.candidates.map((c,i)=>i===index?{...c,[key]:e.target.value}:c)})}/></label>)}</fieldset>)}
      <button type="button" onClick={()=>void onDispose('adopted',content)}>采用此草稿</button><button type="button" onClick={()=>void onDispose('rejected',content)}>拒绝此草稿</button>
    </fieldset>
  </section>;
}

function exactFraction(value: Readonly<{ numerator: string; denominator: string }>) { return `${value.numerator} / ${value.denominator}`; }

function FindingReview({ finding }: Readonly<{ finding: DesktopProjection['findings'][number] }>) {
  // Store admission validates the closed metrics before they reach this read-only projection.
  const metrics = JSON.parse(finding.metrics) as DesktopCalculationResult;
  const { comparison, current } = metrics.periods;
  const relative = (value: DesktopCalculationResult['changes']['active_member_count']['relative_change']) => value === 'not_applicable' ? '不适用（对比期基数为零）' : exactFraction(value);
  const judgment = finding.judgment === 'Confirmed' ? '当前期复购率低于对比期；证据支持 H1 的关联判断，不证明原因。' : finding.judgment === 'Rejected' ? '当前期复购率未低于对比期；本次证据不支持 H1。' : '至少一期活跃成员分母为零，无法作出可比较的判断。';
  return <article className="finding-review">
    <div className="hypothesis-heading"><span className="hypothesis-id">H1</span><h3>当前期复购率低于对比期</h3><span className={`judgment-badge judgment-${finding.judgment}`}>{finding.judgment==='Confirmed'?'证据支持':finding.judgment==='Rejected'?'证据不支持':'证据不足'}</span></div><p>{judgment}</p>
    <div className="metric-scroll"><table aria-label="两期复购指标"><caption>两期复购指标 · CNY / Asia/Shanghai</caption><thead><tr><th scope="col">指标与单位</th><th scope="col">对比期</th><th scope="col">当前期</th></tr></thead><tbody>
      <tr><th scope="row">活跃成员数（人，复购率分母）</th><td>{comparison.active_member_count}</td><td>{current.active_member_count}</td></tr>
      <tr><th scope="row">复购成员数（人）</th><td>{comparison.repeat_member_count}</td><td>{current.repeat_member_count}</td></tr>
      <tr><th scope="row">复购率（复购成员 / 活跃成员）</th><td>{comparison.repeat_member_count} / {comparison.active_member_count}{comparison.active_member_count==='0'?'（不适用）':`，精确值 ${exactFraction(comparison.repurchase_rate)}`}</td><td>{current.repeat_member_count} / {current.active_member_count}{current.active_member_count==='0'?'（不适用）':`，精确值 ${exactFraction(current.repurchase_rate)}`}</td></tr>
      <tr><th scope="row">复购收入（分）</th><td>{comparison.repeat_revenue_fen}</td><td>{current.repeat_revenue_fen}</td></tr>
    </tbody></table></div>
    <p>活跃成员为期内有有效订单的成员；复购成员为期内至少两笔有效订单的成员。复购收入只计每位成员期内第二笔及以后的有效订单，不是全部订单收入。</p>
    <div className="metric-scroll"><table aria-label="指标变化"><caption>指标变化 · 当前期减对比期</caption><thead><tr><th scope="col">指标</th><th scope="col">绝对差异</th><th scope="col">相对差异（精确分数）</th></tr></thead><tbody>
      <tr><th scope="row">活跃成员数</th><td>{metrics.changes.active_member_count.absolute_delta} 人</td><td>{relative(metrics.changes.active_member_count.relative_change)}</td></tr>
      <tr><th scope="row">复购成员数</th><td>{metrics.changes.repeat_member_count.absolute_delta} 人</td><td>{relative(metrics.changes.repeat_member_count.relative_change)}</td></tr>
      <tr><th scope="row">复购率</th><td>{exactFraction(metrics.changes.repurchase_rate.absolute_delta)}</td><td>{relative(metrics.changes.repurchase_rate.relative_change)}</td></tr>
      <tr><th scope="row">复购收入</th><td>{metrics.changes.repeat_revenue_fen.absolute_delta} 分</td><td>{relative(metrics.changes.repeat_revenue_fen.relative_change)}</td></tr>
    </tbody></table></div>
    <h4>分组贡献（M2）</h4>{metrics.m2.status === 'not_applicable' ? <p>不适用：本次没有选择成员分组，不臆造分组结论。</p> : <><p>按确认的成员分组计算复购收入变化；只显示脱敏分组序号，不显示原始组名。贡献为当前期减对比期，不代表原因。</p><div className="metric-scroll"><table aria-label="分组复购收入贡献"><thead><tr><th scope="col">分组</th><th scope="col">对比期（分）</th><th scope="col">当前期（分）</th><th scope="col">贡献（分）</th></tr></thead><tbody>{metrics.m2.groups.map((group,index)=><tr key={group.group_id}><th scope="row">分组 {index+1}</th><td>{group.comparison_repeat_revenue_fen}</td><td>{group.current_repeat_revenue_fen}</td><td>{group.absolute_delta}</td></tr>)}</tbody></table></div></>}
    <h4>支持、反证与限制</h4><p>{judgment}</p><p>DuckDB 主计算与 Python 独立复算一致。关联不等于因果；不进行显著性检验；结论仅限已确认的本地快照，不能外推真实效果。</p>
    <details><summary>精确指标与证据身份（技术信息）</summary><p>正式判断：{finding.judgment}</p><pre>{finding.metrics}</pre><ul>{finding.evidence_refs.map(x=><li key={x}>{x}</li>)}</ul><p>{finding.refutation}</p><ul>{finding.supporting_evidence.concat(finding.limitations).map(x=><li key={x}>{x}</li>)}</ul></details>
    <p>计算结果、显式接受与决策闭环是独立事实；此页面不执行外部行动。</p>
  </article>;
}

type DecisionForm=Extract<SaveFormInput,{kind:'decision_closure'}>;
export function DecisionClosureEditor({initial,disabled,canComplete,onSave,onComplete}:Readonly<{initial:DesktopProjection['forms'][number]|null;disabled:boolean;canComplete:boolean;onSave:(form:DecisionForm)=>Promise<void>;onComplete:()=>Promise<void>}>){
  const [form,setForm]=useState<DecisionForm>(initial?{kind:'decision_closure',candidates:initial.candidates,route:initial.route,insufficient_reason:initial.insufficient_reason,preferred_candidate_id:initial.preferred_candidate_id,preferred_reason:initial.preferred_reason,disposition:'draft',defer_until:initial.defer_until}:{kind:'decision_closure',candidates:[],route:null,insufficient_reason:null,preferred_candidate_id:null,preferred_reason:null,disposition:'draft',defer_until:null});
  const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[deferUntil,setDeferUntil]=useState(initial?.defer_until??'');
  const change=(next:DecisionForm)=>{setForm(next);setDirty(true);};
  const nonblank=(value:string|null)=>value!==null&&/[^\p{White_Space}]/u.test(value);
  const valid=form.route==='insufficient_evidence'?nonblank(form.insufficient_reason):form.route==='candidate_comparison'&&form.candidates.length>=2&&form.candidates.every(c=>[c.title,c.evidence_basis,c.risk_or_refutation,c.applicability_conditions,c.future_validation_metric].every(nonblank))&&(form.preferred_candidate_id===null||nonblank(form.preferred_reason));
  const save=async(disposition:DecisionForm['disposition'])=>{if(disabled||saving)return;setSaving(true);try{await onSave({...form,disposition,defer_until:disposition==='deferred'&&deferUntil!==''?deferUntil:null});}finally{setSaving(false);}};
  const candidateFields=[['title','候选标题'],['evidence_basis','证据依据'],['risk_or_refutation','风险或反证'],['applicability_conditions','适用条件'],['future_validation_metric','后续验证指标']] as const;
  return <section className="decision-editor" aria-label="决策闭环表单" aria-busy={saving}>
    <p id="decision-help">比较至少两个完整候选，或说明为何证据不足。保存路线后仍需单独完成案例。</p>
    <label htmlFor="decision-route">闭环路线</label><select id="decision-route" disabled={disabled||saving} value={form.route??''} onChange={event=>{const route=event.target.value;change({...form,route:route==='candidate_comparison'||route==='insufficient_evidence'?route:null,preferred_candidate_id:null,preferred_reason:null,insufficient_reason:route==='insufficient_evidence'?form.insufficient_reason:null});}}><option value="">尚未选择</option><option value="candidate_comparison">候选比较</option><option value="insufficient_evidence">证据不足</option></select>
    {form.route!=='insufficient_evidence'&&<><button type="button" disabled={disabled||saving} onClick={()=>change({...form,candidates:[...form.candidates,{candidate_id:crypto.randomUUID(),title:'',evidence_basis:'',risk_or_refutation:'',applicability_conditions:'',future_validation_metric:''}]})}>新增候选</button>
      {form.candidates.map((candidate,index)=><fieldset key={candidate.candidate_id} disabled={disabled||saving}><legend>候选 {index+1}</legend>{candidateFields.map(([key,label])=><div key={key}><label htmlFor={`candidate-${candidate.candidate_id}-${key}`}>{label}</label><textarea id={`candidate-${candidate.candidate_id}-${key}`} value={candidate[key]} rows={2} onChange={event=>change({...form,candidates:form.candidates.map(item=>item.candidate_id===candidate.candidate_id?{...item,[key]:event.target.value}:item)})}/></div>)}<button type="button" onClick={()=>change({...form,candidates:[...form.candidates,{...candidate,candidate_id:crypto.randomUUID()}]})}>复制候选 {index+1}</button><button type="button" onClick={()=>change({...form,candidates:form.candidates.filter(c=>c.candidate_id!==candidate.candidate_id),preferred_candidate_id:form.preferred_candidate_id===candidate.candidate_id?null:form.preferred_candidate_id,preferred_reason:form.preferred_candidate_id===candidate.candidate_id?null:form.preferred_reason})}>移除候选 {index+1}</button></fieldset>)}
      <label htmlFor="preferred-candidate">首选候选（可不选）</label><select id="preferred-candidate" disabled={disabled||saving} value={form.preferred_candidate_id??''} onChange={event=>change({...form,preferred_candidate_id:event.target.value||null,preferred_reason:event.target.value?form.preferred_reason:null})}><option value="">无首选</option>{form.candidates.map((c,i)=><option key={c.candidate_id} value={c.candidate_id}>{c.title||`候选 ${i+1}`}</option>)}</select>{form.preferred_candidate_id&&<><label htmlFor="preferred-reason">首选理由</label><textarea id="preferred-reason" disabled={disabled||saving} value={form.preferred_reason??''} onChange={event=>change({...form,preferred_reason:event.target.value})}/></>}
    </>}
    {form.route==='insufficient_evidence'&&<><label htmlFor="insufficient-reason">证据不足原因</label><textarea id="insufficient-reason" rows={4} disabled={disabled||saving} value={form.insufficient_reason??''} onChange={event=>change({...form,insufficient_reason:event.target.value})}/><p>此路线没有首选候选；不强迫生成建议。</p></>}
    <p id="decision-validity">{valid?'路线内容完整，可保存后再单独完成。':'路线尚未完整；可以保存草稿，不可完成。'}</p>
    <button type="button" disabled={disabled||saving} onClick={()=>void save('draft')}>保存草稿</button><button type="button" className="primary-button" aria-describedby="decision-validity" disabled={disabled||saving||!valid} onClick={()=>void save('saved')}>保存闭环路线</button>
    <fieldset disabled={disabled||saving}><legend>暂不闭环</legend><p>以下处置针对本表单中的候选方案或当前决策，不代表完成或执行行动。</p><button type="button" disabled={form.candidates.length===0} onClick={()=>void save('not_adopted')}>不采纳此候选方案</button><label htmlFor="defer-until">暂缓到（可不填）</label><input id="defer-until" type="date" value={deferUntil} onChange={event=>{setDeferUntil(event.target.value);setDirty(true);}}/><p>再次暂缓会保留显示的日期；清空日期后保存，明确记为未指定日期，旧处置仍保留。</p><button type="button" onClick={()=>void save('deferred')}>暂缓决策</button><button type="button" onClick={()=>void save('more_evidence')}>需要补证</button></fieldset>
    <p>只有已接受的分析结果与最新已保存路线才可完成；未保存修改时请先保存。</p><button type="button" className="primary-button" disabled={disabled||saving||dirty||!canComplete} onClick={()=>void onComplete()}>完成分析案例</button>
  </section>;
}

function ReportVersions({projection,exportDisabled,onExport}:Readonly<{projection:DesktopProjection;exportDisabled:boolean;onExport:(reportId:string)=>Promise<void>}>){
  const [selected,setSelected]=useState(projection.revision?.current_report_id??projection.reports.at(-1)?.report_id);
  const report=projection.reports.find(item=>item.report_id===selected);
  return <><label htmlFor="report-version">报告版本历史</label><select id="report-version" value={selected} onChange={event=>setSelected(event.target.value)}>{projection.reports.map(item=><option key={item.report_id} value={item.report_id}>修订报告 {item.version_sequence} · {item.state==='final'?(projection.revision?.current_report_id===item.report_id?'当前最终报告':'历史最终报告'):'分析草稿'}</option>)}</select>{report&&<><ReportReview report={report} projection={projection}/><button type="button" className="primary-button" disabled={exportDisabled} onClick={()=>void onExport(report.report_id)}>导出报告 {report.version_sequence}（Markdown / HTML）</button></>}</>;
}

function ReportReview({ report,projection }: Readonly<{ report: DesktopProjection['reports'][number];projection:DesktopProjection }>) {
  const review = report.review_content;
  const targetId = (reference: string) => `evidence-${reference.replace(':', '-')}`;
  const finding=projection.findings.find(f=>f.finding_id===report.finding_id),closure=projection.closures.find(c=>c.closure_id===report.closure_id),form=projection.forms.find(f=>f.form_id===closure?.form_id);
  return <article className="report-review"><h3>修订报告 {report.version_sequence} · {report.state==='final'?(projection.revision?.current_report_id===report.report_id?'当前最终报告':'历史最终报告（保留原文）'):'分析草稿'}</h3><p>{report.acceptance_id?'形成时已接受':'形成时未接受'} · {report.closure_id?'形成时已闭环':'形成时未闭环'}；这些标记是报告形成时状态，不代表外部目标当前情况。</p>
    {finding&&<FindingReview finding={finding}/>}{form&&<section aria-label="报告决策路线"><h4>{form.route==='candidate_comparison'?'候选比较':'证据不足'}</h4>{form.route==='insufficient_evidence'?<p>{form.insufficient_reason}</p>:form.candidates.map(candidate=><section key={candidate.candidate_id}><h5>{candidate.title}{form.preferred_candidate_id===candidate.candidate_id?' · 首选':''}</h5><dl><dt>证据依据</dt><dd>{candidate.evidence_basis}</dd><dt>风险或反证</dt><dd>{candidate.risk_or_refutation}</dd><dt>适用条件</dt><dd>{candidate.applicability_conditions}</dd><dt>后续验证指标</dt><dd>{candidate.future_validation_metric}</dd></dl></section>)}{form.preferred_reason&&<p>首选理由：{form.preferred_reason}</p>}<p>未执行外部 Action；未声明 Outcome。</p></section>}
    {review ? <><details><summary>报告完整原文（含技术身份）</summary><section aria-label="报告草稿正文">{review.markdown_text.split(/(```[\s\S]*?```)/u).map((block,index)=>block.startsWith('```')?<details key={index}><summary>{block.startsWith('```json')?'精确计算数据（技术原文）':'来源与方法身份（技术原文）'}</summary><pre>{block}</pre></details>:<pre key={index}>{block}</pre>)}</section></details>
      <nav aria-label="报告证据回链"><ul>{review.evidence.map(item=><li key={item.evidence_ref}><a href={`#${targetId(item.evidence_ref)}`} onClick={event=>{event.preventDefault();const target=document.getElementById(targetId(item.evidence_ref));const detail=target?.querySelector('details');if(detail)detail.open=true;target?.focus();target?.scrollIntoView({block:'start'});}}>{item.title}</a></li>)}</ul></nav>
      {review.evidence.map(item=><section className="report-evidence" key={item.evidence_ref} id={targetId(item.evidence_ref)} tabIndex={-1} aria-label={item.title}><h4>{item.title}</h4><details><summary>展开只读证据原文</summary><pre>{item.content}</pre></details></section>)}</>
      : <p role="status">报告或引用证据损坏，正文不可用；原始字节保留，不使用未经核验的内容。</p>}
    <details><summary>报告身份（技术信息）</summary><p>{report.report_id}</p><p>HTML SHA-256：{report.html_sha256}</p></details>
  </article>;
}

const stageEnglish = ['New analysis','数据准备','Local processing','Evidence-based analysis','Report','Execution feedback'];
const stageNotes = ['帮我整理问题 · 逐次披露','数据范围与快照','DuckDB + Python','帮我解释证据 · 固定方法不变','Finding / 报告历史','原 Decision Closure 保持'];
function ProfessionalStages({selectedStage,onSelectStage}:{selectedStage:ProfessionalStage;onSelectStage:(stage:ProfessionalStage)=>void}) {
  return <nav aria-label="专业模式阶段" className="professional-stages">{professionalStages.map((stage,index)=><button type="button" key={stage} aria-label={`${index+1} ${stage}`} aria-current={selectedStage===stage?'step':undefined} className={selectedStage===stage?'stage-button active':'stage-button'} onClick={()=>onSelectStage(stage)}><span className="stage-number">{index+1}</span><span><strong>{stageEnglish[index]}<span className="visually-hidden"> · {stage}</span></strong><small>{stageNotes[index]}</small></span></button>)}</nav>;
}
function ProfessionalWorkspace({selectedStage,children,workLabel,onOpenQuick}:Readonly<{selectedStage:ProfessionalStage;children:React.ReactNode;workLabel:string;onOpenQuick?:()=>void}>) {
 const panel=professionalPanels[selectedStage];
 return <section aria-labelledby="professional-workspace-heading" className="professional-workspace">
  <header className="pro-header"><div><p className="eyebrow">阶段 {professionalStages.indexOf(selectedStage)+1} / {stageEnglish[professionalStages.indexOf(selectedStage)]?.toUpperCase()}</p><h1 id="professional-workspace-heading">{selectedStage==='执行反馈'?'在原分析 Closure 之后记录正式决定':panel.title}</h1></div>{selectedStage==='执行反馈'&&onOpenQuick&&<button className="secondary-button" type="button" onClick={onOpenQuick}>打开关联 Quick Session</button>}</header>
  {selectedStage!=='执行反馈'&&<><p className="workspace-description">{selectedStage==='新建分析'?'在选定项目内创建专业会话，记录复购问题与假设。可选问题辅助须先逐次披露并明确发送。':panel.description}</p><p className="workspace-boundary">{selectedStage==='新建分析'?'手工字段保持本地 · 可选模型辅助单独确认':panel.boundary}</p></>}
  {children}<p className="workspace-footer">{workLabel==='空闲'?'没有运行中的任务':workLabel} · 切换模式不会取消或转换工作。</p>
 </section>;
}
function associatedFormal(projection:DesktopProjection|null,formal:AssistantProjection|null):AssistantProjection|null {
 const session=projection?.session,revision=projection?.revision;
 if(!session||!revision||!formal)return null;
 const owner={project_id:session.project_id,session_id:session.session_id,case_id:session.case_id,revision_id:revision.revision_id};
 return (Object.keys(owner) as (keyof typeof owner)[]).every(key=>formal.session.source[key]===owner[key]&&formal.source.owner[key]===owner[key])?formal:null;
}
function ProfessionalDecision({projection,formal,disabled,onBegin,onRevise,onExport}:{projection:DesktopProjection|null;formal:AssistantProjection|null;disabled:boolean;onBegin:()=>void;onRevise:()=>void;onExport:(id:string)=>void}) {
 formal=associatedFormal(projection,formal);
 const finding=projection?.findings.find(f=>f.finding_id===projection.revision?.current_finding_id),decision=formal?.decisions.find(d=>d.id===formal.current_decision_id),report=formal?.reports.at(-1),original=projection?.reports.find(r=>r.report_id===projection.revision?.current_report_id);
 const eligible=projection?.revision?.state==='Completed'&&projection.revision.integrity_state==='ok';
 const accepted=projection?.findings.filter(f=>projection.acceptances.some(a=>a.finding_id===f.finding_id)).length??0;
 return <section className="ca-stage-six">
  <section className="pro-summary-grid" aria-label="Case 摘要">
   <article><span>已验证 Evidence</span><strong>{finding?.evidence_refs.length??0}</strong><small>来源可追踪</small></article>
   <article><span>已采纳 Finding</span><strong>{accepted}</strong><small>人工确认</small></article>
   <article><span>分析限制</span><strong>{finding?.limitations.length??0}</strong><small>必须进入决策</small></article>
   <article><span>当前报告</span><strong>{report?'v'+report.sequence:original?'v'+original.version_sequence:'暂无'}</strong><small>{report?'原 final report 保留 · 只读':original?original.state+' · 当前':'尚未生成报告'}</small></article>
  </section>
  <section className="pro-card case-assistant-entry"><div className="assistant-orb" aria-hidden="true">✦</div><div><p className="eyebrow">MULTI-TURN CASE ASSISTANT</p><h2>{decision?'Decision Record 已采纳':'用 Case Assistant 记录正式决定'}</h2><p>{decision?`正式决定与 Expected Outcome 已记录，报告 v${report?.sequence} 已追加；来源分析与原 Closure 保持。`:'在独立快速会话中比较已保存候选、补齐责任与预期结果。Agent 只能形成待采纳草案。'}</p><div className="boundary-pills"><span>读取已验证证据</span><span>只读工具</span><span>用户采纳</span><span>不执行行动</span></div>{!eligible&&<p role="status">{formal?.source.missing.join('；')||'请先完成数据快照、证据采纳、Decision Closure 与 final report。'}</p>}</div><button type="button" aria-label="用 Case Assistant 完成决策" className="primary-button" disabled={disabled||!eligible} onClick={onBegin}>进入 Case Assistant</button></section>
  {decision&&<section className="pro-card formal-record"><div className="formal-heading"><div><p className="eyebrow">FORMAL RECORD</p><h2>当前正式决定 · v{decision.sequence}</h2></div><span className="state-badge green">已采纳</span></div><p>{decision.fields.choice==='candidate'?'选择已有候选：'+(formal?.source.candidates.find(c=>c.candidate_id===decision.fields.candidate_id)?.title??decision.fields.candidate_id):decision.fields.choice==='no_action'?'不行动':'暂缓'}</p><div className="formal-grid"><div><span>责任人</span><strong>{decision.fields.owner}</strong></div><div><span>观察窗口 / 触发</span><strong>{decision.fields.outcome.applicable?decision.fields.outcome.observation_window:decision.fields.outcome.reassess_trigger}</strong></div><div><span>新报告</span><strong>v{report?.sequence}</strong></div></div><details><summary>正式 Decision Record / Expected Outcome 完整字段</summary><p>{decision.id} · {decision.outcome_id}</p><p>采纳人 {decision.actor} · {decision.adopted_at} · 来源 revision {decision.source.revision_id}</p><DecisionFieldsView fields={decision.fields}/></details><div className="draft-actions"><button type="button" disabled={disabled||!eligible} onClick={onRevise}>创建待采纳修订</button></div></section>}
  {formal?.reports.map((item,i)=>{const linked=formal.decisions.find(d=>d.id===item.decision_id&&d.report_id===item.id&&d.source.revision_id===item.source_revision&&d.source_report_id===item.original_report_id&&(['project_id','session_id','case_id','revision_id'] as const).every(key=>d.source[key]===formal.source.owner[key]));return <details className="formal-report" id={'formal-report-'+item.id} key={item.id}><summary>报告 v{item.sequence} · {i===formal.reports.length-1?'当前':'superseded history'}</summary>{linked?<article className="formal-report-preview" aria-label={`正式报告 v${item.sequence}`}><p>采纳人 {linked.actor} · {linked.adopted_at}</p>{formalDecisionSections(linked).map(section=><section key={section.title}><h3>{section.title}</h3><dl>{section.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'未填写'}</dd></div>)}</dl></section>)}</article>:<p role="alert">报告关联的正式记录不可用；请重新打开项目核对，不以当前决定替代。</p>}<button type="button" onClick={()=>onExport(item.id)}>导出此报告</button></details>;})}
 </section>;
}
function ProfessionalControl({projection,formal,onOriginalReport,onFormalReport}:{projection:DesktopProjection|null;formal:AssistantProjection|null;onOriginalReport:()=>void;onFormalReport:(id:string)=>void}) {
 formal=associatedFormal(projection,formal);
 const original=projection?.reports.find(r=>r.report_id===projection.revision?.current_report_id);
 return <><section aria-label="Case 控制权"><h3>Case 控制权</h3><ul className="case-control"><li><span>数据快照</span><strong>{projection?.confirmation?'已确认':'待确认'}</strong></li><li><span>证据采纳</span><strong>{projection?.revision?.current_acceptance_id?'由用户完成':'待用户审阅'}</strong></li><li><span>Agent 权限</span><strong>只读 + 提交草案</strong></li><li><span>正式写入</span><strong>仅用户采纳</strong></li></ul></section><section className="report-history"><h3>报告版本</h3>{formal?.reports.slice().reverse().map((r,i)=><button type="button" key={r.id} onClick={()=>onFormalReport(r.id)}>v{r.sequence} · {i===0?'当前':'superseded · 可读'}</button>)}{original&&<button type="button" onClick={onOriginalReport}>v{original.version_sequence} · final · {formal?.reports.length?'superseded · 可读':'当前'}</button>}{!original&&<p>尚无 final report</p>}<button type="button" className="text-button" onClick={onOriginalReport}>全部分析报告与导出</button></section></>;
}

function DataPreparation({api,projection,disabled,onProjection,onFailure,onUnknown}:Readonly<{api:XanthilDesktopApi;projection:DesktopProjection|null;disabled:boolean;onProjection:(p:DesktopProjection)=>void;onFailure:(e:DesktopFailure)=>void;onUnknown:()=>void}>) {
  const [inspection,setInspection]=useState<ImportInspection|null>(null);
  const [configuration,setConfiguration]=useState<InspectionConfiguration>({column_mapping:{member_id_column:null,member_group_column:null,order_id_column:null,order_member_id_column:null,paid_at_column:null,amount_column:null,status_column:null,currency_column:null},comparison_period:{start_date:'',end_date:''},current_period:{start_date:'',end_date:''},currency:'CNY',time_zone:'Asia/Shanghai',valid_statuses:[],selected_group_mode:'none'});
  const [evaluated,setEvaluated]=useState(false),[authority,setAuthority]=useState(false),[issues,setIssues]=useState(false),[plan,setPlan]=useState(false),[working,setWorking]=useState(false);
  const [treatments,setTreatments]=useState<Record<string,string>>({});
  const locked=disabled||working,owner=projection?.session&&projection.revision?{contract_version:'1.0' as const,project_id:projection.session.project_id,session_id:projection.session.session_id,case_id:projection.session.case_id,revision_id:projection.revision.revision_id,expected_row_version:projection.revision.row_version}:null;
  const key=owner?`${owner.revision_id}:${owner.expected_row_version}`:'none';
  useEffect(()=>{setInspection(null);setEvaluated(false);setAuthority(false);setIssues(false);setPlan(false);setTreatments({});},[key]);
  function invalidate(){setEvaluated(false);setAuthority(false);setIssues(false);setPlan(false);setTreatments({});}
  function change(next:InspectionConfiguration){setConfiguration(next);invalidate();}
  async function inspect(repreview:boolean){
    if(!owner||locked||!projection?.capabilities.can_select_import)return;
    invalidate();setWorking(true);
    try {const result=await api.selectImportFiles(repreview&&inspection?{...owner,inspection_token:inspection.inspection_token,configuration}:owner);if(!result.ok){onFailure(result.error);return;}setInspection(result.value);setEvaluated(result.value.evaluation.status==='evaluated');}
    catch{onUnknown();}finally{setWorking(false);}
  }
  const allTreatments=!!inspection&&inspection.reviewable_issues.every(issue=>issue.treatment_options.includes(treatments[issue.code]));
  const confirmable=!!owner&&!!inspection&&evaluated&&inspection.blocking_issues.length===0&&authority&&issues&&plan&&allTreatments&&projection?.capabilities.can_confirm_revision;
  async function confirm(){
    if(!confirmable||!owner||!inspection||locked)return;
    const confirmation:ConfirmationInput={...configuration,issue_treatments:inspection.reviewable_issues.map(issue=>({code:issue.code,count:issue.count,treatment:treatments[issue.code]})),hypothesis_id:'current_repurchase_rate_lower_than_comparison',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true};
    setWorking(true);try{const result=await api.confirmRevision({...owner,command_id:crypto.randomUUID(),inspection_token:inspection.inspection_token,confirmation});if(result.ok){onProjection(result.value);setInspection(null);}else onFailure(result.error);}catch{onUnknown();}finally{setWorking(false);}
  }
  const mappings:[keyof InspectionConfiguration['column_mapping'],string,'members'|'orders'][]=[['member_id_column','成员 ID 列','members'],['member_group_column','成员分组列','members'],['order_id_column','订单 ID 列','orders'],['order_member_id_column','订单成员 ID 列','orders'],['paid_at_column','支付时间列','orders'],['amount_column','金额列','orders'],['status_column','订单状态列','orders'],['currency_column','币种列','orders']];
  if(projection?.snapshot)return <section className="workbench-card"><h2>不可变数据快照已确认</h2><p>CNY · Asia/Shanghai · 原始数据未上传，模型不可见。</p><ul>{(['members','orders'] as const).map(role=><li key={role}>{projection.snapshot![role].display_name} · {projection.snapshot![role].byte_length} bytes<p>SHA-256：{projection.snapshot![role].sha256}</p></li>)}</ul><p>成员：纳入 {projection.snapshot.included_member_count}，排除 {projection.snapshot.excluded_member_count}；订单：纳入 {projection.snapshot.included_order_count}，排除 {projection.snapshot.excluded_order_count}。</p><p>已记录授权、质量处理与分析定义。修改选择须创建新数据修订。</p></section>;
  return <section className="workbench-card import-review" aria-busy={working}>
    <h2>两份本地 CSV</h2><p>原始数据只在本机读取，不显示原始成员、订单 ID 或组名；不发送给模型。</p>
    <button type="button" className="secondary-button" disabled={locked||!projection?.capabilities.can_select_import} onClick={()=>void inspect(false)}>选择成员与订单 CSV</button>
    {!owner&&<p>请先创建或打开专业会话。</p>}
    {inspection&&<>
      <ul>{(['members','orders'] as const).map(role=><li key={role}>{inspection[role].display_name} · {inspection[role].row_count} 行 · {inspection[role].byte_length} bytes<p>SHA-256：{inspection[role].sha256}</p></li>)}</ul>
      <fieldset disabled={locked}><legend>显式映射与分析范围</legend><p>币种：CNY；时区：Asia/Shanghai。期间为等长、互不重叠的本地日期范围，结束日期不包含在内。</p>
      <div className="import-fields">{mappings.map(([field,label,role])=><div key={field}><label htmlFor={`import-${field}`}>{label}</label><select id={`import-${field}`} value={configuration.column_mapping[field]??''} onChange={event=>change({...configuration,column_mapping:{...configuration.column_mapping,[field]:event.target.value||null},...(field==='member_group_column'?{selected_group_mode:event.target.value?'mapped' as const:'none' as const}:{})})}><option value="">{field==='member_group_column'?'不分组（M2 不适用）':'请选择'}</option>{inspection[role].column_names.map(name=><option value={name} key={name}>{name}</option>)}</select></div>)}
      {(['comparison_period','current_period'] as const).map(period=><div key={period}>{(['start_date','end_date'] as const).map(endpoint=><label key={endpoint}>{period==='comparison_period'?'对比期':'当前期'}{endpoint==='start_date'?'开始':'结束（不含）'}<input type="date" value={configuration[period][endpoint]} onChange={event=>change({...configuration,[period]:{...configuration[period],[endpoint]:event.target.value}})} /></label>)}</div>)}
      <div><label htmlFor="import-valid-statuses">有效状态（每行一个精确值）</label><textarea id="import-valid-statuses" rows={2} value={configuration.valid_statuses.join('\n')} onChange={event=>change({...configuration,valid_statuses:event.target.value===''?[]:event.target.value.split('\n')})} /></div></div>
      <p>大小写、前后空白与前导零均保留，不自动修剪或转换。有效状态必须显式填写。</p></fieldset>
      <button type="button" disabled={locked} onClick={()=>void inspect(true)}>核对数据范围</button>
      <p role="status">{evaluated?'数据范围已核对，请逐项确认。':'请显式选择映射、期间与有效状态。'}</p>
      <ul>{inspection.blocking_issues.map(issue=><li key={issue.code} role="alert">阻塞：{issue.code} · {issue.count}</li>)}</ul>
      {evaluated&&<fieldset disabled={locked}><legend>数据问题与精确处理</legend>{inspection.reviewable_issues.length===0?<p>本次范围没有可复核的数据问题。</p>:inspection.reviewable_issues.map(issue=><label className="issue-treatment" key={issue.code}>{issue.code} · {issue.count}<select aria-label={`处理 ${issue.code}`} value={treatments[issue.code]??''} onChange={event=>{setTreatments({...treatments,[issue.code]:event.target.value});setIssues(false);setPlan(false);}}><option value="">请选择处理方式</option>{issue.treatment_options.map(treatment=><option key={treatment} value={treatment}>{treatment}</option>)}</select></label>)}</fieldset>}
      <fieldset disabled={locked||!evaluated}><legend>本修订的显式确认</legend>
        <label><input type="checkbox" checked={authority} onChange={event=>setAuthority(event.target.checked)} />我有权将这两份本地数据用于本次分析</label>
        <label><input type="checkbox" checked={issues} onChange={event=>setIssues(event.target.checked)} />我已核对每项数据问题的数量与处理方式</label>
        <label><input type="checkbox" checked={plan} onChange={event=>setPlan(event.target.checked)} />我确认映射、期间、有效状态与分析定义</label>
        <p>Active Member：期间内至少一笔有效订单；Repeat Member：至少两笔。复购收入为按支付时间及订单 ID 排序后第二笔及以后的有效订单金额。M1 比较当前与对比期；M2 只分解收入变化，不解释因果。任何选择改变都撤销之前的确认。</p>
      </fieldset>
      <button type="button" className="secondary-button" aria-describedby="import-confirm-help" disabled={locked||!confirmable} onClick={()=>void confirm()}>确认数据快照</button><p id="import-confirm-help">只有无阻塞问题、全部处理已选且三项显式确认完成，才能保存不可变快照。</p>
    </>}
  </section>;
}

function QuickWorkspace({ onOpenDialog, onPreview, previewNotice }: Readonly<{
  onOpenDialog: (kind: Exclude<DialogKind, null>, trigger: HTMLElement | null) => void;
  onPreview: (notice: string) => void;
  previewNotice: string;
}>) {
  return (
    <section aria-labelledby="quick-workspace-heading" className="quick-workspace">
      <div className="empty-state-mark" aria-hidden="true">◇</div>
      <h1 id="quick-workspace-heading">快速模式：以对话为主线</h1>
      <p>没有固定阶段导航。能力入口保留在 Composer 附近，并且全部明确为 Preview。</p>
      <p className="professional-path-summary">专业模式路径：新建分析、数据准备、本地处理、循证分析、报告、执行反馈。</p>
      <p className="boundary-note">{previewNotice}</p>
      <div aria-label="Preview capabilities" className="capability-row">
        <button onClick={(event) => onOpenDialog('skill', event.currentTarget)} type="button">Skill · Preview</button>
        <button onClick={(event) => onOpenDialog('prompt', event.currentTarget)} type="button">Prompt · Preview</button>
        <button onClick={() => onPreview('缺少：先创建 Session。Preview · 模拟：Fork 未激活，不创建子对话或结果。')} type="button">Fork · Preview</button>
        <button onClick={() => onPreview('缺少：先创建 Session。Preview · 模拟：Subagent 未激活，不创建任务或结果。')} type="button">Subagent · Preview</button>
        <button onClick={() => onPreview('Preview · 模拟：Generate report 未激活，不创建报告版本或导出。')} type="button">Generate report · Preview</button>
      </div>
      <div className="composer-shell">
        <label htmlFor="quick-composer">继续追问或描述下一步分析</label>
        <textarea id="quick-composer" placeholder="Preview · 模拟：内容仅保留在当前界面，不会发送或执行。" rows={3} />
        <div className="composer-footer"><span>原始数据保持本地 · 未选择数据</span><button className="secondary-button" onClick={() => onPreview('Preview · 模拟：发送尚未激活，未创建任务或分析。')} type="button">发送 · Preview</button></div>
      </div>
    </section>
  );
}

function SearchDialog() {
  return (
    <div className="dialog-content">
      <label className="search-label" htmlFor="global-search-input">搜索当前项目内的分析案例与对话</label>
      <input autoFocus id="global-search-input" placeholder="输入名称、状态或模式" type="search" />
      <div className="mode-search-scope" aria-label="搜索模式范围"><span>快速模式</span><span>专业模式</span></div>
      <p>当前没有可搜索的分析案例或对话。搜索只区分模式，不会创建会话或启动后台工作。</p>
    </div>
  );
}

function CapabilityDialog({ capability }: Readonly<{ capability: 'Skill' | 'Prompt' }>) {
  const details = capability === 'Skill'
    ? { available: '会员复购分析 · v1.0', scope: '适用于专业模式的会员复购分析', unavailable: '通用 Skill 市场 · 不可用' }
    : { available: '循证分析措辞 · v1.0', scope: '仅影响可选辅助说明，不改变数据、计算或判断', unavailable: '通用 Prompt 管理 · 不可用' };
  return (
    <div className="dialog-content">
      <p><strong>Preview · 模拟</strong>：此选择器仅展示能力名称、版本和范围，不会调用 Provider、读取数据或创建业务记录。</p>
      <button className="picker-option" type="button"><strong>{details.available}</strong><span>{details.scope}</span><em>Preview · 未激活</em></button>
      <div className="unavailable-option"><strong>{details.unavailable}</strong><span>当前范围不提供通用运行时或市场。</span></div>
    </div>
  );
}

function DrawerSection({ heading, value }: Readonly<{ heading: string; value: string }>) {
  return <section className="drawer-section"><h3>{heading}</h3><p>{value}</p></section>;
}

function ContextInspector({mode,projection,stage,projectName,expanded}:Readonly<{mode:Mode;projection:DesktopProjection|null;stage:ProfessionalStage;projectName:string|undefined;expanded:boolean}>){
  const context=mode==='professional'?projection:null,revision=context?.revision,snapshot=context?.snapshot;
  return <>
    <section className="drawer-section"><h3>当前上下文</h3><dl className="context-list"><dt>项目</dt><dd>{projectName??'尚未选择'}</dd><dt>分析</dt><dd>{revision?.case_name??'尚未打开分析'}</dd><dt>阶段</dt><dd>{mode==='professional'?stage:'快速模式 · Preview'}</dd>{revision&&<><dt>状态</dt><dd>{revisionLabel[revision.state]} · 修订 {revision.revision_sequence}</dd></>}</dl>{revision?.question_text&&<p className="context-question">{revision.question_text}</p>}</section>
    <section className="drawer-section"><h3>数据与模型边界</h3>{snapshot?<><p>{snapshot.members.display_name}<br/>{snapshot.orders.display_name}</p><p>纳入 {snapshot.included_member_count} 位成员、{snapshot.included_order_count} 笔订单。已确认本地不可变快照。</p></>:<p>尚无已确认快照。原始 CSV 保持本地。</p>}<p>{context?.disclosures.length?`${context.disclosures.length} 项逐次披露；是否发送以请求记录为准。`:'尚无逐次模型披露；未发送模型请求。'}</p></section>
    <section className="drawer-section"><h3>假设与证据</h3>{context?.findings.length?context.findings.map(f=><div key={f.finding_id} className="inspector-evidence"><strong>H1 · {f.judgment==='Confirmed'?'证据支持':f.judgment==='Rejected'?'证据不支持':'证据不足'}</strong><p>当前期会员复购率低于对比期</p><p>{f.evidence_refs.length} 项证据回链 · {context.acceptances.some(a=>a.finding_id===f.finding_id)?'已显式接受':'待人工审阅'}</p></div>):<p>{revision?'H1：当前期会员复购率低于对比期。尚无已提交计算结果。':'创建专业分析后显示真实假设和证据。'}</p>}<p>Fork / Subagent · Preview，无已执行子任务。</p></section>
    <section className="drawer-section"><h3>报告版本</h3>{context?.reports.length?<ul className="inspector-versions">{context.reports.map(r=><li key={r.report_id}>版本 {r.version_sequence} · {r.state==='final'?(revision?.current_report_id===r.report_id?'当前最终报告':'历史最终报告'):'分析草稿'}<small>{r.acceptance_id?'形成时已接受':'形成时未接受'} · {r.closure_id?'已闭环':'未闭环'}</small></li>)}</ul>:<p>暂无报告。计算、接受结果和完成案例分别记录。</p>}</section>
    <DrawerSection heading="Skill · Prompt" value="会员复购分析 v1.0 · 循证分析措辞 v1.0。通用能力为 Preview，不改变确定性方法。"/>
    {expanded&&<details className="technical-details"><summary>技术身份与运行记录</summary>{revision&&<p>Case {context?.session?.case_id}<br/>Revision {revision.revision_id}<br/>{revision.state} · row_version {revision.row_version} · {revision.integrity_state}</p>}{snapshot&&<p>members SHA-256 {snapshot.members.sha256}<br/>orders SHA-256 {snapshot.orders.sha256}</p>}<ul>{context?.runs.map(run=><li key={run.run_id}>{run.status} · {run.run_id} · {run.terminal_reason??'无终止原因'}</li>)}</ul>{context?.findings.map(f=><div key={f.finding_id}><p>{f.judgment} · {f.finding_id}</p><ul>{f.evidence_refs.map(ref=><li key={ref}>{ref}</li>)}</ul></div>)}</details>}
  </>;
}

const root = document.getElementById('root');

if (root === null) throw new Error('Xanthil Desktop requires #root');

createRoot(root).render(<XanthilDesktopApp api={window.xanthilDesktopApi} />);
