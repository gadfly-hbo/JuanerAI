/* 项目总览(中央列,无项目上下文时):时间分组列表 + 归档折叠 + 新建项目表单。 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Chip from "../components/Chip";
import Empty from "../components/Empty";
import { useProjects } from "../state/projects";
import { groupProjects } from "../../src/app/projectGroups";
import { MODULE_LABEL } from "../state/types";
import type { Module, ProjectMeta } from "../state/types";

export function ProjectsView() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { projects, loaded, error, create, toggleArchive } = useProjects();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({ module: "brand" as Module, goal: "", summary: "" });

  useEffect(() => {
    if (params.get("new") === "1") {
      setCreating(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const submit = async () => {
    setBusy(true);
    const id = await create(form);
    setBusy(false);
    if (id) {
      setCreating(false);
      setForm({ module: "brand", goal: "", summary: "" });
      navigate(`/project/${id}`);
    }
  };

  const groups = groupProjects(projects);
  const archivedGroup = groups.find((g) => g.key === "archived");

  const row = (p: ProjectMeta) => (
    <div key={p.id} className="file clickable" onClick={() => navigate(`/project/${p.id}`)}>
      <span className="file-icon" aria-hidden="true">▤</span>
      <span className="file-name">{p.goal}</span>
      <Chip tone={p.module === "brand" ? "agg" : "fork"}>{MODULE_LABEL[p.module]}</Chip>
      <span className="file-meta num">更新于 {new Date(p.updatedAt).toLocaleString("zh-CN")}</span>
      <div className="actions">
        <Chip tone="wait">{p.versions.length} 个版本</Chip>
        <button
          className="btn btn-sm"
          type="button"
          onClick={(e) => { e.stopPropagation(); void toggleArchive(p); }}
        >
          {p.status === "archived" ? "恢复" : "归档"}
        </button>
      </div>
    </div>
  );

  return (
    <main className="main" id="main" tabIndex={-1}>
      <div className="view">
        <h1 className="view-h">研究项目</h1>
        <p className="view-sub">
          创建品牌 / 行业研究项目;点击项目进入六阶段工作区(计划 → 采证 → 分析 → 草稿 → 评审 → 发布)。
        </p>

        {error && (
          <div className="err-card" role="alert">
            <p><strong>项目列表加载失败。</strong>{error}</p>
            <p className="fine">请确认本机服务已启动(启动深度研究.command),然后刷新页面。</p>
          </div>
        )}

        {creating && (
          <div className="card">
            <h2 className="card-h">新建项目</h2>
            <label className="fld">
              <span className="fld-label">研究模块</span>
              <select
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value as Module })}
              >
                <option value="brand">品牌研究</option>
                <option value="industry">行业研究</option>
              </select>
            </label>
            <label className="fld">
              <span className="fld-label">研究目标</span>
              <input
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                placeholder="如:森马在中国市场的品牌定位、价格与竞品格局"
              />
            </label>
            <label className="fld">
              <span className="fld-label">范围说明</span>
              <input
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="对象、时间、单位等边界"
              />
            </label>
            <p className="fine">附件(本机文件路径)在发起研究运行时填写;创建项目只登记目标与范围。</p>
            <div className="actions">
              <button
                className="btn btn-primary"
                type="button"
                disabled={!form.goal || !form.summary || busy}
                onClick={() => void submit()}
              >
                {busy ? "创建中…" : "创建项目"}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setCreating(false)}>取消</button>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="card-h">
            项目列表
            <span className="card-h-note">按更新时间分组 · 归档只收列表,数据与版本全部保留</span>
            <button className="btn btn-primary btn-sm" type="button" style={{ marginLeft: "auto" }} onClick={() => setCreating(!creating)}>
              ＋ 新建项目
            </button>
          </h2>

          {!loaded ? (
            <span className="spinner" role="status" aria-label="加载中" style={{ margin: "24px auto" }} />
          ) : projects.length === 0 ? (
            <Empty
              icon="▤"
              title="还没有项目"
              hint="创建第一个品牌或行业研究项目,开始循证研究"
            >
              <button className="btn btn-primary" type="button" onClick={() => setCreating(true)}>＋ 新建项目</button>
            </Empty>
          ) : (
            <>
              {groups.filter((g) => g.key !== "archived").map((g) => (
                <div key={g.key}>
                  <p className="fine" style={{ margin: "12px 0 6px", letterSpacing: ".04em", fontWeight: 600 }}>
                    {g.label} · {g.items.length}
                  </p>
                  <div className="filelist" style={{ marginBottom: 0 }}>
                    {g.items.map(row)}
                  </div>
                </div>
              ))}
              {archivedGroup && (
                <div style={{ marginTop: 14 }}>
                  <p
                    className="fine"
                    style={{ cursor: "pointer", userSelect: "none", fontWeight: 600 }}
                    onClick={() => setShowArchived(!showArchived)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setShowArchived(!showArchived); }}
                    aria-expanded={showArchived}
                  >
                    已归档 · {archivedGroup.items.length} {showArchived ? "▾ 收起" : "▸ 展开"}
                  </p>
                  {showArchived && (
                    <div className="filelist" style={{ marginTop: 6 }}>
                      {archivedGroup.items.map(row)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
