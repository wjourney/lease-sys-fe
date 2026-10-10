import { describe, expect, it } from "vitest";
import {
  depositFigures,
  depositSummaryItems,
  remainingMoney,
  rentFigures,
} from "./order-financials";

describe("order detail money summaries", () => {
  it("separates the full lease from due rent and excludes deposits and void bills", () => {
    const bills = [
      {
        feeType: "RENT",
        status: "PARTIAL",
        total: "20.10",
        confirmed: "5.10",
        remaining: "10.00",
        offset: "5",
        dueOn: "2026-10-09T00:00:00Z",
      },
      {
        feeType: "RENT",
        status: "OPEN",
        total: "30.20",
        confirmed: "0",
        remaining: "30.20",
        dueOn: "2026-11-09",
      },
      {
        feeType: "RENT",
        status: "VOID",
        total: "90",
        confirmed: "0",
        remaining: "90",
        dueOn: "2026-10-01",
      },
      {
        feeType: "DEPOSIT",
        total: "200",
        confirmed: "200",
        remaining: "0",
        dueOn: "2026-10-09",
      },
      {
        feeType: "OTHER",
        total: "500",
        confirmed: "0",
        remaining: "500",
        dueOn: "2026-10-09",
      },
    ];
    expect(rentFigures(bills, "2026-10-09")).toEqual({
      total: 50.3,
      received: 5.1,
      overdue: 10,
    });
  });
  it("does not describe held deposits as refundable before settlement", () => {
    expect(
      depositFigures(
        { agreed: "20", received: "10", deduction: "0", refundDue: "0" },
        false,
      ),
    ).toEqual({ unreceived: 10, refundable: null, refundDue: null });
  });
  it("shows the total refundable and remaining refund separately after a partial payout", () => {
    expect(
      depositFigures(
        {
          agreed: "20000",
          received: "20000",
          deduction: "2000",
          refunded: "10000",
          refundDue: "8000",
        },
        true,
      ),
    ).toEqual({ unreceived: 0, refundable: 18000, refundDue: 8000 });
  });
  it("uses cents and clamps remaining payouts at zero", () => {
    expect(remainingMoney({ amount: "0.30", paidAmount: "0.10" })).toBe(0.2);
    expect(remainingMoney({ amount: "1", paidAmount: "2" })).toBe(0);
  });
  it("only offers a refund amount after settlement and shows the amount still due", () => {
    const deposit = {
      agreed: "20000",
      received: "20000",
      deduction: "2000",
      refunded: "10000",
      refundDue: "8000",
    };
    expect(depositSummaryItems(deposit, false)).toEqual([
      { label: "约定押金", value: "20000" },
      { label: "已收押金", value: "20000" },
    ]);
    expect(depositSummaryItems(deposit, true)).toEqual([
      { label: "已收押金", value: "20000" },
      { label: "扣款金额", value: "2000" },
      { label: "应退金额", value: "8000" },
    ]);
  });
  it("shows actual refunds for fully refunded and fully deducted deposits", () => {
    expect(
      depositSummaryItems(
        {
          received: "20000",
          deduction: "2000",
          refunded: "18000",
          refundDue: "0",
        },
        true,
      ).at(-1),
    ).toEqual({ label: "已退金额", value: "18000" });
    expect(
      depositSummaryItems(
        {
          received: "20000",
          deduction: "20000",
          refunded: "0",
          refundDue: "0",
        },
        true,
      ).at(-1),
    ).toEqual({ label: "已退金额", value: "0" });
  });
});
