/* 外部情报库:不依赖研究任务的资料入库、检索与资产列表(U2-01/U2-03/U2-05)。 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../state/toast";
import {
  DOC_TYPE_LABEL,
  FETCH_STATUS_LABEL,
  REUSE_LABEL,
  registerAssetItems,
  searchLibrary,
  useLibraryAssets,
  type AssetSearchRow,
  type RegisterResultItem,
} from "../state/library";

const REUSE_CHIP: Record<string, string> = {
  PROJECT_ONLY: "chip-local",
  WORKSPACE_REUSABLE: "chip-ok",
  RESTRICTED: "chip-wait",
};

function fetchChip(status?: string): { cls: string; label: string } {
  switch (status) {
    case "READ_FULL":
      return { cls: "chip-ok", label: FETCH_STATUS_LABEL[status] };
    case "READ_PARTIAL":
    case "SNIPPET_ONLY":
      return { cls: "chip-wait", label: FETCH_STATUS_LABEL[status] ?? status };
    case "DISCOVERED":
      return { cls: "chip-local", label: FETCH_STATUS_LABEL[status] };
    case "UNAVAILABLE":
      return { cls: "chip-fail", label: FETCH_STATUS_LABEL[status] };
    default:
      return { cls: "chip-local", label: "未知" };
  }
}

export function LibraryView() {
  const { assets, loading, error, reload } = useLibraryAssets();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RegisterResultItem[]>([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchHits, setSearchHits] = useState<AssetSearchRow[] | null>(null);
  const [indexState, setIndexState] = useState("");

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const batchId = `ui-${Date.now().toString(36)}`;
      const items = await Promise.all(
        Array.from(files).map(async (f, i) => {
          // 幂等键:同一次选择的重试不产生重复登记(S-09)
          const idempotencyKey = `${batchId}-${i}-${f.name}-${f.size}`;
          if (f.name.toLowerCase().endsWith(".pdf")) {
            const buf = new Uint8Array(await f.arrayBuffer());
            let binary = "";
            for (const b of buf) binary += String.fromCharCode(b);
            return { kind: "file", filename: f.name, contentBase64: btoa(binary), idempotencyKey };
          }
          return { kind: "file", filename: f.name, content: await f.text(), idempotencyKey };
        }),
      );
      const res = await registerAssetItems(items);
      setResults(res);
      await reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onRegisterLink = async () => {
    if (!linkUrl.trim()) return;
    setBusy(true);
    try {
      const res = await registerAssetItems([
        {
          kind: "link",
          url: linkUrl.trim(),
          title: linkTitle.trim() || undefined,
          idempotencyKey: `ui-link-${Date.now().toString(36)}-${linkUrl.trim()}`,
        },
      ]);
      setResults(res);
      setLinkUrl("");
      setLinkTitle("");
      await reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="main" id="main" tabIndex={-1}>
      <div className="view">
        <h1 className="view-h">外部情报库</h1>
        <p className="view-sub">
          资料先于研究积累:直接导入文件或登记链接,研究中沉淀的材料也在这里可检索复用。入库 ≠ 已核验。
        </p>

      <section className="card">
        <div className="card-h">入库</div>
        <div className="fld">
          <label className="fld-label">导入文件(TXT/MD/JSON/CSV/文本 PDF,单个 ≤50MB,可多选)</label>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".txt,.md,.markdown,.json,.csv,.log,.pdf"
            disabled={busy}
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
        <div className="fld">
          <label className="fld-label">登记公开链接(只登记入口,不等于已读正文)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="url"
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={{ flex: 2 }}
            />
            <input
              type="text"
              placeholder="标题(可选)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="button" disabled={busy || !linkUrl.trim()} onClick={() => void onRegisterLink()}>
              登记
            </button>
          </div>
        </div>
        {results.length > 0 && (
          <ul className="filelist" aria-label="入库逐项结果">
            {results.map((r, i) => (
              <li className="file" key={i}>
                <span className={`dot ${r.status === "failed" ? "dot-fail" : r.status === "duplicate" ? "dot-warn" : "dot-ok"}`} aria-hidden="true" />
                <span className="sb-label">
                  {r.status === "registered" ? "已入库" : r.status === "duplicate" ? "重复(已存在)" : `失败:${r.error ?? ""}`}
                </span>
                {r.versionId && <span className="sb-meta mono">{r.versionId}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-h">检索(仅展示有权访问的材料)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="标题/发布者/别名/正文关键词…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 2, minWidth: 220 }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              void (async () => {
                if (!query.trim()) {
                  setSearchHits(null);
                  return;
                }
                try {
                  const out = await searchLibrary({
                    q: query.trim(),
                    docType: filterType || undefined,
                    fetchStatus: filterStatus || undefined,
                  });
                  setSearchHits(out.results);
                  setIndexState(out.indexState);
                } catch (e) {
                  toast.show(e instanceof Error ? e.message : String(e));
                }
              })();
            }}
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">全部类型</option>
            {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">全部取得状态</option>
            {Object.entries(FETCH_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setSearchHits(null);
              setQuery("");
            }}
          >
            清除
          </button>
        </div>
        {searchHits !== null && (
          <>
            {indexState === "rebuilt" && <p className="sb-meta">索引已重建(新建或缺失后自动)。</p>}
            {searchHits.length === 0 ? (
              <p className="empty">没有命中。没有命中不等于资料不存在,可继续外部采证或调整关键词。</p>
            ) : (
              <ul className="filelist">
                {searchHits.map((h) => (
                  <li className="file clickable" key={h.sourceId} onClick={() => navigate(`/library/${h.sourceId}`)}>
                    <span className="file-name">{h.title}</span>
                    <span className="file-meta">{DOC_TYPE_LABEL[h.docType] ?? h.docType} · {FETCH_STATUS_LABEL[h.fetchStatus] ?? h.fetchStatus} · {REUSE_LABEL[h.reuseScope]}</span>
                    <div className="sb-meta" style={{ fontSize: 12 }}>{h.snippet}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="card">
        <div className="card-h">
          资产 <span className="sb-h-count">{assets.length}</span>
        </div>
        {loading ? (
          <p className="empty">加载中…</p>
        ) : error ? (
          <p className="empty">加载失败:{error}</p>
        ) : assets.length === 0 ? (
          <p className="empty">情报库为空。空库不阻断研究;也可以先导入文件或登记链接开始积累。</p>
        ) : (
          <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>标题</th>
                <th>类型</th>
                <th>时期</th>
                <th>取得状态</th>
                <th>解析</th>
                <th>复用范围</th>
                <th>入库时间</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const fc = fetchChip(a.latestVersion?.fetchStatus);
                return (
                  <tr
                    key={a.source.sourceId}
                    className="clickable"
                    onClick={() => navigate(`/library/${a.source.sourceId}`)}
                  >
                    <td>
                      <strong>{a.source.title}</strong>
                      {a.source.url && <div className="sb-meta mono cell-clip" style={{ fontSize: 11 }} title={a.source.url}>{a.source.url}</div>}
                    </td>
                    <td className="nw">{DOC_TYPE_LABEL[a.source.docType] ?? a.source.docType}</td>
                    <td>{a.latestVersion?.dataPeriod ?? "—"}</td>
                    <td><span className={`chip ${fc.cls}`}>{fc.label}</span></td>
                    <td>
                      {a.latestVersion?.parseStatus === "failed" ? (
                        <span className="chip chip-fail" title={a.latestVersion.parseIssue}>解析缺口</span>
                      ) : a.latestVersion?.parseStatus === "partial" ? (
                        <span className="chip chip-wait" title={a.latestVersion.parseIssue}>部分解析</span>
                      ) : a.latestVersion?.parseStatus === "ok" ? (
                        <span className="chip chip-ok">已解析</span>
                      ) : (
                        <span className="sb-meta">—</span>
                      )}
                    </td>
                    <td><span className={`chip ${REUSE_CHIP[a.reuseScope]}`}>{REUSE_LABEL[a.reuseScope]}</span></td>
                    <td className="sb-meta nw">{new Date(a.source.createdAt).toLocaleDateString("zh-CN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </section>
      </div>
    </main>
  );
}
