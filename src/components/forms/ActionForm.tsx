import { RequestError as Alert } from "../feedback/RequestError";
import { UploadOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { errorMessage, options, Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { Field } from "../../shared/resource-config";
import { useRoot } from "../../stores/root";
export function ActionForm({
  title,
  fields,
  initial = {},
  onSubmit,
  onClose,
  voucher = false,
}: {
  title: string;
  fields: Field[];
  initial?: Row;
  onSubmit: (v: Row, file?: File) => Promise<any>;
  onClose: () => void;
  voucher?: boolean;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File>();
  const hasFundAccountField = fields.some((f) => f.source === "fund-accounts");
  const navigate = useNavigate();
  const root = useRoot();
  useEffect(() => {
    const values = {
      ...initial,
    };
    for (const f of fields)
      if (f.type === "date")
        values[f.key] = values[f.key] ? dayjs(values[f.key]) : dayjs();
    form.setFieldsValue(values);
    if (hasFundAccountField)
      options("fund-accounts")
        .then((rows) => {
          const usable = rows.filter(
            (r) =>
              r.enabled && r.bankName?.trim() && r.accountIdentifier?.trim(),
          );
          if (usable.length === 1)
            for (const field of fields.filter(
              (f) => f.source === "fund-accounts",
            ))
              if (!form.getFieldValue(field.key))
                form.setFieldValue(field.key, usable[0].id);
          setAccounts(usable.map((r) => ({ value: r.id, label: t(r.name) })));
          setAccountsLoaded(true);
        })
        .catch((e) => setError(errorMessage(e)));
  }, []);
  async function submit() {
    try {
      const values = await form.validateFields();
      for (const f of fields)
        if (f.type === "date" && values[f.key])
          values[f.key] = values[f.key].format("YYYY-MM-DD");
      setSaving(true);
      await onSubmit(values, voucherFile);
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
        {hasFundAccountField && accountsLoaded && accounts.length === 0 && (
          <Alert
            type="warning"
            showIcon
            className="mb-5"
            message={t(
              "暂无资料完整的可用平台账户，请先填写银行资料并启用账户。",
            )}
            action={
              root.canWrite("fund-accounts") ? (
                <Button
                  size="small"
                  onClick={() => {
                    onClose();
                    navigate("/fund-accounts");
                  }}
                >
                  {t("管理平台账户")}
                </Button>
              ) : undefined
            }
          />
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
                  style={{ width: "100%" }}
                  className="w-full"
                />
              ) : f.source ? (
                <Select
                  disabled={accounts.length === 1}
                  options={accounts}
                  loading={!accountsLoaded && !error}
                  notFoundContent={t("暂无资料完整的可用平台账户")}
                />
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
        {voucher && (
          <Form.Item
            label={t("收款凭证（可选，可在收款记录补传）")}
            extra={t("支持 PDF、PNG、JPG、WebP，单个文件不超过 30 MB")}
          >
            <Upload
              maxCount={1}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              beforeUpload={(file) => {
                const extension = file.name.split(".").at(-1)?.toLowerCase();
                if (
                  !extension ||
                  !["pdf", "png", "jpg", "jpeg", "webp"].includes(extension)
                ) {
                  message.error(t("收款凭证支持 PDF 或图片"));
                  return Upload.LIST_IGNORE;
                }
                if (file.size > 30 * 1024 * 1024) {
                  message.error(t("单个文件不能超过 30 MB"));
                  return Upload.LIST_IGNORE;
                }
                setVoucherFile(file);
                return false;
              }}
              onRemove={() => setVoucherFile(undefined)}
            >
              <Button icon={<UploadOutlined aria-hidden />}>
                {t("选择收款凭证")}
              </Button>
            </Upload>
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
