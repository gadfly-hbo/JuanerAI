/* 应用外壳:顶部品牌栏 + 三栏窗口(侧栏 + Outlet)+ 底部状态栏 + 命令面板;
   项目路由下用 ProjectDetailProvider 包裹,三栏共享同一份详情数据。 */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { Palette } from "./Palette";
import { ProjectDetailProvider } from "../state/projectDetail";
import { useUI } from "../state/ui";

export function AppShell() {
  const location = useLocation();
  const { sbCollapsed, inspCollapsed, toggleSb, toggleInsp, openPalette } = useUI();
  const projectId = location.pathname.match(/^\/project\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); openPalette(); }
      else if (k === "b") { e.preventDefault(); toggleSb(); }
      else if (k === "i") { e.preventDefault(); toggleInsp(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette, toggleSb, toggleInsp]);

  const appCls = ["app", sbCollapsed ? "sb-collapsed" : "", inspCollapsed ? "insp-collapsed" : ""]
    .filter(Boolean)
    .join(" ");

  const shell = (
    <div className="window">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳到主工作区
      </a>
      <TopBar />
      <div className={appCls}>
        <Sidebar />
        <button
          className="sb-toggle"
          type="button"
          onClick={toggleSb}
          aria-label="收起或展开侧边栏"
          aria-expanded={!sbCollapsed}
          title="侧边栏(⌘B)"
        >
          {sbCollapsed ? "⟩" : "⟨"}
        </button>
        <Outlet />
      </div>
      <StatusBar />
      <Palette />
    </div>
  );

  if (projectId) {
    return <ProjectDetailProvider id={projectId}>{shell}</ProjectDetailProvider>;
  }
  return shell;
}
