/* 阶段 2 · 采证:运行进度(进行中)或运行记录(空闲);证据快照流;复用资料与使用记录。 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chip from "../components/Chip";
import Empty from "../components/Empty";
import { api, errMsg, post } from "../state/api";
import { useProject } from "../state/projectDetail";
import { snapshotTitle } from "../state/derive";
import { useToast } from "../state/toast";
import { STATUS, STATUS_DOT, TIER_BADGE, stageTitle, BUDGET_TIER_META, gateLabelOf } from "../state/types";
import type { BudgetTier, InvestigationEventUI, Run, Tone } from "../state/types";

const INS_TYPE_LABEL: Record<string, string> = {
  "skip-question": "跳过问题",
  "add-questions": "新增问题",
  "refine-direction": "方向附注",
  "add-source": "补充信源",
};

interface ReuseRow {
  bindings: Array<{ bindingId: string; sourceId: string; versionId: string; purpose: string; applicability: string; checkNotes: string[] }>;
  usages: Array<{ usageId: string; step: string; contentVersionId: string }>;
}

/* 行内重跑控件:选预算档位后重跑;独立 state,多行记录互不影响 */
function RerunControls({ disabled, onRerun }: { disabled: boolean; onRerun: (tier: BudgetTier) => void }) {
  const [tier, setTier] = useState<BudgetTier>("medium");
  return (
    <>
      <select
        value={tier}
        disabled={disabled}
        title="重跑预算档位"
        onChange={(e) => setTier(e.target.value as BudgetTier)}
      >
        {BUDGET_TIER_META.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      <button
        className="btn btn-sm"
        type="button"
        disabled={disabled}
        title="沿用本运行已确认的问题清单,按所选预算档位重新采证(不重新规划)"
        onClick={() => onRerun(tier)}
      >
        重跑
      </button>
    </>
  );
}

/* P2-4(D5):调查时间线(S1-S3)——问题分组头(状态徽+verdict note)+三型事件卡(query/fetch/read);
   空态两分(S5):附件/复用注入期 vs agent 未动工具。只读;无逐问计数、无模型轮次原文(负例)。 */
function InvestigationTimeline({
  events, questions, running, materialPhase,
}: {
  events: InvestigationEventUI[];
  questions: Array<{ id: string; question: string; status: string }>;
  running: boolean;
  materialPhase: boolean;
}) {
  interface Group { qid: string; events: InvestigationEventUI[]; verdict?: InvestigationEventUI }
  const groups: Group[] = [];
  for (const ev of events) {
    let g = groups.find((x) => x.qid === ev.qid);
    if (!g) {
      g = { qid: ev.qid, events: [] };
      groups.push(g);
    }
    if (ev.kind === "verdict") g.verdict = ev;
    else g.events.push(ev);
  }
  // 终态补齐无事件的问题(已跳过等,来自 checkpoint 问题清单)
  if (!running) {
    for (const q of questions) {
      if (!groups.some((g) => g.qid === q.id)) groups.push({ qid: q.id, events: [] });
    }
  }
  const Q_STATUS: Record<string, { label: string; tone: Tone }> = {
    answered: { label: "已答", tone: "ok" },
    partially: { label: "部分回答", tone: "wait" },
    unanswered: { label: "未答", tone: "fail" },
    skipped: { label: "已跳过", tone: "local" },
  };
  const chipOf = (g: Group): { label: string; tone: Tone } => {
    const mapStatus = questions.find((q) => q.id === g.qid)?.status;
    if (!running && mapStatus && Q_STATUS[mapStatus]) return Q_STATUS[mapStatus]; // 终态:checkpoint 权威状态
    if (g.verdict) return g.verdict.sufficient ? Q_STATUS.answered : Q_STATUS.unanswered; // 运行中:verdict 近似
    return { label: "调查中", tone: "run" };
  };
  const domainOf = (url?: string): string => {
    try {
      return new URL(url ?? "").hostname;
    } catch {
      return url ?? "";
    }
  };

  return (
    <div className="card">
      <h2 className="card-h">
        调查记录
        <span className="card-h-note num">{events.length} 事件{running ? " · 自动追加" : ""}</span>
      </h2>
      {events.length === 0 ? (
        <p className="fine" style={{ margin: 0 }}>
          {materialPhase ? "准备采证材料中(附件解析与复用注入)……" : "尚无调查事件——调查代理正在规划……"}
        </p>
      ) : (
        groups.map((g) => {
          const chip = chipOf(g);
          const q = questions.find((x) => x.id === g.qid);
          return (
            <div key={g.qid} style={{ marginTop: 14 }}>
              <div className="pstep-head" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
                <span className="pstep-name">{q?.question ?? g.qid}</span>
                <Chip tone={chip.tone}>{chip.label}</Chip>
              </div>
              {g.verdict?.note && (
                <p className="fine" style={{ margin: "4px 0 0" }}>agent 判定:{g.verdict.note}</p>
              )}
              {g.events.length > 0 && (
                <ul
                  className="filelist"
                  style={{ marginLeft: 8, marginTop: 8, borderLeft: "2px solid var(--line)", paddingLeft: 12 }}
                >
                  {g.events.map((e) => {
                    if (e.kind === "query") {
                      return (
                        <li className="file" key={e.seq}>
                          <span className="file-icon" aria-hidden="true">⌕</span>
                          <span className="file-name">{e.query ?? e.summary}</span>
                          {e.note && <span className="file-meta num">{e.note}</span>}
                        </li>
                      );
                    }
                    if (e.kind === "fetch") {
                      const failed = !e.sid;
                      return (
                        <li className="file" key={e.seq}>
                          <span className="file-icon" aria-hidden="true">{failed ? "✕" : "▦"}</span>
                          <span className="file-name" style={failed ? { color: "var(--fail)" } : undefined}>
                            {failed ? e.summary : (e.title ?? e.summary)}
                          </span>
                          <span className="file-meta">
                            {domainOf(e.url)}
                            {e.sid ? ` · sid ${e.sid.slice(5, 13)}…` : ""}
                            {failed && e.note ? ` · ${e.note}` : ""}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li className="file" key={e.seq}>
                        <span className="file-icon" aria-hidden="true">▤</span>
                        <span className="file-name">{e.summary}</span>
                        {e.sid && <span className="file-meta mono">sid {e.sid.slice(5, 13)}…</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export function GatherView() {
  const p = useProject();
  const navigate = useNavigate();
  const toast = useToast();
  const focusRunId = p.activeRun?.id ?? p.detail?.runs[p.detail.runs.length - 1]?.id ?? null;
  const [reuse, setReuse] = useState<ReuseRow | null>(null);
  // 2.1 执行中干预表单
  const [newQ, setNewQ] = useState("");
  const [note, setNote] = useState("");
  const [src, setSrc] = useState("");
  // P2-6(R1-8):运行中加注行内表单(只输入增量;不展示上限不前端校验)
  const [addSearches, setAddSearches] = useState("");
  const [addFetches, setAddFetches] = useState("");
  const [addWallMin, setAddWallMin] = useState("");
  const [topupBusy, setTopupBusy] = useState(false);
  const [topupErr, setTopupErr] = useState<string | null>(null);

  useEffect(() => {
    if (!focusRunId) return;
    void api<ReuseRow>(`/api/library/bindings?runId=${encodeURIComponent(focusRunId)}`)
      .then(setReuse)
      .catch(() => setReuse(null));
  }, [focusRunId]);

  if (!p.detail) {
    return (
      <div className="view">
        <span className="spinner" role="status" aria-label="加载中" />
      </div>
    );
  }

  const { runs, snapshots } = p.detail;
  const publishedRunIds = new Set(p.detail.meta.versions.map((v) => v.runId));
  const run = p.activeRun;
  // P2-3(S4):待确认不渲染为"进行中零进度"——独立卡片引导去计划页确认;无干预入口(awaiting 下 instruct 为 409 语义)
  const awaiting = run?.status === "awaiting-confirmation" ? run : null;

  const runActions = (r: Run) => (
    <div className="actions">
      {r.status === "cancelled" && (
        <button className="btn btn-sm" type="button" onClick={() => void p.resumeRun(r)}>自检查点恢复</button>
      )}
      {(r.status === "published" || r.status === "limited") && (
        <button className="btn btn-sm" type="button" disabled={p.activeRun !== null} title={p.activeRun ? "有运行进行中,完成后可追问" : "基于此研究发起增量追问"} onClick={() => navigate(`/project/${p.id}/plan?followup=${r.id}`)}>追问</button>
      )}
      {(r.status === "published" || r.status === "limited") && (
        <RerunControls disabled={p.activeRun !== null} onRerun={(tier) => void p.rerunRun(r.requestId, tier)} />
      )}
      {(r.status === "published" || r.status === "limited") && !publishedRunIds.has(r.id) && (
        <button className="btn btn-primary btn-sm" type="button" onClick={() => void p.publishRun(r)}>发布为版本</button>
      )}
    </div>
  );

  // P2-6(R1-8):加注提交——0/空键忽略(R1-8),非正整数内联错误不提交(契约 C1);服务端同对象原地变异
  const topupVals = [addSearches, addFetches, addWallMin];
  const topupIgnored = (v: string) => v.trim() === "" || Number(v) === 0;
  const topupFieldInvalid = (v: string) => !topupIgnored(v) && !(Number.isInteger(Number(v)) && Number(v) > 0);
  const topupInvalid = topupVals.some(topupFieldInvalid);
  const topupReady = topupVals.some((v) => !topupIgnored(v));
  const submitTopup = async () => {
    if (!run || !topupReady || topupBusy || topupInvalid) return;
    setTopupBusy(true);
    try {
      await post(`/api/projects/${p.id}/runs/${run.id}/budget`, {
        ...(Number(addSearches) > 0 ? { addSearches: Number(addSearches) } : {}),
        ...(Number(addFetches) > 0 ? { addFetches: Number(addFetches) } : {}),
        ...(Number(addWallMin) > 0 ? { extendWallMs: Math.round(Number(addWallMin) * 60_000) } : {}),
      });
      toast.show("已加注,配额饿死的问题将在发布门评估前的评估点自动重开,其后加注只恢复润色/评审回环");
      setAddSearches("");
      setAddFetches("");
      setAddWallMin("");
      setTopupErr(null);
    } catch (e) {
      const msg = errMsg(e);
      // 契约 C1:400=加注增量不合法→input 内联错误;409/网络错误→toast
      if (msg.includes("→ 400:")) setTopupErr("增量须为正整数");
      else toast.show(msg);
    } finally {
      setTopupBusy(false);
    }
  };

  const usageLine = (r: Run) =>
    `搜索 ${r.usage.searches} · 抓取 ${r.usage.fetches} · 模型 ${r.usage.modelCalls} 次 · 输出 ${r.usage.outputTokens} tok · ${Math.round(r.usage.wallMs / 1000)}s`;

  return (
    <div className="view">
      <h1 className="view-h">
        采证
        {run && (
          <Chip tone={awaiting ? "insuf" : "run"}>
            {awaiting ? `待确认 · ${gateLabelOf(run)}` : `进行中 · ${stageTitle(run.stage)}`}
          </Chip>
        )}
      </h1>
      <p className="view-sub">
        检索与抓取由流水线在本机服务内执行;每个来源页面留存净化文本快照,供逐条核查。
      </p>

      {awaiting ? (
        <div className="card">
          <div className="pstep">
            <div className="pstep-head">
              <span className="pstep-name">研究运行待确认</span>
              <Chip tone="insuf">待确认 · {gateLabelOf(awaiting)}</Chip>
            </div>
            <p className="fine" style={{ margin: "6px 0 0" }}>
              「{gateLabelOf(awaiting)}」已生成,等待确认后才会继续执行;关闭页面或重启服务后仍可回来确认。
            </p>
            <div className="actions">
              <button className="btn btn-primary" type="button" onClick={() => navigate(`/project/${p.id}/plan`)}>
                前往计划页确认
              </button>
            </div>
          </div>
        </div>
      ) : run ? (
        <div className="card">
          <div className="pstep running">
            <div className="pstep-head">
              <span className="pstep-name">研究运行进行中</span>
              <Chip tone="run">阶段 · {stageTitle(run.stage)}</Chip>
            </div>
            <div className="bar" aria-hidden="true"><span className="bar-fill" /></div>
            <dl className="kv" style={{ marginTop: 10 }}>
              <div><dt>搜索</dt><dd className="num">{run.usage.searches}</dd></div>
              <div><dt>抓取</dt><dd className="num">{run.usage.fetches}</dd></div>
              <div><dt>模型用量</dt><dd className="num">{run.usage.modelCalls} 次 · {run.usage.outputTokens} tok</dd></div>
              <div><dt>已用时</dt><dd className="num">{Math.round(run.usage.wallMs / 1000)}s</dd></div>
            </dl>
            {run.progress && run.progress.total > 0 && (
              <p className="fine" style={{ margin: 0 }}>
                当前问题:{run.progress.currentQuestionText ?? "(阶段间)"} · 已答 {run.progress.answered}/{run.progress.total}
                {run.progress.skipped > 0 ? ` · 已跳过 ${run.progress.skipped}` : ""}
              </p>
            )}
            {/* P2-6(D1/R1-8):运行中加注——用量条旁行内 fld;非 running 卡片不渲染即禁用;契约 C1 三态 */}
            <div className="fld" style={{ marginTop: 8 }}>
              <span className="fld-label">运行中加注(只增不减;配额饿死的问题将在采证中每问开始、采证轮末、发布门评估前的评估点自动重开,其后加注只恢复润色/评审回环;恢复/重启后加注不延续)</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="number"
                  min={0}
                  style={{ width: 120, ...(topupFieldInvalid(addSearches) ? { borderColor: "var(--fail-line)" } : undefined) }}
                  placeholder="+搜索次数"
                  value={addSearches}
                  onChange={(e) => { setAddSearches(e.target.value); setTopupErr(null); }}
                />
                <input
                  type="number"
                  min={0}
                  style={{ width: 120, ...(topupFieldInvalid(addFetches) ? { borderColor: "var(--fail-line)" } : undefined) }}
                  placeholder="+抓取次数"
                  value={addFetches}
                  onChange={(e) => { setAddFetches(e.target.value); setTopupErr(null); }}
                />
                <input
                  type="number"
                  min={0}
                  style={{ width: 120, ...(topupFieldInvalid(addWallMin) ? { borderColor: "var(--fail-line)" } : undefined) }}
                  placeholder="+墙钟(分钟)"
                  value={addWallMin}
                  onChange={(e) => { setAddWallMin(e.target.value); setTopupErr(null); }}
                />
                <button className="btn btn-sm" type="button" disabled={!topupReady || topupBusy} onClick={() => void submitTopup()}>
                  确认加注
                </button>
              </div>
              {(topupInvalid || topupErr) && (
                <p className="fine" style={{ margin: "6px 0 0", color: "var(--fail)" }}>{topupErr ?? "增量须为正整数"}</p>
              )}
            </div>
            {run.stage === "gather" && (
              <div className="fld" style={{ marginTop: 8 }}>
                <span className="fld-label">执行中干预(不打断进行中的调用,在当前问题完成后生效)</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btn-sm" type="button" onClick={() => void p.instruct({ type: "skip-question" })}>
                    跳过当前问题
                  </button>
                  <input
                    style={{ flex: 1, minWidth: 150 }}
                    placeholder="新增问题(回车提交)"
                    value={newQ}
                    onChange={(e) => setNewQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newQ.trim()) {
                        void p.instruct({ type: "add-questions", questions: [newQ.trim()] });
                        setNewQ("");
                      }
                    }}
                  />
                  <input
                    style={{ flex: 1, minWidth: 150 }}
                    placeholder="方向附注(如:重点看国内,回车提交)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && note.trim()) {
                        void p.instruct({ type: "refine-direction", note: note.trim() });
                        setNote("");
                      }
                    }}
                  />
                  <input
                    style={{ flex: 1, minWidth: 150 }}
                    placeholder="补充信源 URL 或文本(回车提交)"
                    value={src}
                    onChange={(e) => setSrc(e.target.value)}
                    onKeyDown={(e) => {
                      const v = src.trim();
                      if (e.key === "Enter" && v) {
                        void p.instruct(/^https?:\/\//.test(v) ? { type: "add-source", url: v } : { type: "add-source", text: v });
                        setSrc("");
                      }
                    }}
                  />
                </div>
                {run.interventions && run.interventions.length > 0 && (
                  <ul className="filelist" style={{ marginTop: 6 }}>
                    {run.interventions.map((i) => (
                      <li className="file" key={i.id}>
                        <span className="file-name">{INS_TYPE_LABEL[i.instruction.type] ?? i.instruction.type}</span>
                        <span className={`chip ${i.effect === "applied" ? "chip-ok" : i.effect === "failed" ? "chip-fail" : "chip-wait"}`}>
                          {i.effect === "applied" ? "已生效" : i.effect === "failed" ? "失败" : "不适用"}
                        </span>
                        {i.detail && <span className="file-meta">{i.detail}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <p className="fine mono">requestId {run.requestId} · 自动刷新(2.5s)</p>
            <div className="actions">
              <button className="btn btn-danger" type="button" onClick={() => void p.cancelRun(run)}>
                取消(保留已完成阶段)
              </button>
              <span className="fine" style={{ margin: 0 }}>取消后可在运行记录中自检查点恢复</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-h">
            运行记录
            <span className="card-h-note">取消的运行可自检查点恢复;完成的运行可发布为不可变版本</span>
          </h2>
          {runs.length === 0 ? (
            <Empty icon="◇" title="还没有运行" hint="从「计划」阶段发起第一次研究运行">
              <button className="btn btn-primary" type="button" onClick={() => navigate(`/project/${p.id}/plan?new=1`)}>
                ＋ 新建研究运行
              </button>
            </Empty>
          ) : (
            <ul className="filelist" style={{ marginBottom: 0 }}>
              {runs.slice().reverse().map((r) => (
                <li className="file" key={r.id}>
                  <span className={`dot ${STATUS_DOT[r.status] ?? "dot-idle"}`} aria-hidden="true" />
                  <span className="file-name mono">{r.requestId}</span>
                  {r.derivedFromRunId && <Chip tone="fork">增量</Chip>}
                  <Chip tone={STATUS[r.status]?.tone ?? "wait"}>{STATUS[r.status]?.label ?? r.status}</Chip>
                  <span className="file-meta num">{usageLine(r)}</span>
                  {runActions(r)}
                  {r.error && <span className="file-sub" style={{ color: "var(--fail)" }}>{r.error.slice(0, 160)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* P2-4(D5):调查时间线(S1)——只呈现 agent 调查事件;awaiting 不进时间线(负例);完成态全量回看 */}
      {!awaiting && (run?.status === "running" || p.investigation.length > 0) && (
        <InvestigationTimeline
          events={p.investigation}
          questions={p.investigationQuestions}
          running={run?.status === "running"}
          materialPhase={snapshots.some((s) => s.url.startsWith("file://") || s.url.startsWith("library://"))}
        />
      )}

      {reuse && reuse.bindings.length > 0 && (
        <div className="card">
          <h2 className="card-h">
            本运行复用的情报
            <span className="card-h-note num">{reuse.bindings.length} 项 · 使用 {reuse.usages.length} 次</span>
          </h2>
          <ul className="filelist">
            {reuse.bindings.map((b) => (
              <li className="file clickable" key={b.bindingId} onClick={() => navigate(`/library/${b.sourceId}`)}>
                <span className="file-name">{b.purpose}</span>
                <span className="file-meta mono">{b.versionId}</span>
                <span className={`chip ${b.applicability === "ELIGIBLE" ? "chip-ok" : b.applicability === "LEAD_ONLY" ? "chip-fork" : "chip-wait"}`}>
                  {b.applicability === "ELIGIBLE" ? "证据候选" : b.applicability === "LEAD_ONLY" ? "仅作线索" : "需复核"}
                </span>
                {b.checkNotes.length > 0 && <div className="fine" style={{ marginTop: 2 }}>{b.checkNotes.join(" · ")}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="card-h">
          证据快照流
          <span className="card-h-note num">{snapshots.length} 个 · 解析成功 {snapshots.filter((s) => s.parseStatus === "ok").length} 个</span>
        </h2>
        {snapshots.length === 0 ? (
          <Empty icon="▦" title="尚无快照" hint={run ? "运行进行中,抓取到的来源会实时出现在这里" : "运行发起后,每个抓取来源都会留存净化文本快照"} />
        ) : (
          <ul className="filelist" style={{ marginBottom: 0 }}>
            {snapshots.slice(-12).reverse().map((s) => (
              <li className="file" key={s.id}>
                <span className="file-icon" aria-hidden="true">▦</span>
                <span className="file-name">{snapshotTitle(s)}</span>
                {s.tier && <Chip tone={TIER_BADGE[s.tier]?.tone ?? "wait"}>{TIER_BADGE[s.tier]?.label ?? s.tier}</Chip>}
                <Chip tone={s.parseStatus === "ok" ? "ok" : "insuf"}>{s.parseStatus === "ok" ? "解析成功" : s.parseStatus}</Chip>
                <span className="file-sub mono">{s.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
