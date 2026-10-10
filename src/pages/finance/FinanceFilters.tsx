import { Button, DatePicker, Segmented } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { t } from "../../shared/i18n";
import { OrderFilter } from "../../components/filters/OrderFilter";
import { FinanceFilters as Filters } from "./finance-data";

export function FinanceFilters({
  value,
  onChange,
  period,
  onPeriod,
  onReset,
  children,
}: {
  value: Filters;
  onChange: (next: Partial<Filters>) => void;
  period: string;
  onPeriod: (p: string) => void;
  onReset: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="finance-filter-panel">
      <div className="finance-filters finance-filter-period">
        <div className="finance-filter-field">
          <span>{t("时间")}</span>
          <Segmented
            aria-label={t("统计时间范围")}
            value={period}
            onChange={(p) => onPeriod(String(p))}
            options={[
              { label: t("本月"), value: "month" },
              { label: t("本季度"), value: "quarter" },
              { label: t("近半年"), value: "half" },
              { label: t("自定义"), value: "custom" },
            ]}
          />
        </div>
        <DatePicker.RangePicker
          aria-label={t("日期范围")}
          allowClear={false}
          value={[dayjs(value.from), dayjs(value.to)]}
          onChange={(dates) => {
            if (dates?.[0] && dates[1]) {
              onPeriod("custom");
              onChange({
                from: dates[0].format("YYYY-MM-DD"),
                to: dates[1].format("YYYY-MM-DD"),
              });
            }
          }}
        />
        <OrderFilter
          value={value.orderId}
          onChange={(orderId) => onChange({ orderId })}
        />
        {!children && (
          <Button className="finance-filter-reset" onClick={onReset}>
            {t("重置")}
          </Button>
        )}
      </div>
      {children && (
        <div className="finance-filters finance-filter-fields">
          {children}
          <Button className="finance-filter-reset" onClick={onReset}>
            {t("重置")}
          </Button>
        </div>
      )}
    </div>
  );
}
