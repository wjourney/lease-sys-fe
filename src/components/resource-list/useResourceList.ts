import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Row } from "../../shared/api";
import { configs } from "../../shared/config";
import { SEARCH_DEBOUNCE_MS } from "../../shared/search";
import { ListStore, useRoot } from "../../stores/root";
export function useResourceList(
  resource: string,
  fixed: Row,
  embedded: boolean,
  pageSize: number,
  syncSearch = !embedded,
) {
  const config = configs[resource],
    root = useRoot(),
    navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const store = useMemo(() => new ListStore(), [resource]);
  const urlQuery = search.get("q") || "";
  const [q, setDraftQuery] = useState(urlQuery);
  const [embeddedQuery, setEmbeddedQuery] = useState(urlQuery);
  const [embeddedStatus, setEmbeddedStatus] = useState<string | undefined>(
    search.get("status") || undefined,
  );
  const keywordTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const fixedKey = JSON.stringify(fixed);
  const [localPagination, setLocalPagination] = useState({ fixedKey, page: 1 });
  const setLocalPage = (value: number) =>
    setLocalPagination({ fixedKey, page: value });
  const page = !syncSearch
    ? localPagination.fixedKey === fixedKey
      ? localPagination.page
      : 1
    : Number(search.get("page") || 1);
  const query = !syncSearch ? embeddedQuery : urlQuery;
  const filter = !syncSearch
    ? embeddedStatus
    : search.get("status") || undefined;
  const status =
    resource === "commissions"
      ? ["OPEN", "PARTIAL", "UNSET"].includes(filter || "")
        ? "OPEN"
        : filter === "PAID"
          ? "PAID"
          : undefined
      : filter;
  const urlFilters = Object.fromEntries(search.entries());
  if (resource === "commissions") delete urlFilters.mode;
  const key = JSON.stringify({
    ...urlFilters,
    ...fixed,
    page,
    pageSize,
    q: query,
    status: fixed.status ?? status,
  });
  useEffect(() => {
    if (!syncSearch) return;
    clearTimeout(keywordTimer.current);
    setDraftQuery(urlQuery);
  }, [syncSearch, urlQuery]);
  useEffect(() => () => clearTimeout(keywordTimer.current), []);
  const applyFilters = useCallback(
    (nextQuery: string, nextStatus?: string) => {
      const trimmedQuery = nextQuery.trim();
      if (!syncSearch) {
        setEmbeddedQuery(trimmedQuery);
        setEmbeddedStatus(nextStatus || undefined);
        setLocalPagination({ fixedKey, page: 1 });
      } else {
        setSearch(
          (current) => {
            const next = new URLSearchParams(current);
            if (trimmedQuery) next.set("q", trimmedQuery);
            else next.delete("q");
            if (nextStatus) next.set("status", nextStatus);
            else next.delete("status");
            next.set("page", "1");
            return next;
          },
          { replace: true },
        );
      }
    },
    [syncSearch, fixedKey, setSearch],
  );
  function setQ(value: string) {
    setDraftQuery(value);
    clearTimeout(keywordTimer.current);
    if (!value.trim()) applyFilters("", status);
    else
      keywordTimer.current = setTimeout(
        () => applyFilters(value, status),
        SEARCH_DEBOUNCE_MS,
      );
  }
  function setStatus(value?: string) {
    clearTimeout(keywordTimer.current);
    applyFilters(q, value);
  }
  function searchNow() {
    clearTimeout(keywordTimer.current);
    applyFilters(q, status);
  }
  function resetFilters() {
    clearTimeout(keywordTimer.current);
    setDraftQuery("");
    applyFilters("", undefined);
  }
  function changePage(value: number) {
    if (!syncSearch) setLocalPage(value);
    else
      setSearch((current) => {
        const next = new URLSearchParams(current);
        next.set("page", String(value));
        return next;
      });
  }
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
  return {
    filterKey: key,
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
    changePage,
    refresh,
    searchNow,
    resetFilters,
  };
}
