import { describe, expect, it } from "vitest";
import { expenseBreakdown, monthlyTotals } from "./statistics-summary";
import type { StatisticsData } from "./finance-data";

describe("finance statistics summaries", () => {
  it("handles no expenses and the single-category 100% case", () => {
    expect(expenseBreakdown([])).toEqual({ total: 0, items: [] });
    expect(
      expenseBreakdown([{ feeType: "COMMISSION", amount: "2000.00" }]),
    ).toEqual({
      total: 2000,
      items: [{ feeType: "COMMISSION", value: 2000, percentage: 100 }],
    });
  });
  it("calculates shares from the total, excluding zero amounts", () => {
    const result = expenseBreakdown([
      { feeType: "COMMISSION", amount: "75.00" },
      { feeType: "OTHER", amount: "25.00" },
      { feeType: "DEPOSIT_REFUND", amount: "0.00" },
    ]);
    expect(result.total).toBe(100);
    expect(result.items.map((item) => item.percentage)).toEqual([75, 25]);
  });
  it("sums monthly amounts in cents and preserves negative net cash flow", () => {
    const row = (
      incoming: string,
      outgoing: string,
      net: string,
      orderCount: number,
    ) =>
      ({
        incoming,
        outgoing,
        net,
        orderCount,
        commissionPaid: "0.10",
        corrections: "0.00",
      }) as StatisticsData["trend"][number];
    expect(
      monthlyTotals([
        row("0.10", "0.30", "-0.20", 1),
        row("0.20", "0.40", "-0.20", 2),
      ]),
    ).toEqual({
      month: "合计",
      orderCount: 3,
      incoming: "0.30",
      outgoing: "0.70",
      commissionPaid: "0.20",
      net: "-0.40",
      corrections: "0.00",
    });
    expect(monthlyTotals([]).incoming).toBe("0.00");
  });
});
