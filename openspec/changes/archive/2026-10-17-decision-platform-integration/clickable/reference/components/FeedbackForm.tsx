import { useId, useState } from 'react'
import { formatDateTime } from '../data'
import type { ActionFeedbackView } from '../data'

export const SCORE_HINT = '5=显著正向效果 · 3=无明显变化 · 1=显著负向'
export const OUTCOME_REQUIRED_ERROR = '请填写结果'
export const SCORE_REQUIRED_ERROR = '请选择评分（1-5）'

export interface FeedbackFormValues {
  adopted: boolean
  outcome: string
  metricDelta: string
  review: string
  score: number | null
}

interface FeedbackFormProps {
  /** 更新反馈时预填现值 */
  initial?: ActionFeedbackView
  showCancel: boolean
  onSubmit(values: { adopted: boolean; outcome: string; metricDelta: string; review: string; score: number }): Promise<boolean>
  onCancel(): void
}

/** S5 反馈回录表单：已执行（默认勾选）/结果*（textarea）/指标变化/复盘/评分*（radio 1-5） */
export function FeedbackForm({ initial, showCancel, onSubmit, onCancel }: FeedbackFormProps) {
  const uid = useId()
  const [adopted, setAdopted] = useState(initial?.adopted ?? true)
  const [outcome, setOutcome] = useState(initial?.outcome ?? '')
  const [metricDelta, setMetricDelta] = useState(initial?.metricDelta ?? '')
  const [review, setReview] = useState(initial?.review ?? '')
  const [score, setScore] = useState<number | null>(initial?.score ?? null)
  const [errors, setErrors] = useState<{ outcome?: boolean; score?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const nextErrors = { outcome: outcome.trim() === '', score: score === null }
    setErrors(nextErrors)
    if (nextErrors.outcome || nextErrors.score) return
    setSubmitting(true)
    const ok = await onSubmit({
      adopted,
      outcome: outcome.trim(),
      metricDelta: metricDelta.trim(),
      review: review.trim(),
      score: score as number,
    })
    setSubmitting(false)
    if (ok) {
      setOutcome('')
      setMetricDelta('')
      setReview('')
      setScore(null)
      setErrors({})
    }
  }

  return (
    <form
      className="feedback-form"
      aria-label="反馈"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="form-row form-row-inline">
        <input
          id={`${uid}-adopted`}
          type="checkbox"
          checked={adopted}
          onChange={(event) => setAdopted(event.target.checked)}
        />
        <label className="form-label" htmlFor={`${uid}-adopted`}>
          已执行
        </label>
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor={`${uid}-outcome`}>
          结果 *
        </label>
        <textarea
          id={`${uid}-outcome`}
          className="form-textarea"
          value={outcome}
          onChange={(event) => {
            setOutcome(event.target.value)
            if (errors.outcome) setErrors((prev) => ({ ...prev, outcome: false }))
          }}
        />
        {errors.outcome && (
          <p role="alert" className="form-error">
            {OUTCOME_REQUIRED_ERROR}
          </p>
        )}
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor={`${uid}-metric`}>
          指标变化
        </label>
        <input
          id={`${uid}-metric`}
          className="form-input"
          type="text"
          placeholder="复购率 +2.3pp"
          value={metricDelta}
          onChange={(event) => setMetricDelta(event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor={`${uid}-review`}>
          复盘
        </label>
        <textarea id={`${uid}-review`} className="form-textarea" value={review} onChange={(event) => setReview(event.target.value)} />
      </div>
      <fieldset className="form-row feedback-score">
        <legend className="form-label">评分 *</legend>
        <p className="feedback-score-hint" id={`${uid}-score-hint`}>
          {SCORE_HINT}
        </p>
        <div className="feedback-score-options">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="feedback-score-option">
              <input
                type="radio"
                name={`${uid}-score`}
                value={value}
                checked={score === value}
                aria-describedby={`${uid}-score-hint`}
                onChange={() => {
                  setScore(value)
                  if (errors.score) setErrors((prev) => ({ ...prev, score: false }))
                }}
              />
              {value}
            </label>
          ))}
        </div>
        {errors.score && (
          <p role="alert" className="form-error">
            {SCORE_REQUIRED_ERROR}
          </p>
        )}
      </fieldset>
      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          提交反馈
        </button>
        {showCancel && (
          <button type="button" disabled={submitting} onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  )
}

interface FeedbackReadonlyProps {
  feedback: ActionFeedbackView
  onUpdate(): void
}

/** 已回录反馈只读块（虚线区）：已执行|未执行 · 评分 {n}/5 + 结果/指标变化/复盘 + 更新时间 */
export function FeedbackReadonly({ feedback, onUpdate }: FeedbackReadonlyProps) {
  return (
    <div className="feedback-readonly">
      <p className="feedback-readonly-head">
        {feedback.adopted ? '已执行' : '未执行'} · 评分 {feedback.score}/5
        <button type="button" className="feedback-update-btn" onClick={onUpdate}>
          更新反馈
        </button>
      </p>
      <p className="feedback-line">
        <span className="feedback-line-label">结果</span>
        {feedback.outcome}
      </p>
      <p className="feedback-line">
        <span className="feedback-line-label">指标变化</span>
        {feedback.metricDelta || '—'}
      </p>
      <p className="feedback-line">
        <span className="feedback-line-label">复盘</span>
        {feedback.review || '—'}
      </p>
      <p className="feedback-updated-at">更新时间 {formatDateTime(feedback.updatedAt)}</p>
    </div>
  )
}
