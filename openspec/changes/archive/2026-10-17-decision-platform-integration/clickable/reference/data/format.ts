import type { ActionItemStatus, ActionItemView, ActionLevel, ActionLifecycle, ActionScene, ReportStatus } from './types'

/** 展示时间口径：MM-DD HH:mm（导入时间、审批留痕共用） */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const PRIORITY_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' }
export const ACTION_STATUS_LABELS: Record<ActionItemStatus, string> = {
  suggested: '建议',
  adopted: '已采纳',
  dismissed: '已驳回',
}
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '待抽取',
  extracting: '抽取中',
  done: '已抽取',
  failed: '抽取失败',
}
export const DECIDED_VIA_LABELS: Record<string, string> = { board: '看板', card: '飞书' }

/** 飞书渠道驳回的默认理由（G10 契约钉死文案；看板据此判断补填入口可见性） */
export const CARD_DISMISS_DEFAULT_REASON = '卡片驳回（未填理由）'

/** 四级证据等级（顺序即看板呈现顺序） */
export const EVIDENCE_LEVELS = ['数据支撑', '多源佐证', '逻辑推断', '经验假设'] as const

/** 四级色标 chip / 引用块等级类名（绿/蓝/琥珀/灰，见 tokens 与 App.css） */
export const EVIDENCE_CLASS: Record<string, string> = {
  数据支撑: 'ev-data',
  多源佐证: 'ev-multi',
  逻辑推断: 'ev-logic',
  经验假设: 'ev-exp',
}

/** 抽取枚举同一套（validator 定义；S13 表单下拉与卡片区共用，UI 不改写值） */
export const ACTION_SCENE_OPTIONS: ActionScene[] = ['开业', '日常', '假日', '大促']
export const ACTION_LIFECYCLE_OPTIONS: ActionLifecycle[] = ['A获取', 'A激活', 'R培育', 'R复购', 'R裂变']
export const ACTION_LEVEL_OPTIONS: ActionLevel[] = ['high', 'medium', 'low']

export function displayEvidenceLevel(item: Pick<ActionItemView, 'evidenceLevel' | 'evidence' | 'sourceKind'>): string {
  return item.evidenceLevel ?? item.evidence?.level ?? '经验假设'
}

export function formatConfidence(confidence: number | null): number {
  return Math.round((confidence ?? 0) * 100)
}

/** 报告名 = 文件名去扩展名（卡片报告 chip 与左栏导航共用口径） */
export function reportDisplayName(filename: string): string {
  return filename.replace(/\.(md|txt)$/i, '')
}
