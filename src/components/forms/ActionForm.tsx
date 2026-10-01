import { RequestError as Alert } from "../feedback/RequestError";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { errorMessage, options, Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { Field } from "../../shared/resource-config";
export function ActionForm({
  title,
  fields,
  initial = {},
  onSubmit,
  onClose,
}: {
  title: string;
  fields: Field[];
  initial?: Row;
  onSubmit: (v: Row) => Promise<any>;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  useEffect(() => {
    const values = {
      ...initial,
    };
    for (const f of fields)
      if (f.type === "date")
        values[f.key] = values[f.key] ? dayjs(values[f.key]) : dayjs();
    form.setFieldsValue(values);
    if (fields.some((f) => f.source === "fund-accounts"))
      options("fund-accounts")
        .then((rows) =>
          setAccounts(
            rows
              .filter((r) => r.enabled)
              .map((r) => ({
                value: r.id,
                label: t(r.name),
              })),
          ),
        )
        .catch((e) => setError(errorMessage(e)));
  }, []);
  async function submit() {
    try {
      const values = await form.validateFields();
      for (const f of fields)
        if (f.type === "date" && values[f.key])
          values[f.key] = values[f.key].format("YYYY-MM-DD");
      setSaving(true);
      await onSubmit(values);
      onClose();
    } catch (e: any) {
      if (!e.errorFields) setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Drawer
      open
      title={t(title)}
      width={520}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2.5 p-[5px]">
          <Button onClick={onClose}>{t("取消")}</Button>
          <Button type="primary" loading={saving} onClick={submit}>
            {t("确认提交")}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        {error && (
          <Alert message={t(error)} type="error" showIcon className="mb-5" />
        )}
        {fields.map((f) => (
          <Form.Item
            key={f.key}
            name={f.key}
            label={t(f.label)}
            rules={[
              {
                required: f.required !== false,
                message: "请填写" + f.label,
              },
            ]}
          >
            {t(
              f.type === "date" ? (
                <DatePicker className="w-full" />
              ) : f.type === "money" ? (
                <InputNumber
                  stringMode
                  min="0"
                  precision={2}
                  className="w-full"
                />
              ) : f.source ? (
                <Select options={accounts} />
              ) : f.type === "select" ? (
                <Select options={f.options} />
              ) : f.type === "textarea" ? (
                <Input.TextArea rows={3} />
              ) : (
                <Input />
              ),
            )}
          </Form.Item>
        ))}
      </Form>
    </Drawer>
  );
}
