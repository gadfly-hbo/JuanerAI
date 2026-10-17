import { useRef, useState } from 'react'
import {
  ACTION_STATUS_LABELS,
  CARD_DISMISS_DEFAULT_REASON,
  DECIDED_VIA_LABELS,
  EVIDENCE_CLASS,
  PRIORITY_LABELS,
  displayEvidenceLevel,
  formatConfidence,
  formatDateTime,
} from '../data'
import type { ActionItemView, ActionTaskView } from '../data'
import type { FeedbackFormInput, TaskCreateFormInput, TaskPatchFormInput } from '../useBoardStore'
import { DismissDialog, DISMISS_REASON_ERROR } from './DismissDialog'
import { TaskList } from './TaskList'

interface ActionItemCardProps {
  item: ActionItemView
  /** 所属报告名（文件名去扩展名）；人工项为 null（chip 显示「人工补充」） */
  reportName: string | null
  expanded: boolean
  onToggle(): void
  onAdopt(item: ActionItemView): void
  onDismiss(item: ActionItemView, reason: string): Promise<boolean> | void
  onBackfill(item: ActionItemView, reason: string): Promise<boolean> | void
  onCreateTask(item: ActionItemView, input: TaskCreateFormInput): Promise<boolean>
  onPatchTask(item: ActionItemView, task: ActionTaskView, patch: TaskPatchFormInput): Promise<boolean>
  onSaveFeedback(item: ActionItemView, task: ActionTaskView, input: FeedbackFormInput): Promise<boolean>
}

