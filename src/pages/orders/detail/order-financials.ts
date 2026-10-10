import type { Row } from "../../../shared/api";
import { cents } from "./order-state";

export function sumMoney(rows: Row[], key: string) {
  return rows.reduce((total, row) => total + cents(row[key]), 0) / 100;
}
export function rentFigures(bills: Row[], today: string) {
  const rent = bills.filter(
    (bill) => bill.feeType === "RENT" && bill.status !== "VOID",
  );
  return {
    total: sumMoney(rent, "total"),
    received: sumMoney(rent, "confirmed"),
    overdue: sumMoney(
      rent.filter((bill) => bill.dueOn && bill.dueOn.slice(0, 10) <= today),
      "remaining",
    ),
  };
}
export function depositFigures(deposit: Row, settled: boolean) {
  return {
    unreceived:
      Math.max(0, cents(deposit.agreed) - cents(deposit.received)) / 100,
    // Refundable amounts only exist after settlement; held money is not yet a refund.
    refundable: settled
      ? Math.max(0, cents(deposit.received) - cents(deposit.deduction)) / 100
      : null,
    refundDue: settled ? Math.max(0, cents(deposit.refundDue)) / 100 : null,
  };
}
export function remainingMoney(row: Row) {
  return Math.max(0, cents(row.amount) - cents(row.paidAmount)) / 100;
}

export function depositSummaryItems(deposit: Row, settled: boolean) {
  if (!settled)
    return [
      { label: "约定押金", value: deposit.agreed },
      { label: "已收押金", value: deposit.received },
    ];
  return [
    { label: "已收押金", value: deposit.received },
    { label: "扣款金额", value: deposit.deduction },
    cents(deposit.refundDue) > 0
      ? { label: "应退金额", value: deposit.refundDue }
      : { label: "已退金额", value: deposit.refunded },
  ];
}
