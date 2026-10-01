import axios from "axios";
import type { components } from "./api.generated";
export type ApiInput<K extends keyof components["schemas"]> =
  components["schemas"][K];
export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 30000,
});
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((x) => x.startsWith("lease_csrf="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (token) config.headers["X-CSRF-Token"] = decodeURIComponent(token);
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/")
    )
      window.dispatchEvent(new Event("session-expired"));
    return Promise.reject(error);
  },
);
export function errorMessage(error: unknown): string {
  const e = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { message?: unknown } };
  } | null;
  if (!e) return "请求失败，请稍后重试";
  if (
    ["ECONNABORTED", "ETIMEDOUT"].includes(e.code || "") ||
    /timeout/i.test(e.message || "")
  )
    return "请求超时，请稍后重试";
  if (e.code === "ERR_NETWORK" || e.message === "Network Error")
    return "网络连接失败，请检查网络后重试";
  const status = e.response?.status;
  if (status === 429) return "操作过于频繁，请稍后重试";
  if (status && status >= 500) return "服务暂时不可用，请稍后重试";
  const serverMessage = e.response?.data?.message;
  if (
    typeof serverMessage === "string" &&
    /[\u3400-\u9fff]/u.test(serverMessage)
  )
    return serverMessage;
  if (status === 401 || status === 403) return "当前账号无权执行此操作";
  if (status === 400 || status === 422) return "提交的信息有误，请检查后重试";
  if (status === 404) return "请求的内容不存在或已删除";
  if (typeof e.message === "string" && /[\u3400-\u9fff]/u.test(e.message))
    return e.message;
  return "请求失败，请稍后重试";
}
export type Row = Record<string, any>;
export type Page = {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
};
let cacheEpoch = 0;
const lookupCache = new Map<string, { at: number; data: Row[] }>();
const lookupsInFlight = new Map<string, Promise<Row[]>>();
export function clearLookupCache() {
  cacheEpoch++;
  lookupCache.clear();
  lookupsInFlight.clear();
}
export async function options(resource: string, params: Row = {}) {
  const generation = cacheEpoch;
  const key = JSON.stringify([generation, resource, params]);
  const cached = lookupCache.get(key);
  if (
    cached &&
    Date.now() - cached.at < (resource === "settings" ? 300000 : 30000)
  )
    return cached.data;
  const current = lookupsInFlight.get(key);
  if (current) return current;
  const request = (async () => {
    const rows: Row[] = [];
    let page = 1;
    while (true) {
      const { data } = await api.get<Page>("/" + resource, {
        params: { ...params, page, pageSize: 100 },
      });
      rows.push(...data.items);
      if (rows.length >= data.total || !data.items.length) break;
      page++;
    }
    if (generation === cacheEpoch)
      lookupCache.set(key, { at: Date.now(), data: rows });
    return rows;
  })();
  lookupsInFlight.set(key, request);
  try {
    return await request;
  } finally {
    lookupsInFlight.delete(key);
  }
}
export function dateText(v: any) {
  return v ? String(v).slice(0, 10) : "—";
}
export function amount(v: any) {
  if (v === null || v === undefined) return "待填写";
  return (
    "HK$ " +
    new Intl.NumberFormat("en-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(v))
  );
}
