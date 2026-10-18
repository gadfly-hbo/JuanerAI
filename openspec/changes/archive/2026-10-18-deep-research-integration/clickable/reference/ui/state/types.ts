/* 共享数据类型与标签映射:与服务端契约(src/contracts.ts)对应,仅前端展示用。 */

export type Module = "brand" | "industry";

export interface OutlineSection { id: string; title: string; purpose?: string; bullets: string[] }
export interface Outline { title: string; subtitle?: string; sections: OutlineSection[] }
export interface VersionEntry {
  version: number;
  runId: string;
  publishedAt: string;
  diffSummary?: { addedClaims: string[]; removedClaims: string[]; evidenceDelta: number };
  /** P1-4:服务端响应时计算(产物文件即事实源);仅项目详情端点携带,列表端点无此字段 */
  formalGenerated?: boolean;
}
export interface ProjectMeta {
  id: string;
  module: Module;
  goal: string;
  scope: { summary: string; queries: string[] };
  updatedAt: string;
  versions: VersionEntry[];
  status?: "active" | "archived";
}
export interface RunProgress {
  currentQuestionId?: string;
  currentQuestionText?: string;
  answered: number;
  open: number;
  skipped: number;
  total: number;
}

export type RunInstructionUI =
  | { type: "skip-question"; questionId?: string }
  | { type: "add-questions"; questions: string[] }
  | { type: "refine-direction"; note: string }
  | { type: "add-source"; url?: string; text?: string; title?: string };

export interface InterventionUI {
  id: string;
  submittedAt: string;
  instruction: RunInstructionUI;
  consumedAt?: string;
  effect?: "applied" | "invalid" | "failed";
  detail?: string;
}

export interface Run {
  id: string;
  requestId: string;
  stage: string;
  status: "running" | "cancelled" | "failed" | "published" | "limited" | "awaiting-confirmation";
  usage: { searches: number; fetches: number; modelCalls: number; outputTokens: number; wallMs: number };
  error?: string;
  derivedFromRunId?: string;
  progress?: RunProgress;
  interventions?: InterventionUI[];
  /** P2-3:确认门身份(仅 awaiting-confirmation 期间存在) */
  gate?: { kind: "plan" | "outline" };
}
export interface Snapshot { id: string; url: string; title: string; fetchedAt: string; parseStatus: string; tier?: "A" | "B" | "C" }
export interface Claim {
  id: string;
  statement: string;
  kind: string;
  evidenceIds: string[];
  calibration?: { entity: string; period: string; unit: string; value?: number };
  confidence?: "high" | "medium" | "low";
}
export interface Verdict {
  evidenceId: string;
  verdict: string;
  entailment?: "strong" | "weak" | "fail" | "na";
  numeric?: "ok" | "mismatch" | "na";
  tier?: "A" | "B" | "C";
}
export interface Bundle {
  runId: string;
  version: number;
  reportMd: string;
  claims: Claim[];
  evidence: { id: string; snapshotId: string; quote: string }[];
  snapshots: Snapshot[];
  limitations: string[];
  unresolved: string[];
  verdicts: Verdict[];
}
export interface ProjectDetail { meta: ProjectMeta; runs: Run[]; snapshots: Snapshot[] }

/** P2-4(D4):调查事件侧车(UI 消费形状,与服务端 InvestigationEvent 对应)。 */
export interface InvestigationEventUI {
  seq: number;
  qid: string;
  kind: "query" | "fetch" | "read" | "verdict";
  at: string;
  summary: string;
  sid?: string;
  url?: string;
  query?: string;
  sufficient?: boolean;
  note?: string;
  title?: string;
}

/** Chip 色调 → styles.css 类名后缀 */
export type Tone = "ok" | "run" | "queue" | "wait" | "fail" | "insuf" | "agg" | "local" | "fork" | "falsi" | "plain";

export const MODULE_LABEL: Record<Module, string> = { brand: "品牌研究", industry: "行业研究" };

export const STATUS: Record<string, { label: string; tone: Tone }> = {
  running: { label: "进行中", tone: "run" },
  cancelled: { label: "已取消", tone: "wait" },
  failed: { label: "已失败", tone: "fail" },
  published: { label: "已发布", tone: "ok" },
  limited: { label: "有限交付", tone: "insuf" },
  // P2-3(S4):待确认=琥珀(warn 系),与已取消的灰 wait 区分
  "awaiting-confirmation": { label: "待确认", tone: "insuf" },
};

/** 侧栏/列表状态点 */
export const STATUS_DOT: Record<string, string> = {
  running: "dot-run",
  cancelled: "dot-cancel",
  failed: "dot-fail",
  published: "dot-ok",
  limited: "dot-warn",
  "awaiting-confirmation": "dot-amber",
};

/** P2-3:确认门展示名(计划门/框架门),供五处状态展示点分支文案 */
export const gateLabelOf = (run: Run): string =>
  run.gate?.kind === "outline" ? "报告框架" : "研究计划";

/** 预算档位:数值解析在服务端(src/core/budgetTiers.ts),此处只承载展示文案 */
export type BudgetTier = "low" | "medium" | "high";

export const BUDGET_TIER_META: Array<{ id: BudgetTier; label: string; hint: string }> = [
  { id: "low", label: "低·快速", hint: "8 搜索 / 12 抓取 · 约 3-8 分钟" },
  { id: "medium", label: "中·标准", hint: "40 搜索 / 80 抓取 · 约 10-30 分钟" },
  { id: "high", label: "高·深度", hint: "100 搜索 / 300 抓取 · 约 30-90 分钟" },
];

export const KIND: Record<string, { label: string; tone: Tone }> = {
  fact: { label: "事实", tone: "agg" },
  inference: { label: "推断", tone: "insuf" },
  unverified: { label: "未验证", tone: "fail" },
};

export const VERDICT: Record<string, { label: string; tone: Tone }> = {
  "quote-hit": { label: "已核实", tone: "ok" },
  "quote-mismatch": { label: "未通过", tone: "fail" },
  "snapshot-missing": { label: "快照缺失", tone: "insuf" },
};

export const CONFIDENCE: Record<string, { label: string; tone: Tone }> = {
  high: { label: "高置信", tone: "ok" },
  medium: { label: "中置信", tone: "insuf" },
  low: { label: "低置信", tone: "fail" },
};

export const TIER_BADGE: Record<string, { label: string; tone: Tone }> = {
  A: { label: "A级", tone: "ok" },
  B: { label: "B级", tone: "agg" },
  C: { label: "C级", tone: "wait" },
};

export const ENTAIL_LABEL: Record<string, string> = {
  strong: "蕴涵:强支撑",
  weak: "蕴涵:弱支撑",
  fail: "蕴涵:不支撑",
  na: "蕴涵:未评估",
};
export const NUMERIC_LABEL: Record<string, string> = {
  ok: "数值复算:一致",
  mismatch: "数值复算:不一致",
  na: "数值复算:未评估",
};

export const STAGES = [
  { key: "plan", title: "计划" },
  { key: "gather", title: "采证" },
  { key: "analyze", title: "分析" },
  { key: "draft", title: "草稿" },
  { key: "review", title: "评审" },
  { key: "publish", title: "发布" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export const isStageKey = (s: string | undefined | null): s is StageKey =>
  s !== undefined && s !== null && STAGES.some((x) => x.key === s);

export const stageTitle = (key: string): string =>
  STAGES.find((s) => s.key === key)?.title ?? key;
