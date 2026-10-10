import type { StatisticsData } from "./finance-data";

export function expenseBreakdown(expenses: StatisticsData["expenses"]) {
  const items = expenses
    .map((item) => ({ ...item, cents: Math.round(Number(item.amount) * 100) }))
    .filter((item) => Number.isFinite(item.cents) && item.cents > 0);
  const totalCents = items.reduce((sum, item) => sum + item.cents, 0);
  return {
    total: totalCents / 100,
    items: items.map((item) => ({
      feeType: item.feeType,
      value: item.cents / 100,
      percentage: (item.cents / totalCents) * 100,
    })),
  };
}

export function monthlyTotals(rows: StatisticsData["trend"]) {
  const sum = (
    key: "incoming" | "outgoing" | "commissionPaid" | "net" | "corrections",
  ) =>
    (
      rows.reduce(
        (total, row) => total + Math.round(Number(row[key]) * 100),
        0,
      ) / 100
    ).toFixed(2);
  return {
    month: "合计",
    orderCount: rows.reduce((total, row) => total + row.orderCount, 0),
    incoming: sum("incoming"),
    outgoing: sum("outgoing"),
    commissionPaid: sum("commissionPaid"),
    net: sum("net"),
    corrections: sum("corrections"),
  };
}
