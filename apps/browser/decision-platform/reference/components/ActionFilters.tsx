import { useState } from 'react'
import {
  ACTION_LEVEL_OPTIONS,
  ACTION_LIFECYCLE_OPTIONS,
  ACTION_SCENE_OPTIONS,
  ACTION_STATUS_LABELS,
  EVIDENCE_LEVELS,
  PRIORITY_LABELS,
  displayEvidenceLevel,
  reportDisplayName,
} from '../data'
import type { ActionItemStatus, ActionItemView, ReportRecord } from '../data'
import type { ManualSuggestInput } from '../useBoardStore'

export const MODEL_SELF_EVAL_NOTE = '证据等级由提取模型自评，未做真实数据重验证'

export type StatusFilter = 'all' | ActionItemStatus
export type EvidenceFilter = 'all' | (typeof EVIDENCE_LEVELS)[number]
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low'
export type ReportFilter = 'all' | 'manual' | number

interface ActionFiltersProps {
  items: ActionItemView[]
  reports: ReportRecord[]
  status: StatusFilter
  evidence: EvidenceFilter
  priority: PriorityFilter
  report: number | 'all' | 'manual'
  onStatusChange(value: StatusFilter): void
  onEvidenceChange(value: EvidenceFilter): void
  onPriorityChange(value: PriorityFilter): void
  onReportChange(value: number | 'all' | 'manual'): void
  onCreateManual(input: ManualSuggestInput): Promise<boolean>
}

/** S6 过滤器：状态/证据等级/优先级/报告 四维单选 + 「补充建议」主按钮（S13 inline 表单） */
export function ActionFilters({
  items,
  reports,
  status,
  evidence,
  priority,
  report,
  onStatusChange,
  onEvidenceChange,
  onPriorityChange,
  onReportChange,
  onCreateManual,
}: ActionFiltersProps) {
  const [formOpen, setFormOpen] = useState(false)

  const statusOptions: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: 'all', label: '全部', count: items.length },
    ...(['suggested', 'adopted', 'dismissed'] as const).map((value) => ({
      value,
      label: ACTION_STATUS_LABELS[value],
      count: items.filter((item) => item.status === value).length,
    })),
  ]
  const evidenceOptions = [
    { value: 'all' as const, label: '全部', count: items.length },
    ...EVIDENCE_LEVELS.map((level) => ({
      value: level,
      count: items.filter((item) => displayEvidenceLevel(item) === level).length,
    })),
  ]
  const priorityOptions = [
    { value: 'all' as const, label: '全部', count: items.length },
    ...ACTION_LEVEL_OPTIONS.map((value) => ({
      value: value as PriorityFilter,
      count: items.filter((item) => item.priority === value).length,
    })),
  ]
  const manualCount = items.filter((item) => item.sourceKind === 'manual').length
  const reportOptions = [
    { value: 'all' as const, count: items.length, label: '全部' },
    { value: 'manual' as const, count: manualCount, label: '人工补充' },
    ...reports.map((r) => ({
      value: r.id,
      count: items.filter((item) => item.reportId === r.id).length,
      label: reportDisplayName(r.filename),
    })),
  ]

  return (
    <section className="filter-bar" aria-label="过滤器">
      <div className="filter-groups">
        <ChipGroup ariaLabel="状态" options={statusOptions} selected={status} onChange={onStatusChange} />
        <ChipGroup
          ariaLabel="证据等级"
          options={evidenceOptions}
          selected={evidence}
          onChange={onEvidenceChange}
        />
        <ChipGroup
          ariaLabel="优先级"
          options={priorityOptions}
          selected={priority}
          onChange={onPriorityChange}
          labelOf={(value) => (value === 'all' ? '全部' : PRIORITY_LABELS[value] ?? value)}
        />
        <ChipGroup ariaLabel="报告" options={reportOptions} selected={report} onChange={onReportChange} />
      </div>
      <button type="button" className="primary-btn suggest-btn" aria-expanded={formOpen} onClick={() => setFormOpen((open) => !open)}>
        补充建议
      </button>
      {formOpen && <SuggestForm onSubmit={onCreateManual} onCancel={() => setFormOpen(false)} />}
      <p className="filter-note">{MODEL_SELF_EVAL_NOTE}</p>
    </section>
  )
}

