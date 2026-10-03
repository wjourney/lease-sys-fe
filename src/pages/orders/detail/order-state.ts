import { Row } from "../../../shared/api";
export const depositLabels: Record<string, string> = {
  COLLECTING: "押金未收齐",
  HELD: "押金持有中",
  SETTLEMENT_PENDING: "押金待结算",
  REFUND_PENDING: "押金待退款",
  SETTLED: "押金已结算",
  CLOSED: "无押金待办",
};
export const depositStages = ["收取", "持有", "交还", "结算", "退款", "结清"];
export function depositStage(row: Row) {
  switch (row.deposit?.state) {
    case "COLLECTING":
      return 0;
    case "HELD":
      return row.status === "COMPLETED" ? 2 : 1;
    case "SETTLEMENT_PENDING":
      return 3;
    case "REFUND_PENDING":
      return 4;
    case "SETTLED":
      return 5;
    default:
      return 0;
  }
}
export function depositDisplayLabel(row: Row) {
  const d = row.deposit;
  if (!d) return "押金状态未知";
  if (d.state === "COLLECTING") {
    if (Number(d.pending) > 0) return "押金待确认";
    return Number(d.received) > 0 ? "部分收取" : "待收取";
  }
  if (d.state === "HELD" && row.status === "COMPLETED") return "待交还";
  if (d.state === "REFUND_PENDING")
    return Number(d.refunded) > 0 ? "部分退款" : "押金待退款";
  if (d.state === "SETTLED")
    return Number(d.refunded) > 0 ? "已退清" : "已结清（无需退款）";
  return depositLabels[d.state] ?? d.state;
}
export const paymentLabels: Record<string, string> = {
  UNPAID: "首期未收款",
  PARTIAL: "首期部分收款",
  PENDING: "首期待确认",
  PAID: "首期已收齐",
};
export function orderLabel(row: Row) {
  return row.status === "COMPLETED"
    ? row.handoverStatus === "DONE"
      ? "已结束"
      : "待交还"
    : ({ PENDING: "待确认", ACTIVE: "租赁中", CLOSED: "已关闭" }[
        row.status as string
      ] ?? row.status);
}
export function orderNotice(row: Row) {
  if (row.status === "CLOSED") return "订单已关闭，单位占用已释放。";
  if (row.status === "COMPLETED") {
    if (row.handoverStatus !== "DONE")
      return "租赁已结束，请先确认单位交还，再办理押金结算。";
    if (Number(row.deposit?.pending) > 0)
      return "押金仍有待确认收款，请先确认或驳回，再办理结算。";
    if (row.deposit?.state === "REFUND_PENDING")
      return "押金已结算，退款尚未付清，请登记实际退款付款。";
    if (row.deposit?.state === "SETTLED")
      return "单位已交还，押金已结算。其他未结账款请继续跟进。";
    return "单位已交还，请核对扣款事项并办理押金结算。";
  }
  if (row.status === "ACTIVE")
    return "租赁进行中；退租并交还单位后办理押金结算。";
  return row.firstPaymentStatus === "PENDING"
    ? "首期款项已登记，等待财务核对到账；填报已付款不等于确认收齐。"
    : "首期租金及约定押金确认收齐后，订单自动生效。";
}
export function cents(value: unknown) {
  return Math.round(Number(value ?? 0) * 100);
}
