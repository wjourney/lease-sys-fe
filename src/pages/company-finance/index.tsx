import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  Pagination,
  Segmented,
  Select,
  Spin,
  Table,
} from "antd";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { dateText, Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { formatMoney } from "../../shared/money-format";
import { Status } from "../../shared/ui";
import { useRoot } from "../../stores/root";
import { useBillRequest } from "../incomes/bill-data";

const modes: Row = {
  ONE_TIME: "一次性结付",
  RECURRING_MONTHLY: "按月结付",
  MONTHLY: "单月佣金",
  YEARLY: "年度佣金",
};
function range(period: string) {
  const now = dayjs();
  const from =
    period === "quarter"
      ? now.startOf("year").add(Math.floor(now.month() / 3) * 3, "month")
      : period === "half"
        ? now.subtract(5, "month").startOf("month")
        : period === "year"
          ? now.startOf("year")
          : now.startOf("month");
  const to =
    period === "quarter"
      ? from.add(2, "month").endOf("month")
      : period === "year"
        ? now.endOf("year")
        : now.endOf("month");
  return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
}
type Data = {
  items: Row[];
  total: number;
  employees: Row[];
  months: string[];
  summary: Row;
  trend: Row[];
  staff: Row[];
};

export default observer(function CompanyFinancePage({
  details = false,
}: {
  details?: boolean;
}) {
  const root = useRoot();
  const personal = root.user?.role === "SALES";
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const period =
    search.get("period") || (search.has("from") ? "custom" : "month");
  const [keyword, setKeyword] = useState(search.get("q") || "");
  const [viewing, setViewing] = useState<string | undefined>(
    search.get("commissionId") || undefined,
  );
  const defaults = range("month");
  const params = {
    from: search.get("from") || defaults.from,
    to: search.get("to") || defaults.to,
    currency: search.get("currency") || "HKD",
    salesUserId: personal
      ? root.user?.id
      : search.get("salesUserId") || undefined,
    q: search.get("q") || undefined,
    mode: search.get("mode") || undefined,
    status: search.get("status") || undefined,
    page: Number(search.get("page") || 1),
    pageSize: 12,
  };
  const { data, loading, error, reload } = useBillRequest<Data>(
    "/company-commissions",
    params,
    root.epoch,
  );
  const change = (values: Row) =>
    setSearch(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("page", "1");
        for (const [key, value] of Object.entries(values)) {
          if (value) next.set(key, String(value));
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((search.get("q") || "") !== keyword.trim())
        change({ q: keyword.trim() });
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]);
  useEffect(() => {
    setKeyword(search.get("q") || "");
  }, [search.get("q")]);
  const money = (v: any) =>
    v == null ? t("待填写") : formatMoney(v, params.currency);
  const drill = (salesUserId: string, month?: string) => {
    const next = new URLSearchParams({
      from: month ? `${month}-01` : params.from,
      to: month
        ? dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD")
        : params.to,
      currency: params.currency,
      salesUserId,
    });
    if (month) {
      next.set(
        "from",
        next.get("from")! < params.from ? params.from : next.get("from")!,
      );
      next.set("to", next.get("to")! > params.to ? params.to : next.get("to")!);
    }
    navigate(`/company-commissions?${next}`);
  };
  return (
    <section className="finance-page resource-list">
      <div className="finance-heading">
        <h1>{t(details ? "佣金明细" : "财务统计")}</h1>
        <span>
          {t(
            personal
              ? "仅本人 · 按约定结付日期统计，作废佣金不计入汇总"
              : "仅本公司 · 按约定结付日期统计，作废佣金不计入汇总",
          )}
        </span>
      </div>
      <div className="finance-panel finance-filters">
        <Segmented
          value={period}
          options={[
            { label: t("本月"), value: "month" },
            { label: t("本季度"), value: "quarter" },
            { label: t("近半年"), value: "half" },
            { label: t("本年"), value: "year" },
            { label: t("自定义"), value: "custom" },
          ]}
          onChange={(v) => {
            change({
              ...(v !== "custom" ? range(String(v)) : {}),
              period: String(v),
            });
          }}
        />
        <DatePicker.RangePicker
          allowClear={false}
          value={[dayjs(params.from), dayjs(params.to)]}
          onChange={(v) => {
            if (v?.[0] && v[1]) {
              change({
                period: "custom",
                from: v[0].format("YYYY-MM-DD"),
                to: v[1].format("YYYY-MM-DD"),
              });
            }
          }}
        />
        {!personal && (
          <Select
            aria-label={t("销售员工")}
            placeholder={t("全部员工")}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 160 }}
            value={params.salesUserId}
            options={data?.employees.map((e) => ({
              value: e.id,
              label: e.name,
            }))}
            onChange={(salesUserId) => change({ salesUserId })}
          />
        )}
        <Select
          aria-label={t("币种")}
          style={{ width: 100 }}
          value={params.currency}
          options={["HKD", "CNY", "USD"].map((value) => ({
            value,
            label: value,
          }))}
          onChange={(currency) => change({ currency })}
        />
        {details && (
          <>
            <Input
              aria-label={t("佣金关键词")}
              style={{ width: 220 }}
              allowClear
              value={keyword}
              placeholder={t(
                personal ? "佣金编号、订单编号" : "佣金编号、订单编号、员工",
              )}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              aria-label={t("结付方式")}
              placeholder={t("全部方式")}
              allowClear
              style={{ width: 140 }}
              value={params.mode}
              options={Object.entries(modes).map(([value, label]) => ({
                value,
                label: t(label),
              }))}
              onChange={(mode) => change({ mode })}
            />
            <Select
              aria-label={t("佣金状态")}
              style={{ width: 150 }}
              value={params.status || ""}
              onChange={(status) => change({ status })}
              options={[
                ["", "有效佣金"],
                ["OPEN", "待付款"],
                ["PARTIAL", "部分付款"],
                ["PAID", "已付清"],
                ["UNSET", "待填写"],
                ["VOID", "已作废"],
                ["ALL", "全部（含作废）"],
              ].map(([value, label]) => ({ value, label: t(label) }))}
            />
          </>
        )}
        <Button
          onClick={() => {
            setKeyword("");
            setSearch({});
          }}
        >
          {t("重置")}
        </Button>
      </div>
      {error ? (
        <Alert
          type="error"
          message={error}
          action={<Button onClick={reload}>{t("重试")}</Button>}
        />
      ) : (
        <Spin spinning={loading}>
          {data && (
            <>
              <div className="finance-kpis" style={{ marginBottom: 16 }}>
                {[
                  [
                    personal ? "应得佣金" : "应付佣金",
                    money(data.summary.amount),
                  ],
                  [
                    personal ? "已结佣金" : "已付佣金",
                    money(data.summary.paidAmount),
                  ],
                  [
                    personal ? "待结佣金" : "未付佣金",
                    money(data.summary.remainingAmount),
                  ],
                  ["关联订单", data.summary.orderCount],
                ].map(([label, value]) => (
                  <div className="finance-panel" key={label}>
                    <span className="finance-kpi-label">{t(label)}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              {!!data.summary.unsetCount && (
                <Alert
                  type="warning"
                  message={t(
                    `有 ${data.summary.unsetCount} 笔历史佣金未填写金额，未计入金额汇总。`,
                  )}
                />
              )}
              {details ? (
                <div className="finance-panel list-surface">
                  <div className="list-results">
                    <div className="list-scroll-area">
                      <Table<Row>
                        rowKey="id"
                        size="small"
                        dataSource={data.items}
                        pagination={false}
                        scroll={{ x: 1700 }}
                        columns={[
                          {
                            title: t("佣金编号"),
                            dataIndex: "commissionNo",
                            width: 190,
                          },
                          {
                            title: t("关联订单"),
                            dataIndex: "orderNo",
                            width: 190,
                            render: (v, r) => (
                              <Link to={`/orders/${r.orderId}`}>{v}</Link>
                            ),
                          },
                          {
                            title: t("项目 / 单位"),
                            render: (_, r) =>
                              `${r.projectName || "—"} · ${r.unitNo || "—"}`,
                            width: 220,
                          },
                          { title: t("销售员工"), dataIndex: "salesName" },
                          {
                            title: t("结付方式"),
                            dataIndex: "mode",
                            render: (v) => t(modes[v] || v),
                          },
                          {
                            title: t("账期"),
                            render: (_, r) =>
                              `${dateText(r.periodStart)} ~ ${dateText(r.periodEnd)}`,
                            width: 205,
                          },
                          {
                            title: t("结付日期"),
                            dataIndex: "dueOn",
                            width: 105,
                          },
                          ...[
                            ["应付", "amount"],
                            ["已付", "paidAmount"],
                            ["未付", "remainingAmount"],
                          ].map(([label, key]) => ({
                            title: t(label),
                            dataIndex: key,
                            render: money,
                            width: 130,
                          })),
                          {
                            title: t("状态"),
                            dataIndex: "status",
                            render: (v) => (
                              <Status resource="commissions" value={v} />
                            ),
                          },
                          {
                            title: t("操作"),
                            fixed: "right",
                            width: 80,
                            render: (_, r) => (
                              <Button
                                size="small"
                                onClick={() => setViewing(r.id)}
                              >
                                {t("查看")}
                              </Button>
                            ),
                          },
                        ]}
                      />
                    </div>
                    <div className="list-pagination">
                      <Pagination
                        current={params.page}
                        pageSize={12}
                        total={data.total}
                        showSizeChanger={false}
                        showTotal={(n) => t(`共 ${n} 条`)}
                        onChange={(page) => change({ page })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="finance-panel">
                    <h2>{t(personal ? "月度应得佣金" : "月度应付佣金")}</h2>
                    <div className="finance-breakdown">
                      {data.trend.map((r) => (
                        <div key={r.month}>
                          <div>
                            <span>{r.month}</span>
                            <strong>{money(r.amount)}</strong>
                          </div>
                          <div className="finance-bar-track">
                            <div
                              style={{
                                width: `${(Number(r.amount) / Math.max(1, ...data.trend.map((v) => Number(v.amount)))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {personal ? (
                    <div className="finance-panel">
                      <h2>{t("我的月度佣金")}</h2>
                      <Table<Row>
                        rowKey="month"
                        dataSource={data.trend}
                        size="small"
                        pagination={{ pageSize: 12, showSizeChanger: false }}
                        scroll={{ x: 700 }}
                        columns={[
                          { title: t("月份"), dataIndex: "month" },
                          { title: t("关联订单"), dataIndex: "orderCount" },
                          ...[
                            ["应得佣金", "amount"],
                            ["已结佣金", "paidAmount"],
                            ["待结佣金", "remainingAmount"],
                          ].map(([label, key]) => ({
                            title: t(label),
                            dataIndex: key,
                            render: money,
                          })),
                          {
                            title: t("操作"),
                            render: (_, r) => (
                              <Button
                                type="link"
                                onClick={() => drill(root.user!.id, r.month)}
                              >
                                {t("查看明细")}
                              </Button>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="finance-panel">
                        <h2>{t("员工佣金统计")}</h2>
                        <Table<Row>
                          rowKey="id"
                          dataSource={data.staff}
                          size="small"
                          pagination={{ pageSize: 12, showSizeChanger: false }}
                          scroll={{ x: 750 }}
                          columns={[
                            { title: t("员工"), dataIndex: "name" },
                            { title: t("关联订单"), dataIndex: "orderCount" },
                            ...[
                              ["应付佣金", "amount"],
                              ["已付佣金", "paidAmount"],
                              ["未付佣金", "remainingAmount"],
                            ].map(([label, key]) => ({
                              title: t(label),
                              dataIndex: key,
                              render: money,
                            })),
                            {
                              title: t("操作"),
                              render: (_, r) => (
                                <Button type="link" onClick={() => drill(r.id)}>
                                  {t("查看明细")}
                                </Button>
                              ),
                            },
                          ]}
                        />
                      </div>
                      <div className="finance-panel">
                        <h2>{t("员工每月应付佣金")}</h2>
                        <Table<Row>
                          rowKey="id"
                          size="small"
                          dataSource={data.staff}
                          pagination={{ pageSize: 12, showSizeChanger: false }}
                          scroll={{
                            x: Math.max(600, 150 + data.months.length * 150),
                          }}
                          columns={[
                            {
                              title: t("员工"),
                              dataIndex: "name",
                              fixed: "left",
                              width: 150,
                            },
                            ...data.months.map((month) => ({
                              title: month,
                              key: month,
                              width: 150,
                              render: (_: any, r: Row) => (
                                <Button
                                  type="link"
                                  onClick={() => drill(r.id, month)}
                                >
                                  {money(r.months[month])}
                                </Button>
                              ),
                            })),
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </Spin>
      )}
      {viewing && (
        <CommissionDrawer
          key={viewing}
          id={viewing}
          onClose={() => setViewing(undefined)}
        />
      )}
    </section>
  );
});

function CommissionDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const root = useRoot();
  const {
    data: r,
    error,
    loading,
  } = useBillRequest<Row>(`/company-commissions/${id}`, {}, root.epoch);
  return (
    <Drawer open title={t("佣金详情")} width={760} onClose={onClose}>
      {error ? (
        <Alert type="error" message={error} />
      ) : (
        <Spin spinning={loading}>
          {r && (
            <>
              <Descriptions
                column={2}
                items={[
                  { key: "no", label: t("佣金编号"), children: r.commissionNo },
                  {
                    key: "state",
                    label: t("状态"),
                    children: (
                      <Status resource="commissions" value={r.status} />
                    ),
                  },
                  {
                    key: "order",
                    label: t("订单"),
                    children: (
                      <Link to={`/orders/${r.orderId}`}>{r.orderNo}</Link>
                    ),
                  },
                  { key: "sales", label: t("员工"), children: r.salesName },
                  {
                    key: "unit",
                    label: t("项目 / 单位"),
                    children: `${r.projectName || "—"} · ${r.unitNo || "—"}`,
                    span: 2,
                  },
                  {
                    key: "mode",
                    label: t("结付方式"),
                    children: t(modes[r.mode] || r.mode),
                  },
                  {
                    key: "due",
                    label: t("结付日期"),
                    children: dateText(r.dueOn),
                  },
                  {
                    key: "period",
                    label: t("账期"),
                    children: `${dateText(r.periodStart)} ~ ${dateText(r.periodEnd)}`,
                    span: 2,
                  },
                  ...[
                    ["应付", "amount"],
                    ["已付", "paidAmount"],
                    ["未付", "remainingAmount"],
                  ].map(([label, key]) => ({
                    key,
                    label: t(label),
                    children:
                      r[key] == null ? "—" : formatMoney(r[key], r.currency),
                  })),
                  {
                    key: "remark",
                    label: t("备注"),
                    children: r.remark || "—",
                    span: 2,
                  },
                ]}
              />
              <h3 style={{ marginTop: 24, marginBottom: 12 }}>
                {t("付款记录")}
              </h3>
              <Table
                rowKey="expenseNo"
                size="small"
                pagination={false}
                dataSource={r.payments}
                columns={[
                  { title: t("付款编号"), dataIndex: "expenseNo" },
                  {
                    title: t("付款日期"),
                    dataIndex: "paidOn",
                    render: dateText,
                  },
                  {
                    title: t("已付金额"),
                    dataIndex: "paidAmount",
                    render: (v) => formatMoney(v, r.currency),
                  },
                ]}
              />
            </>
          )}
        </Spin>
      )}
    </Drawer>
  );
}
