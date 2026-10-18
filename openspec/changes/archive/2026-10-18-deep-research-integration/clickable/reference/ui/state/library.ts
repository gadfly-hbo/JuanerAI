/* 情报库状态:资产列表 / 导入 / 链接取得。与 server /api/library/* 对齐。 */
import { useCallback, useEffect, useState } from "react";
import { api, post } from "./api";

export interface LibrarySource {
  sourceId: string;
  title: string;
  url?: string;
  publisher?: string;
  docType: string;
  lifecycle: "ACTIVE" | "ARCHIVED" | "WITHDRAWN";
  createdAt: string;
}

export interface LibraryVersion {
  versionId: string;
  sourceId: string;
  fetchStatus: "DISCOVERED" | "SNIPPET_ONLY" | "READ_PARTIAL" | "READ_FULL" | "UNAVAILABLE";
  parseStatus?: "ok" | "failed" | "partial";
  parseIssue?: string;
  dataPeriod?: string;
  publishedAt?: string;
  contentHash?: string;
  createdAt: string;
}

export interface LibraryAssetRow {
  source: LibrarySource;
  latestVersion: LibraryVersion | null;
  reuseScope: "PROJECT_ONLY" | "WORKSPACE_REUSABLE" | "RESTRICTED";
  acquisitionCount: number;
}

export interface RegisterResultItem {
  status: "registered" | "duplicate" | "failed";
  sourceId?: string;
  versionId?: string;
  error?: string;
}

export const FETCH_STATUS_LABEL: Record<string, string> = {
  DISCOVERED: "仅登记",
  SNIPPET_ONLY: "仅摘要",
  READ_PARTIAL: "部分读取",
  READ_FULL: "已取得正文",
  UNAVAILABLE: "不可得",
};

export const REUSE_LABEL: Record<string, string> = {
  PROJECT_ONLY: "项目范围",
  WORKSPACE_REUSABLE: "可跨项目复用",
  RESTRICTED: "受限",
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  "consumer-profile": "消费者画像",
  "financial-disclosure": "财报披露",
  "job-posting": "招聘信息",
  "industry-report": "行业报告",
  "media-article": "媒体文章",
  "research-report": "研究成果",
  other: "其他",
};

export async function registerAssetItems(
  items: Array<Record<string, unknown>>,
): Promise<RegisterResultItem[]> {
  const res = await post<{ results: RegisterResultItem[] }>("/api/library/assets", { items });
  return res.results;
}

export async function fetchAssetContent(versionId: string): Promise<{ fetchStatus: string }> {
  return post("/api/library/assets/fetch", { versionId });
}

export interface AssetSearchRow {
  sourceId: string;
  title: string;
  docType: string;
  fetchStatus: string;
  reuseScope: string;
  versionId: string;
  snippet: string;
  /** 带项目上下文检索时服务端给出的适用性(§11.4 四组) */
  applicability?: string | null;
  checkNotes?: string[];
}

export async function searchLibrary(
  params: { q: string; docType?: string; fetchStatus?: string; reuseScope?: string; projectId?: string },
): Promise<{ results: AssetSearchRow[]; indexState: string }> {
  const qs = new URLSearchParams();
  qs.set("q", params.q);
  if (params.docType) qs.set("docType", params.docType);
  if (params.fetchStatus) qs.set("fetchStatus", params.fetchStatus);
  if (params.reuseScope) qs.set("reuseScope", params.reuseScope);
  if (params.projectId) qs.set("projectId", params.projectId);
  return api(`/api/library/search?${qs.toString()}`);
}

export interface AssetDetail {
  source: LibrarySource & { entityIds: string[]; tags: string[]; derivedFromRunId?: string };
  versions: LibraryVersion[];
  acquisitions: Array<{
    acquisitionId: string;
    projectId?: string;
    runId?: string;
    method: string;
    readScope: string;
    reuseScope: string;
    rights: Record<string, boolean | undefined>;
    acquiredAt: string;
  }>;
}

export async function getAssetDetail(sourceId: string): Promise<AssetDetail> {
  return api(`/api/library/assets/${encodeURIComponent(sourceId)}`);
}

export async function getAssetContent(versionId: string): Promise<string | null> {
  const res = await fetch(`/api/library/content/${encodeURIComponent(versionId)}`);
  if (!res.ok) return null;
  return res.text();
}

export interface EntityRow {
  entityId: string;
  type: string;
  name: string;
  aliases: string[];
  confirmStatus: string;
  assetCount: number;
}

export async function getEntities(): Promise<EntityRow[]> {
  const res = await api<{ entities: EntityRow[] }>("/api/library/entities");
  return res.entities;
}

export function useLibraryAssets() {
  const [assets, setAssets] = useState<LibraryAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ assets: LibraryAssetRow[] }>("/api/library/assets");
      setAssets(res.assets);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { assets, loading, error, reload };
}
