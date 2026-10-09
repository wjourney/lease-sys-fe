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
  "批量资料已过期或归属不匹配，请重新选择并上传文件":
    "批量资料已过期，请重新选择文件后提交。",
  "批量资料不能重复": "请移除重复的批量资料后重新提交。",
  "请重新选择尚未上传完成的文件": "请重新选择尚未上传完成的文件。",
  "已有实际收付款或押金抵扣，请先完成退款、撤销或冲正，不能直接删除订单及资金记录":
    "已有实际收付款或押金抵扣，请先处理关联资金记录后再删除。",
  "请完善单位类型的名称、期/座、楼层、面积、间隔、价格范围和月租价格":
    "请先在项目中完善所选类型的期/座、楼层、面积、间隔、价格范围和月租价格。",
  "该期/座、楼层下已存在此房号": "同一期/座、楼层下房号不能重复。",
  月租价格须介于单位类型的最低价和最高价之间:
    "月租价格须介于单位类型的最低价和最高价之间。",

  "佣金已有付款计划或付款记录，不能直接修改佣金约定":
    "该佣金已进入付款流程，请先核对关联支出，不能直接修改约定。",
  "佣金已有付款计划或付款记录，不能修改约定":
    "该佣金已进入付款流程，不能直接修改约定。",
  "订单佣金请通过订单修改，不能直接编辑": "请返回关联订单修改佣金约定。",
  "历史佣金只能补全金额、结付日期和备注，结算约定请在订单处理":
    "历史佣金只能补全金额、结付日期和备注，请返回订单处理结算约定。",
  重复提交编号冲突: "本次提交内容已变化，请重新打开操作窗口后提交。",
  "网站 Logo 仅支持 2MB 以内的 PNG、JPG、WebP 图片":
    "请上传 2MB 以内的 PNG、JPG 或 WebP 图片。",
  网站配置格式无效: "公司信息未能提交，请刷新后重试。",
  "请勿同时上传和移除网站 Logo": "请重新选择要保留的网站 Logo 后保存。",
  "已有单位使用的类型不能删除，请保留类型":
    "这个类型已有单位使用，请保留；可以修改名称和参考范围。",
  请选择所属项目的单位类型: "请选择当前项目中配置的单位类型。",
  请至少配置一种项目单位类型: "请先为项目添加至少一种单位类型。",
  项目单位类型名称或编码重复: "同一项目中的类型名称不能重复，请检查。",
  "请填写类型名称、面积范围和月租范围": "请补全类型名称、面积范围和月租范围。",
  请检查单位类型的面积和月租范围:
    "面积须大于零，面积和月租的上限不能小于下限。",
  单位类型请在所属项目中配置: "单位类型已改为在项目的新建或编辑页面维护。",
  "请填写佣金结付方式、金额和结付日期": "请补全佣金结付方式、金额和结付日期。",
  佣金金额必须大于零: "佣金金额需大于零，请检查填写内容。",
  "佣金已有付款计划或付款记录，请在佣金管理中调整":
    "该佣金已进入付款流程，不能通过编辑订单直接修改。",
  请至少填写一笔收款金额: "请至少填写一笔收款金额。",
  收款金额超过可登记余额: "收款金额超过可登记余额，请核对金额或刷新账单。",
  "实收金额与首期账单不一致，未付齐请选择部分付款":
    "请核对首期实际金额；未收齐时请选择部分付款，也可先保存未付款订单，再按账单登记。",
  "已付款时请填写资金账户、付款方式和到账日期":
    "请补齐收款账户、付款方式和到账日期。",
  "已有结算、抵扣或付款单，请先处理关联业务，不能冲正收款":
    "这笔收款已有后续结算或付款，请先核对关联业务，无法直接冲正。",
  "该收款已有退款关联，不能冲正": "这笔收款已有退款记录，无法直接冲正。",
  "已有收款或抵扣，不能作废": "请先处理收款或押金抵扣，再作废这笔费用。",
  "已有付款单，不能作废佣金": "这笔佣金已有付款记录，无法直接作废。",
  首期款项确认收齐后才能办理入住: "请先确认首期租金和押金已收齐，再办理入住。",
  "入住日期应在租期内，且不能晚于今天":
    "请填写租期内的实际入住日期，不能选择未来日期。",

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
    "订单已登记收款，请联系业务负责人处理后续变更。",
  请选择同币种且资料完整的有效资金账户:
    "请选择已启用、币种相同且银行资料完整的银行账户。",
  "启用资金账户前，请填写银行名称和银行账号":
    "请先填写银行名称和银行账号，再启用银行账户。",
  "只允许创建一个平台账户，请编辑已有账户":
    "只允许创建一个银行账户，请编辑已有账户。",
  "平台账户创建冲突，请刷新后查看已有账户":
    "银行账户创建冲突，请刷新后查看已有账户。",
  "平台账户只允许编辑，不能删除": "银行账户只允许编辑，不能删除。",
  请先在系统设置中配置唯一且有效的平台账户:
    "请先在公司设置中配置唯一且有效的银行账户。",
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
  if (orderErrorHints[e.message || ""]) return orderErrorHints[e.message || ""];
  if (
    ["ECONNABORTED", "ETIMEDOUT"].includes(e.code || "") ||
    /timeout/i.test(e.message || "")
  )
    return "网络不太稳定，请稍后再试";
  if (e.code === "ERR_NETWORK" || e.message === "Network Error")
    return "网络连接失败，请检查网络后重试";
  const status = e.response?.status;
  if (status === 429)
    return e.response?.data?.message === "尝试过多，请 15 分钟后重试"
      ? "登录尝试过多，请 15 分钟后重试"
      : "操作过于频繁，请稍后重试";
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
  if (status === 403) {
    const hints: Record<string, string> = {
      "尝试过多，请 15 分钟后重试": "登录尝试过多，请 15 分钟后重试",
      "请求校验失败，请刷新页面": "请求校验失败，请刷新页面后重试",
      请求来源不被允许: "当前访问地址未获允许，请使用系统配置的地址登录",
    };
    return (
      (typeof serverMessage === "string" && hints[serverMessage]) ||
      "当前账号没有操作权限"
    );
  }
  if (status === 404) return "操作暂时无法完成，请稍后再试";
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
