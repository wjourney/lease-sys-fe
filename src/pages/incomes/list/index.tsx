import { DownloadBillInvoices } from "../DownloadBillInvoices";
import { OrderFilter } from "../../../components/filters/OrderFilter";
import { BillBatchActions } from "../BillBatchActions";
import { RequestError } from "../../../components/feedback/RequestError";
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
} from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RegisterReceipt } from "../../../components/receipts/RegisterReceipt";
import { dateText, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
import { formatMoney } from "../../finance/finance-data";
import { BillDrawer, BillStatus } from "../BillDrawer";
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
  const [selected, setSelected] = useState<React.Key[]>([]);
  useEffect(() => setSelected([]), [filters, root.epoch]);
  const [viewing, setViewing] = useState<string>();
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
          <OrderFilter
            value={filters.orderId}
            onChange={(orderId) => change({ orderId })}
          />
          <label>
            {t("类型")}
            <Select
              aria-label={t("账单类型")}
              allowClear
              placeholder={t("全部类型")}
              style={{ width: 125 }}
              value={filters.feeType}
              onChange={(feeType) => change({ feeType })}
              options={Object.entries(billTypes)
                .filter(([value]) => value !== "OTHER")
                .map(([value, label]) => ({
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
                { value: "", label: t("全部") },
                ...Object.entries(billStates).map(([value, label]) => ({
                  value,
                  label: t(label),
                })),
              ]}
            />
          </label>
          <Button
            onClick={() => {
              setKeyword("");
              setFilters({ currency: "HKD", page: 1 });
            }}
          >
            {t("重置")}
          </Button>
        </div>
        {!root.salesRole && (
          <BillBatchActions
            rows={
              loading
                ? []
                : (data?.items ?? []).filter((r) => selected.includes(r.id))
            }
          />
        )}
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
                <div className="list-results">
                  <div className="list-scroll-area">
                    <Table<Row>
                      rowKey="id"
                      rowSelection={
                        !root.salesRole
                          ? {
                              selectedRowKeys: selected,
                              onChange: setSelected,
                              preserveSelectedRowKeys: false,
                            }
                          : undefined
                      }
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
                          width: 290,
                          render: (_, r) => (
                            <Space wrap>
                              <Button
                                size="small"
                                onClick={() => setViewing(r.id)}
                              >
                                {t("查看")}
                              </Button>
                              {!loading && (
                                <RegisterReceipt
                                  bills={[r]}
                                  orderId={r.orderId}
                                  payerName={r.payerName}
                                />
                              )}
                              <DownloadBillInvoices
                                bill={r}
                                disabled={loading}
                              />
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
    </section>
  );
});
