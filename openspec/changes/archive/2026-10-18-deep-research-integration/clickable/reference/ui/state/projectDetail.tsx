/* 单项目详情上下文:2.5s 轮询,三栏(侧栏运行/中央区/Inspector)共享一份数据。
   集中承载运行操作(启动/取消/恢复/发布)、版本 bundle 选择、正式报告探测、主张选中与快照文本缓存。 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api, errMsg, post } from "./api";
import { useToast } from "./toast";
import { useUI } from "./ui";
import { useProjects } from "./projects";
import { STAGES, BUDGET_TIER_META } from "./types";
import type { Bundle, BudgetTier, Claim, InvestigationEventUI, Outline, ProjectDetail, Run, RunInstructionUI } from "./types";

export interface SelectedAsset {
  sourceId: string;
  versionId: string;
  purpose: string;
  applicability?: string;
  asOf?: string;
}

export interface StartRunParams {
  goal: string;
  summary: string;
  attachments: string;
  /** P2-3:免 plan 起跑(缺省)走 run 内确认门;旧路径显式携带则跳过 plan 门 */
  plan?: { id: string; question: string }[];
  outline?: Outline;
  /** 2.0:启动前选择的已有情报;服务端检查权限并固定版本绑定 */
  selectedAssets?: SelectedAsset[];
  /** 2.1:增量追问的基准运行(延续其证据与主张,只为新问题采证) */
  incrementalOf?: { runId: string; requestId: string };
  /** 预算档位;缺省中档(服务端解析为具体搜索/抓取上限) */
  budgetTier?: BudgetTier;
}

interface ProjectCtx {
  id: string;
  detail: ProjectDetail | null;
  loadFailed: boolean;
  activeRun: Run | null;
  /** 运行进度标记:0-6,用于 stagebar done/locked 判定 */
  progress: number;
  bundle: Bundle | null;
  bundleVersion: number | null;
  selectVersion(v: number): Promise<void>;
  formalReady: Record<number, boolean>;
  genFormal(v: number): Promise<void>;
  busy: string;
  startRun(p: StartRunParams): Promise<{ ok: boolean; rejected: Array<{ sourceId: string; reason: string }> }>;
  /** 2.1:向运行中的 run 提交干预指令(问题间隙生效) */
  instruct(instruction: RunInstructionUI): Promise<void>;
  cancelRun(r: Run): Promise<void>;
  resumeRun(r: Run): Promise<void>;
  publishRun(r: Run): Promise<void>;
  /** 按新预算档位重跑既有请求(沿用原问题清单,生成新 run) */
  rerunRun(requestId: string, tier: BudgetTier): Promise<void>;
  selectedClaim: Claim | null;
  snapshotText: string | null;
  openClaim(c: Claim | null): void;
  reload(): Promise<void>;
  /** P2-4(D4/D5):聚焦 run(activeRun 优先,否则最近 run)的调查事件——since 游标增量追加。 */
  investigation: InvestigationEventUI[];
  /** P2-4:调查流分组头的问题清单(最新 gather/plan checkpoint;带 plan 旧路径首采前为空)。 */
  investigationQuestions: Array<{ id: string; question: string; status: string }>;
}

const Ctx = createContext<ProjectCtx | null>(null);

const stageIndexOf = (stage: string): number => Math.max(0, STAGES.findIndex((s) => s.key === stage));

