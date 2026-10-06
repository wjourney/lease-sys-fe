import { useEffect, useState } from "react";
import { api, errorMessage, Row } from "../../shared/api";

export type BillFilters = {
  q?: string;
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
  OPEN: "待收款",
  PARTIAL: "部分结清",
  PAID: "已结清",
  VOID: "已作废",
};
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
