/* 阶段 3 · 分析:主张卡流(主张绑定证据编号,点击证据在 Inspector 查看引句与快照)。 */
import { useNavigate } from "react-router-dom";
import Chip from "../components/Chip";
import Empty from "../components/Empty";
import LimitsCard from "../components/LimitsCard";
import { useProject } from "../state/projectDetail";
import { bestTierOf, verdictKeyOf } from "../state/derive";
import { CONFIDENCE, KIND, TIER_BADGE, VERDICT } from "../state/types";

export function AnalyzeView() {
  const p = useProject();
  const navigate = useNavigate();
  const bundle = p.bundle;

  return (
    <div className="view">
      <h1 className="view-h">
        分析
        {bundle && <Chip tone="agg">报告 v{p.bundleVersion} · 草稿产物</Chip>}
      </h1>
      <p className="view-sub">
        主张逐条绑定证据编号;点击证据编号,在右侧 Inspector「主张与证据」查看引句与原文快照。
      </p>

      {!bundle ? (
        <Empty
          icon="◇"
          title="尚无可分析的版本产物"
          hint={p.activeRun ? "运行完成并发布为版本后,主张与证据会出现在这里" : "发布版本后,主张与证据会出现在这里"}
        >
          {!p.activeRun && (
            <button className="btn" type="button" onClick={() => navigate(`/project/${p.id}/publish`)}>前往「发布」阶段</button>
          )}
        </Empty>
      ) : (
        <>
          <LimitsCard limitations={bundle.limitations} />

          {bundle.claims.length === 0 && (
            <Empty icon="◇" title="该版本没有主张记录" hint="运行可能因资料不足提前收敛;查看报告草稿与限制说明" />
          )}

          {bundle.claims.map((c, i) => {
            const vk = verdictKeyOf(bundle, c);
            const tier = bestTierOf(bundle, c);
            const selected = p.selectedClaim?.id === c.id;
            return (
              <div className={`hypo${selected ? " selected" : ""}`} key={c.id || i} style={selected ? { borderColor: "var(--accent)" } : undefined}>
                <div className="hypo-head">
                  <span className="hypo-id">{c.id || `C${i + 1}`}</span>
                  <span className="hypo-text">{c.statement}</span>
                  <span className="hypo-status">
                    <Chip tone={VERDICT[vk]?.tone ?? "wait"}>{VERDICT[vk]?.label ?? vk}</Chip>
                  </span>
                </div>
                {c.calibration && (
                  <p className="hypo-sub num">
                    口径:{c.calibration.entity} · {c.calibration.period} · {c.calibration.unit}
                    {c.calibration.value !== undefined && ` · ${c.calibration.value}`}
                  </p>
                )}
                <div className="hypo-evi">
                  <Chip tone={KIND[c.kind]?.tone ?? "wait"}>{KIND[c.kind]?.label ?? c.kind}</Chip>
                  {c.confidence && (
                    <Chip tone={CONFIDENCE[c.confidence]?.tone ?? "wait"}>{CONFIDENCE[c.confidence]?.label}</Chip>
                  )}
                  {tier && <Chip tone={TIER_BADGE[tier]?.tone ?? "wait"}>{TIER_BADGE[tier]?.label}</Chip>}
                  {c.evidenceIds.map((eid) => (
                    <button className="evi-link" type="button" key={eid} onClick={() => p.openClaim(c)}>
                      证据 {eid}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {bundle.unresolved.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <h2 className="card-h">
                未决问题
                <span className="card-h-note">证据不足,未进入结论;如实披露</span>
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {bundle.unresolved.map((u, i) => (
                  <li key={i} style={{ margin: "4px 0" }}>{u}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
