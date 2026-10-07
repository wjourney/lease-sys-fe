import { App, Select } from "antd";
import { useEffect, useState } from "react";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";

/** Search only orders visible to the current actor; do not load the entire ledger. */
export function OrderFilter({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const { message } = App.useApp();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [chosen, setChosen] = useState<Row>();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/orders", {
          params: { q: query.trim(), page: 1, pageSize: 30 },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setRows(data.items);
      } catch (error) {
        if (!controller.signal.aborted) message.error(errorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, message]);
  // Resolve a persisted URL selection even when it is outside the first search page.
  useEffect(() => {
    if (!value || chosen?.id === value) return;
    const controller = new AbortController();
    api
      .get(`/orders/${value}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setChosen(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) message.error(errorMessage(error));
      });
    return () => controller.abort();
  }, [value, message]);
  const options =
    chosen && chosen.id === value && !rows.some((r) => r.id === value)
      ? [chosen, ...rows]
      : rows;
  return (
    <div className="flex items-center gap-2.5">
      <span className="whitespace-nowrap text-sm text-[#718095]">
        {t("订单")}
      </span>
      <Select
        aria-label={t("订单筛选")}
        style={{ width: 270 }}
        allowClear
        showSearch
        filterOption={false}
        loading={loading}
        placeholder={t("全部订单（搜索订单编号、租客）")}
        value={value}
        onSearch={setQuery}
        onChange={(id) => {
          setChosen(rows.find((r) => r.id === id));
          setQuery("");
          onChange(id);
        }}
        options={options.map((r) => ({
          value: r.id,
          label: `${r.orderNo} · ${r.tenantName || "—"}`,
        }))}
      />
    </div>
  );
}
