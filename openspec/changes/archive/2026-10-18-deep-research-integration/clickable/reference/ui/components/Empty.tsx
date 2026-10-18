/* 空状态:虚线框 + 图标 + 主文案 + 提示,可附操作按钮。 */
import type { ReactNode } from "react";

export default function Empty({ icon = "▤", title, hint, children }: {
  icon?: string;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-icon" aria-hidden="true">{icon}</p>
      <p><strong>{title}</strong></p>
      {hint && <p className="fine">{hint}</p>}
      {children && <div className="actions">{children}</div>}
    </div>
  );
}
