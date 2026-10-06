import type { Row } from "./api";

export function canEditFinancialRecord(resource: string, row: Row) {
  if (resource === "incomes") return false;
  if (resource === "expenses")
    return (
      row.status === "UNPAID" &&
      Number(row.paidAmount || 0) === 0 &&
      !row.commissionId &&
      !["DEPOSIT_REFUND", "RENT_REFUND", "COMMISSION"].includes(row.feeType)
    );
  if (resource === "commissions")
    return (
      !["ONE_TIME", "RECURRING_MONTHLY"].includes(row.mode) &&
      row.status !== "VOID" &&
      Number(row.paidAmount || 0) === 0 &&
      Number(row.plannedAmount || 0) === 0
    );
  return true;
}
