/* 中央列顶部:六阶段导航(计划→采证→分析→草稿→评审→发布)+ 边界提示 + Inspector 开关。 */
import { useNavigate } from "react-router-dom";
import { useProject } from "../state/projectDetail";
import { useUI } from "../state/ui";
import { STAGES } from "../state/types";
import type { StageKey } from "../state/types";

export function StageBar({ stage }: { stage: StageKey | null }) {
  const p = useProject();
  const ui = useUI();
  const navigate = useNavigate();

  return (
    <div className="stagebar" role="navigation" aria-label="研究阶段">
      <ol className="stages">
        {STAGES.map((s, i) => {
          const cls = [
            "stage",
            stage === s.key ? "active" : "",
            i < p.progress ? "done" : "",
            i > p.progress && stage !== s.key ? "locked" : "",
          ].filter(Boolean).join(" ");
          return (
            <li key={s.key}>
              <button
                className={cls}
                type="button"
                aria-current={stage === s.key ? "step" : undefined}
                onClick={() => navigate(`/project/${p.id}/${s.key}`)}
              >
                <span className="stage-n" aria-hidden="true">{i + 1}</span>
                {s.title}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="stagebar-right">
        <span
          className="pill pill-boundary"
          title="执行完成 ≠ 证据充分:资料不足或预算到达上限时有限交付并披露限制,不编造完整答案"
        >
          结论逐条绑定原文快照
        </span>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-expanded={!ui.inspCollapsed}
          aria-controls="inspector"
          title="Inspector(⌘I)"
          onClick={ui.toggleInsp}
        >
          Inspector
        </button>
      </div>
    </div>
  );
}
