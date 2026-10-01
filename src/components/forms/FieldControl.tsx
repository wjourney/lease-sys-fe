import { DatePicker, Input, InputNumber, Select, Switch } from "antd";
import { t } from "../../shared/i18n";
import { Field } from "../../shared/resource-config";
export function renderFieldControl(
  f: Field,
  lookups: Record<
    string,
    {
      label: string;
      value: string;
    }[]
  >,
) {
  switch (f.type) {
    case "textarea":
      return <Input.TextArea rows={3} placeholder={t("请输入" + f.label)} />;
    case "json":
      return (
        <Input.TextArea
          rows={4}
          placeholder={t('[{"code":"example","name":"示例","enabled":true}]')}
        />
      );
    case "select":
      return (
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          options={f.source ? (lookups[f.source] ?? []) : f.options}
          placeholder={t("请选择" + f.label)}
        />
      );
    case "date":
      return <DatePicker className="w-full" />;
    case "money":
      return (
        <InputNumber
          stringMode
          precision={2}
          min="0"
          className="w-full"
          placeholder="0.00"
        />
      );
    case "number":
      return <InputNumber min={0} precision={0} className="w-full" />;
    case "switch":
      return <Switch />;
    case "password":
      return <Input.Password autoComplete="new-password" />;
    default:
      return <Input placeholder={t("请输入" + f.label)} />;
  }
}
