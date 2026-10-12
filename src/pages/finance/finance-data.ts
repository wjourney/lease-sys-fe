import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { api, errorMessage } from "../../shared/api";

export type FinanceFilters = {
  from: string;
  to: string;
  currency: string;
  orderId?: string;
  accountId?: string;
  direction?: string;
  q?: string;
  page?: number;
};
export function periodDates(period: string, now = dayjs()) {
  const start =
    period === "quarter"
      ? now.startOf("year").add(Math.floor(now.month() / 3) * 3, "month")
      : period === "half"
        ? now.subtract(5, "month").startOf("month")
        : now.startOf("month");
  return { from: start.format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD") };
}
export function useFinanceData<T>(
  kind: "ledger" | "statistics",
  filters: FinanceFilters,
  epoch: number,
  allowed: boolean,
) {
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify({ kind, filters, epoch, retry });
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error: string;
    loading: boolean;
  }>();
  useEffect(() => {
    if (!allowed) {
      setResult(undefined);
      return;
    }
    const controller = new AbortController();
    setResult({ key, loading: true, error: "" });
    api
      .get<T>(`/finance/${kind}`, {
        params: JSON.parse(key).filters,
        signal: controller.signal,
      })
      .then((r) => {
        if (!controller.signal.aborted)
          setResult({ key, data: r.data, error: "", loading: false });
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setResult({ key, error: errorMessage(e), loading: false });
        }
      });
    return () => controller.abort();
  }, [kind, key, allowed]);
  // A render with new filters must never label the previous response as current.
  const current = allowed && result?.key === key ? result : undefined;
  return {
    data: current?.data,
    error: current?.error || "",
    loading: allowed && (!current || current.loading),
    reload: () => setRetry((v) => v + 1),
  };
}
export type MoneySummary = {
  incoming: string;
  outgoing: string;
  corrections: string;
  net: string;
  income: string;
  depositReceived: string;
  depositRefunded: string;
  commissionPaid: string;
};
export type Movement = {
  id: string;
  source: "incomes" | "expenses";
  sourceId: string;
  sourceNo: string;
  date: string;
  direction: "IN" | "OUT";
  kind: "RECEIPT" | "PAYMENT" | "REVERSAL";
  amount: string;
  currency: string;
  feeType: string;
  accountName: string;
  counterparty: string;
  bankReference: string;
  orderId?: string;
  orderNo: string;
  commissionId?: string;
  projectName: string;
};
export type Choice = { id: string; name: string };
export type LedgerData = {
  items: Movement[];
  total: number;
  summary: MoneySummary;
  accounts: Choice[];
};
export type StatisticsData = {
  summary: MoneySummary & {
    orderCount: number;
    commissionCount: number;
    commissionDue: string;
    unsetCommissionCount: number;
  };
  trend: (MoneySummary & { month: string; orderCount: number })[];
  expenses: { feeType: string; amount: string }[];
};
export { formatMoney } from "../../shared/money-format";
