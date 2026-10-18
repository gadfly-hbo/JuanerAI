/* 资产详情三区(§11.3):原文与定位 / 元数据·口径·版本 / 取得与核验·限制。 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errMsg } from "../state/api";
import {
  DOC_TYPE_LABEL,
  FETCH_STATUS_LABEL,
  REUSE_LABEL,
  getAssetContent,
  getAssetDetail,
  type AssetDetail,
} from "../state/library";
import { useToast } from "../state/toast";

export function AssetDetailView() {
  const { sourceId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [correction, setCorrection] = useState("");

  const lifecycleAction = async (lifecycle: string) => {
    try {
      const res = await fetch(`/api/library/assets/${encodeURIComponent(sourceId)}/lifecycle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lifecycle }),
      });
      const out = (await res.json()) as { affectedBindings?: unknown[] };
      if (!res.ok) throw new Error(JSON.stringify(out));
      toast.show(
        out.affectedBindings && out.affectedBindings.length > 0
          ? `已更新;${out.affectedBindings.length} 条历史绑定保持原版本`
          : "已更新生命周期",
      );
      await load();
    } catch (e) {
      toast.show(errMsg(e));
    }
  };

  const submitCorrection = async () => {
    if (!current) return;
    try {
      const res = await fetch(`/api/library/assets/${encodeURIComponent(sourceId)}/corrections`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionId: current.versionId, content: correction }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.show("更正版已登记;旧研究绑定不受影响");
      setCorrection("");
      await load();
    } catch (e) {
      toast.show(errMsg(e));
    }
  };

  const elevateScope = async () => {
    if (!current) return;
    const basis = window.prompt("授权依据(将写入审计):例如「公开财报,允许跨项目引用」");
    if (!basis || !basis.trim()) return;
    try {
      const res = await fetch(`/api/library/assets/${encodeURIComponent(sourceId)}/scope`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionId: current.versionId, targetScope: "WORKSPACE_REUSABLE", basis: basis.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.show("已授权跨项目复用(审计已记录)");
      await load();
    } catch (e) {
      toast.show(errMsg(e));
    }
  };

  const requestDelete = async () => {
    try {
      const preview = await fetch(`/api/library/assets/${encodeURIComponent(sourceId)}?preview=1`, {
        method: "DELETE",
      }).then((r) => r.json() as Promise<{ affectedRuns: string[] }>);
      const affected = preview.affectedRuns.join(", ") || "无";
      if (!window.confirm(`永久删除该资产?\n受影响运行:${affected}\n删除后索引与缓存将清理,操作不可逆。`)) return;
      const res = await fetch(`/api/library/assets/${encodeURIComponent(sourceId)}?confirm=1&force=1`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.show("已删除");
      navigate("/library");
    } catch (e) {
      toast.show(errMsg(e));
    }
  };

  const load = useCallback(async () => {
    try {
      const d = await getAssetDetail(sourceId);
      setDetail(d);
      setError(null);
      const latest = d.versions[d.versions.length - 1];
      if (latest && !selectedVersion) setSelectedVersion(latest.versionId);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [sourceId, selectedVersion]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

  useEffect(() => {
    if (!selectedVersion) return;
    void getAssetContent(selectedVersion).then(setContent);
  }, [selectedVersion]);

  if (error) {
    return (
      <main className="main" id="main" tabIndex={-1}>
        <div className="view">
          <p className="empty">资产加载失败:{error}</p>
          <button className="btn" type="button" onClick={() => navigate("/library")}>返回情报库</button>
        </div>
      </main>
    );
  }
  if (!detail) {
    return (
      <main className="main" id="main" tabIndex={-1}>
        <div className="view"><p className="empty">加载中…</p></div>
      </main>
    );
  }

  const { source, versions, acquisitions } = detail;
  const current = versions.find((v) => v.versionId === selectedVersion) ?? versions[versions.length - 1];

  return (
    <main className="main" id="main" tabIndex={-1}>
      <div className="view">
        <h1 className="view-h">
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate("/library")}>← 情报库</button>
          {source.title}
        </h1>
        <p className="view-sub">
          {DOC_TYPE_LABEL[source.docType] ?? source.docType}
          {source.url ? <> · <span className="mono">{source.url}</span></> : null}
          {source.lifecycle !== "ACTIVE" ? <> · <span className="chip chip-wait">{source.lifecycle}</span></> : null}
          {source.derivedFromRunId ? <> · <span className="chip chip-local">工作台派生成果</span></> : null}
        </p>

        <section className="card">
          <div className="card-h">原文 / 快照及定位</div>
          <div className="fld">
            <label className="fld-label">版本</label>
            <select value={selectedVersion ?? ""} onChange={(e) => setSelectedVersion(e.target.value)}>
              {versions.map((v) => (
                <option key={v.versionId} value={v.versionId}>
                  {v.versionId} · {FETCH_STATUS_LABEL[v.fetchStatus]}
                  {v.parseStatus === "failed" ? " · 解析缺口" : ""}
                </option>
              ))}
            </select>
          </div>
          {current?.parseStatus === "failed" && (
            <p className="err-card" role="alert">解析缺口:{current.parseIssue ?? "解析失败"} —— 该版本正文不可作为已核验事实引用。</p>
          )}
          {current?.fetchStatus === "DISCOVERED" && (
            <p className="empty">仅登记入口,尚未取得正文。状态如实展示,不冒充已读全文。</p>
          )}
          {content !== null ? (
            <pre className="snap-text" style={{ whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>
              {content.slice(0, 20000)}
              {content.length > 20000 ? "\n…(预览截断,完整原文见版本存储)" : ""}
            </pre>
          ) : current && current.fetchStatus !== "DISCOVERED" ? (
            <p className="empty">原文当前不可读(可能解析失败或文件缺失)。</p>
          ) : null}
        </section>

        <section className="card">
          <div className="card-h">元数据 · 口径 · 版本</div>
          <div className="fld">
            <label className="fld-label">更正标题(影响已发布研究的更正需在成果页另行处理)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={editTitle || source.title}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <button
                className="btn btn-sm"
                type="button"
                disabled={!editTitle || editTitle === source.title}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/library/assets/${encodeURIComponent(source.sourceId)}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ title: editTitle }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    toast.show("元数据已更正");
                    await load();
                  } catch (e) {
                    toast.show(errMsg(e));
                  }
                }}
              >
                保存
              </button>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>版本</th><th>取得状态</th><th>解析</th><th>数据期间</th><th>发布时间</th><th>内容哈希</th></tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.versionId}>
                  <td className="mono">{v.versionId}</td>
                  <td>{FETCH_STATUS_LABEL[v.fetchStatus]}</td>
                  <td>{v.parseStatus ?? "—"}</td>
                  <td>{v.dataPeriod ?? "—"}</td>
                  <td>{v.publishedAt ?? "未知"}</td>
                  <td className="mono">{v.contentHash ? v.contentHash.slice(0, 12) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="card-h">取得记录 · 权限 · 使用</div>
          {acquisitions.length === 0 ? (
            <p className="empty">尚无取得记录。</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>取得</th><th>项目/运行</th><th>读取</th><th>复用范围</th><th>外发模型</th><th>导出全文</th></tr>
              </thead>
              <tbody>
                {acquisitions.map((a) => (
                  <tr key={a.acquisitionId}>
                    <td className="mono">{a.acquisitionId}</td>
                    <td className="mono">{a.projectId ?? "工作台"}{a.runId ? ` / ${a.runId.slice(0, 8)}` : ""}</td>
                    <td>{FETCH_STATUS_LABEL[a.readScope] ?? a.readScope}</td>
                    <td><span className={`chip ${a.reuseScope === "WORKSPACE_REUSABLE" ? "chip-ok" : a.reuseScope === "RESTRICTED" ? "chip-wait" : "chip-local"}`}>{REUSE_LABEL[a.reuseScope]}</span></td>
                    <td>{a.rights.sendToExternalModel ? "已授权" : "默认拒绝"}</td>
                    <td>{a.rights.exportFulltext ? "已授权" : "默认拒绝"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="sb-meta">证据、引用项目与核验记录随研究沉淀在研究运行中产生;加入研究在「计划」阶段的复用选择器完成。</p>
        </section>

        <section className="card">
          <div className="card-h">治理动作(归档不删除;撤回禁止新使用;删除不可逆)</div>
          <div className="actions">
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => void lifecycleAction(source.lifecycle === "ARCHIVED" ? "ACTIVE" : "ARCHIVED")}
            >
              {source.lifecycle === "ARCHIVED" ? "恢复为活跃" : "归档"}
            </button>
            <button
              className="btn btn-sm"
              type="button"
              disabled={source.lifecycle === "WITHDRAWN"}
              onClick={() => void lifecycleAction("WITHDRAWN")}
            >
              撤回(禁止新使用)
            </button>
            <button className="btn btn-danger btn-sm" type="button" onClick={() => void requestDelete()}>
              永久删除…
            </button>
          </div>
          <label className="fld">
            <span className="fld-label">登记更正版(产生新版本;旧研究与旧绑定保持原版本)</span>
            <textarea rows={3} value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="更正后的正文…" />
          </label>
          <div className="actions">
            <button
              className="btn btn-sm"
              type="button"
              disabled={!correction.trim() || !current}
              onClick={() => void submitCorrection()}
            >
              提交更正版
            </button>
            <button
              className="btn btn-sm"
              type="button"
              disabled={!current}
              title="显式授权后该版本才可被其他项目复用(§9.3/G6)"
              onClick={() => void elevateScope()}
            >
              授权跨项目复用…
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
