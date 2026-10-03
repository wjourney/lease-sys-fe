import axios from "axios";
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
const orderErrorHints: Record<string, string> = {
  "押金有待确认收款，请先确认或驳回后再结算":
    "请先处理待确认的押金收款，再办理结算。",
  "抵扣账单有待确认收款，请先处理":
    "请先核对这笔账单的待确认收款，再使用押金抵扣。",
  扣除金额超过实收押金: "扣款金额超过已收押金，请核对扣款明细。",
  押金抵扣金额超过账单剩余应收: "抵扣金额超过该账单的剩余欠款，请调整金额。",
  付款金额超过待付余额: "退款金额超过待退余额，请核对后重新填写。",
  金额超过可登记余额: "收款金额超过可登记余额，请核对金额或刷新账单。",
  "押金已结算，请勿重复修改": "这笔押金已经结算，请刷新查看结算结果。",
  "押金已结算，不能继续登记收款": "这笔押金已经结算，无法继续登记收款。",
  "已登记付款，不能直接修改租约，请办理财务调整或退租结算":
    "订单已登记收款，请通过财务调整或退租结算处理后续变更。",
  交还完成后才能结算押金: "请先登记单位交还，再办理押金结算。",
};
export function errorMessage(error: unknown): string {
  if (typeof error === "string") {
    if (Object.values(orderErrorHints).includes(error)) return error;
    if (
      /^(网络|请求|服务|操作|当前账号|登录状态|提交的信息|内容不存在|该记录|文件过大|请上传|资料已保存|项目资料已保存|单位资料已保存|公司资料已保存|账号已创建)/.test(
        error,
      )
    )
      return error;
    return "操作未完成，请稍后再试";
  }
  const e = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { message?: unknown; code?: string } };
  } | null;
  if (!e) return "操作未完成，请稍后再试";
  if (
    ["ECONNABORTED", "ETIMEDOUT"].includes(e.code || "") ||
    /timeout/i.test(e.message || "")
  )
    return "网络不太稳定，请稍后再试";
  if (e.code === "ERR_NETWORK" || e.message === "Network Error")
    return "网络连接失败，请检查网络后重试";
  const status = e.response?.status;
  if (status === 429) return "操作过于频繁，请稍后重试";
  if (status && status >= 500) return "服务暂时不可用，请稍后再试";
  const serverMessage = e.response?.data?.message;
  if (
    status === 400 &&
    e.response?.data?.code === "BUSINESS" &&
    typeof serverMessage === "string" &&
    orderErrorHints[serverMessage]
  )
    return orderErrorHints[serverMessage];
  if (
    typeof serverMessage === "string" &&
    /已有业务引用|存在业务关联/.test(serverMessage)
  )
    return "该记录已关联业务，无法删除。可改为停用。";
  if (status === 401) return "登录状态已失效，请重新登录";
  if (status === 403) return "当前账号没有操作权限";
  if (status === 404) return "内容不存在或已删除，请刷新后重试";
  if (status === 409) return "内容已被修改，请刷新后重试";
  if (status === 413) return "文件过大，请选择较小的文件";
  if (status === 400 || status === 422) return "提交的信息有误，请检查后重试";
  return "操作未完成，请稍后再试";
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
