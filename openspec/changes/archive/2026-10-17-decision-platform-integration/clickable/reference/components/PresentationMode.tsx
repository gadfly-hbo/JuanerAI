import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DECIDED_VIA_LABELS,
  EVIDENCE_CLASS,
  EVIDENCE_LEVELS,
  PRIORITY_LABELS,
  displayEvidenceLevel,
  formatConfidence,
  formatDateTime,
} from '../data'
import type { ActionItemView, BoardView } from '../data'
import { DismissDialog } from './DismissDialog'

export const EMPTY_AGENDA_TEXT = '当前没有待拍板的建议'
export const SAVE_FAILED_TEXT = '保存失败，已恢复为服务器状态'
export const KEY_HINT_TEXT = '← → 切换 · Esc 退出'

type Scope = 'pending' | 'all'

interface PresentationModeProps {
  view: BoardView
  /** 操作共享（G4''）：工作台 useBoardStore 的 adopt/dismiss（乐观 + 失败回滚内建）；返回 false = 提交失败 */
  onAdopt(item: ActionItemView): Promise<boolean>
  onDismiss(item: ActionItemView, reason: string): Promise<boolean>
  onClose(): void
  /** 关闭后焦点归还目标（S1「汇报模式」按钮，M7-US9） */
  returnFocusRef: React.RefObject<HTMLButtonElement | null>
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

/** 议程排序：优先级（高>中>低）> 置信度（降序）> 创建时间（升序） */
function agendaKey(a: ActionItemView, b: ActionItemView): number {
  const pr = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3)
  if (pr !== 0) return pr
  const conf = (b.confidence ?? 0) - (a.confidence ?? 0)
  if (conf !== 0) return conf
  return a.createdAt.localeCompare(b.createdAt)
}

/** 全部范围分组：suggested → adopted → dismissed，组内同议程序 */
function scopeItems(items: ActionItemView[], scope: Scope): ActionItemView[] {
  if (scope === 'pending') return items.filter((it) => it.status === 'suggested').sort(agendaKey)
  return [
    ...items.filter((it) => it.status === 'suggested').sort(agendaKey),
    ...items.filter((it) => it.status === 'adopted').sort(agendaKey),
    ...items.filter((it) => it.status === 'dismissed').sort(agendaKey),
  ]
}

/**
 * S15 汇报模式（覆盖层，契约 2.18）：汇总页 + 逐项页两态 + 驳回大字弹窗。
 * 纯前端只读复用 BoardView；操作共享 useBoardStore（G4''）；模式内本地乐观副本 + 失败停留回滚。
 */
