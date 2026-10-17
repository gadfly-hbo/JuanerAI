import { useEffect, useRef, useState } from 'react'

export const DISMISS_REASON_ERROR = '请填写驳回理由（至少 2 个字）'
export const DISMISS_REASON_HELPER = '至少 2 个字'

interface DismissDialogProps {
  itemTitle: string
  /** 返回 false = 提交失败（已回滚服务器态），弹窗关闭后由列表底部 alert 呈现 */
  onSubmit(reason: string): Promise<boolean>
  onClose(): void
  /** 关闭后焦点归还目标（触发它的「驳回」钮，G10） */
  returnFocusRef: React.RefObject<HTMLButtonElement | null>
  /** S15 大字变体（2.18.3）：标题 ~28px / textarea ~20px / 宽 min(560px,90vw)；G10 规则与逐字文案完全复用 */
  size?: 'base' | 'lg'
}

/**
 * S11 驳回理由弹窗（G10，全站唯一弹层）：原生 <dialog> + showModal，
 * 原生 Esc 关闭与焦点圈定；jsdom 等无 showModal 环境降级 open 属性。
 */
export function DismissDialog({ itemTitle, onSubmit, onClose, returnFocusRef, size = 'base' }: DismissDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
    else dialog.setAttribute('open', '')
    textareaRef.current?.focus()
    const onCancel = (event: Event) => {
      event.preventDefault() // 阻止原生关闭，统一走 close()（焦点归还）
      close()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => {
    const dialog = dialogRef.current
    if (dialog) {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close()
      else dialog.removeAttribute('open')
    }
    returnFocusRef.current?.focus()
    onClose()
  }

  const confirm = async () => {
    if (reason.trim().length < 2) {
      setError(true)
      textareaRef.current?.focus()
      return
    }
    setSubmitting(true)
    await onSubmit(reason.trim())
    setSubmitting(false)
    close() // 成功落库或失败回滚均关闭；失败态由列表底部 role=alert 呈现
  }

  return (
    <dialog ref={dialogRef} className={`dismiss-dialog${size === 'lg' ? ' dlg-lg' : ''}`} aria-labelledby="dismiss-dialog-title">
      <h2 id="dismiss-dialog-title" className="dismiss-dialog-title">
        驳回行动项
      </h2>
      <p className="card-summary">{itemTitle}</p>
      <label className="dismiss-label" htmlFor="dismiss-reason-input">
        驳回理由 *
      </label>
      <textarea
        id="dismiss-reason-input"
        ref={textareaRef}
        className="dismiss-textarea"
        value={reason}
        aria-describedby="dismiss-reason-helper"
        onChange={(event) => {
          setReason(event.target.value)
          if (error) setError(false)
        }}
      />
      <p id="dismiss-reason-helper" className="dismiss-helper">
        {DISMISS_REASON_HELPER}
      </p>
      {error && (
        <p role="alert" className="dismiss-error">
          {DISMISS_REASON_ERROR}
        </p>
      )}
      <div className="dismiss-dialog-actions">
        <button type="button" className="primary-btn" disabled={submitting} onClick={() => void confirm()}>
          确认驳回
        </button>
        <button type="button" disabled={submitting} onClick={close}>
          取消
        </button>
      </div>
    </dialog>
  )
}
