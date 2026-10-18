/* 阶段路由:index 重定向到默认阶段;:stage 分发到六个阶段视图。 */
import type { ReactElement } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useProject } from "../state/projectDetail";
import { isStageKey } from "../state/types";
import type { StageKey } from "../state/types";
import { PlanView } from "./PlanView";
import { GatherView } from "./GatherView";
import { AnalyzeView } from "./AnalyzeView";
import { DraftView } from "./DraftView";
import { ReviewView } from "./ReviewView";
import { PublishView } from "./PublishView";

const VIEW: Record<StageKey, () => ReactElement> = {
  plan: PlanView,
  gather: GatherView,
  analyze: AnalyzeView,
  draft: DraftView,
  review: ReviewView,
  publish: PublishView,
};

export function StageRedirect() {
  const p = useProject();
  const { id = "" } = useParams();
  if (!p.detail) return <span className="spinner" role="status" aria-label="加载中" />;
  const def: StageKey =
    p.activeRun && isStageKey(p.activeRun.stage)
      ? p.activeRun.stage
      : p.detail.meta.versions.length > 0
        ? "draft"
        : "plan";
  return <Navigate to={`/project/${id}/${def}`} replace />;
}

export function StageRoute() {
  const { id = "", stage = "" } = useParams();
  if (!isStageKey(stage)) return <Navigate to={`/project/${id}`} replace />;
  const View = VIEW[stage];
  return <View />;
}
