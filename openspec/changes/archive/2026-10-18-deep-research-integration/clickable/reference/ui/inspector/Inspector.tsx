/* 右侧 Inspector:上下文 / 主张与证据 / 运行记录 / 信源与核查。
   与中央区共享 ProjectDetailContext;点击主张或证据在此展示引句与原文快照(取代旧 Drawer)。 */
import { useLocation, useNavigate } from "react-router-dom";
import Chip from "../components/Chip";
import { useProject } from "../state/projectDetail";
import { useUI } from "../state/ui";
import type { InspTab } from "../state/ui";
import { bestTierOf, quoteOf, snapshotTitle, summarizeVerdicts, verdictKeyOf, verdictOf } from "../state/derive";
import {
  CONFIDENCE, ENTAIL_LABEL, KIND, MODULE_LABEL, NUMERIC_LABEL,
  STATUS, STATUS_DOT, TIER_BADGE, VERDICT, gateLabelOf, isStageKey, stageTitle,
} from "../state/types";

const TABS: { key: InspTab; label: string }[] = [
  { key: "context", label: "上下文" },
  { key: "evidence", label: "主张与证据" },
  { key: "runs", label: "运行记录" },
  { key: "sources", label: "信源与核查" },
];

export function Inspector() {
  const ui = useUI();

  return (
    <aside className="inspector" id="inspector" aria-label="上下文 Inspector">
      <div className="insp-head">
        <h2 className="insp-title">Inspector</h2>
        <button className="btn btn-ghost btn-sm" type="button" onClick={ui.toggleInsp} aria-label="关闭 Inspector">✕</button>
      </div>
      <div className="insp-tabs" role="tablist" aria-label="Inspector 页签">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`insp-tab${ui.inspTab === t.key ? " active" : ""}`}
            role="tab"
            type="button"
            aria-selected={ui.inspTab === t.key}
            onClick={() => ui.setInspTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {ui.inspTab === "context" && <ContextPane />}
      {ui.inspTab === "evidence" && <EvidencePane />}
      {ui.inspTab === "runs" && <RunsPane />}
      {ui.inspTab === "sources" && <SourcePane />}
    </aside>
  );
}

/* ————— 上下文 ————— */
function ContextPane() {
  const p = useProject();
  const location = useLocation();
  if (!p.detail) return <p className="fine">加载中…</p>;

  const seg = location.pathname.split("/");
  const viewStage = isStageKey(seg[3]) ? seg[3] : null;
  const { meta, runs, snapshots } = p.detail;
  const versions = meta.versions;

  return (
    <div role="tabpanel" aria-label="上下文">
      <h3 className="insp-h">当前上下文</h3>
      <dl className="kv">
        <div><dt>阶段</dt><dd>{viewStage ? stageTitle(viewStage) : "—"}</dd></div>
        <div>
          <dt>运行</dt>
          <dd>
            {p.activeRun
              ? p.activeRun.status === "awaiting-confirmation"
                ? `待确认 · ${gateLabelOf(p.activeRun)}`
                : <>进行中 · {stageTitle(p.activeRun.stage)}</>
              : "空闲"}
          </dd>
        </div>
        <div><dt>项目</dt><dd>{meta.goal}</dd></div>
        <div><dt>模块</dt><dd>{MODULE_LABEL[meta.module]}</dd></div>
        <div><dt>版本</dt><dd className="num">{versions.length}(当前 {p.bundleVersion ? `v${p.bundleVersion}` : "未选"})</dd></div>
        <div><dt>快照</dt><dd className="num">{snapshots.length} 个 · 解析成功 {snapshots.filter((s) => s.parseStatus === "ok").length}</dd></div>
        <div><dt>边界</dt><dd>结论逐条绑定原文快照;有限交付披露限制</dd></div>
      </dl>

      <h3 className="insp-h">处理记录</h3>
      <ul className="insp-log">
        {versions.slice().reverse().map((v) => (
          <li key={v.version}>
            <span className="dot dot-ok" aria-hidden="true" style={{ display: "inline-block", marginRight: 6 }} />
            发布 v{v.version} · <span className="num">{new Date(v.publishedAt).toLocaleString("zh-CN")}</span>
          </li>
        ))}
        {runs.slice(-5).reverse().map((r) => (
          <li key={r.id}>
            <span
              className={`dot ${STATUS_DOT[r.status] ?? "dot-idle"}`}
              aria-hidden="true"
              style={{ display: "inline-block", marginRight: 6 }}
            />
            运行 <span className="mono">{r.requestId}</span> · {STATUS[r.status]?.label ?? r.status}
          </li>
        ))}
        {versions.length === 0 && runs.length === 0 && <li className="fine">尚无运行与版本记录。</li>}
      </ul>
    </div>
  );
}

