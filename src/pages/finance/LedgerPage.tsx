import { SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ReceiptDrawer } from "../../components/receipts/ReceiptActions";
import { feeLabels } from "../../shared/config";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { FinanceFilters } from "./FinanceFilters";
import {
  FinanceFilters as Filters,
  formatMoney,
  LedgerData,
  Movement,
  periodDates,
  useFinanceData,
} from "./finance-data";

export default observer(function LedgerPage() {
  const root = useRoot();
  const [period, setPeriod] = useState("month");
  const [filters, setFilters] = useState<Filters>({
    ...periodDates("month"),
    currency: "HKD",
    page: 1,
  });
  const [keyword, setKeyword] = useState("");
  const [receipt, setReceipt] = useState<string>();
  const { data, error, loading, reload } = useFinanceData<LedgerData>(
    "ledger",
    filters,
    root.epoch,
    root.finance,
  );
  const change = (value: Partial<Filters>) =>
    setFilters((v) => ({ ...v, ...value, page: 1 }));
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((v) =>
          v.q === keyword.trim()
            ? v
            : { ...v, q: keyword.trim() || undefined, page: 1 },
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [keyword]);
  if (!root.finance) return <Empty description={t("暂无此模块的访问权限")} />;
  return (
    <section className="finance-page resource-list">
      <div className="finance-heading">
        <h1>{t("资金流水")}</h1>
        <span>
          {t(
            "已确认收款与实际付款自动汇总，可追溯来源，不可直接增删改。冲正作为更正记录保留。",
          )}
        </span>
      </div>
      <div className="finance-panel list-surface">
        <FinanceFilters
          value={filters}
          onChange={change}
          period={period}
          onPeriod={(p) => {
            setPeriod(p);
            if (p !== "custom") change(periodDates(p));
          }}
          projects={data?.projects || []}
          onReset={() => {
            setPeriod("month");
            setKeyword("");
            setFilters({ ...periodDates("month"), currency: "HKD", page: 1 });
          }}
        />
        <div className="finance-filters">
          <Input
            aria-label={t("流水关键词")}
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t("编号、订单、往来方或银行参考号")}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            aria-label={t("资金账户")}
            placeholder={t("全部资金账户")}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 200 }}
            value={filters.accountId}
            onChange={(accountId) => change({ accountId })}
            options={data?.accounts.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
          />
          <Select
            aria-label={t("收支方向")}
            placeholder={t("全部收支")}
            allowClear
            style={{ width: 120 }}
            value={filters.direction}
            onChange={(direction) => change({ direction })}
            options={[
              { value: "IN", label: t("收入") },
              { value: "OUT", label: t("支出 / 冲正") },
            ]}
          />
          <Select
            aria-label={t("流水类型")}
            placeholder={t("全部类型")}
            allowClear
            style={{ width: 130 }}
            value={filters.kind}
            onChange={(kind) => change({ kind })}
            options={[
              { value: "RECEIPT", label: t("已确认收款") },
              { value: "PAYMENT", label: t("实际付款") },
              { value: "REVERSAL", label: t("收款冲正") },
            ]}
          />
          <Select
            aria-label={t("费用类型")}
            placeholder={t("全部费用")}
            allowClear
            style={{ width: 130 }}
            value={filters.feeType}
            onChange={(feeType) => change({ feeType })}
            options={Object.entries(feeLabels).map(([value, label]) => ({
              value,
              label: t(label),
            }))}
          />
        </div>
        {error ? (
          <Alert
            type="error"
            showIcon
            message={error}
            action={<Button onClick={reload}>{t("重试")}</Button>}
          />
        ) : (
          <Spin spinning={loading}>
            {data && (
              <>
                <div className="finance-summary">
                  {[
                    ["确认流入", data.summary.incoming],
                    ["实际流出", data.summary.outgoing],
                    ["冲正扣减", data.summary.corrections],
                    ["净流入", data.summary.net],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span>{t(label)}</span>
                      <strong>{formatMoney(val, filters.currency)}</strong>
                    </div>
                  ))}
                </div>
                <div className="list-results">
                  <div className="list-scroll-area">
                    <Table<Movement>
                      rowKey="id"
                      size="middle"
                      dataSource={data.items}
                      pagination={false}
                      scroll={{ x: 1450 }}
                      columns={[
                        { title: t("发生日期"), dataIndex: "date", width: 116 },
                        {
                          title: t("来源单号"),
                          dataIndex: "sourceNo",
                          width: 210,
                          render: (v, r) =>
                            r.source === "incomes" ? (
                              <Button
                                type="link"
                                className="!p-0"
                                onClick={() => setReceipt(r.sourceId)}
                              >
                                {v}
                              </Button>
                            ) : (
                              <Link to={`/expenses/${r.sourceId}`}>{v}</Link>
                            ),
                        },
                        {
                          title: t("类型"),
                          dataIndex: "kind",
                          width: 120,
                          render: (v) => (
                            <Tag
                              color={
                                v === "REVERSAL"
                                  ? "orange"
                                  : v === "RECEIPT"
                                    ? "green"
                                    : "blue"
                              }
                            >
                              {t(
                                v === "REVERSAL"
                                  ? "收款冲正"
                                  : v === "RECEIPT"
                                    ? "收入"
                                    : "支出",
                              )}
                            </Tag>
                          ),
                        },
                        {
                          title: t("费用"),
                          dataIndex: "feeType",
                          render: (v) => t(feeLabels[v] || v),
                        },
                        {
                          title: t("金额"),
                          width: 160,
                          align: "right",
                          render: (_, r) =>
                            `${r.direction === "IN" ? "+" : "−"}${formatMoney(r.amount, r.currency)}`,
                        },
                        {
                          title: t("资金账户"),
                          dataIndex: "accountName",
                          width: 160,
                        },
                        { title: t("往来方"), dataIndex: "counterparty" },
                        {
                          title: t("关联订单"),
                          width: 210,
                          render: (_, r) =>
                            r.orderId ? (
                              <Link to={`/orders/${r.orderId}`}>
                                {r.orderNo || t("查看订单")}
                              </Link>
                            ) : (
                              "—"
                            ),
                        },
                        { title: t("项目"), dataIndex: "projectName" },
                        { title: t("银行参考号"), dataIndex: "bankReference" },
                        {
                          title: t("佣金"),
                          render: (_, r) =>
                            r.commissionId ? (
                              <Link to={`/commissions/${r.commissionId}`}>
                                {t("查看佣金")}
                              </Link>
                            ) : (
                              "—"
                            ),
                        },
                      ]}
                    />
                  </div>
                  <div className="list-pagination">
                    <Space>
                      <span>{t(`共 ${data.total} 条`)}</span>
                      <Pagination
                        current={filters.page}
                        pageSize={12}
                        total={data.total}
                        showSizeChanger={false}
                        onChange={(page) => setFilters((v) => ({ ...v, page }))}
                      />
                    </Space>
                  </div>
                </div>
              </>
            )}
          </Spin>
        )}
      </div>
      {receipt && (
        <ReceiptDrawer id={receipt} onClose={() => setReceipt(undefined)} />
      )}
    </section>
  );
});
