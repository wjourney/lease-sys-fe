import { Empty } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { feeLabels } from "../../shared/config";
import { t } from "../../shared/i18n";
import type { StatisticsData } from "./finance-data";
import { expenseBreakdown } from "./statistics-summary";

const colors: Record<string, string> = {
  COMMISSION: "#597aa7",
  DEPOSIT_REFUND: "#d69d67",
  OTHER: "#81a897",
  MAINTENANCE: "#9b89b7",
  UTILITIES: "#789fab",
};
const chartNumber = (value: string | number) =>
  Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

export function ExpenseBreakdown({
  expenses,
  money,
}: {
  expenses: StatisticsData["expenses"];
  money: (value: number | string) => string;
}) {
  const { items, total } = expenseBreakdown(expenses);
  if (!items.length) return <Empty description={t("此期间暂无实际支出")} />;
  const entries = items.map((item, index) => ({
    ...item,
    name: t(feeLabels[item.feeType] || item.feeType),
    fill:
      colors[item.feeType] ||
      ["#81a897", "#9b89b7", "#789fab", "#b79a76"][index % 4],
  }));
  return (
    <div className="finance-expense-distribution">
      <div
        className="finance-donut"
        role="img"
        aria-label={t(`支出去向环形图，总支出 ${money(total)}`)}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart accessibilityLayer>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={entries.length > 1 ? 2 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            />
            <Tooltip
              formatter={(value, name) => [
                `${money(Number(value))} · ${((Number(value) / total) * 100).toFixed(1).replace(/\.0$/, "")}%`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="finance-donut-total">
          <span>{t("总支出")}</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <ul className="finance-expense-legend">
        {entries.map((item) => (
          <li key={item.feeType}>
            <span className="finance-expense-name">
              <i style={{ backgroundColor: item.fill }} />
              {item.name}
            </span>
            <strong>{money(item.value)}</strong>
            <span>{item.percentage.toFixed(1).replace(/\.0$/, "")}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Trend({
  data,
  money,
  currency,
}: {
  data: StatisticsData["trend"];
  money: (value: number | string) => string;
  currency: string;
}) {
  if (!data.some((item) => Number(item.incoming) || Number(item.outgoing)))
    return <Empty description={t("此期间暂无确认收付款")} />;
  const entries = data.map((item) => ({
    month: item.month,
    incoming: Number(item.incoming),
    outgoing: Number(item.outgoing),
  }));
  return (
    <div className="finance-trend">
      <span className="finance-chart-unit">
        {t("金额")}（{currency}）
      </span>
      <div
        className="finance-trend-canvas"
        style={{ minWidth: Math.max(440, data.length * 100) }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={entries}
            margin={{ top: 22, right: 16, left: 8, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="#edf0f4" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#78869a", fontSize: 12 }}
            />
            <YAxis
              width={55}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#78869a", fontSize: 12 }}
              tickFormatter={chartNumber}
            />
            <Tooltip
              formatter={(value, name) => [money(Number(value)), String(name)]}
              cursor={{ fill: "#f5f7fa" }}
            />
            <Bar
              dataKey="incoming"
              name={t("资金流入")}
              fill="#597aa7"
              maxBarSize={40}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="incoming"
                position="top"
                fontSize={12}
                fill="#41526b"
                formatter={(value) => chartNumber(String(value))}
              />
            </Bar>
            <Bar
              dataKey="outgoing"
              name={t("资金流出")}
              fill="#d69d67"
              maxBarSize={40}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="outgoing"
                position="top"
                fontSize={12}
                fill="#41526b"
                formatter={(value) => chartNumber(String(value))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