export function ProjectDetailProvider({ id, children }: { id: string; children: ReactNode }) {
  const toast = useToast();
  const ui = useUI();
  const projects = useProjects();

  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [bundleVersion, setBundleVersion] = useState<number | null>(null);
  const [formalReady, setFormalReady] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [snapshotText, setSnapshotText] = useState<string | null>(null);
  const snapCache = useRef(new Map<string, string>());
  const autoLoaded = useRef(false);
  const lastUpdatedAt = useRef<string | null>(null);
  // P2-4:调查事件游标——runId 切换重置;终态全量回看一次后停(窗口溢出则拉到收尾)
  const detailRef = useRef<ProjectDetail | null>(null);
  detailRef.current = detail;
  const invRef = useRef<{ runId: string | null; since: number; stopped: boolean }>({ runId: null, since: 0, stopped: false });
  const [investigation, setInvestigation] = useState<InvestigationEventUI[]>([]);
  const [investigationQuestions, setInvestigationQuestions] = useState<Array<{ id: string; question: string; status: string }>>([]);

  // 切换项目:清空上一个项目的全部状态
  useEffect(() => {
    setDetail(null);
    setBundle(null);
    setBundleVersion(null);
    setFormalReady({});
    setSelectedClaim(null);
    setSnapshotText(null);
    setLoadFailed(false);
    setBusy("");
    autoLoaded.current = false;
    lastUpdatedAt.current = null;
    snapCache.current = new Map();
    invRef.current = { runId: null, since: 0, stopped: false };
    setInvestigation([]);
    setInvestigationQuestions([]);
  }, [id]);

  const reload = useCallback(async () => {
    try {
      const d = await api<ProjectDetail>(`/api/projects/${id}`);
      setDetail(d);
      setLoadFailed(false);
      // 首次拿到详情后默认选中最新版本
      if (!autoLoaded.current) {
        autoLoaded.current = true;
        const latest = d.meta.versions[d.meta.versions.length - 1];
        if (latest) {
          setBundleVersion(latest.version);
          try {
            setBundle(await api<Bundle>(`/api/projects/${id}/versions/${latest.version}/bundle`));
          } catch { /* 版本探测失败不阻断页面 */ }
        }
      }
      // meta 变化时同步侧栏项目列表(版本数/更新时间)
      if (lastUpdatedAt.current !== null && lastUpdatedAt.current !== d.meta.updatedAt) {
        void projects.reload();
      }
      lastUpdatedAt.current = d.meta.updatedAt;
    } catch {
      setLoadFailed(true);
    }
  }, [id, projects]);

  /**
   * P2-4(D4/D5):调查事件增量拉取——沿 2.5s 轮询 since 追加;终态全量回看一次后停
   * (窗口溢出 ≥500 时整段替换并继续拉到收尾);awaiting 不停(确认后沿用同一游标);
   * 404/无事件吞错交空态。
   */
  const invTick = useCallback(async () => {
    const d = detailRef.current;
    if (!d) return;
    const focus =
      d.runs.find((r) => r.status === "running" || r.status === "awaiting-confirmation") ??
      d.runs[d.runs.length - 1] ??
      null;
    const fid = focus?.id ?? null;
    if (invRef.current.runId !== fid) {
      invRef.current = { runId: fid, since: 0, stopped: false };
      setInvestigation([]);
      setInvestigationQuestions([]);
    }
    if (!fid || invRef.current.stopped) return;
    try {
      const r = await api<{ events: InvestigationEventUI[]; questions: Array<{ id: string; question: string; status: string }> }>(
        `/api/projects/${id}/runs/${fid}/investigation?since=${invRef.current.since}`,
      );
      if (r.questions.length > 0) setInvestigationQuestions(r.questions);
      if (r.events.length > 0) {
        invRef.current.since = r.events[r.events.length - 1].seq;
        setInvestigation((prev) => (r.events.length >= 500 ? r.events : prev.concat(r.events)));
      }
      if (focus && ["cancelled", "failed", "published", "limited"].includes(focus.status) && r.events.length < 500) {
        invRef.current.stopped = true;
      }
    } catch {
      /* 无事件/端点不可用 → 空态呈现 */
    }
  }, [id]);

  useEffect(() => {
    void reload();
    void invTick();
    const timer = window.setInterval(() => {
      void reload();
      void invTick();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [reload, invTick]);

  // P1-4:formalReady 从轮询到的 meta.versions[].formalGenerated 派生(D2,替代逐版本探测 fetch);
  // merge 只增不减,与 genFormal 成功后的乐观置位一致
  const versionsKey = detail ? detail.meta.versions.map((v) => v.version).join(",") : "";
  useEffect(() => {
    if (!detail) return;
    setFormalReady((prev) => {
      const next = { ...prev };
      for (const v of detail.meta.versions) {
        if (v.formalGenerated) next[v.version] = true;
      }
      return next;
    });
  }, [versionsKey, detail?.meta.versions]);

  const selectVersion = useCallback(async (v: number) => {
    setBundleVersion(v);
    setSelectedClaim(null);
    setSnapshotText(null);
    try {
      setBundle(await api<Bundle>(`/api/projects/${id}/versions/${v}/bundle`));
    } catch (e) {
      setBundle(null);
      toast.show(errMsg(e));
    }
  }, [id, toast]);

  const genFormal = useCallback(async (v: number) => {
    setBusy(`生成正式报告中…(v${v})`);
    try {
      const r = await post<{ summarySource: string }>(`/api/projects/${id}/versions/${v}/formal`, {});
      setFormalReady((prev) => ({ ...prev, [v]: true }));
      toast.show(r.summarySource === "model" ? "正式报告已生成(含摘要提炼)" : "正式报告已生成(摘要为确定性兜底)");
    } catch (e) {
      toast.show(errMsg(e));
    } finally {
      setBusy("");
    }
  }, [id, toast]);

  const startRun = useCallback(
    async (p: StartRunParams): Promise<{ ok: boolean; rejected: Array<{ sourceId: string; reason: string }> }> => {
      try {
        // P2-5:追问(有基准)走 followup 端点;全新研究走 /runs(现状)
        const isFollowup = !!p.incrementalOf;
        const started = await post<{
          reuse?: { bound: number; rejected: Array<{ sourceId: string; reason: string }> };
        }>(
          isFollowup ? `/api/projects/${id}/runs/followup` : `/api/projects/${id}/runs`,
          isFollowup
            ? {
                prompt: p.goal,
                summary: p.summary,
                baseRunId: p.incrementalOf!.runId,
                budgetTier: p.budgetTier ?? "medium",
              }
            : {
          request: {
            id: `req-${Date.now().toString(36)}`,
            module: detail?.meta.module ?? "brand",
            goal: p.goal,
            scope: { summary: p.summary, queries: (p.plan ?? []).map((q) => q.question) },
            attachments: p.attachments.split("\n").map((s) => s.trim()).filter(Boolean),
            outline: p.outline,
            incrementalOf: p.incrementalOf,
            budgetTier: p.budgetTier ?? "medium",
          },
          // P2-3:不带 plan 时 server 传 gates 走确认门(plan 产出后落门返回)
          plan: p.plan ? { questions: p.plan.map((q) => ({ ...q, status: "open" })) } : undefined,
          // 2.0:复用选择在请求体顶层,服务端绑定后随 run 固定版本
          selectedAssets: p.selectedAssets,
              },
        );
        const rejected = started.reuse?.rejected ?? [];
        toast.show(
          rejected.length > 0
            ? `研究运行已启动;${rejected.length} 项选择因权限/状态被拒绝(未绑定)`
            : p.plan
              ? "研究运行已启动,可在「采证」阶段跟踪进度"
              : "研究运行已启动,请在「计划」阶段确认研究计划",
        );
        await reload();
        void projects.reload();
        return { ok: true, rejected };
      } catch (e) {
        toast.show(errMsg(e));
        return { ok: false, rejected: [] };
      }
    },
    [detail?.meta.module, id, projects, reload, toast],
  );

  const instruct = useCallback(async (instruction: RunInstructionUI): Promise<void> => {
    const running = detail?.runs.find((r) => r.status === "running");
    if (!running) {
      toast.show("没有正在运行的 run");
      return;
    }
    try {
      const r = await post<{ queued: boolean; pending: number; note?: string }>(`/api/projects/${id}/runs/instruct`, {
        requestId: running.requestId,
        instruction,
      });
      toast.show(r.queued ? `指令已入队(待消费 ${r.pending})· ${r.note ?? "将在当前问题完成后生效"}` : "指令未入队");
      await reload();
    } catch (e) {
      toast.show(errMsg(e));
    }
  }, [detail, id, reload, toast]);

  const cancelRun = useCallback(async (r: Run) => {
    try {
      await post(`/api/projects/${id}/runs/cancel`, { requestId: r.requestId });
      toast.show("已取消,已完成阶段保留");
      await reload();
    } catch (e) {
      toast.show(errMsg(e));
    }
  }, [id, reload, toast]);

  const resumeRun = useCallback(async (r: Run) => {
    try {
      await post(`/api/projects/${id}/runs/resume`, { requestId: r.requestId });
      toast.show("已自检查点恢复运行");
      await reload();
    } catch (e) {
      toast.show(errMsg(e));
    }
  }, [id, reload, toast]);

  const publishRun = useCallback(async (r: Run) => {
    try {
      await post(`/api/projects/${id}/publish`, { runId: r.id });
      toast.show("已发布为新版本");
      autoLoaded.current = true; // 手动选版本逻辑接管,避免轮询覆盖
      await reload();
      void projects.reload();
    } catch (e) {
      toast.show(errMsg(e));
    }
  }, [id, projects, reload, toast]);

  const rerunRun = useCallback(async (requestId: string, tier: BudgetTier) => {
    const meta = BUDGET_TIER_META.find((t) => t.id === tier);
    try {
      await post(`/api/projects/${id}/runs/rerun`, { requestId, budgetTier: tier });
      toast.show(`重跑已启动(预算${meta?.label ?? tier}),可在「采证」阶段跟踪进度`);
      await reload();
      void projects.reload();
    } catch (e) {
      toast.show(errMsg(e));
    }
  }, [id, reload, toast]);

  const openClaim = useCallback((c: Claim | null) => {
    setSelectedClaim(c);
    setSnapshotText(null);
    if (c) {
      ui.setInspTab("evidence");
      const ev = bundle?.evidence.find((e) => e.id === c.evidenceIds[0]);
      if (ev) {
        const cached = snapCache.current.get(ev.snapshotId);
        if (cached !== undefined) {
          setSnapshotText(cached);
        } else {
          void fetch(`/api/projects/${id}/snapshots?sid=${encodeURIComponent(ev.snapshotId)}`)
            .then(async (res) => {
              const text = res.ok ? await res.text() : "(快照不可用)";
              snapCache.current.set(ev.snapshotId, text);
              return text;
            })
            .catch(() => "(快照不可用)")
            .then((text) => {
              // 仅当选中主张未变时回填,避免快速切换时串台
              setSelectedClaim((cur) => {
                if (cur?.id === c.id) setSnapshotText(text);
                return cur;
              });
            });
        }
      }
    }
  }, [bundle, id, ui]);

  // P2-3(D4):activeRun 扩含 awaiting-confirmation——待确认也是"占用中"(新建/追问/重跑均被服务端守卫拒绝);
  // 各展示点按 status 分支,不再把 awaiting 渲染为"进行中"
  const activeRun =
    detail?.runs.find((r) => r.status === "running" || r.status === "awaiting-confirmation") ?? null;
  const progress = detail
    ? activeRun
      ? stageIndexOf(activeRun.stage)
      : detail.meta.versions.length > 0
        ? STAGES.length
        : 0
    : 0;

  return (
    <Ctx.Provider
      value={{
        id, detail, loadFailed, activeRun, progress,
        bundle, bundleVersion, selectVersion,
        formalReady, genFormal, busy,
        startRun, instruct, cancelRun, resumeRun, publishRun, rerunRun,
        selectedClaim, snapshotText, openClaim,
        reload,
        investigation, investigationQuestions,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useProjectOrNull = (): ProjectCtx | null => useContext(Ctx);

export const useProject = (): ProjectCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProject 必须在 ProjectDetailProvider 内使用");
  return ctx;
};
