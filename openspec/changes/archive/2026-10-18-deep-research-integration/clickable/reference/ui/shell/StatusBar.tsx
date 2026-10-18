/* 底部状态栏:项目 / 阶段 / 运行状态 / 预算用量 / 本机声明。 */
import { useLocation } from "react-router-dom";
import { useProjectOrNull } from "../state/projectDetail";
import { gateLabelOf, isStageKey, stageTitle } from "../state/types";

export function StatusBar() {
  const location = useLocation();
  const p = useProjectOrNull();

  const seg = location.pathname.split("/");
  const viewStage = isStageKey(seg[3]) ? seg[3] : null;
  const onSettings = location.pathname === "/settings";

  const usageRun = p?.activeRun ?? (p?.detail && p.detail.runs.length > 0 ? p.detail.runs[p.detail.runs.length - 1] : null);

  return (
    <footer className="statusbar">
      <span className="pill pill-offline">● 本机服务</span>
      <span>
        项目:<strong>{p?.detail ? p.detail.meta.goal : onSettings ? "设置" : "总览"}</strong>
      </span>
      {p && (
        <span>
          阶段:<strong>{viewStage ? stageTitle(viewStage) : "—"}</strong>
        </span>
      )}
      <span>
        运行状态:
        <strong>
          {p?.activeRun
            ? p.activeRun.status === "awaiting-confirmation"
              ? `待确认 · ${gateLabelOf(p.activeRun)}`
              : `进行中 · ${stageTitle(p.activeRun.stage)}`
            : p
              ? "空闲"
              : "—"}
        </strong>
      </span>
      {usageRun && (
        <span className="num">
          搜索 {usageRun.usage.searches} · 抓取 {usageRun.usage.fetches} · 模型 {usageRun.usage.modelCalls} 次 · 输出 {usageRun.usage.outputTokens} tok
        </span>
      )}
      <span className="statusbar-right">
        仅在本机运行(127.0.0.1),不连接 JuanerAI · 关键结论逐条绑定原文快照,可核查
      </span>
    </footer>
  );
}