/* ————— 主张与证据 ————— */
function EvidencePane() {
  const p = useProject();
  const bundle = p.bundle;

  if (!bundle) {
    return (
      <div role="tabpanel" aria-label="主张与证据">
        <p className="fine">发布版本后,主张与证据会出现在这里;点击主张查看引句与原文快照。</p>
      </div>
    );
  }

  const selected = p.selectedClaim;
  const v = selected ? verdictOf(bundle, selected) : null;

  return (
    <div role="tabpanel" aria-label="主张与证据">
      <h3 className="insp-h">主张 · {bundle.claims.length} 条(v{p.bundleVersion})</h3>
      {bundle.claims.length === 0 && <p className="fine">该版本没有主张记录。</p>}
      <ul className="insp-list">
        {bundle.claims.map((c) => {
          const vk = verdictKeyOf(bundle, c);
          const tier = bestTierOf(bundle, c);
          const isSel = selected?.id === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`insp-claim${isSel ? " selected" : ""}`}
                onClick={() => p.openClaim(isSel ? null : c)}
              >
                <span className="row">
                  <span className="hypo-id">{c.id}</span>
                  <Chip tone={VERDICT[vk]?.tone ?? "wait"}>{VERDICT[vk]?.label ?? vk}</Chip>
                  {tier && <Chip tone={TIER_BADGE[tier]?.tone ?? "wait"}>{TIER_BADGE[tier]?.label}</Chip>}
                </span>
                <span>{c.statement}</span>
                <span className="row">
                  <Chip tone={KIND[c.kind]?.tone ?? "wait"}>{KIND[c.kind]?.label ?? c.kind}</Chip>
                  {c.confidence && <Chip tone={CONFIDENCE[c.confidence]?.tone ?? "wait"}>{CONFIDENCE[c.confidence].label}</Chip>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <>
          <h3 className="insp-h">证据详情 · {selected.evidenceIds.join(", ")}</h3>
          <div className="insp-evi">
            {v ? (
              <p className="fine" style={{ margin: "0 0 6px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span>引用:{VERDICT[v.verdict]?.label ?? v.verdict}</span>
                {v.entailment && v.entailment !== "na" && <span>{ENTAIL_LABEL[v.entailment]}</span>}
                {v.numeric && v.numeric !== "na" && <span>{NUMERIC_LABEL[v.numeric]}</span>}
                {v.tier && <span>信源:{TIER_BADGE[v.tier]?.label ?? v.tier}</span>}
              </p>
            ) : (
              <p className="fine" style={{ margin: "0 0 6px" }}>无核查记录(快照缺失)。</p>
            )}
            {quoteOf(bundle, selected) && (
              <div className="quote-block">引句(须在原文逐字命中):{quoteOf(bundle, selected)}</div>
            )}
          </div>
          <p className="fine">快照原文(净化纯文本,来源内容不执行):</p>
          {p.snapshotText === null ? (
            <span className="spinner" role="status" aria-label="加载快照" style={{ margin: "14px auto" }} />
          ) : (
            <pre className="snap-text">{p.snapshotText}</pre>
          )}
        </>
      )}
    </div>
  );
}

/* ————— 运行记录 ————— */
function RunsPane() {
  const p = useProject();
  const navigate = useNavigate();
  if (!p.detail) return <p className="fine">加载中…</p>;
  const runs = p.detail.runs;
  const publishedRunIds = new Set(p.detail.meta.versions.map((v) => v.runId));

  return (
    <div role="tabpanel" aria-label="运行记录">
      <h3 className="insp-h">运行 · {runs.length} 次</h3>
      {runs.length === 0 && <p className="fine">尚无运行;从「计划」阶段发起。</p>}
      <ul className="insp-list">
        {runs.slice().reverse().map((r) => (
          <li key={r.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 9px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className={`dot ${STATUS_DOT[r.status] ?? "dot-idle"}`} aria-hidden="true" />
              <span className="mono" style={{ fontSize: 11 }}>{r.requestId}</span>
              <span style={{ marginLeft: "auto" }}>
                <Chip tone={STATUS[r.status]?.tone ?? "wait"}>{STATUS[r.status]?.label ?? r.status}</Chip>
              </span>
            </div>
            <p className="fine num" style={{ margin: "4px 0 0" }}>
              {stageTitle(r.stage)} · 搜索 {r.usage.searches} · 抓取 {r.usage.fetches} · 模型 {r.usage.modelCalls} 次 · 输出 {r.usage.outputTokens} tok · {Math.round(r.usage.wallMs / 1000)}s
            </p>
            {r.error && <p className="fine" style={{ margin: "2px 0 0", color: "var(--fail)" }}>{r.error.slice(0, 120)}</p>}
            {(r.status === "running" || r.status === "cancelled" || ((r.status === "published" || r.status === "limited") && !publishedRunIds.has(r.id))) && (
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {r.status === "running" && (
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => void p.cancelRun(r)}>取消</button>
                )}
                {r.status === "cancelled" && (
                  <button className="btn btn-sm" type="button" onClick={() => void p.resumeRun(r)}>自检查点恢复</button>
                )}
                {(r.status === "published" || r.status === "limited") && !publishedRunIds.has(r.id) && (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => void p.publishRun(r)}>发布为版本</button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="fine">
        运行失败或被取消时如实显示状态与原因;取消的运行可自检查点恢复。
        <button className="evi-link" type="button" style={{ marginLeft: 6 }} onClick={() => navigate(`/project/${p.id}/gather`)}>
          前往采证阶段
        </button>
      </p>
    </div>
  );
}

/* ————— 信源与核查 ————— */
function SourcePane() {
  const p = useProject();
  if (!p.detail) return <p className="fine">加载中…</p>;

  const bundle = p.bundle;
  const snapshots = bundle && bundle.snapshots.length > 0 ? bundle.snapshots : p.detail.snapshots;
  const summary = bundle ? summarizeVerdicts(bundle.verdicts) : null;

  return (
    <div role="tabpanel" aria-label="信源与核查">
      <h3 className="insp-h">核查分布{bundle ? `(v${bundle.version})` : ""}</h3>
      {summary ? (
        <dl className="kv">
          <div><dt>引句命中</dt><dd className="num">{summary.quoteHit} / {summary.total}</dd></div>
          <div><dt>引句未通过</dt><dd className="num">{summary.quoteMismatch}</dd></div>
          <div><dt>蕴涵强支撑</dt><dd className="num">{summary.entailStrong}</dd></div>
          <div><dt>蕴涵不支撑</dt><dd className="num">{summary.entailFail}</dd></div>
          <div><dt>数值一致</dt><dd className="num">{summary.numericOk}</dd></div>
          <div><dt>数值不一致</dt><dd className="num">{summary.numericMismatch}</dd></div>
          <div><dt>信源 A / B / C</dt><dd className="num">{summary.tierA} / {summary.tierB} / {summary.tierC}</dd></div>
          <div><dt>快照缺失</dt><dd className="num">{summary.snapshotMissing}</dd></div>
        </dl>
      ) : (
        <p className="fine">发布版本后展示核查分布。</p>
      )}

      <h3 className="insp-h">证据快照 · {snapshots.length} 个{bundle ? "(当前版本引用)" : "(项目全部)"}</h3>
      <ul className="insp-list">
        {snapshots.slice().reverse().map((s) => (
          <li key={s.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {s.tier && <Chip tone={TIER_BADGE[s.tier]?.tone ?? "wait"}>{TIER_BADGE[s.tier]?.label}</Chip>}
              <Chip tone={s.parseStatus === "ok" ? "ok" : "insuf"}>{s.parseStatus === "ok" ? "解析成功" : s.parseStatus}</Chip>
              <span className="fine num" style={{ margin: 0, marginLeft: "auto" }}>{new Date(s.fetchedAt).toLocaleDateString("zh-CN")}</span>
            </div>
            <div style={{ fontWeight: 500, marginTop: 2 }}>{snapshotTitle(s)}</div>
            <div className="fine mono" style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.url}>
              {s.url}
            </div>
          </li>
        ))}
        {snapshots.length === 0 && <li className="fine">尚无快照。</li>}
      </ul>
      <p className="fine">
        信源分级口径:A = 官方 / 政府公报 / 权威媒体一手;B = 行业报告 / 专业平台;C = 论坛社媒自媒体。
      </p>
    </div>
  );
}
