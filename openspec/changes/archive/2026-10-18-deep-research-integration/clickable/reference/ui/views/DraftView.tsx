/* 阶段 4 · 草稿:待采纳草案卡(PENDING DRAFT,人审不可绕过)+ 报告草稿纸张式阅读;
   草稿是 Agent 产出、无正式效力,人审通过后在「发布」阶段生成正式版式(内容以此为准)。 */
import { useNavigate } from "react-router-dom";
import Empty from "../components/Empty";
import LimitsCard from "../components/LimitsCard";
import ReportBody from "../components/ReportBody";
import { useProject } from "../state/projectDetail";

export function DraftView() {
  const p = useProject();
  const navigate = useNavigate();
  const bundle = p.bundle;
  const run = bundle ? p.detail?.runs.find((r) => r.id === bundle.runId) ?? null : null;
  const formalReady = bundle ? p.formalReady[bundle.version] === true : false;

  return (
    <div className="view">
      <h1 className="view-h">报告草稿</h1>
      <p className="view-sub">
        草稿由研究流水线自动产出,仅供人审;确认内容后在「发布」阶段固化为不可变版本并生成正式报告。
      </p>

      {!bundle ? (
        <Empty
          icon="▤"
          title="尚无报告草稿"
          hint={p.activeRun ? "运行完成并发布为版本后,草稿会出现在这里" : "发布版本后可在此阅读报告草稿"}
        >
          {!p.activeRun && (
            <button className="btn" type="button" onClick={() => navigate(`/project/${p.id}/publish`)}>前往「发布」阶段</button>
          )}
        </Empty>
      ) : (
        <>
          <section className={`draft-card${formalReady ? " adopted" : ""}`} aria-label="待采纳报告草稿">
            <div className="draft-heading">
              <div className="draft-identity">
                {formalReady && <span className="adopted-mark" aria-hidden="true">✓</span>}
                <div>
                  <p className="eyebrow">Pending draft · 待人审</p>
                  <h2>{p.detail?.meta.goal}</h2>
                  <p className="draft-source">
                    来源运行 <span className="mono">{run?.requestId ?? bundle.runId}</span>
                    {" · "}主张 {bundle.claims.length} · 证据 {bundle.evidence.length} · 快照 {bundle.snapshots.length}
                    {bundle.limitations.length > 0 && <> · 有限交付({bundle.limitations.length} 项限制)</>}
                  </p>
                </div>
              </div>
              {formalReady ? (
                <span className="state-badge green">正式版已生成 · v{bundle.version}</span>
              ) : (
                <span className="state-badge amber">草稿 v{bundle.version} · 未生成正式版</span>
              )}
            </div>
            <div className="draft-actions">
              <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
                打印
              </button>
              <button className="btn btn-primary" type="button" onClick={() => navigate(`/project/${p.id}/publish`)}>
                {formalReady ? "查看正式产物 →" : "人审通过,生成正式报告 →"}
              </button>
            </div>
          </section>

          <LimitsCard limitations={bundle.limitations} />
          <article className="report" id="report-doc">
            <header className="report-head">
              <p className="report-brand">独立深度研究工作台 · 品牌 × 行业</p>
              <h2>
                {p.detail?.meta.goal} <small>草稿 v{bundle.version} · 内容以此为准</small>
              </h2>
              <p className="fine">
                定稿版式(HTML / PDF / PPTX)在「发布」阶段生成;正文中每条关键结论可在「评审」阶段回链原文快照。
              </p>
            </header>
            <ReportBody md={bundle.reportMd} />
          </article>
        </>
      )}
    </div>
  );
}
