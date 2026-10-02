import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage, Row } from "../../shared/api";

/** The newest route/reload owns the result; late responses cannot replace it. */
export function useRecordData(resource: string, id: string, epoch: number) {
  const [row, setRow] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<Row[]>([]);
  const [receipts, setReceipts] = useState<Row[]>([]);
  const [versions, setVersions] = useState<Row[]>([]);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError("");
    try {
      const [record, related] = await Promise.all([
        api.get<Row>(`/${resource}/${id}`),
        resource === "materials"
          ? api.get(`/materials/${id}/versions`)
          : resource === "incomes"
            ? api.get(`/incomes/${id}/receipts`, { params: { pageSize: 100 } })
            : Promise.resolve(undefined),
      ]);
      if (current !== request.current) return;
      setRow(record.data);
      setLogs(record.data.operations || []);
      setReceipts(resource === "incomes" ? related?.data.items || [] : []);
      setVersions(resource === "materials" ? related?.data.items || [] : []);
    } catch (e) {
      if (current === request.current) setError(errorMessage(e));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [resource, id]);
  useEffect(() => {
    void load();
    return () => {
      request.current++;
    };
  }, [load, epoch]);
  return { row, loading, error, logs, receipts, versions, load };
}
