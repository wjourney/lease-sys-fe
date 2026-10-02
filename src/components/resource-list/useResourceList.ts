import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Row } from "../../shared/api";
import { configs } from "../../shared/config";
import { ListStore, useRoot } from "../../stores/root";
export function useResourceList(
  resource: string,
  fixed: Row,
  embedded: boolean,
  pageSize: number,
) {
  const config = configs[resource],
    root = useRoot(),
    navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const store = useMemo(() => new ListStore(), [resource]);
  const [q, setQ] = useState(search.get("q") || "");
  const [status, setStatus] = useState<string | undefined>(
    search.get("status") || "",
  );
  const [localPage, setLocalPage] = useState(1);
  const page = embedded ? localPage : Number(search.get("page") || 1);
  const query = embedded ? q : search.get("q") || "";
  const filter = embedded ? status : search.get("status") || undefined;
  const fixedKey = JSON.stringify(fixed);
  const key = JSON.stringify({
    ...Object.fromEntries(search.entries()),
    ...fixed,
    page,
    pageSize,
    q: query,
    status: fixed.status ?? filter,
  });
  useEffect(() => {
    if (embedded) setLocalPage(1);
  }, [embedded, fixedKey]);
  const epoch = root.epoch,
    identity = root.user?.id || "",
    allowed = !!config && root.canRead(resource);
  const load = useCallback(
    (force = false) => {
      if (allowed)
        void store.load(resource, JSON.parse(key), epoch, identity, force);
    },
    [store, resource, key, epoch, identity, allowed],
  );
  useEffect(() => {
    load();
  }, [load]);
  const refresh = () => load(true);
  function searchNow() {
    if (embedded) setLocalPage(1);
    else
      setSearch({
        ...Object.fromEntries(search.entries()),
        q,
        status: status || "",
        page: "1",
      });
    refresh();
  }
  return {
    config,
    root,
    navigate,
    search,
    setSearch,
    store,
    q,
    setQ,
    status,
    setStatus,
    page,
    query,
    filter,
    setLocalPage,
    refresh,
    searchNow,
  };
}