export function PresentationMode({ view, onAdopt, onDismiss, onClose, returnFocusRef }: PresentationModeProps) {
  // 本地乐观副本：会中拍板立即呈现留痕，失败回滚停留（G4''——store 已回滚服务器态，本地以 store 视图同步为准，
  // 但 store 视图不传入本组件（避免重挂），故本地维护 item 覆盖表；失败时 onDismiss 返回 false 触发清除）
  const [localItems, setLocalItems] = useState<Map<string, ActionItemView>>(new Map())
  const [scope, setScope] = useState<Scope>('pending')
  const [pageIndex, setPageIndex] = useState<number | null>(null) // null = 汇总页
  const [dismissTarget, setDismissTarget] = useState<ActionItemView | null>(null)
  const [dismissReturnRef] = useState<React.RefObject<HTMLButtonElement | null>>(() => ({ current: null }))
  const [liveMessage, setLiveMessage] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 议程快照（2.18.2/2.18.3）：成员关系（id 集合）与范围变化时才重建——会中拍板的状态翻转
  // 不把已决项移出当前议程（留痕行停留显示，800ms 前进后离开）
  const idsKey = useMemo(() => view.actionItems.map((it) => it.id).slice().sort().join(','), [view.actionItems])
  const scoped = useMemo(
    () => scopeItems(view.actionItems, scope),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idsKey, scope],
  )
  const displayScoped = useMemo(
    () => scoped.map((it) => localItems.get(it.id) ?? it),
    [scoped, localItems],
  )
  const items = useMemo(
    () => view.actionItems.map((it) => localItems.get(it.id) ?? it),
    [view.actionItems, localItems],
  )

  const applyLocal = useCallback((item: ActionItemView) => {
    setLocalItems((prev) => new Map(prev).set(item.id, item))
  }, [])
  const rollbackLocal = useCallback((id: string) => {
    setLocalItems((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  // 进入：焦点入容器；尝试浏览器全屏（失败静默降级 CSS 全屏）
  useEffect(() => {
    containerRef.current?.focus()
    const root = document.documentElement
    if (typeof root.requestFullscreen === 'function') {
      root.requestFullscreen().catch(() => {
        /* 静默降级：功能不依赖 Fullscreen API（2.18.1） */
      })
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch(() => void 0)
      }
    }
  }, [])

  // Esc：弹窗打开时原生 dialog 自行处理（只关弹窗，G1''）；否则退出模式、焦点回入口（M7-US9）
  const exitMode = useCallback(() => {
    returnFocusRef.current?.focus()
    onClose()
  }, [onClose, returnFocusRef])

  // 键位（2.18.3 表）：弹窗打开时不响应（dialog 焦点圈定 + dismissTarget 判空）
  const current = pageIndex !== null ? displayScoped[pageIndex] : undefined
  const advance = useCallback(() => {
    setPageIndex((idx) => {
      if (idx === null) return idx
      if (idx + 1 < scoped.length) return idx + 1
      return null // 末条 → 回汇总页
    })
  }, [scoped.length])
  const scheduleAdvance = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(advance, 800) // 采纳/驳回成功后 800ms 自动前进
  }, [advance])

  const doAdopt = useCallback(
    async (item: ActionItemView): Promise<void> => {
      const optimistic: ActionItemView = {
        ...item,
        status: 'adopted',
        decidedAt: new Date().toISOString(),
        decidedVia: 'board',
      }
      applyLocal(optimistic)
      const ok = await onAdopt(item) // store 乐观 + 失败回滚服务器态（G4''）
      if (!ok) {
        rollbackLocal(item.id) // 失败：停留当前页、按钮恢复、逐字播报（契约 2.18.3）
        setLiveMessage(SAVE_FAILED_TEXT)
        containerRef.current?.focus() // 指针采纳失败：按钮重挂不回收焦点，重聚焦容器保键盘流
        return
      }
      setLiveMessage(decidedLine(optimistic))
      containerRef.current?.focus() // 拍板按钮卸载后键盘流不中断（2.18.5）
      scheduleAdvance()
    },
    [applyLocal, onAdopt, rollbackLocal, scheduleAdvance],
  )

  const doDismiss = useCallback(
    async (item: ActionItemView, reason: string): Promise<boolean> => {
      const optimistic: ActionItemView = {
        ...item,
        status: 'dismissed',
        dismissedReason: reason,
        decidedAt: new Date().toISOString(),
        decidedVia: 'board',
      }
      applyLocal(optimistic)
      const ok = await onDismiss(item, reason)
      if (!ok) {
        rollbackLocal(item.id) // 失败：停留当前页、按钮恢复（G4''）
        setLiveMessage(SAVE_FAILED_TEXT)
        containerRef.current?.focus() // 弹窗关闭后焦点归还可能落空，重聚焦容器保键盘流
        return false
      }
      setLiveMessage(decidedLine(optimistic))
      containerRef.current?.focus() // 弹窗关闭归还焦点可能落空（按钮已卸载），重聚焦容器保键盘流
      scheduleAdvance()
      return true
    },
    [applyLocal, onDismiss, rollbackLocal, scheduleAdvance],
  )

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (dismissTarget) return // 弹窗打开：键位由 dialog 内处理（Esc 只关弹窗，G1''）
    const key = event.key
    if (key === 'Escape') {
      event.preventDefault()
      exitMode()
      return
    }
    if (pageIndex === null) return // 汇总页无单键位（直达行走点击/Enter）
    if (key === 'ArrowRight') {
      event.preventDefault()
      setPageIndex((i) => Math.min((i ?? 0) + 1, scoped.length - 1))
    } else if (key === 'ArrowLeft') {
      event.preventDefault()
      setPageIndex((i) => Math.max((i ?? 0) - 1, 0))
    } else if (key === 'Home') {
      event.preventDefault()
      setPageIndex(0)
    } else if (key === 'End') {
      event.preventDefault()
      setPageIndex(scoped.length - 1)
    } else if (key === 'g' || key === 'G') {
      event.preventDefault()
      setPageIndex(null)
    } else if ((key === 'a' || key === 'A') && current?.status === 'suggested') {
      event.preventDefault()
      doAdopt(current)
    } else if ((key === 'd' || key === 'D') && current?.status === 'suggested') {
      event.preventDefault()
      setDismissTarget(current)
    }
  }

  return (
    <div
      ref={containerRef}
      className="pres-overlay"
      role="region"
      aria-label="汇报模式"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {liveMessage === SAVE_FAILED_TEXT ? (
        <div role="alert" aria-live="polite" className="sr-live">
          {liveMessage}
        </div>
      ) : (
        <div aria-live="polite" className="sr-live">
          {liveMessage}
        </div>
      )}
      {pageIndex === null ? (
        <PresSummaryPage
          view={view}
          items={items}
          scoped={displayScoped}
          scope={scope}
          onScopeChange={setScope}
          onJump={(index) => {
            containerRef.current?.focus() // 议程行卸载后键盘流不中断（与拍板路径同类焦点归还）
            setPageIndex(index)
          }}
        />
      ) : (
        <PresItemPage
          item={displayScoped[pageIndex]}
          index={pageIndex}
          total={displayScoped.length}
          scope={scope}
          reportName={reportNameOf(view, scoped[pageIndex])}
          onBackToSummary={() => setPageIndex(null)}
          onAdopt={doAdopt}
          onOpenDismiss={(item) => setDismissTarget(item)}
          dismissReturnRef={dismissReturnRef}
        />
      )}
      {dismissTarget && (
        <DismissDialog
          size="lg"
          itemTitle={dismissTarget.title}
          onSubmit={(reason) => doDismiss(dismissTarget, reason)}
          onClose={() => setDismissTarget(null)}
          returnFocusRef={dismissReturnRef}
        />
      )}
    </div>
  )
}

