import { RequestError } from "../../components/feedback/RequestError";
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
} from "antd";
import { observer } from "mobx-react-lite";
import { lazy, Suspense, useEffect, useState } from "react";
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

const ExpenseDetail = lazy(() => import("../expenses/detail"));
const CommissionDetail = lazy(() => import("../commissions/detail"));

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
  const [expense, setExpense] = useState<string>();
  const [commission, setCommission] = useState<string>();
  const view = (row: Movement) =>
    row.source === "incomes"
      ? setReceipt(row.sourceId)
      : setExpense(row.sourceId);
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
    <section className="finance-page finance-ledger resource-list">
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
        >
          <div className="finance-filter-field">
            <span>{t("关键词")}</span>
            <Input
              aria-label={t("流水关键词")}
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t("编号、订单、往来方或银行参考号")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
          <div className="finance-filter-field">
            <span>{t("银行账户")}</span>
            <Select
              aria-label={t("银行账户")}
              placeholder={t("全部银行账户")}
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
          </div>
          <div className="finance-filter-field">
            <span>{t("收支")}</span>
            <Select
              aria-label={t("收支方向")}
              placeholder={t("全部收支")}
              allowClear
              style={{ width: 120 }}
              value={filters.direction}
              onChange={(direction) => change({ direction })}
              options={[
                { value: "IN", label: t("收入") },
                { value: "OUT", label: t("支出") },
              ]}
            />
          </div>
        </FinanceFilters>
        {error ? (
          <RequestError
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
                    ["资金流入", data.summary.incoming],
                    ["资金流出", data.summary.outgoing],
                    ...(Number(data.summary.corrections) !== 0
                      ? [["历史调整", data.summary.corrections]]
                      : []),
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
                      scroll={{ x: 1349 }}
                      columns={[
                        { title: t("发生日期"), dataIndex: "date", width: 105 },
                        {
                          title: t("来源单号"),
                          dataIndex: "sourceNo",
                          width: 180,
                          render: (v, r) => (
                            <Button
                              type="link"
                              className="finance-table-link"
                              onClick={() => view(r)}
                            >
                              {v}
                            </Button>
                          ),
                        },
                        {
                          title: t("类型"),
                          dataIndex: "kind",
                          width: 64,
                          render: (v) => (
                            <Tag
                              color={
                                v === "REVERSAL"
                                  ? "orange"
                                  : v === "RECEIPT"
                                    ? "green"
                                    : "orange"
                              }
                            >
                              {t(
                                v === "REVERSAL"
                                  ? "历史调整"
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
                          width: 55,
                          render: (v) => t(feeLabels[v] || v),
                        },
                        {
                          title: t("金额"),
                          width: 140,
                          align: "right",
                          render: (_, r) => (
                            <span
                              className={
                                r.direction === "IN"
                                  ? "finance-amount-in"
                                  : "finance-amount-out"
                              }
                            >
                              {`${r.direction === "IN" ? "+" : "−"}${formatMoney(r.amount, r.currency)}`}
                            </span>
                          ),
                        },
                        {
                          title: t("银行账户"),
                          dataIndex: "accountName",
                          width: 145,
                        },
                        {
                          title: t("往来方"),
                          dataIndex: "counterparty",
                          width: 135,
                        },
                        {
                          title: t("关联订单"),
                          width: 180,
                          render: (_, r) =>
                            r.orderId ? (
                              <Link to={`/orders/${r.orderId}`}>
                                {r.orderNo || t("查看订单")}
                              </Link>
                            ) : (
                              "—"
                            ),
                        },
                        {
                          title: t("项目"),
                          dataIndex: "projectName",
                          width: 100,
                          render: (v) => v || "—",
                        },
                        {
                          title: t("银行参考号"),
                          dataIndex: "bankReference",
                          width: 95,
                          render: (v) => v || "—",
                        },
                        {
                          title: t("佣金"),
                          width: 80,
                          render: (_, r) =>
                            r.commissionId ? (
                              <Button
                                type="link"
                                className="finance-table-link"
                                onClick={() => setCommission(r.commissionId)}
                              >
                                {t("查看佣金")}
                              </Button>
                            ) : (
                              "—"
                            ),
                        },
                        {
                          title: t("操作"),
                          width: 70,
                          fixed: "right",
                          render: (_, r) => (
                            <Button
                              size="small"
                              className="finance-view-button"
                              onClick={() => view(r)}
                            >
                              {t("查看")}
                            </Button>
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
      <Suspense fallback={<Spin fullscreen />}>
        {expense && (
          <ExpenseDetail
            recordId={expense}
            onClose={() => setExpense(undefined)}
          />
        )}
        {commission && (
          <CommissionDetail
            recordId={commission}
            onClose={() => setCommission(undefined)}
          />
        )}
      </Suspense>
    </section>
  );
});
