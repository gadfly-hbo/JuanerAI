/* 阶段 1 · 计划:研究发起表单(免 plan 起跑)+ run 内确认门卡片(P2-3:计划确认 → 框架确认 → 开始研究)。
   预览向导已退役;门数据由确认卡片经 gate GET 自取,状态经既有 2.5s 轮询自然呈现。 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Chip from "../components/Chip";
import Empty from "../components/Empty";
import { useProject, type SelectedAsset } from "../state/projectDetail";
import { api, errMsg, post } from "../state/api";
import { FETCH_STATUS_LABEL, REUSE_LABEL, searchLibrary, type AssetSearchRow } from "../state/library";
import { useToast } from "../state/toast";
import { BUDGET_TIER_META, MODULE_LABEL } from "../state/types";
import type { BudgetTier, Module, Outline, Run } from "../state/types";

const FETCH_LABEL = FETCH_STATUS_LABEL;

interface WizardForm { goal: string; summary: string; attachments: string; budgetTier: BudgetTier }
interface BaseRunRef { runId: string; requestId: string }

/** gate GET 契约(R1-5):payload 为 PlanOutput | ReportOutline,context 为请求语境。 */
interface GateData {
  kind: "plan" | "outline";
  payload: any;
  context: { goal?: string; scope?: { summary: string }; module?: Module };
  incremental?: {
    summary: { runId: string; answeredQuestions: number; evidence: number; snapshots: number; claims: number };
  };
}

