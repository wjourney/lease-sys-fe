import {
  DollarOutlined,
  FileTextOutlined,
  FundOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Spin, Table } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { feeLabels } from "../../shared/config";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
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
  return (
    <section className="finance-page">
      <div className="finance-heading">
        <h1>{t("财务统计")}</h1>
        <span>
          {t(
            "按实际收付日期统计；各币种独立计算，净流入不代表利润或银行余额。",
          )}
        </span>
      </div>
      <div className="finance-panel">
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
              <div className="finance-kpis">
                {[
                  {
                    label: "新增订单",
                    value: data.summary.orderCount,
                    note: "按创建日期 · 含已关闭订单，不区分币种",
                    icon: <FileTextOutlined />,
                  },
                  {
                    label: "实收收入",
                    value: money(data.summary.income),
                    note: "租金及其他收入 · 扣除冲正，不含押金",
                    icon: <DollarOutlined />,
                  },
                  {
                    label: "应付佣金",
                    value: money(data.summary.commissionDue),
                    note: `期内到期 ${data.summary.commissionCount} 笔 · 实付 ${money(data.summary.commissionPaid)}`,
                    icon: <TeamOutlined />,
                  },
                  {
                    label: "净流入",
                    value: money(data.summary.net),
                    note: "含押金流入流出 · 扣除收款冲正",
                    icon: <FundOutlined />,
                  },
                ].map((k) => (
                  <div className="finance-panel" key={k.label}>
                    <span className="finance-kpi-label">
                      {k.icon} {t(k.label)}
                    </span>
                    <strong>{k.value}</strong>
                    <small>{t(k.note)}</small>
                  </div>
                ))}
              </div>
              {data.summary.unsetCommissionCount > 0 && (
                <Alert
                  type="warning"
                  message={t(
                    `有 ${data.summary.unsetCommissionCount} 笔历史佣金未设置金额，未计入应付金额。`,
                  )}
                />
              )}
              <div className="finance-panel finance-summary">
                {[
                  ["确认流入", data.summary.incoming],
                  ["实际流出", data.summary.outgoing],
                  ["押金实收", data.summary.depositReceived],
                  ["押金已退", data.summary.depositRefunded],
                  ["冲正扣减", data.summary.corrections],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{t(label)}</span>
                    <strong>{money(value)}</strong>
                  </div>
                ))}
              </div>
              <div className="finance-charts">
                <div className="finance-panel">
                  <h2>{t("收支趋势")}</h2>
                  <p className="finance-muted">
                    {t("蓝色为确认流入，橙色为实际流出；冲正单列在下方明细。")}
                  </p>
                  <Trend data={data.trend} money={money} />
                </div>
                <div className="finance-panel">
                  <h2>{t("支出去向")}</h2>
                  {!data.expenses.length ? (
                    <Empty description={t("此期间暂无实际支出")} />
                  ) : (
                    <div className="finance-breakdown">
                      {data.expenses.map((e) => {
                        const max = Math.max(
                          ...data.expenses.map((v) => Number(v.amount)),
                          1,
                        );
                        return (
                          <div key={e.feeType}>
                            <div>
                              <span>
                                {t(feeLabels[e.feeType] || e.feeType)}
                              </span>
                              <strong>{money(e.amount)}</strong>
                            </div>
                            <div className="finance-bar-track">
                              <div
                                style={{
                                  width: `${(Number(e.amount) / max) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="finance-panel">
                <h2>{t("月度明细")}</h2>
                <Table
                  rowKey="month"
                  dataSource={data.trend}
                  size="small"
                  pagination={false}
                  scroll={{ x: 800 }}
                  columns={[
                    { title: t("月份"), dataIndex: "month" },
                    { title: t("新增订单"), dataIndex: "orderCount" },
                    ...[
                      ["incoming", "确认流入"],
                      ["outgoing", "实际流出"],
                      ["corrections", "冲正扣减"],
                      ["commissionPaid", "佣金实付"],
                      ["net", "净流入"],
                    ].map(([key, label]) => ({
                      title: t(label),
                      dataIndex: key,
                      render: money,
                    })),
                  ]}
                />
              </div>
            </>
          )}
        </Spin>
      )}
    </section>
  );
});

function Trend({
  data,
  money,
}: {
  data: StatisticsData["trend"];
  money: (v: string | number) => string;
}) {
  if (!data.some((v) => Number(v.incoming) || Number(v.outgoing)))
    return <Empty description={t("此期间暂无确认收付款")} />;
  const max = Math.max(
    ...data.flatMap((v) => [Number(v.incoming), Number(v.outgoing)]),
    1,
  );
  const width = Math.max(580, data.length * 70),
    step = (width - 40) / data.length;
  return (
    <div className="finance-trend">
      <svg
        role="img"
        aria-label={t("月度收支柱状图，完整金额见月度明细")}
        viewBox={`0 0 ${width} 240`}
        style={{ minWidth: width }}
      >
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={20}
            x2={width - 10}
            y1={20 + i * 60}
            y2={20 + i * 60}
            stroke="#edf0f4"
          />
        ))}
        {data.map((m, i) => (
          <g key={m.month}>
            {[
              { val: m.incoming, color: "#486b99" },
              { val: m.outgoing, color: "#d49860" },
            ].map((b, j) => (
              <rect
                key={j}
                x={20 + i * step + step / 2 - 18 + j * 20}
                y={200 - (Number(b.val) / max) * 170}
                width={16}
                height={(Number(b.val) / max) * 170}
                fill={b.color}
                rx={2}
              >
                <title>
                  {m.month} {t(j ? "实际流出" : "确认流入")} {money(b.val)}
                </title>
              </rect>
            ))}
            <text
              x={20 + i * step + step / 2}
              y={225}
              textAnchor="middle"
              fontSize={12}
              fill="#708097"
            >
              {m.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
