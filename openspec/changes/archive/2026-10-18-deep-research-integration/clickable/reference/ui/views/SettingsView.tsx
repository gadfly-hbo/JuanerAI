/* 设置(中央列):模型供应商主备链首位 + 默认预算上限;密钥只走环境变量。 */
import { useEffect, useState } from "react";
import Chip from "../components/Chip";
import { api, errMsg, post } from "../state/api";
import { useToast } from "../state/toast";

export function SettingsView() {
  const toast = useToast();
  const [provider, setProvider] = useState("");
  const [modelId, setModelId] = useState("");
  const [budget, setBudget] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api<{ config: Record<string, unknown>; budgetDefaults: Record<string, number> }>("/api/settings")
      .then((r) => {
        setBudget(r.budgetDefaults);
        // 模型为主备链(数组)时编辑链首;其余备用项由服务端配置维护
        const m = r.config.model as unknown;
        const head = (Array.isArray(m) ? m[0] : m) as { provider?: string; modelId?: string } | undefined;
        setProvider(head?.provider ?? "");
        setModelId(head?.modelId ?? "");
      })
      .catch((e) => toast.show(errMsg(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await post("/api/settings", { model: { provider, modelId } });
      setSaved(true);
      toast.show("已保存");
    } catch (e) {
      toast.show(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="main" id="main" tabIndex={-1}>
      <div className="view">
        <h1 className="view-h">设置</h1>
        <p className="view-sub">
          配置模型与搜索供应商;密钥只走环境变量(由启动脚本从本机凭据注入),不经过本页面。
        </p>

        <div className="card">
          <h2 className="card-h">
            模型供应商
            <span className="card-h-note">主备链路首位;备用链在服务端配置文件维护</span>
          </h2>
          <div className="fld-row">
            <label className="fld">
              <span className="fld-label">provider</span>
              <input
                value={provider}
                onChange={(e) => { setProvider(e.target.value); setSaved(false); }}
                placeholder="minimax-cn"
              />
            </label>
            <label className="fld">
              <span className="fld-label">modelId</span>
              <input
                value={modelId}
                onChange={(e) => { setModelId(e.target.value); setSaved(false); }}
                placeholder="MiniMax-M2.7"
              />
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              disabled={!provider || !modelId || saving}
              onClick={() => void save()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
            {saved && <Chip tone="ok">已保存</Chip>}
          </div>
        </div>

        <div className="card">
          <h2 className="card-h">
            默认预算上限
            <span className="card-h-note">每 run 可在请求级覆盖;模型调用不设累计上限,用量按次数/输出 token 计量</span>
          </h2>
          {Object.keys(budget).length === 0 ? (
            <p className="fine">加载中…</p>
          ) : (
            <table className="tbl">
              <tbody>
                {Object.entries(budget).map(([k, v]) => (
                  <tr key={k}>
                    <td className="mono">{k}</td>
                    <td className="num">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