/** S2 行动项卡片 + S3 证据展开区（含 S4 任务/S5 反馈、S12 补填理由、S11 驳回弹窗触发） */
export function ActionItemCard({
  item,
  reportName,
  expanded,
  onToggle,
  onAdopt,
  onDismiss,
  onBackfill,
  onCreateTask,
  onPatchTask,
  onSaveFeedback,
}: ActionItemCardProps) {
  const rejectBtnRef = useRef<HTMLButtonElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const level = displayEvidenceLevel(item)
  const evClass = EVIDENCE_CLASS[level] ?? 'ev-exp'

  const handleDismiss = async (reason: string): Promise<boolean> => {
    const result = onDismiss(item, reason)
    return result instanceof Promise ? await result : true
  }

  const handleBackfill = async (reason: string): Promise<boolean> => {
    const result = onBackfill(item, reason)
    return result instanceof Promise ? await result : true
  }

  return (
    <article className="action-card">
      <button type="button" className="action-card-head" aria-expanded={expanded} aria-controls={`evidence-${item.id}`} onClick={onToggle}>
        <span className="head-main">
          <span className="chip-row">
            <span className={`chip st-${item.status}`}>{ACTION_STATUS_LABELS[item.status]}</span>
            <span className={`chip ev-chip ${evClass}`}>{level}</span>
            <span className={`chip sev-${item.priority}`}>{PRIORITY_LABELS[item.priority] ?? item.priority}</span>
            {item.effort && <span className="chip val-chip">{PRIORITY_LABELS[item.effort] ?? item.effort}</span>}
            {item.scene && <span className="chip val-chip">{item.scene}</span>}
            {item.lifecycle && <span className="chip val-chip">{item.lifecycle}</span>}
            {item.sourceKind === 'manual' ? (
              <span className="chip val-chip">人工补充</span>
            ) : (
              reportName && <span className="chip val-chip">{reportName}</span>
            )}
          </span>
          <span className="card-title">{item.title}</span>
          <span className="card-rationale">{item.rationale}</span>
        </span>
        <span className="head-meta">
          {item.sourceKind === 'manual' ? (
            <span className="manual-badge">人工</span>
          ) : (
            <span className="confidence">置信度 {formatConfidence(item.confidence)}%</span>
          )}
          <span className="chevron" aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
        </span>
      </button>
      <div className="action-ops">
        <button
          type="button"
          className="status-btn st-accepted"
          aria-pressed={item.status === 'adopted'}
          disabled={item.status === 'dismissed'}
          onClick={() => onAdopt(item)}
        >
          采纳
        </button>
        <button
          type="button"
          ref={rejectBtnRef}
          className="status-btn st-rejected"
          aria-pressed={item.status === 'dismissed'}
          onClick={() => setDialogOpen(true)}
        >
          驳回
        </button>
        {item.decidedAt && (
          <span className="decided-meta">
            {[item.decidedBy, formatDateTime(item.decidedAt), item.decidedVia ? DECIDED_VIA_LABELS[item.decidedVia] : null]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </div>
      {expanded && (
        <div className="evidence" id={`evidence-${item.id}`}>
          {item.status === 'dismissed' && <DismissBlock item={item} onSave={handleBackfill} />}
          {item.sourceKind === 'manual' ? (
            <ManualEvidence item={item} />
          ) : (
            <ExtractedEvidence item={item} level={level} evClass={evClass} />
          )}
          {item.status === 'adopted' && (
            <TaskList item={item} onCreateTask={onCreateTask} onPatchTask={onPatchTask} onSaveFeedback={onSaveFeedback} />
          )}
        </div>
      )}
      {dialogOpen && (
        <DismissDialog
          itemTitle={item.title}
          onSubmit={handleDismiss}
          onClose={() => setDialogOpen(false)}
          returnFocusRef={rejectBtnRef}
        />
      )}
    </article>
  )
}

function ExtractedEvidence({ item, level, evClass }: { item: ActionItemView; level: string; evClass: string }) {
  const facts = item.evidence?.facts ?? []
  return (
    <>
      <section className="evidence-block" aria-label="事实">
        <h4 className="block-title">事实</h4>
        {facts.length === 0 ? (
          <p className="empty-lite">未引用报告事实（置信度已按无事实封顶 0.5）</p>
        ) : (
          <ul className="fact-list">
            {facts.map((fact, index) => (
              <li key={index} className="fact-item">
                <span className={`chip ev-chip ${evClass}`}>{level}</span>
                {fact.quote && <blockquote className={`quote-block ${evClass}`}>{fact.quote}</blockquote>}
                <p className="fact-note">{fact.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="evidence-block" aria-label="推导过程">
        <h4 className="block-title">推导过程</h4>
        <p className="evidence-text">{item.evidence?.reasoning || item.rationale}</p>
      </section>
      <section className="evidence-block" aria-label="预期效果">
        <h4 className="block-title">预期效果</h4>
        <p className="evidence-text">{item.expectedImpact}</p>
      </section>
      <p className="confidence-note">置信度由证据派生（证据等级与原文引用决定），非模型自评。</p>
      <p className="warn-note">证据等级由提取模型自评，未做真实数据重验证</p>
    </>
  )
}

function ManualEvidence({ item }: { item: ActionItemView }) {
  return (
    <>
      <p className="empty-lite">人工补充建议，未引用报告事实</p>
      <section className="evidence-block" aria-label="推导过程">
        <h4 className="block-title">推导过程</h4>
        <p className="evidence-text">{item.evidence?.reasoning || item.rationale}</p>
      </section>
      <p className="manual-note">人工补充建议：不参与置信度派生，证据等级固定「经验假设」。</p>
    </>
  )
}

/** 已驳回卡证据区首块：驳回理由；卡片渠道默认理由可补填一次（S12） */
function DismissBlock({ item, onSave }: { item: ActionItemView; onSave(reason: string): Promise<boolean> }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const needsBackfill = item.decidedVia === 'card' && item.dismissedReason === CARD_DISMISS_DEFAULT_REASON

  const save = async () => {
    if (value.trim().length < 2) {
      setError(true)
      return
    }
    setSaving(true)
    await onSave(value.trim())
    setSaving(false)
    setValue('')
    setError(false)
  }

  return (
    <section className="evidence-block dismiss-block" aria-label="驳回理由">
      <h4 className="block-title">驳回理由</h4>
      <p className="dismiss-reason">{item.dismissedReason ?? CARD_DISMISS_DEFAULT_REASON}</p>
      {needsBackfill && (
        <div className="backfill-row">
          <label className="backfill-label" htmlFor={`backfill-${item.id}`}>
            补填理由
          </label>
          <input
            id={`backfill-${item.id}`}
            className="backfill-input"
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError(false)
            }}
          />
          <button type="button" disabled={saving} onClick={() => void save()}>
            保存
          </button>
          {error && (
            <p role="alert" className="backfill-error">
              {DISMISS_REASON_ERROR}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
