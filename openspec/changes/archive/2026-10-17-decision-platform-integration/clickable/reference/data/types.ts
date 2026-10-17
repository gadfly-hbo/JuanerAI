/**
 * M5 行动闭环共享域类型：前端与 server 共用的唯一类型源。
 * server 侧（agent/types、db、board）经各自模块 re-export，方向保持 server → src。
 */

export type ReportStatus = 'pending' | 'extracting' | 'done' | 'failed'
export type ActionItemStatus = 'suggested' | 'adopted' | 'dismissed'
export type ActionTaskStatus = 'todo' | 'doing' | 'done'

export type ActionScene = '开业' | '日常' | '假日' | '大促'
export type ActionLifecycle = 'A获取' | 'A激活' | 'R培育' | 'R复购' | 'R裂变'
export type ActionLevel = 'high' | 'medium' | 'low'
export type ActionEvidenceLevel = '数据支撑' | '多源佐证' | '逻辑推断' | '经验假设'

export interface ActionEvidenceFact {
  text: string
  /** 报告原文逐字引用；无则为 undefined */
  quote?: string
}

export interface ActionEvidence {
  facts: ActionEvidenceFact[]
  level: ActionEvidenceLevel
  reasoning: string
}

export interface ProjectRecord {
  id: string
  title: string
  purpose: string
  createdAt: string
  updatedAt: string
}

export interface ReportRecord {
  id: number
  projectId: string
  slug: string
  filename: string
  status: ReportStatus
  error: string | null
  importedAt: string
  updatedAt: string
}

export interface ActionItemRecord {
  id: string
  projectId: string
  reportId: number | null
  sourceKind: 'extracted' | 'manual'
  title: string
  rationale: string
  scene: string | null
  lifecycle: string | null
  expectedImpact: string
  metricRef: string | null
  priority: string
  effort: string
  confidence: number | null
  evidence: ActionEvidence | null
  evidenceLevel: string | null
  status: ActionItemStatus
  dismissedReason: string | null
  decidedBy: string | null
  decidedAt: string | null
  decidedVia: string | null
  createdAt: string
  updatedAt: string
}

export interface ActionTaskRecord {
  id: string
  actionItemId: string
  title: string
  owner: string | null
  dueDate: string | null
  status: ActionTaskStatus
  priority: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface ActionFeedbackRecord {
  taskId: string
  adopted: boolean
  outcome: string
  metricDelta: string
  review: string
  score: number
  createdAt: string
  updatedAt: string
}

export interface ActionFeedbackView {
  adopted: boolean
  outcome: string
  metricDelta: string
  review: string
  score: number
  updatedAt: string
}

export interface ActionTaskView extends ActionTaskRecord {
  feedback?: ActionFeedbackView
}

export interface ActionItemView extends ActionItemRecord {
  tasks: ActionTaskView[]
}

export interface BoardStats {
  suggested: number
  adopted: number
  dismissed: number
  manual: number
}

/** M6：项目列表条目（GET /api/projects 响应形状） */
export interface ProjectSummary {
  id: string
  title: string
  purpose: string
  createdAt: string
  updatedAt: string
  actionCounts: BoardStats
  /** 项目内最新 updated_at（空项目为空串） */
  lastActivity: string
}

export interface ModelChainProvider {
  role: '主' | '备'
  provider: string
  modelId: string
  keyReady: boolean
}

export interface BoardView {
  title: string
  lede: string
  /** M6：项目根容器元信息（board 作用域） */
  project: { id: string; title: string; purpose: string }
  reports: ReportRecord[]
  actionItems: ActionItemView[]
  stats: BoardStats
  /** 推送状态（S1 通知 chip 四态数据源，契约 2.1） */
  notify: {
    /** webhook 或 IM 任一已配置 */
    configured: boolean
    /** IM（飞书）通道是否配置；未配置但 webhook 已配置 → 文本摘要降级提示 */
    imConfigured?: boolean
    /** 最近成功推送的报告 slug（来自 notify-state pushedSlugs 最新值） */
    lastPushedReport?: string
  }
  modelChain: { available: boolean; providers: ModelChainProvider[] }
  /** M5 遗留字段（v5 演示态退役）：后端仍返回，前端不再渲染——保留避免后端类型 churn */
  isDemo: boolean
}
