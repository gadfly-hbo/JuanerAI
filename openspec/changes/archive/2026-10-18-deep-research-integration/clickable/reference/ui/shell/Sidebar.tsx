/* 左侧栏:⌘K 搜索 / 新建入口 / 项目树(展开列版本) / 当前项目最近运行 / 底部设置与边界声明;品牌区在顶部 TopBar。 */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Chip from "../components/Chip";
import { useProjects } from "../state/projects";
import { useProjectOrNull } from "../state/projectDetail";
import { useUI } from "../state/ui";
import { MODULE_LABEL, STATUS, STATUS_DOT, STAGES, gateLabelOf } from "../state/types";
import type { Module, ProjectMeta } from "../state/types";

const MODULE_ORDER: Module[] = ["brand", "industry"];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const ui = useUI();
  const { projects } = useProjects();
  const detail = useProjectOrNull();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [archivedOpen, setArchivedOpen] = useState(false);

  const currentId = location.pathname.match(/^\/project\/([^/]+)/)?.[1] ?? null;
  const current = detail?.detail ?? null;
  const active = projects.filter((p) => p.status !== "archived");
  const archived = projects.filter((p) => p.status === "archived");
  const runs = current ? current.runs.slice(-6).reverse() : [];

  const projectRow = (p: ProjectMeta) => {
    const isCurrent = p.id === currentId;
    const canExpand = p.versions.length > 0;
    const open = expanded[p.id] === true;
    return (
      <li key={p.id}>
        <div
          className={`sb-item${isCurrent ? " active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/project/${p.id}`)}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(`/project/${p.id}`); }}
        >
          <span
            className="caret"
            aria-hidden="true"
            onClick={(e) => {
              if (!canExpand) return;
              e.stopPropagation();
              setExpanded({ ...expanded, [p.id]: !open });
            }}
          >
            {canExpand ? (open ? "▾" : "▸") : "·"}
          </span>
          <span className="sb-label" title={p.goal}>{p.goal}</span>
          {p.versions.length > 0 && <span className="sb-meta">v{p.versions[p.versions.length - 1].version}</span>}
        </div>
        {open && (
          <ul className="sb-versions" aria-label={`${p.goal} 版本`}>
            {p.versions.slice().reverse().map((v) => (
              <li key={v.version}>
                <button className="sb-item" type="button" onClick={() => navigate(`/project/${p.id}/publish?v=${v.version}`)}>
                  <span className="sb-label">v{v.version} · {new Date(v.publishedAt).toLocaleDateString("zh-CN")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className="sidebar" aria-label="项目与运行导航">
      <div className="sb-top">
        <button className="sb-search" type="button" onClick={ui.openPalette}>
          <span aria-hidden="true">⌕</span> 搜索项目与命令 <kbd>⌘K</kbd>
        </button>
        <button
          className={`sb-item${location.pathname === "/library" ? " active" : ""}`}
          type="button"
          onClick={() => navigate("/library")}
        >
          <span aria-hidden="true">▣</span> 外部情报库
        </button>
        {currentId && current ? (
          <button
            className="sb-new"
            type="button"
            disabled={detail?.activeRun != null}
            title={detail?.activeRun ? "运行进行中或待确认,处理后方可再次发起" : undefined}
            onClick={() => navigate(`/project/${currentId}/plan?new=1`)}
          >
            ＋ 新建研究运行
          </button>
        ) : (
          <button className="sb-new" type="button" onClick={() => navigate("/?new=1")}>＋ 新建项目</button>
        )}
      </div>

      {MODULE_ORDER.map((mod) => {
        const items = active
          .filter((p) => p.module === mod)
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        if (items.length === 0) return null;
        return (
          <div className="sb-section" key={mod}>
            <h2 className="sb-h">{MODULE_LABEL[mod]}<span className="sb-h-count">{items.length}</span></h2>
            <ul className="sb-list" role="list">
              {items.map(projectRow)}
            </ul>
          </div>
        );
      })}

      {archived.length > 0 && (
        <div className="sb-section">
          <h2 className="sb-h">
            <button
              className="sb-item"
              type="button"
              style={{ padding: 0, width: "auto" }}
              onClick={() => setArchivedOpen(!archivedOpen)}
              aria-expanded={archivedOpen}
            >
              <span className="caret" aria-hidden="true">{archivedOpen ? "▾" : "▸"}</span>
              已归档<span className="sb-meta">{archived.length}</span>
            </button>
          </h2>
          {archivedOpen && (
            <ul className="sb-list" role="list">
              {archived.map(projectRow)}
            </ul>
          )}
        </div>
      )}

      {currentId && current && (
        <div className="sb-section">
          <h2 className="sb-h">最近运行<span className="sb-h-count">{current.runs.length}</span></h2>
          {runs.length === 0 ? (
            <p className="sb-empty">尚无运行;从「计划」阶段发起。</p>
          ) : (
            <ul className="sb-list sb-runs" role="list">
              {runs.map((r) => (
                <li key={r.id}>
                  <button className="sb-item sb-run" type="button" onClick={() => navigate(`/project/${currentId}/gather`)}>
                    <span className={`dot ${STATUS_DOT[r.status] ?? "dot-idle"}`} aria-hidden="true" />
                    <span className="sb-label mono" title={`${r.requestId} · ${STATUS[r.status]?.label ?? r.status}`}>
                      {r.requestId}
                    </span>
                    <span className="sb-meta">{STATUS[r.status]?.label ?? r.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {detail?.activeRun && (
            <p className="sb-empty">
              {detail.activeRun.status === "awaiting-confirmation"
                ? `待确认:${gateLabelOf(detail.activeRun)}等待确认后继续`
                : `当前阶段:${STAGES.find((s) => s.key === detail.activeRun?.stage)?.title ?? detail.activeRun.stage}`}
            </p>
          )}
        </div>
      )}

      <div className="sb-foot">
        <button
          className={`sb-item${location.pathname === "/settings" ? " active" : ""}`}
          type="button"
          onClick={() => navigate("/settings")}
        >
          <span aria-hidden="true">⚙</span> 设置
        </button>
        <div className="sb-note">
          <strong>执行完成 ≠ 证据充分</strong>
          资料不足或预算到达上限时有限交付并披露限制,不编造完整答案。
        </div>
      </div>
    </nav>
  );
}
