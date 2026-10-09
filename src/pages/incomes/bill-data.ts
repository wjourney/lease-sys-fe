import { useEffect, useState } from "react";
import { api, dateText, errorMessage, Row } from "../../shared/api";

export type BillFilters = {
  q?: string;
  orderId?: string;
  projectId?: string;
  unitId?: string;
  feeType?: string;
  status?: string;
  currency: string;
  overdue?: string;
  pending?: string;
  from?: string;
  to?: string;
  page: number;
};
export type BillSummary = Record<
  "total" | "confirmed" | "pending" | "offset" | "remaining",
  string
>;
export type BillPage = {
  items: Row[];
  total: number;
  page: number;
  summary: { rental: BillSummary; deposit: BillSummary };
  pendingCount: number;
  projects: { id: string; name: string }[];
  units: { id: string; projectId: string; unitNo: string }[];
};
export const billTypes: Record<string, string> = {
  RENT: "租金",
  DEPOSIT: "押金",
  OTHER: "其他费用",
};
export const billStates: Record<string, string> = {
  OPEN: "待付款",
  PAID: "已付款",
};
export function billTitle(bill: Row): string {
  if (bill.billTitle) return bill.billTitle;
  const type = billTypes[bill.feeType] || bill.feeType || "账单";
  return bill.periodStart && bill.periodEnd
    ? `${type}—${dateText(bill.periodStart)} 至 ${dateText(bill.periodEnd)}`
    : type;
}
export function useBillRequest<T>(path: string, params: Row, epoch: number) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify(params);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .get<T>(path, { params: JSON.parse(key), signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setData(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setData(undefined);
          setError(errorMessage(e));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, key, epoch, retry]);
  return { data, error, loading, reload: () => setRetry((v) => v + 1) };
}