function decidedLine(item: ActionItemView): string {
  const via = item.decidedVia ? DECIDED_VIA_LABELS[item.decidedVia] ?? item.decidedVia : ''
  const time = item.decidedAt ? formatDateTime(item.decidedAt) : ''
  if (item.status === 'adopted') return `已采纳 · ${via} · ${time}`
  const reason = item.dismissedReason ?? ''
  return `已驳回 · ${reason.length > 12 ? `${reason.slice(0, 12)}…` : reason}`
}

function reportNameOf(view: BoardView, item: ActionItemView | undefined): string | null {
  if (!item || item.sourceKind === 'manual') return null
  const report = view.reports.find((r) => r.id === item.reportId)
  return report ? report.filename : null
}

/* ---- 汇总页（2.18.2）---- */

interface PresSummaryPageProps {
  view: BoardView
  items: ActionItemView[]
  /** 议程快照（模式级）：议程/图例/直达索引与逐项页严格同源 */
  scoped: ActionItemView[]
  scope: Scope
  onScopeChange(scope: Scope): void
  onJump(index: number): void
}

function PresSummaryPage({ view, items, scoped, scope, onScopeChange, onJump }: PresSummaryPageProps) {
  const suggested = items.filter((it) => it.status === 'suggested')
  const highPriority = suggested.filter((it) => it.priority === 'high').length
  const adopted = items.filter((it) => it.status === 'adopted').length

  const levelCount = (level: string) => scoped.filter((it) => displayEvidenceLevel(it) === level).length
  const total = scoped.length

  return (
    <div className="pres-summary">
      <header className="pres-summary-head">
        <h2 className="pres-project-title">{view.project.title}</h2>
        {view.project.purpose && <p className="pres-project-purpose">{view.project.purpose}</p>}
      </header>
      <div className="pres-stats">
        <div className="stat-group">
          <span className="stat-num">{view.reports.length}</span>
          <span className="stat-label">报告</span>
        </div>
        <div className="stat-group">
          <span className="stat-num">{suggested.length}</span>
          <span className="stat-label">建议</span>
        </div>
        <div className="stat-group">
          <span className="stat-num">{highPriority}</span>
          <span className="stat-label">高优</span>
        </div>
        <div className="stat-group">
          <span className="stat-num">{adopted}</span>
          <span className="stat-label">已采纳</span>
        </div>
      </div>

      <div className="dist-bar" role="img" aria-label={EVIDENCE_LEVELS.map((l) => `${l} ${levelCount(l)}`).join(' · ')}>
        {EVIDENCE_LEVELS.map((level) => {
          const n = levelCount(level)
          if (n === 0) return null
          return (
            <span
              key={level}
              className={`dist-seg ${EVIDENCE_CLASS[level]}`}
              style={{ width: total > 0 ? `${(n / total) * 100}%` : '0%' }}
            />
          )
        })}
      </div>
      <p className="dist-legend">
        {EVIDENCE_LEVELS.map((level) => (
          <span key={level} className="legend-item">
            <i className={`legend-dot ${EVIDENCE_CLASS[level]}`} />
            {level} {levelCount(level)}
          </span>
        ))}
      </p>

      <div className="scope-toggle" role="group" aria-label="范围">
        <button type="button" className="filter-chip" aria-pressed={scope === 'pending'} onClick={() => onScopeChange('pending')}>
          待拍板
        </button>
        <button type="button" className="filter-chip" aria-pressed={scope === 'all'} onClick={() => onScopeChange('all')}>
          全部
        </button>
      </div>

      {scoped.length === 0 && scope === 'pending' ? (
        <div className="pres-empty">
          <p>{EMPTY_AGENDA_TEXT}</p>
          <button type="button" className="filter-chip" onClick={() => onScopeChange('all')}>
            查看全部
          </button>
        </div>
      ) : (
        <ol className="agenda-list">
          {scoped.map((item, index) => (
            <li key={item.id}>
              <button type="button" className="agenda-row" onClick={() => onJump(index)}>
                <span className="agenda-no">{String(index + 1).padStart(2, '0')}</span>
                <span className="agenda-title">{item.title}</span>
                <span className={`chip pres-chip sev-${item.priority}`}>{PRIORITY_LABELS[item.priority] ?? item.priority}</span>
                <i className={`legend-dot ${EVIDENCE_CLASS[displayEvidenceLevel(item)] ?? 'ev-exp'}`} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="pres-keys">{KEY_HINT_TEXT}</p>
    </div>
  )
}

/* ---- 逐项页（2.18.3）---- */

interface PresItemPageProps {
  item: ActionItemView
  index: number
  total: number
  scope: Scope
  reportName: string | null
  onBackToSummary(): void
  onAdopt(item: ActionItemView): void
  onOpenDismiss(item: ActionItemView): void
  dismissReturnRef: React.RefObject<HTMLButtonElement | null>
}

function PresItemPage({
  item,
  index,
  total,
  scope,
  reportName,
  onBackToSummary,
  onAdopt,
  onOpenDismiss,
  dismissReturnRef,
}: PresItemPageProps) {
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const level = displayEvidenceLevel(item)
  const evClass = EVIDENCE_CLASS[level] ?? 'ev-exp'
  const facts = item.evidence?.facts ?? []

  return (
    <div className="pres-item">
      <div className="pres-item-top">
        <span className="pres-pageno" aria-label={`第 ${index + 1} 条，共 ${total} 条`}>
          {index + 1} / {total}
        </span>
        <span className="chip pres-chip scope-chip">{scope === 'pending' ? '待拍板' : '全部'}</span>
        <button type="button" className="pres-back-btn" onClick={onBackToSummary}>
          汇总 (G)
        </button>
      </div>

      <h2 className="pres-title">{item.title}</h2>

      <div className="pres-chip-row">
        <span className={`chip pres-chip sev-${item.priority}`}>{PRIORITY_LABELS[item.priority] ?? item.priority}</span>
        {item.effort && <span className="chip pres-chip val">投入 {PRIORITY_LABELS[item.effort] ?? item.effort}</span>}
        {item.scene && <span className="chip pres-chip val">{item.scene}</span>}
        {item.lifecycle && <span className="chip pres-chip val">{item.lifecycle}</span>}
      </div>

      <div className="pres-evidence">
        <span className={`chip pres-chip ${evClass}`}>{level}</span>
        {item.sourceKind === 'manual' ? (
          <span className="manual-badge-lg">人工</span>
        ) : (
          <span className="conf-group">
            <span className="conf-big">{formatConfidence(item.confidence)}%</span>
            <span className="conf-caption">置信度</span>
          </span>
        )}
      </div>

      {item.sourceKind === 'manual' ? (
        <p className="pres-manual-note">人工补充建议：不参与置信度派生，证据等级固定「经验假设」。</p>
      ) : (
        <>
          {facts.map((fact, i) => (
            <blockquote key={i} className={`pres-quote ${EVIDENCE_CLASS[level] ?? 'ev-exp'}`}>
              {fact.quote ?? fact.text}
            </blockquote>
          ))}
          {facts.length === 0 && <p className="pres-manual-note">未引用报告事实（置信度已按无事实封顶 0.5）</p>}
          <button type="button" className="pres-reasoning-toggle" aria-expanded={reasoningOpen} onClick={() => setReasoningOpen((v) => !v)}>
            推导过程 {reasoningOpen ? '▾' : '▸'}
          </button>
          {reasoningOpen && (
            <div className="pres-reasoning">
              <p className="pres-body">{item.evidence?.reasoning || item.rationale}</p>
              {facts.map((fact, i) => (
                <p key={i} className="pres-fact-note">
                  <span className={`chip pres-chip ${evClass}`}>{level}</span>
                  {fact.text}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      <p className="pres-impact">
        <span className="pres-impact-label">预期效果：</span>
        {item.expectedImpact}
      </p>
      {reportName && <p className="pres-source">{reportName}</p>}

      {item.status === 'suggested' ? (
        <div className="pres-actions">
          <button
            type="button"
            className="btn-adopt-lg"
            onClick={() => onAdopt(item)}
          >
            采纳 (A)
          </button>
          <button
            type="button"
            ref={dismissReturnRef}
            className="btn-dismiss-lg"
            onClick={() => onOpenDismiss(item)}
          >
            驳回 (D)
          </button>
        </div>
      ) : (
        <p className="pres-decided" aria-live="polite">
          {decidedLine(item)}
        </p>
      )}
    </div>
  )
}

