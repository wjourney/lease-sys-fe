import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RequestError } from "../../components/feedback/RequestError";
import { dateText, Page, Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { useBillRequest } from "../incomes/bill-data";
import { formatMoney } from "../finance/finance-data";
import { DepositDrawer } from "./DepositDrawer";
import {
  depositColors,
  depositStates,
  depositRefundDisabledReason,
} from "./deposit-state";

export default observer(function DepositsPage() {
  const root = useRoot();
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<{
    page: number;
    q?: string;
    projectId?: string;
    state?: string;
  }>({ page: 1 });
  const [viewing, setViewing] = useState<{
    id: string;
    mode?: "settle" | "refund";
  }>();
  const { data, loading, error, reload } = useBillRequest<
    Page & { projects: Row[] }
  >("/orders/deposits", filters, root.epoch);
  const change = (value: Partial<typeof filters>) =>
    setFilters((v) => ({ ...v, ...value, page: 1 }));
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((v) =>
          v.q === (keyword.trim() || undefined)
            ? v
            : { ...v, q: keyword.trim() || undefined, page: 1 },
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [keyword]);
  useEffect(() => {
    if (
      !loading &&
      data &&
      filters.page > Math.max(1, Math.ceil(data.total / 12))
    )
      setFilters((v) => ({
        ...v,
        page: Math.max(1, Math.ceil(data.total / 12)),
      }));
  }, [loading, data, filters.page]);
  if (!root.finance) return <Empty description={t("暂无此模块的访问权限")} />;
  const moneyColumn = (label: string, key: string) => ({
    title: t(label),
    width: 142,
    className: "whitespace-nowrap",
    align: "right" as const,
    render: (_: unknown, row: Row) =>
      key === "refundable" && row.deposit[key] == null ? (
        <span className="text-[#8793a4]">
          {t(row.deposit.state === "REFUND_PENDING" ? "待核算" : "—")}
        </span>
      ) : (
        formatMoney(row.deposit[key] ?? "0", row.currency)
      ),
  });
  return (
    <section className="finance-page resource-list">
      <div className="finance-panel list-surface">
        <div className="finance-filters bill-filters">
          <label>
            {t("关键词")}
            <Input
              aria-label={t("押金关键词")}
              prefix={<SearchOutlined />}
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("订单编号、租客、项目或单位")}
              style={{ width: 300 }}
            />
          </label>
          <label>
            {t("项目")}
            <Select
              aria-label={t("押金项目")}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t("全部项目")}
              value={filters.projectId}
              onChange={(projectId) => change({ projectId })}
              style={{ width: 200 }}
              options={data?.projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </label>
          <label>
            {t("状态")}
            <Select
              aria-label={t("押金状态")}
              allowClear
              placeholder={t("全部状态")}
              value={filters.state}
              onChange={(state) => change({ state })}
              style={{ width: 160 }}
              options={Object.entries(depositStates).map(([value, label]) => ({
                value,
                label: t(label),
              }))}
            />
          </label>
          <Button
            onClick={() => {
              setKeyword("");
              setFilters({ page: 1 });
            }}
          >
            {t("重置")}
          </Button>
        </div>
        {error ? (
          <RequestError
            type="error"
            message={error}
            action={<Button onClick={reload}>{t("重试")}</Button>}
          />
        ) : (
          <Spin spinning={loading}>
            <div className="list-results">
              <div className="list-scroll-area">
                <Table<Row>
                  rowKey="id"
                  dataSource={data?.items ?? []}
                  pagination={false}
                  scroll={{ x: 1320 }}
                  columns={[
                    {
                      title: t("租客 / 订单"),
                      width: 210,
                      render: (_, r) => (
                        <>
                          <div className="font-medium">{r.tenantName}</div>
                          <Link
                            className="text-xs"
                            to={`/orders/${r.id}?tab=deposit`}
                          >
                            {r.orderNo}
                          </Link>
                        </>
                      ),
                    },
                    {
                      title: t("项目 / 单位"),
                      width: 160,
                      render: (_, r) => (
                        <>
                          <div>{r.projectName}</div>
                          <div className="text-xs text-[#8793a4]">
                            {r.unitNo}
                          </div>
                        </>
                      ),
                    },
                    {
                      title: t("租约结束日"),
                      width: 110,
                      render: (_, r) =>
                        dateText(r.actualTerminationOn ?? r.endsOn),
                    },
                    {
                      title: t("押金状态"),
                      width: 100,
                      render: (_, r) => (
                        <Tag color={depositColors[r.deposit.state]}>
                          {t(depositStates[r.deposit.state] || "—")}
                        </Tag>
                      ),
                    },
                    moneyColumn("实收押金", "received"),
                    moneyColumn("扣款金额", "deduction"),
                    moneyColumn("应退金额", "refundable"),
                    moneyColumn("已退金额", "refunded"),
                    {
                      title: t("操作"),
                      width: 160,
                      fixed: "right",
                      render: (_, r) => (
                        <Space size={4} wrap>
                          <Button
                            size="small"
                            onClick={() => setViewing({ id: r.id })}
                          >
                            {t("查看")}
                          </Button>
                          <Tooltip
                            title={t(
                              depositRefundDisabledReason(r, root.finance) ||
                                "",
                            )}
                          >
                            <span>
                              <Button
                                size="small"
                                type="primary"
                                disabled={Boolean(
                                  depositRefundDisabledReason(r, root.finance),
                                )}
                                onClick={() =>
                                  setViewing({
                                    id: r.id,
                                    mode: r.depositSettledAt
                                      ? "refund"
                                      : "settle",
                                  })
                                }
                              >
                                {t("退还押金")}
                              </Button>
                            </span>
                          </Tooltip>
                          {r.deposit.state === "UNCOLLECTED" &&
                            !r.depositSettledAt &&
                            r.status !== "COMPLETED" && (
                              <Button
                                size="small"
                                onClick={() => setViewing({ id: r.id })}
                              >
                                {t("登记收款")}
                              </Button>
                            )}
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
              <div className="list-pagination">
                <Space>
                  <span>{t(`共 ${data?.total ?? 0} 条`)}</span>
                  <Pagination
                    current={filters.page}
                    pageSize={12}
                    total={data?.total ?? 0}
                    showSizeChanger={false}
                    onChange={(page) => setFilters((v) => ({ ...v, page }))}
                  />
                </Space>
              </div>
            </div>
          </Spin>
        )}
      </div>
      {viewing && (
        <DepositDrawer
          key={`${viewing.id}:${viewing.mode ?? "view"}`}
          {...viewing}
          onClose={() => setViewing(undefined)}
        />
      )}
    </section>
  );
});
