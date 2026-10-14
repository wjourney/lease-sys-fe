import type { Row } from "../../shared/api";
import { feeLabels, statusLabels } from "../../shared/resource-config";
import { formatMoney } from "../../shared/money-format";

export type FinanceHistoryResource =
  "incomes" | "deposits" | "commissions" | "expenses" | "invoices";

type ValueKind =
  "date" | "money" | "status" | "fee" | "mode" | "method" | "text";

const resourceNames: Record<FinanceHistoryResource, string> = {
  incomes: "账单",
  deposits: "押金",
  commissions: "佣金",
  expenses: "支出",
  invoices: "发票",
};

function subjectName(
  log: Row,
  resource: FinanceHistoryResource,
  recordNo?: string,
) {
  const number = String(log.subject || recordNo || "");
  if (/^RC\d/i.test(number)) return "收款";
  if (/^CM\d/i.test(number)) return "佣金";
  if (/^B\d/i.test(number)) return "账单";
  if (/^INV/i.test(number)) return "发票";
  if (/^E\d/i.test(number)) return "支出";
  if (/^R\d/i.test(number)) return "订单";
  if (number.startsWith("合同")) return "合同";
  return resourceNames[resource];
}

function amountLabel(subject: string) {
  if (subject === "收款") return "收款金额";
  if (subject === "账单") return "应收金额";
  if (subject === "佣金") return "佣金金额";
  if (subject === "押金") return "押金金额";
  if (subject === "发票") return "发票金额";
  return "应付金额";
}

const fieldInfo: Record<string, { label: string; kind: ValueKind }> = {
  amount: { label: "金额", kind: "money" },
  total: { label: "应收金额", kind: "money" },
  confirmed: { label: "已收金额", kind: "money" },
  paidAmount: { label: "已付金额", kind: "money" },
  depositAmount: { label: "约定押金", kind: "money" },
  depositDeductionAmount: { label: "押金扣款", kind: "money" },
  depositOffsetAmount: { label: "押金抵扣", kind: "money" },
  dueOn: { label: "到期日", kind: "date" },
  issuedOn: { label: "出具日期", kind: "date" },
  paidOn: { label: "付款日", kind: "date" },
  receivedOn: { label: "收款日", kind: "date" },
  periodStart: { label: "账期开始日", kind: "date" },
  periodEnd: { label: "账期结束日", kind: "date" },
  status: { label: "状态", kind: "status" },
  feeType: { label: "费用类型", kind: "fee" },
  mode: { label: "结付方式", kind: "mode" },
  paymentMethod: { label: "付款方式", kind: "method" },
  payerName: { label: "付款方", kind: "text" },
  payeeName: { label: "收款方", kind: "text" },
  depositDeductionReason: { label: "扣款原因", kind: "text" },
  remark: { label: "备注", kind: "text" },
};

const modeLabels: Record<string, string> = {
  MONTHLY: "单月佣金",
  YEARLY: "按年结付",
  ONE_TIME: "一次性结付",
  RECURRING_MONTHLY: "按月结付",
};

const methodLabels: Record<string, string> = {
  BANK: "银行转账",
  CASH: "现金",
  CHEQUE: "支票",
};

function displayValue(
  value: unknown,
  kind: ValueKind,
  resource: FinanceHistoryResource,
  currency: string,
) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "object") return "";
  const raw = String(value);
  if (kind === "date")
    return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
  if (kind === "money") {
    return Number.isFinite(Number(value)) ? formatMoney(raw, currency) : "";
  }
  if (kind === "status") {
    if (resource === "incomes" || resource === "commissions") {
      if (["OPEN", "UNPAID", "PARTIAL", "UNSET"].includes(raw)) return "待付款";
      if (raw === "PAID") return "已付款";
    }
    if (resource === "expenses" && raw === "PAID") return "已付款";
    return statusLabels[raw] || "";
  }
  if (kind === "fee") return feeLabels[raw] || "";
  if (kind === "mode") return modeLabels[raw] || "";
  if (kind === "method") return methodLabels[raw] || "";
  return raw;
}

export function financeOperationSummary(
  log: Row,
  resource: FinanceHistoryResource,
  recordNo?: string,
) {
  const subjectValue = log.subject || recordNo;
  const subject =
    typeof subjectValue === "string" &&
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(subjectValue)
      ? subjectValue
      : undefined;
  const reason = typeof log.reason === "string" ? log.reason.trim() : "";
  const resourceName = subjectName(log, resource, recordNo);
  const fallback =
    log.action === "CREATE"
      ? resourceName
      : log.action === "DELETE"
        ? `删除${resourceName}`
        : `修改${resourceName}`;
  const summary = reason || fallback;
  return subject && !summary.includes(subject)
    ? `${summary} · ${subject}`
    : summary;
}

export function financeOperationChanges(
  log: Row,
  resource: FinanceHistoryResource,
  currency = "HKD",
) {
  // Creation logs contain the entire new database record. They are not changes made
  // to an existing business record and expose internal IDs if rendered verbatim.
  if (log.action !== "UPDATE") return [];
  const changes = log.changes;
  if (!changes || typeof changes !== "object") return [];

  return Object.entries(changes).flatMap(([key, change]) => {
    const info = fieldInfo[key];
    if (!info || !change || typeof change !== "object") return [];
    if (resource === "incomes" && key === "total" && "amount" in changes)
      return [];
    const { before, after } = change as { before?: unknown; after?: unknown };
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    const entity = subjectName(log, resource);
    let label = info.label;
    if (key === "amount") label = amountLabel(entity);
    if (entity === "佣金" && key === "periodStart") label = "结算期开始日";
    if (entity === "佣金" && key === "periodEnd") label = "结算期结束日";
    const oldValue = displayValue(before, info.kind, resource, currency);
    const newValue = displayValue(after, info.kind, resource, currency);
    if (!oldValue && !newValue) return [];
    if (!oldValue) return [`设置${label}为${newValue}`];
    if (!newValue) return [`清除${label}`];
    return [`${label}由${oldValue}改为${newValue}`];
  });
}
