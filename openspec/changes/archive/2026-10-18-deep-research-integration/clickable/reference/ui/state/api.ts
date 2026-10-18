/* fetch 封装:非 2xx 抛出带路径与响应片段的消息,由调用方 toast。 */

export const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json() as Promise<T>;
};

export const post = <T,>(path: string, body: unknown): Promise<T> =>
  api<T>(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const errMsg = (e: unknown, limit = 200): string =>
  String(e instanceof Error ? e.message : e).slice(0, limit);
