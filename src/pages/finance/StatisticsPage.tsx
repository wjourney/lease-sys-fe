import { RequestError } from "../../components/feedback/RequestError";
import { Alert, Button, Empty, Spin, Table, Tabs } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { ExpenseBreakdown, Trend } from "./FinanceCharts";
import { monthlyTotals } from "./statistics-summary";
import { FinanceFilters } from "./FinanceFilters";
import {
  FinanceFilters as Filters,
  formatMoney,
  periodDates,
  StatisticsData,
  useFinanceData,
} from "./finance-data";

export default observer(function StatisticsPage() {
  const root = useRoot();
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("month");
  const [filters, setFilters] = useState<Filters>({
    ...periodDates("month"),
    currency: "HKD",
  });
  const { data, error, loading, reload } = useFinanceData<StatisticsData>(
    "statistics",
    filters,
    root.epoch,
    root.finance,
  );
  const change = (value: Partial<Filters>) =>
    setFilters((v) => ({ ...v, ...value }));
  const money = (v: string | number) => formatMoney(v, filters.currency);
  if (!root.finance) return <Empty description={t("暂无此模块的访问权限")} />;
  const content = (
    <>
      <div className="finance-panel finance-overview">
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
            setFilters({ ...periodDates("month"), currency: "HKD" });
          }}
        />
      </div>
      {error ? (
        <RequestError
          type="error"
          showIcon
          message={error}
          action={<Button onClick={reload}>{t("重试")}</Button>}
        />
      ) : (
        <div className="finance-statistics-loading">
          <Spin spinning={loading}>
            {data && (
              <div className="finance-statistics-body">
                {tab === "overview" ? (
                  <>
                    <div className="finance-panel finance-overview">
                      <div className="finance-kpis finance-overview-kpis">
                        {[
                          {
                            label: "资金流入",
                            value: money(data.summary.incoming),
                          },
                          {
                            label: "资金流出",
                            value: money(data.summary.outgoing),
                          },
                          {
                            label: "净流入",
                            value: money(data.summary.net),
                            note: "含押金收退",
                          },
                          {
                            label: "新增订单",
                            value: data.summary.orderCount,
                            note: "按创建日期",
                          },
                        ].map((k) => (
                          <div key={k.label}>
                            <span className="finance-kpi-label">
                              {t(k.label)}
                            </span>
                            <strong>{k.value}</strong>
                            {k.note && <small>{t(k.note)}</small>}
                          </div>
                        ))}
                      </div>
                      <div className="finance-secondary-metrics">
                        {[
                          ["业务实收", data.summary.income, "不含押金"],
                          ["押金收取", data.summary.depositReceived],
                          ["押金退还", data.summary.depositRefunded],
                          ["应付佣金", data.summary.commissionDue],
                          ["实付佣金", data.summary.commissionPaid],
                          ...(Number(data.summary.corrections) !== 0
                            ? [["历史调整", data.summary.corrections]]
                            : []),
                        ].map(([label, value, note]) => (
                          <div key={label}>
                            <span>{t(label)}</span>
                            <strong>{money(value)}</strong>
                            {note && <small>{t(note)}</small>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {data.summary.unsetCommissionCount > 0 && (
                      <Alert
                        type="warning"
                        message={t(
                          `有 ${data.summary.unsetCommissionCount} 笔历史佣金未设置金额，未计入应付金额。`,
                        )}
                      />
                    )}
                    <div className="finance-charts">
                      <div className="finance-panel">
                        <div className="finance-chart-heading">
                          <h2>{t("收支趋势")}</h2>
                          <div className="finance-legend">
                            <span className="finance-legend-in">
                              {t("资金流入")}
                            </span>
                            <span className="finance-legend-out">
                              {t("资金流出")}
                            </span>
                          </div>
                        </div>
                        <Trend
                          data={data.trend}
                          money={money}
                          currency={filters.currency}
                        />
                      </div>
                      <div className="finance-panel finance-expenses-chart">
                        <h2>{t("支出去向")}</h2>
                        <ExpenseBreakdown
                          expenses={data.expenses}
                          money={money}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <MonthlyDetails data={data} money={money} />
                )}
                <div className="finance-table-note">
                  <span>
                    {t("金额单位")} {filters.currency}
                  </span>
                  <span>
                    {t("统计范围")}：{filters.from} {t("至")} {filters.to}
                  </span>
                </div>
              </div>
            )}
          </Spin>
        </div>
      )}
    </>
  );
  return (
    <section
      className={`finance-page finance-statistics ${tab === "monthly" ? "finance-statistics-monthly" : ""}`}
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        destroyOnHidden
        items={[
          {
            key: "overview",
            label: t("收支概览"),
            children: tab === "overview" ? content : null,
          },
          {
            key: "monthly",
            label: t("月度明细"),
            children: tab === "monthly" ? content : null,
          },
        ]}
        className="finance-tabs"
      />
    </section>
  );
});

function MonthlyDetails({
  data,
  money,
}: {
  data: StatisticsData;
  money: (value: number | string) => string;
}) {
  const columns = [
    { title: t("月份"), dataIndex: "month", width: 100 },
    {
      title: t("新增订单"),
      dataIndex: "orderCount",
      width: 100,
      align: "right" as const,
    },
    ...[
      ["incoming", "资金流入"],
      ["outgoing", "资金流出"],
      ...(data.trend.some((row) => Number(row.corrections) !== 0)
        ? [["corrections", "历史调整"]]
        : []),
      ["commissionPaid", "佣金实付"],
      ["net", "净流入"],
    ].map(([key, label]) => ({
      title: t(label),
      dataIndex: key,
      width: 175,
      align: "right" as const,
      render: money,
    })),
  ];
  return (
    <div className="finance-panel finance-monthly">
      <span className="finance-month-count">
        {t(`共 ${data.trend.length} 个月`)}
      </span>
      <div className="finance-monthly-scroll">
        <div className="finance-monthly-sheet">
          <Table
            rowKey="month"
            dataSource={data.trend}
            columns={columns}
            size="middle"
            pagination={false}
            tableLayout="fixed"
          />
          <Table
            className="finance-monthly-total"
            rowKey="month"
            dataSource={[{ ...monthlyTotals(data.trend), month: t("合计") }]}
            columns={columns}
            showHeader={false}
            pagination={false}
            size="middle"
            tableLayout="fixed"
          />
        </div>
      </div>
    </div>
  );
}
