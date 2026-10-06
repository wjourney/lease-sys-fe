import { SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
} from "antd";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RegisterReceipt } from "../../../components/receipts/RegisterReceipt";
import { dateText, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
import { formatMoney } from "../../finance/finance-data";
import { BillDrawer, BillStatus } from "../BillDrawer";
import { ReceiptReviewDrawer } from "../ReceiptReviewDrawer";
import {
  BillFilters,
  BillPage,
  billStates,
  billTypes,
  useBillRequest,
} from "../bill-data";

export default observer(function IncomeListPage() {
  const root = useRoot();
  const [filters, setFilters] = useState<BillFilters>({
    currency: "HKD",
    page: 1,
  });
  const [keyword, setKeyword] = useState("");
  const [viewing, setViewing] = useState<string>();
  const [reviewing, setReviewing] = useState(false);
  const { data, loading, error, reload } = useBillRequest<BillPage>(
    "/incomes/bills",
    filters,
    root.epoch,
  );
  const change = (value: Partial<BillFilters>) =>
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
  }, [data, loading, filters.page]);
  const money = (v: string) => formatMoney(v, filters.currency);
  if (!root.canRead("incomes"))
    return <Empty description={t("暂无此模块的访问权限")} />;
  return (
    <section className="finance-page resource-list bills-page">
      <div className="finance-heading bill-heading">
        <div>
          <h1>{t("账单管理")}</h1>
          <span>{t("所有订单的已生成账单，未结清优先展示。")}</span>
        </div>
        {root.finance && (
          <Button onClick={() => setReviewing(true)}>
            {t("待核对收款")}（{data?.pendingCount ?? "—"}）
          </Button>
        )}
      </div>
      <div className="finance-panel list-surface">
        <div className="finance-filters bill-filters">
          <label>
            {t("关键词")}
            <Input
              aria-label={t("账单关键词")}
              value={keyword}
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t("账单编号、订单编号、租客")}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => change({ q: keyword.trim() || undefined })}
              style={{ width: 260 }}
            />
          </label>
          <label>
            {t("项目")}
            <Select
              aria-label={t("项目")}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t("全部项目")}
              style={{ width: 160 }}
              value={filters.projectId}
              onChange={(projectId) => change({ projectId, unitId: undefined })}
              options={data?.projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </label>
          <label>
            {t("单位")}
            <Select
              aria-label={t("单位")}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t("全部单位")}
              style={{ width: 180 }}
              value={filters.unitId}
              onChange={(unitId) => change({ unitId })}
              options={data?.units
                .filter(
                  (u) =>
                    !filters.projectId || u.projectId === filters.projectId,
                )
                .map((u) => ({ value: u.id, label: u.unitNo }))}
            />
          </label>
          <label>
            {t("类型")}
            <Select
              aria-label={t("账单类型")}
              allowClear
              placeholder={t("全部类型")}
              style={{ width: 125 }}
              value={filters.feeType}
              onChange={(feeType) => change({ feeType })}
              options={Object.entries(billTypes).map(([value, label]) => ({
                value,
                label: t(label),
              }))}
            />
          </label>
          <label>
            {t("状态")}
            <Select
              aria-label={t("账单状态")}
              style={{ width: 145 }}
              value={filters.status || ""}
              onChange={(status) => change({ status: status || undefined })}
              options={[
                { value: "", label: t("有效账单") },
                { value: "ALL", label: t("全部（含作废）") },
                ...Object.entries(billStates).map(([value, label]) => ({
                  value,
                  label: t(label),
                })),
              ]}
            />
          </label>
          <label>
            {t("币种")}
            <Select
              aria-label={t("币种")}
              value={filters.currency}
              style={{ width: 100 }}
              onChange={(currency) => change({ currency })}
              options={["HKD", "CNY", "USD"].map((v) => ({
                value: v,
                label: v,
              }))}
            />
          </label>
          <label>
            {t("到期日期")}
            <DatePicker.RangePicker
              aria-label={t("到期日期范围")}
              value={
                filters.from && filters.to
                  ? [dayjs(filters.from), dayjs(filters.to)]
                  : null
              }
              onChange={(v) =>
                change({
                  from: v?.[0]?.format("YYYY-MM-DD"),
                  to: v?.[1]?.format("YYYY-MM-DD"),
                })
              }
            />
          </label>
          <Checkbox
            checked={filters.overdue === "true"}
            onChange={(e) =>
              change({ overdue: e.target.checked ? "true" : undefined })
            }
          >
            {t("仅看逾期")}
          </Checkbox>
          <Checkbox
            checked={filters.pending === "true"}
            onChange={(e) =>
              change({ pending: e.target.checked ? "true" : undefined })
            }
          >
            {t("有待核对收款")}
          </Checkbox>
          <Button
            onClick={() => {
              setKeyword("");
              setFilters({ currency: "HKD", page: 1 });
            }}
          >
            {t("重置")}
          </Button>
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
                <div
                  className="bill-summary"
                  aria-label={t("筛选结果金额汇总")}
                >
                  <div className="bill-summary-caption">
                    {t("当前筛选汇总 · 不含作废")}
                  </div>
                  {(
                    [
                      ["租金及其他费用", data.summary.rental],
                      ["押金", data.summary.deposit],
                    ] as const
                  ).map(([label, group]) => (
                    <div className="bill-summary-row" key={label}>
                      <strong>{t(label)}</strong>
                      {[
                        ["应收", "total"],
                        ["已确认收款", "confirmed"],
                        ["押金抵扣", "offset"],
                        ["剩余应收", "remaining"],
                      ].map(([name, key]) => (
                        <div key={key}>
                          <span>{t(name)}</span>
                          <b>{money(group[key as keyof typeof group])}</b>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="list-results">
                  <div className="list-scroll-area">
                    <Table<Row>
                      rowKey="id"
                      size="middle"
                      dataSource={data.items}
                      pagination={false}
                      scroll={{ x: 1960 }}
                      columns={[
                        {
                          title: t("账单编号"),
                          dataIndex: "recordNo",
                          width: 200,
                          render: (v, r) => (
                            <Button
                              type="link"
                              className="!p-0"
                              onClick={() => setViewing(r.id)}
                            >
                              {v}
                            </Button>
                          ),
                        },
                        {
                          title: t("订单 / 项目 / 单位"),
                          width: 245,
                          render: (_, r) => (
                            <>
                              <Link to={`/orders/${r.orderId}`}>
                                {r.orderNo}
                              </Link>
                              <div className="text-[#738198]">
                                {r.projectName} · {r.unitNo}
                              </div>
                            </>
                          ),
                        },
                        {
                          title: t("租客"),
                          dataIndex: "payerName",
                          width: 120,
                        },
                        {
                          title: t("类型 / 账期"),
                          width: 215,
                          render: (_, r) => (
                            <>
                              {t(billTypes[r.feeType] || r.feeType)}
                              {r.periodStart && (
                                <div className="text-[#738198]">
                                  {dateText(r.periodStart)} ~{" "}
                                  {dateText(r.periodEnd)}
                                </div>
                              )}
                            </>
                          ),
                        },
                        ...[
                          ["应收", "total"],
                          ["已确认收款", "confirmed"],
                          ["待核对", "pending"],
                          ["押金抵扣", "offset"],
                          ["剩余应收", "remaining"],
                        ].map(([title, key]) => ({
                          title: t(title),
                          dataIndex: key,
                          width: 138,
                          render: money,
                        })),
                        {
                          title: t("到期日期"),
                          dataIndex: "dueOn",
                          width: 120,
                          render: dateText,
                        },
                        {
                          title: t("状态"),
                          width: 180,
                          render: (_, r) => <BillStatus row={r} />,
                        },
                        {
                          title: t("操作"),
                          fixed: "right",
                          width: 190,
                          render: (_, r) => (
                            <Space wrap>
                              <Button
                                size="small"
                                onClick={() => setViewing(r.id)}
                              >
                                {t("查看")}
                              </Button>
                              {!loading && r.canRegister && (
                                <RegisterReceipt
                                  bills={[r]}
                                  orderId={r.orderId}
                                  payerName={r.payerName}
                                />
                              )}
                              {root.finance && Number(r.pending) > 0 && (
                                <Button
                                  size="small"
                                  onClick={() => setViewing(r.id)}
                                >
                                  {t("核对收款")}
                                </Button>
                              )}
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>
                  <div className="list-pagination flex justify-end">
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
      {viewing && (
        <BillDrawer
          key={viewing}
          id={viewing}
          onClose={() => setViewing(undefined)}
        />
      )}
      {reviewing && (
        <ReceiptReviewDrawer
          currency={filters.currency}
          onClose={() => setReviewing(false)}
        />
      )}
    </section>
  );
});
