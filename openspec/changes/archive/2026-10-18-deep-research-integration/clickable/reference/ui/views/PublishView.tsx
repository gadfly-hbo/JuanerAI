/* 阶段 6 · 发布:可发布运行 → 不可变版本 → 正式报告(HTML / PDF / PPTX / zip);展示本版本绑定的资产版本。 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Chip from "../components/Chip";
import Empty from "../components/Empty";
import { api } from "../state/api";
import { useProject } from "../state/projectDetail";
import { useToast } from "../state/toast";

interface BindingRow {
  bindingId: string;
  sourceId: string;
  versionId: string;
  purpose: string;
  applicability: string;
  checkNotes: string[];
}

export function PublishView() {
  const p = useProject();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [versionBindings, setVersionBindings] = useState<BindingRow[]>([]);

  // 侧栏版本入口:/project/:id/publish?v=N
  const requested = Number(params.get("v"));
  const versions = p.detail?.meta.versions ?? [];
  useEffect(() => {
    if (requested > 0 && versions.some((v) => v.version === requested) && p.bundleVersion !== requested) {
      void p.selectVersion(requested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, versions.length, p.bundleVersion]);

  // 本查看版本对应运行的资产绑定(引用固定到版本,§8.4)
  const viewedRunId = versions.find((v) => v.version === p.bundleVersion)?.runId ?? null;
  useEffect(() => {
    if (!viewedRunId) {
      setVersionBindings([]);
      return;
    }
    void api<{ bindings: BindingRow[] }>(`/api/library/bindings?runId=${encodeURIComponent(viewedRunId)}`)
      .then((r) => setVersionBindings(r.bindings))
      .catch(() => setVersionBindings([]));
  }, [viewedRunId]);

  if (!p.detail) {
    return (
      <div className="view">
        <span className="spinner" role="status" aria-label="加载中" />
      </div>
    );
  }

  const { runs } = p.detail;
  const publishedRunIds = new Set(versions.map((v) => v.runId));
  const publishable = runs.filter(
    (r) => (r.status === "published" || r.status === "limited") && !publishedRunIds.has(r.id),
  );

  const apiBase = `/api/projects/${p.id}/versions`;

  return (
    <div className="view">
      <h1 className="view-h">发布</h1>
      <p className="view-sub">
        发布即不可变;正式报告在草稿内容之上生成定稿版式(HTML / PDF / PPTX),可重复生成(覆盖旧产物)。
      </p>

      {publishable.length > 0 && (
        <div className="card">
          <h2 className="card-h">
            可发布的运行
            <span className="card-h-note">完成的运行发布后成为不可变版本</span>
          </h2>
          <ul className="filelist" style={{ marginBottom: 0 }}>
            {publishable.map((r) => (
              <li className="file" key={r.id}>
                <span className="file-icon" aria-hidden="true">▤</span>
                <span className="file-name mono">{r.requestId}</span>
                <Chip tone={r.status === "published" ? "ok" : "insuf"}>{r.status === "published" ? "已完成" : "有限交付"}</Chip>
                <span className="file-meta num">
                  搜索 {r.usage.searches} · 抓取 {r.usage.fetches} · 模型 {r.usage.modelCalls} 次 · 输出 {r.usage.outputTokens} tok
                </span>
                <div className="actions">
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => void p.publishRun(r)}>
                    发布为版本
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="card-h">
          本版本实际使用的资产版本
          <span className="card-h-note">引用指向固定版本,不随情报库后续更正漂移</span>
        </h2>
        {versionBindings.length === 0 ? (
          <p className="empty">该版本未绑定情报库资产(全部证据来自本次采证或附件)。</p>
        ) : (
          <ul className="filelist" style={{ marginBottom: 0 }}>
            {versionBindings.map((b) => (
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
        )}
      </div>

      <div className="card">
        <h2 className="card-h">
          版本
          <span className="card-h-note">差异摘要对比上一版;「查看草稿」切换中央区阅读的版本</span>
        </h2>
        {versions.length === 0 ? (
          <Empty
            icon="▤"
            title="尚未发布版本"
            hint={p.activeRun ? "运行完成后可在此发布为版本" : "运行完成后,在「可发布的运行」或运行记录中发布为版本"}
          >
            {!p.activeRun && runs.length === 0 && (
              <button className="btn btn-primary" type="button" onClick={() => navigate(`/project/${p.id}/plan?new=1`)}>
                ＋ 新建研究运行
              </button>
            )}
          </Empty>
        ) : (
          <ul className="filelist" style={{ marginBottom: 0 }}>
            {versions.slice().reverse().map((v) => {
              const isCurrent = p.bundleVersion === v.version;
              return (
                <li className={`file${isCurrent ? " selected" : ""}`} key={v.version}>
                  <span className="file-name">v{v.version}</span>
                  {isCurrent && <Chip tone="agg">正在查看</Chip>}
                  <span className="file-meta num">
                    发布于 {new Date(v.publishedAt).toLocaleString("zh-CN")}
                    {v.diffSummary && (
                      <>
                        {" · "}新增主张 {v.diffSummary.addedClaims.length} · 删除 {v.diffSummary.removedClaims.length} · 证据{" "}
                        {v.diffSummary.evidenceDelta >= 0 ? "+" : ""}{v.diffSummary.evidenceDelta}
                      </>
                    )}
                  </span>
                  <div className="actions">
                    <button
                      className={`btn btn-sm${isCurrent ? "" : " btn-primary"}`}
                      type="button"
                      onClick={async () => {
                        if (!isCurrent) await p.selectVersion(v.version);
                        navigate(`/project/${p.id}/draft`);
                      }}
                    >
                      查看草稿
                    </button>
                    {!p.formalReady[v.version] ? (
                      <button
                        className="btn btn-sm"
                        type="button"
                        disabled={p.busy !== ""}
                        onClick={() => void p.genFormal(v.version)}
                      >
                        {p.busy.includes(`v${v.version}`) ? "生成中…" : "生成正式报告"}
                      </button>
                    ) : (
                      <>
                        <a className="btn btn-sm" href={`${apiBase}/${v.version}/formal/html`} target="_blank" rel="noreferrer">HTML</a>
                        <a className="btn btn-sm" href={`${apiBase}/${v.version}/formal/html?print=1`} target="_blank" rel="noreferrer">PDF</a>
                        <a className="btn btn-sm" href={`${apiBase}/${v.version}/formal/pptx`} download>PPTX</a>
                      </>
                    )}
                    <a
                      className="btn btn-ghost btn-sm"
                      href={`${apiBase}/${v.version}/export`}
                      download
                      onClick={() => toast.show("正在导出 zip(含 bundle、报告与正式产物)")}
                    >
                      导出 zip
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
