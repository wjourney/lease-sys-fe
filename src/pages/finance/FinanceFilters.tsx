import { Button, DatePicker, Segmented, Select } from "antd";
import dayjs from "dayjs";
import { t } from "../../shared/i18n";
import { Choice, FinanceFilters as Filters } from "./finance-data";

export function FinanceFilters({
  value,
  onChange,
  period,
  onPeriod,
  projects,
  onReset,
}: {
  value: Filters;
  onChange: (next: Partial<Filters>) => void;
  period: string;
  onPeriod: (p: string) => void;
  projects: Choice[];
  onReset: () => void;
}) {
  return (
    <div className="finance-filters">
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
      <Select
        aria-label={t("币种")}
        value={value.currency}
        onChange={(currency) => onChange({ currency, accountId: undefined })}
        options={["HKD", "CNY", "USD"].map((v) => ({ value: v, label: v }))}
        style={{ width: 96 }}
      />
      <Select
        aria-label={t("项目")}
        placeholder={t("全部项目")}
        allowClear
        showSearch
        optionFilterProp="label"
        value={value.projectId}
        onChange={(projectId) => onChange({ projectId })}
        options={projects.map((p) => ({ value: p.id, label: p.name }))}
        style={{ width: 180 }}
      />
      <Button onClick={onReset}>{t("重置")}</Button>
    </div>
  );
}
