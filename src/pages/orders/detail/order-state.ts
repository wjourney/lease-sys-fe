import { Row } from "../../../shared/api";
import { orderDisplayStatus } from "../../../shared/order-status";

export function orderLabel(row: Row) {
  const status = orderDisplayStatus(row.status);
  return status === "ENDED"
    ? "已结束"
    : status === "IN_PROGRESS"
      ? "进行中"
      : row.status;
}
export function cents(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}