/** S2 · 计划确认卡片:问题清单可编辑(≥1 条非空),确认后续跑生成框架;放弃=取消 run 回表单。 */
function PlanGateCard({
  projectId, run, onConfirmed, onAbandoned, reload, followupCount,
}: {
  projectId: string;
  run: Run;
  onConfirmed(): void;
  onAbandoned(prefill: { goal: string; summary: string }): void;
  reload(): Promise<void>;
  followupCount: number;
}) {
  const toast = useToast();
  const [gate, setGate] = useState<GateData | null>(null);
  const [missing, setMissing] = useState(false);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string }>>([]);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let alive = true;
    void api<GateData>(`/api/projects/${projectId}/runs/${run.id}/gate`)
      .then((g) => {
        if (!alive) return;
        setGate(g);
        setQuestions((g.payload.questions ?? []).map((q: any) => ({ id: q.id, question: q.question })));
      })
      .catch(() => {
        if (!alive) return;
        setMissing(true);
        void reload(); // 404:门已处理/不存在——刷新状态,由轮询收敛(C4 失败态)
      });
    return () => { alive = false; };
  }, [projectId, run.id, reload]);

  const invalid = questions.length === 0 || questions.some((q) => !q.question.trim());
  const confirm = async () => {
    setBusy("确认中…");
    try {
      await post(`/api/projects/${projectId}/runs/${run.id}/gate/confirm`, {
        payload: {
          questions: questions.map((q, i) => ({
            id: q.id || `q${Date.now().toString(36)}-${i}`,
            question: q.question.trim(),
            status: "open",
          })),
        },
      });
      onConfirmed();
    } catch (e) {
      toast.show(errMsg(e)); // 409:并发已处理——靠轮询收敛到最新状态
      void reload();
    } finally {
      setBusy("");
    }
  };
  const abandon = async () => {
    setBusy("放弃中…");
    try {
      await post(`/api/projects/${projectId}/runs/${run.id}/gate/cancel`, {});
      toast.show("已放弃该研究运行");
      onAbandoned({ goal: gate?.context.goal ?? "", summary: gate?.context.scope?.summary ?? "" });
    } catch (e) {
      toast.show(errMsg(e));
      void reload();
    } finally {
      setBusy("");
    }
  };

  if (missing) {
    return (
      <div className="card">
        <p className="fine" style={{ margin: 0 }}>该确认已处理或不存在,正在刷新运行状态…(自动回退运行列表)</p>
      </div>
    );
  }
  if (!gate) {
    return (
      <div className="card">
        <span className="spinner" role="status" aria-label="加载确认数据" />
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-h" style={{ margin: 0 }}>研究计划待确认</h2>
        <Chip tone="insuf">待确认</Chip>
      </div>
      <p className="fine" style={{ margin: "6px 0 10px" }}>
        研究目标:{gate.context.goal}
        {gate.context.module ? ` · 模块:${MODULE_LABEL[gate.context.module]}` : ""}
      </p>
      {questions.map((q, i) => (
        <div className="fld plan-item" key={q.id || `new-${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label className="fld" style={{ flex: 1, margin: 0 }}>
            <span className="fld-label">问题 {i + 1}</span>
            <input
              value={q.question}
              placeholder="问题不能为空"
              style={q.question.trim() === "" ? { borderColor: "var(--fail-line)" } : undefined}
              onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
            />
          </label>
          <button
            className="btn btn-danger btn-sm"
            type="button"
            disabled={busy !== "" || questions.length <= 1}
            onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
          >
            删除
          </button>
        </div>
      ))}
      <button
        className="btn btn-sm"
        type="button"
        style={{ marginTop: 6 }}
        disabled={busy !== ""}
        onClick={() => setQuestions([...questions, { id: "", question: "" }])}
      >
        ＋ 添加问题
      </button>
      {invalid && (
        <p className="fine" style={{ margin: "8px 0 0", color: "var(--fail)" }}>请至少保留 1 条非空问题</p>
      )}
      {gate.incremental && (
        <p className="fine" style={{ margin: "10px 0 0" }}>
          <span className="chip chip-fork" style={{ marginRight: 8 }}>
            延续研究{followupCount > 0 ? ` · 第 ${followupCount + 1} 次追问` : " · 首次追问"}
          </span>
          基准:<span className="mono">{gate.incremental.summary.runId.slice(0, 10)}…</span>
          {" "}· 已答 {gate.incremental.summary.answeredQuestions} 问 · 证据 {gate.incremental.summary.evidence}
          {" "}· 快照 {gate.incremental.summary.snapshots}(本次只为新问题采证)
        </p>
      )}
      <div className="actions">
        <button className="btn btn-primary" type="button" disabled={invalid || busy !== ""} onClick={() => void confirm()}>
          {busy === "确认中…" ? busy : "确认计划,开始框架"}
        </button>
        <button className="btn btn-ghost" type="button" disabled={busy !== ""} onClick={() => void abandon()}>
          放弃
        </button>
      </div>
    </div>
  );
}

/** S3 · 框架确认卡片:标题/副标题/章节可编辑(标题与每章节标题非空),确认后跳采证;放弃=取消 run 回表单。 */
function OutlineGateCard({
  projectId, run, onDone, onAbandoned, reload,
}: {
  projectId: string;
  run: Run;
  onDone(): void;
  onAbandoned(prefill: { goal: string; summary: string }): void;
  reload(): Promise<void>;
}) {
  const toast = useToast();
  const [gate, setGate] = useState<GateData | null>(null);
  const [missing, setMissing] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let alive = true;
    void api<GateData>(`/api/projects/${projectId}/runs/${run.id}/gate`)
      .then((g) => {
        if (!alive) return;
        setGate(g);
        setOutline(g.payload as Outline);
      })
      .catch(() => {
        if (!alive) return;
        setMissing(true);
        void reload();
      });
    return () => { alive = false; };
  }, [projectId, run.id, reload]);

  const confirm = async () => {
    if (!outline) return;
    setBusy("确认中…");
    try {
      await post(`/api/projects/${projectId}/runs/${run.id}/gate/confirm`, { payload: outline });
      onDone();
    } catch (e) {
      toast.show(errMsg(e));
      void reload();
    } finally {
      setBusy("");
    }
  };
  const abandon = async () => {
    setBusy("放弃中…");
    try {
      await post(`/api/projects/${projectId}/runs/${run.id}/gate/cancel`, {});
      toast.show("已放弃该研究运行");
      onAbandoned({ goal: gate?.context.goal ?? "", summary: gate?.context.scope?.summary ?? "" });
    } catch (e) {
      toast.show(errMsg(e));
      void reload();
    } finally {
      setBusy("");
    }
  };

  if (missing) {
    return (
      <div className="card">
        <p className="fine" style={{ margin: 0 }}>该确认已处理或不存在,正在刷新运行状态…(自动回退运行列表)</p>
      </div>
    );
  }
  if (!outline) {
    return (
      <div className="card">
        <span className="spinner" role="status" aria-label="加载确认数据" />
      </div>
    );
  }
  const invalid = !outline.title.trim() || outline.sections.length === 0 || outline.sections.some((s) => !s.title.trim());

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-h" style={{ margin: 0 }}>报告框架待确认</h2>
        <Chip tone="insuf">待确认</Chip>
      </div>
      <label className="fld" style={{ marginTop: 8 }}>
        <span className="fld-label">报告标题</span>
        <input value={outline.title} onChange={(e) => setOutline({ ...outline, title: e.target.value })} placeholder="报告标题" />
      </label>
      <label className="fld">
        <span className="fld-label">副标题(可空)</span>
        <input
          value={outline.subtitle ?? ""}
          onChange={(e) => setOutline({ ...outline, subtitle: e.target.value })}
          placeholder="副标题"
        />
      </label>
      {outline.sections.map((s, i) => (
        <div className="outline-card" key={s.id}>
          <div className="fld-row">
            <label className="fld">
              <span className="fld-label">章节 {i + 1} 标题</span>
              <input
                value={s.title}
                placeholder="章节标题"
                style={s.title.trim() === "" ? { borderColor: "var(--fail-line)" } : undefined}
                onChange={(e) => setOutline({ ...outline, sections: outline.sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
              />
            </label>
            <div className="actions" style={{ marginTop: 0, alignSelf: "flex-end" }}>
              <button
                className="btn btn-danger btn-sm"
                type="button"
                disabled={busy !== "" || outline.sections.length <= 1}
                onClick={() => setOutline({ ...outline, sections: outline.sections.filter((_, j) => j !== i) })}
              >
                删除
              </button>
            </div>
          </div>
          <label className="fld">
            <span className="fld-label">本节目的(可空)</span>
            <input
              value={s.purpose ?? ""}
              placeholder="本节目的"
              onChange={(e) => setOutline({ ...outline, sections: outline.sections.map((x, j) => (j === i ? { ...x, purpose: e.target.value } : x)) })}
            />
          </label>
          <label className="fld">
            <span className="fld-label">内容要点(每行一条)</span>
            <textarea
              rows={3}
              value={s.bullets.join("\n")}
              placeholder="内容要点,每行一条"
              onChange={(e) => setOutline({
                ...outline,
                sections: outline.sections.map((x, j) => (j === i
                  ? { ...x, bullets: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean) }
                  : x)),
              })}
            />
          </label>
        </div>
      ))}
      <button
        className="btn btn-sm"
        type="button"
        style={{ marginTop: 10 }}
        disabled={busy !== ""}
        onClick={() => setOutline({ ...outline, sections: [...outline.sections, { id: `s${Date.now().toString(36)}-${outline.sections.length + 1}`, title: "", bullets: [] }] })}
      >
        ＋ 添加章节
      </button>
      {invalid && (
        <p className="fine" style={{ margin: "8px 0 0", color: "var(--fail)" }}>请填写报告标题,且每章节标题非空</p>
      )}
      <div className="actions">
        <button className="btn btn-primary" type="button" disabled={invalid || busy !== ""} onClick={() => void confirm()}>
          {busy === "确认中…" ? busy : "确认框架,开始研究"}
        </button>
        <button className="btn btn-ghost" type="button" disabled={busy !== ""} onClick={() => void abandon()}>
          放弃
        </button>
      </div>
      <p className="fine" style={{ margin: "8px 0 0" }}>确认后开始采证,框架不可中途更改。</p>
    </div>
  );
}

export function PlanView() {
  const p = useProject();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const meta = p.detail?.meta;

  const [wizard, setWizard] = useState(false);
  const [form, setForm] = useState<WizardForm>({ goal: "", summary: "", attachments: "", budgetTier: "medium" as BudgetTier });
  const [busy, setBusy] = useState("");
  // plan 门确认后等待框架门(C1 中间态);run 不再占用时复位
  const [awaitingNextGate, setAwaitingNextGate] = useState(false);
  // 2.0 复用选择器:候选资产 → 启动时随请求提交,服务端固定版本绑定
  const [reuseQuery, setReuseQuery] = useState("");
  const [reuseHits, setReuseHits] = useState<AssetSearchRow[]>([]);
  const [selected, setSelected] = useState<SelectedAsset[]>([]);
  // 2.1 增量追问:基准 run 选择(基准摘要来自门 GET 的 incremental)
  const [baseRun, setBaseRun] = useState<BaseRunRef | null>(null);

  const finishedRuns = (p.detail?.runs ?? []).filter((r) => r.status === "published" || r.status === "limited");
  // P2-5(S2):追问次数=项目 runs 中 derivedFromRunId 非空计数(惰性会话后从 0 起跳,语义=本项目追问次数)
  const followupCount = (p.detail?.runs ?? []).filter((r) => r.derivedFromRunId).length;
  const awaitingRun = p.activeRun?.status === "awaiting-confirmation" ? p.activeRun : null;

  useEffect(() => {
    if (!p.activeRun) setAwaitingNextGate(false);
  }, [p.activeRun]);

  const openWizard = (prefill?: { goal?: string; summary?: string }) => {
    if (!meta) return;
    setBaseRun(null);
    setForm({
      goal: prefill?.goal ?? meta.goal,
      summary: prefill?.summary ?? meta.scope.summary,
      attachments: "",
      budgetTier: "medium",
    });
    setWizard(true);
  };

  // ?new=1(侧栏/命令面板入口)在详情就绪后自动打开发起表单
  useEffect(() => {
    if (params.get("new") === "1" && meta) {
      params.delete("new");
      setParams(params, { replace: true });
      openWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, meta]);

  // ?followup=<runId>(运行记录「追问」入口):打开发起表单并预选基准 run
  useEffect(() => {
    const fu = params.get("followup");
    if (fu && meta && p.detail) {
      params.delete("followup");
      setParams(params, { replace: true });
      const target = p.detail.runs.find((r) => r.id === fu && (r.status === "published" || r.status === "limited"));
      if (target) {
        setBaseRun({ runId: target.id, requestId: target.requestId });
        setForm({ goal: `追问:${meta.goal}`, summary: meta.scope.summary, attachments: "", budgetTier: "medium" });
        setWizard(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, meta, p.detail]);

  if (!p.detail || !meta) {
    return (
      <div className="view">
        <span className="spinner" role="status" aria-label="加载中" />
      </div>
    );
  }

  // P2-3 C1:免 plan 起跑 → 门数据经轮询呈现,提交后停留本页等待确认卡片
  const start = async () => {
    setBusy("启动中…");
    const started = await p.startRun({
      goal: form.goal,
      summary: form.summary,
      attachments: form.attachments,
      selectedAssets: selected,
      incrementalOf: baseRun ?? undefined,
      budgetTier: form.budgetTier,
    });
    setBusy("");
    if (started.ok) {
      setWizard(false);
      setSelected([]);
      setReuseHits([]);
      setReuseQuery("");
    }
  };

  // C3 放弃:run=cancelled(可恢复),回到表单并带回该 run 的语境
  const backToForm = (prefill: { goal: string; summary: string }) => {
    setAwaitingNextGate(false);
    openWizard({ goal: prefill.goal || meta.goal, summary: prefill.summary || meta.scope.summary });
  };

  const running = p.activeRun?.status === "running" ? p.activeRun : null;

  return (
    <div className="view">
      <h1 className="view-h">
        计划
        <Chip tone={meta.module === "brand" ? "agg" : "fork"}>{MODULE_LABEL[meta.module]}</Chip>
      </h1>
      <p className="view-sub">{meta.goal} — 研究计划与报告框架都经你确认后才会执行。</p>

      {awaitingRun ? (
        awaitingRun.gate?.kind === "outline" ? (
          <OutlineGateCard
            projectId={p.id}
            run={awaitingRun}
            onDone={() => navigate(`/project/${p.id}/gather`)}
            onAbandoned={backToForm}
            reload={p.reload}
          />
        ) : (
          <PlanGateCard
            followupCount={followupCount}
            projectId={p.id}
            run={awaitingRun}
            onConfirmed={() => setAwaitingNextGate(true)}
            onAbandoned={backToForm}
            reload={p.reload}
          />
        )
      ) : running && awaitingNextGate ? (
        <div className="card">
          <p className="fine" style={{ margin: 0 }}>
            <span className="spinner" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "-2px" }} />{" "}
            正在生成报告框架…通常 1-2 分钟。请保持本页打开以跟踪进度;关闭后再回来确认仍在。
          </p>
        </div>
      ) : running ? (
        <div className="trust-banner" role="note">
          <strong>研究运行进行中</strong>(阶段:{awaitingNextGate ? "框架生成" : "计划生成"})。
          {awaitingNextGate ? "框架生成后会在此等待确认。" : "研究计划生成后会在此等待你的确认。"}
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate(`/project/${p.id}/gather`)}>
            查看进度
          </button>
        </div>
      ) : wizard ? (
        <div className="card">
          <h2 className="card-h">新建研究运行</h2>

          <label className="fld">
            <span className="fld-label">研究目标</span>
            <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="研究目标" />
          </label>
          <label className="fld">
            <span className="fld-label">范围说明</span>
            <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="对象、时间、单位等边界" />
          </label>
          <label className="fld">
            <span className="fld-label">附件(本机文件路径,文本 / PDF,每行一个,可空)</span>
            <textarea rows={3} value={form.attachments} onChange={(e) => setForm({ ...form, attachments: e.target.value })} />
          </label>
          <div className="fld">
            <span className="fld-label">预算档位(决定资料量与耗时;不够可在采证页重跑升档)</span>
            <div style={{ display: "flex", gap: 8 }}>
              {BUDGET_TIER_META.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-sm ${form.budgetTier === t.id ? "btn-primary" : ""}`}
                  onClick={() => setForm({ ...form, budgetTier: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="fine" style={{ margin: 0 }}>
              {BUDGET_TIER_META.find((t) => t.id === form.budgetTier)?.hint}
            </p>
          </div>
          <div className="fld">
            <span className="fld-label">基于已完成研究追问(可选;延续其证据与主张,只为新问题采证)</span>
            <select
              value={baseRun?.runId ?? ""}
              onChange={(e) => {
                const target = finishedRuns.find((r) => r.id === e.target.value);
                setBaseRun(target ? { runId: target.id, requestId: target.requestId } : null);
              }}
            >
              <option value="">— 全新研究(不追问) —</option>
              {finishedRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requestId} · {r.status === "published" ? "完整交付" : "有限交付"}
                  {r.derivedFromRunId ? " · 增量" : ""}
                </option>
              ))}
            </select>
            {baseRun && (
              <p className="fine" style={{ margin: 0 }}>
                将延续基准研究的已核实证据(同 URL 不重复抓取,数据截止默认刷新到今天,采录时点在报告中披露)。
              </p>
            )}
          </div>
          <div className="fld">
            <span className="fld-label">选择已有情报(可选;服务端校验权限并固定版本)</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="search"
                placeholder="在情报库中搜索…"
                value={reuseQuery}
                onChange={(e) => setReuseQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  void (async () => {
                    if (!reuseQuery.trim()) return;
                    try {
                      // 带当前项目上下文:服务端按授权过滤并给适用性(S-01/§11.4)
                      setReuseHits((await searchLibrary({ q: reuseQuery.trim(), projectId: p.id })).results);
                    } catch (err) {
                      toast.show(errMsg(err));
                    }
                  })();
                }}
              />
            </div>
            {reuseHits.length > 0 && (
              <ul className="filelist" style={{ marginTop: 6 }}>
                {reuseHits.map((h) => {
                  const picked = selected.some((s) => s.sourceId === h.sourceId);
                  const forbidden = h.applicability === "FORBIDDEN";
                  const APPL_LABEL: Record<string, string> = {
                    ELIGIBLE: "证据候选",
                    LEAD_ONLY: "仅作线索",
                    NEEDS_REVIEW: "需补证/复核",
                    NOT_APPLICABLE: "不适用",
                    FORBIDDEN: "权限不允许",
                  };
                  return (
                    <li className="file" key={h.sourceId}>
                      <span className="file-name">{h.title}</span>
                      <span className="file-meta">{FETCH_LABEL[h.fetchStatus] ?? h.fetchStatus} · {REUSE_LABEL[h.reuseScope]}</span>
                      {h.applicability && (
                        <span className={`chip ${h.applicability === "ELIGIBLE" ? "chip-ok" : h.applicability === "FORBIDDEN" ? "chip-fail" : "chip-wait"}`}>
                          {APPL_LABEL[h.applicability] ?? h.applicability}
                        </span>
                      )}
                      {h.checkNotes && h.checkNotes.length > 0 && (
                        <div className="fine" style={{ marginTop: 2 }}>{h.checkNotes.join(" · ")}</div>
                      )}
                      <button
                        className="btn btn-sm"
                        type="button"
                        disabled={forbidden}
                        title={forbidden ? "权限不允许:需资产所有者显式授权跨项目复用" : undefined}
                        onClick={() =>
                          setSelected(
                            picked
                              ? selected.filter((s) => s.sourceId !== h.sourceId)
                              : [
                                  ...selected,
                                  {
                                    sourceId: h.sourceId,
                                    versionId: h.versionId,
                                    purpose: "研究复用",
                                    applicability: h.applicability ?? undefined,
                                  },
                                ],
                          )
                        }
                      >
                        {picked ? "移除" : "加入"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {selected.length > 0 && (
              <ul className="filelist" style={{ marginTop: 6 }}>
                {selected.map((s) => (
                  <li className="file" key={s.sourceId}>
                    <span className="file-name">{s.purpose}</span>
                    <span className="file-meta mono" title="绑定固定到该版本,不随情报库更正漂移">
                      {s.versionId}
                    </span>
                    <span className={`chip ${s.applicability === "LEAD_ONLY" ? "chip-fork" : "chip-ok"}`}>
                      {s.applicability === "LEAD_ONLY" ? "仅作线索" : "证据候选"}
                    </span>
                    <button
                      className="btn btn-sm"
                      type="button"
                      title="确认前可下调为仅作线索(§11.4)"
                      onClick={() =>
                        setSelected(
                          selected.map((x) =>
                            x.sourceId === s.sourceId
                              ? { ...x, applicability: x.applicability === "LEAD_ONLY" ? "ELIGIBLE" : "LEAD_ONLY" }
                              : x,
                          ),
                        )
                      }
                    >
                      {s.applicability === "LEAD_ONLY" ? "改回证据候选" : "标记仅作线索"}
                    </button>
                    <input
                      style={{ flex: 1, minWidth: 120 }}
                      value={s.purpose}
                      placeholder="选择理由/用途"
                      onChange={(e) =>
                        setSelected(selected.map((x) => (x.sourceId === s.sourceId ? { ...x, purpose: e.target.value } : x)))
                      }
                    />
                    <button className="btn btn-sm" type="button" onClick={() => setSelected(selected.filter((x) => x.sourceId !== s.sourceId))}>
                      移除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" disabled={!form.goal || busy !== ""} onClick={() => void start()}>
              {busy || "开始研究"}
            </button>
            <button className="btn btn-ghost" type="button" disabled={busy !== ""} onClick={() => setWizard(false)}>取消</button>
            <span className="fine" style={{ margin: 0 }}>提交后先生成研究计划,在本页确认后才会继续</span>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="card-h">研究语境</h2>
            <dl className="kv">
              <div><dt>研究目标</dt><dd>{meta.goal}</dd></div>
              <div><dt>研究模块</dt><dd>{MODULE_LABEL[meta.module]}</dd></div>
              <div><dt>范围说明</dt><dd>{meta.scope.summary}</dd></div>
              <div><dt>研究问题</dt><dd className="num">{meta.scope.queries.length} 个(最近一次运行确认)</dd></div>
            </dl>
            <div className="actions">
              <button className="btn btn-primary" type="button" disabled={p.activeRun !== null} onClick={() => openWizard()}>
                ＋ 新建研究运行
              </button>
              <span className="fine" style={{ margin: 0 }}>
                提交后生成研究计划与报告框架,均经你确认后执行
              </span>
            </div>
          </div>

          <div className="card">
            <h2 className="card-h">
              已确认的研究问题
              <span className="card-h-note">发起运行时逐条确认过;调整请发起新运行</span>
            </h2>
            {meta.scope.queries.length === 0 ? (
              <Empty icon="◇" title="尚无已确认的研究问题" hint="点击「新建研究运行」,先生成计划再逐条编辑确认" />
            ) : (
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {meta.scope.queries.map((q, i) => (
                  <li key={i} style={{ margin: "4px 0" }}>{q}</li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
}
