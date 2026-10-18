/* 顶部品牌栏(09-28 契约):JuanerAI 品牌区(logo 裁切块 + 品牌名/slogan)+ 分隔线 + 产品名;
   右端边界徽常驻声明服务位置与数据边界。本产品无通知/账户体系,不设假入口。 */
import logoUrl from "../assets/juanerai-logo-slogan.png";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="brand" aria-label="JuanerAI,持续做出更好的决策;独立深度研究工作台">
        <span className="brand-mark">
          <img src={logoUrl} alt="" />
        </span>
        <span className="brand-copy">
          <strong>JuanerAI</strong>
          <small>持续做出更好的决策</small>
        </span>
        <span className="product-name">独立深度研究工作台</span>
      </div>
      <div aria-hidden="true" />
      <div className="top-actions">
        <span
          className="boundary-badge"
          title="研究服务仅在本机运行(127.0.0.1),不连接 JuanerAI;采证与模型调用经「设置」中配置的外部 API 发起,外发内容在运行记录中可核查"
        >
          ● 本机服务 · 127.0.0.1
        </span>
      </div>
    </header>
  );
}
