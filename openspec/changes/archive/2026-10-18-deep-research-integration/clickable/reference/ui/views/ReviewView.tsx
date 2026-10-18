/* 阶段 5 · 评审:核查摘要(四步核查统计)+ 主张与证据评审表。 */
import Chip from "../components/Chip";
import Empty from "../components/Empty";
import { useProject } from "../state/projectDetail";
import { bestTierOf, summarizeVerdicts, verdictKeyOf } from "../state/derive";
import { CONFIDENCE, KIND, TIER_BADGE, VERDICT } from "../state/types";

export function ReviewView() {
  const p = useProject();
  const bundle = p.bundle;
  const summary = bundle ? summarizeVerdicts(bundle.verdicts) : null;

  return (
    <div className="view">
      <h1 className="view-h">
        评审
        {bundle && <Chip tone="agg">v{p.bundleVersion}</Chip>}
      </h1>
      <p className="view-sub">
        真实性核查四步:引句逐字命中、多源交叉、语义蕴涵、数值复算;信源按 A / B / C 分级。点击行在右侧 Inspector 查看证据详情。
      </p>

      {!bundle ? (
        <Empty icon="◇" title="尚无可评审的版本产物" hint="发布版本后,核查结果会出现在这里" />
      ) : (
        <>
          {summary && (
            <div className="card">
              <h2 className="card-h">
                核查摘要
                <span className="card-h-note num">{summary.total} 条证据核查记录</span>
              </h2>
              <table className="tbl">
                <thead>
                  <tr><th>核查维度</th><th>通过</th><th>问题</th><th>其他</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>引句逐字命中</td>
                    <td className="num">{summary.quoteHit} 已核实</td>
                    <td className="num">{summary.quoteMismatch} 未通过</td>
                    <td className="num">{summary.snapshotMissing} 快照缺失</td>
                  </tr>
                  <tr>
                    <td>语义蕴涵</td>
                    <td className="num">{summary.entailStrong} 强支撑</td>
                    <td className="num">{summary.entailFail} 不支撑</td>
                    <td className="num">{summary.entailWeak} 弱支撑</td>
                  </tr>
                  <tr>
                    <td>数值复算</td>
                    <td className="num">{summary.numericOk} 一致</td>
                    <td className="num">{summary.numericMismatch} 不一致</td>
                    <td className="num">{summary.total - summary.numericOk - summary.numericMismatch} 未评估</td>
                  </tr>
                </tbody>
              </table>
              <p className="fine">
                信源分级:
                <Chip tone={TIER_BADGE.A.tone}>{summary.tierA} 条 A级</Chip>{" "}
                <Chip tone={TIER_BADGE.B.tone}>{summary.tierB} 条 B级</Chip>{" "}
                <Chip tone={TIER_BADGE.C.tone}>{summary.tierC} 条 C级</Chip>
              </p>
            </div>
          )}

          <div className="card">
            <h2 className="card-h">
              主张与证据
              <span className="card-h-note num">{bundle.claims.length} 条主张</span>
            </h2>
            {bundle.claims.length === 0 ? (
              <Empty icon="◇" title="该版本没有主张记录" />
            ) : (
              <table className="tbl">
                <thead>
                  <tr><th>主张</th><th>类型</th><th>置信度</th><th>信源</th><th>核查</th></tr>
                </thead>
                <tbody>
                  {bundle.claims.map((c) => {
                    const vk = verdictKeyOf(bundle, c);
                    const tier = bestTierOf(bundle, c);
                    const selected = p.selectedClaim?.id === c.id;
                    return (
                      <tr key={c.id} className={`clickable${selected ? " selected" : ""}`} onClick={() => p.openClaim(c)}>
                        <td>
                          {c.statement}
                          {c.calibration && (
                            <div className="fine num" style={{ margin: "2px 0 0" }}>
                              {c.calibration.entity} · {c.calibration.period} · {c.calibration.unit}
                            </div>
                          )}
                        </td>
                        <td><Chip tone={KIND[c.kind]?.tone ?? "wait"}>{KIND[c.kind]?.label ?? c.kind}</Chip></td>
                        <td>
                          {c.confidence
                            ? <Chip tone={CONFIDENCE[c.confidence]?.tone ?? "wait"}>{CONFIDENCE[c.confidence].label}</Chip>
                            : <span className="fine" style={{ margin: 0 }}>—</span>}
                        </td>
                        <td>
                          {tier
                            ? <Chip tone={TIER_BADGE[tier]?.tone ?? "wait"}>{TIER_BADGE[tier].label}</Chip>
                            : <span className="fine" style={{ margin: 0 }}>—</span>}
                        </td>
                        <td><Chip tone={VERDICT[vk]?.tone ?? "wait"}>{VERDICT[vk]?.label ?? vk}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
