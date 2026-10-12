import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Empty, Table } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, dateText, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { formatMoney } from "../../shared/money-format";

export function FinanceSummaryStrip({
  status,
  figures,
  actions,
}: {
  status: ReactNode;
  figures: { label: string; value: ReactNode }[];
  actions?: ReactNode;
}) {
  return (
    <div className="finance-detail-summary">
      <div className="finance-detail-status">{status}</div>
      {figures.map((item) => (
        <div className="finance-detail-figure" key={item.label}>
          <span>{t(item.label)}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
      {actions && <div className="finance-detail-actions">{actions}</div>}
    </div>
  );
}

export function FinanceFields({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="finance-detail-fields">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{t(item.label)}</dt>
          <dd>{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RelatedOrderPanel({
  orderId,
  summary,
}: {
  orderId?: string;
  summary?: Row;
}) {
  const navigate = useNavigate();
  const [fetched, setFetched] = useState<Row>();
  useEffect(() => {
    if (!orderId || (summary?.startsOn && summary?.endsOn)) return;
    const controller = new AbortController();
    api
      .get<Row>(`/orders/${orderId}`, { signal: controller.signal })
      .then(({ data }) => setFetched(data))
      .catch(() => {});
    return () => controller.abort();
  }, [orderId, summary?.startsOn, summary?.endsOn]);
  if (!orderId) return null;
  const row = {
    ...fetched,
    ...Object.fromEntries(
      Object.entries(summary || {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ),
  };
  const lease =
    row.startsOn || row.endsOn
      ? `${dateText(row.startsOn)} ${t("至")} ${dateText(row.endsOn)}`
      : "—";
  return (
    <section className="finance-related-order">
      <div className="finance-related-order-head">
        <h3>{t("关联订单")}</h3>
        <Button type="link" onClick={() => navigate(`/orders/${orderId}`)}>
          {t("查看订单")} <ArrowRightOutlined aria-hidden />
        </Button>
      </div>
      <FinanceFields
        items={[
          { label: "订单编号", value: row.orderNo || "—" },
          { label: "租客", value: row.tenantName || "—" },
          { label: "项目", value: row.projectName || "—" },
          { label: "单位", value: row.unitNo || "—" },
          { label: "租期", value: lease },
          {
            label: "成交月租",
            value:
              row.monthlyRent == null
                ? "—"
                : formatMoney(row.monthlyRent, row.currency || "HKD"),
          },
        ]}
      />
    </section>
  );
}

export function FinanceRecords({
  title,
  rows,
  columns,
  emptyText,
}: {
  title: string;
  rows: Row[];
  columns: React.ComponentProps<typeof Table<Row>>["columns"];
  emptyText: string;
}) {
  return (
    <section className="finance-detail-records">
      <h3>{t(title)}</h3>
      <Table<Row>
        rowKey={(row, index) => String(row.id ?? index)}
        pagination={false}
        dataSource={rows}
        columns={columns}
        scroll={{ x: 680 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t(emptyText)}
            />
          ),
        }}
      />
    </section>
  );
}
