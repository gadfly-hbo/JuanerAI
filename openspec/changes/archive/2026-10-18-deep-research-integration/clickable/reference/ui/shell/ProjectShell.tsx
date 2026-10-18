/* 项目路由外壳:中央区(StageBar + 阶段视图 Outlet)+ 右侧 Inspector。 */
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { StageBar } from "./StageBar";
import { Inspector } from "../inspector/Inspector";
import Empty from "../components/Empty";
import { useProject } from "../state/projectDetail";
import { isStageKey } from "../state/types";
import type { StageKey } from "../state/types";

export function ProjectShell() {
  const p = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  const seg = location.pathname.split("/");
  const stage: StageKey | null = isStageKey(seg[3]) ? seg[3] : null;

  if (p.loadFailed && !p.detail) {
    return (
      <main className="main" id="main" tabIndex={-1}>
        <div className="view">
          <Empty icon="⚠" title="项目加载失败" hint="项目可能已被移除,或本机服务未运行">
            <button className="btn" type="button" onClick={() => navigate("/")}>返回项目总览</button>
          </Empty>
        </div>
      </main>
    );
  }

  return (
    <div className="content-3col">
      <main className="main" id="main" tabIndex={-1}>
        <StageBar stage={stage} />
        <Outlet />
      </main>
      <Inspector />
    </div>
  );
}
