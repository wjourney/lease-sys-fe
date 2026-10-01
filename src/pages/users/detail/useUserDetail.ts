import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage, Row } from "../../../shared/api";

export function useUserDetail(id: string, epoch: number) {
  const [row, setRow] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<Row>(`/users/${id}`);
      if (current === request.current) setRow(data);
    } catch (cause) {
      if (current === request.current) setError(errorMessage(cause));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    return () => {
      request.current++;
    };
  }, [load, epoch]);

  return { row, loading, error, load };
}
