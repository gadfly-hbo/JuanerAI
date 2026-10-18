/* 有限交付披露卡:默认折叠摘要,展开看全部限制原文(限制文本可能很长)。 */
export default function LimitsCard({ limitations }: { limitations: string[] }) {
  if (limitations.length === 0) return null;
  return (
    <details className="warn-card" role="note">
      <summary>
        有限交付 · {limitations.length} 条限制(点击展开完整披露)
      </summary>
      <ul>
        {limitations.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="fine" style={{ margin: "6px 0 0" }}>执行完成 ≠ 证据充分;以上限制同步披露在报告中。</p>
    </details>
  );
}
