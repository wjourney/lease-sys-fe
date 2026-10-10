import type { Row } from "../../shared/api";

export function depositRefundDisabledReason(row: Row, canFinance: boolean) {
  if (!canFinance) return "当前账号没有退还押金的权限";
  if (row.depositSettledAt)
    return Number(row.deposit?.refundDue) > 0
      ? undefined
      : "押金已结清，无需退还";
  if (row.status !== "COMPLETED") return "租约尚未结束，暂不能退还押金";
  if (Number(row.deposit?.pending) > 0) return "请先核对历史收款，再退还押金";
  if (row.actions && !row.actions.settle)
    return "当前押金不可退还，请刷新后重试";
  return undefined;
}

export const depositStates: Record<string, string> = {
  UNCOLLECTED: "未收取",
  HELD: "持有中",
  REFUND_PENDING: "待退还",
  SETTLED: "已结清",
  NOT_REQUIRED: "无需押金",
};

export const depositColors: Record<string, string> = {
  UNCOLLECTED: "orange",
  HELD: "blue",
  REFUND_PENDING: "gold",
  SETTLED: "green",
};