interface ChipGroupProps<T extends string | number> {
  ariaLabel: string
  options: Array<{ value: T; count: number; label?: string }>
  selected: T
  onChange(value: T): void
  labelOf?(value: T): string
}

function ChipGroup<T extends string | number>({ ariaLabel, options, selected, onChange, labelOf }: ChipGroupProps<T>) {
  return (
    <div className="filter-group" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const label = option.label ?? labelOf?.(option.value) ?? String(option.value)
        return (
          <button
            type="button"
            key={String(option.value)}
            className="filter-chip"
            aria-pressed={selected === option.value}
            onClick={() => onChange(option.value)}
          >
            {label} {option.count}
          </button>
        )
      })}
    </div>
  )
}

interface SuggestFormProps {
  onSubmit(input: ManualSuggestInput): Promise<boolean>
  onCancel(): void
}

/** S13 补充建议表单（G11，inline 非弹窗）：标题与依据必填，场景/周期/优先级/投入可选下拉 */
function SuggestForm({ onSubmit, onCancel }: SuggestFormProps) {
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')
  const [scene, setScene] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [priority, setPriority] = useState('')
  const [effort, setEffort] = useState('')
  const [errors, setErrors] = useState<{ title?: boolean; rationale?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const nextErrors = { title: title.trim() === '', rationale: rationale.trim() === '' }
    setErrors(nextErrors)
    if (nextErrors.title || nextErrors.rationale) return
    setSubmitting(true)
    const ok = await onSubmit({
      title: title.trim(),
      rationale: rationale.trim(),
      ...(scene ? { scene } : {}),
      ...(lifecycle ? { lifecycle } : {}),
      ...(priority ? { priority } : {}),
      ...(effort ? { effort } : {}),
    })
    setSubmitting(false)
    if (ok) onCancel()
  }

  return (
    <form
      className="suggest-form"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="form-row">
        <label className="form-label" htmlFor="suggest-title">
          标题 *
        </label>
        <input
          id="suggest-title"
          className="form-input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {errors.title && (
          <p role="alert" className="form-error">
            请填写标题
          </p>
        )}
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor="suggest-rationale">
          依据 *
        </label>
        <textarea
          id="suggest-rationale"
          className="form-textarea"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
        />
        {errors.rationale && (
          <p role="alert" className="form-error">
            请填写依据
          </p>
        )}
      </div>
      <div className="form-row form-selects">
        <label className="form-label" htmlFor="suggest-scene">
          场景
        </label>
        <select id="suggest-scene" className="form-select" value={scene} onChange={(event) => setScene(event.target.value)}>
          <option value="">不填</option>
          {ACTION_SCENE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label className="form-label" htmlFor="suggest-lifecycle">
          周期
        </label>
        <select
          id="suggest-lifecycle"
          className="form-select"
          value={lifecycle}
          onChange={(event) => setLifecycle(event.target.value)}
        >
          <option value="">不填</option>
          {ACTION_LIFECYCLE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label className="form-label" htmlFor="suggest-priority">
          优先级
        </label>
        <select
          id="suggest-priority"
          className="form-select"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="">不填</option>
          {ACTION_LEVEL_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </select>
        <label className="form-label" htmlFor="suggest-effort">
          投入
        </label>
        <select id="suggest-effort" className="form-select" value={effort} onChange={(event) => setEffort(event.target.value)}>
          <option value="">不填</option>
          {ACTION_LEVEL_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          提交
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          取消
        </button>
      </div>
    </form>
  )
}
