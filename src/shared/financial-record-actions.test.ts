import { describe, expect, it } from "vitest";
import { canEditFinancialRecord } from "./financial-record-actions";
import { periodDates } from "../pages/finance/finance-data";
import dayjs from "dayjs";
describe("finance records and periods", () => {
  it("only unpaid manual expenses are editable", () => {
    const row = { status: "UNPAID", paidAmount: "0", feeType: "OTHER" };
    expect(canEditFinancialRecord("expenses", row)).toBe(true);
    for (const extra of [
      { paidAmount: "5" },
      { status: "PAID" },
      { commissionId: "c" },
      { feeType: "DEPOSIT_REFUND" },
      { feeType: "RENT_REFUND" },
    ])
      expect(canEditFinancialRecord("expenses", { ...row, ...extra })).toBe(
        false,
      );
    expect(canEditFinancialRecord("incomes", row)).toBe(false);
  });
  it("order commissions use their source; unpaid legacy commissions can be completed", () => {
    expect(
      canEditFinancialRecord("commissions", {
        mode: "ONE_TIME",
        status: "OPEN",
      }),
    ).toBe(false);
    expect(
      canEditFinancialRecord("commissions", {
        mode: "MONTHLY",
        status: "OPEN",
      }),
    ).toBe(true);
    expect(
      canEditFinancialRecord("commissions", {
        mode: "MONTHLY",
        status: "OPEN",
        plannedAmount: "100",
      }),
    ).toBe(false);
  });
  it("quarter and six-month presets respect year boundaries", () => {
    const now = dayjs("2026-02-05");
    expect(periodDates("quarter", now)).toEqual({
      from: "2026-01-01",
      to: "2026-02-05",
    });
    expect(periodDates("half", now)).toEqual({
      from: "2025-09-01",
      to: "2026-02-05",
    });
  });
});
