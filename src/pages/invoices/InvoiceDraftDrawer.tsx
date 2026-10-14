import {
  Alert,
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { useBillRequest, type BillPage } from "../incomes/bill-data";

export function InvoiceDraftDrawer({
  row,
  onClose,
}: {
  row?: Row;
  onClose: () => void;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState("");
  const [currency, setCurrency] = useState(row?.currency || "HKD");
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useBillRequest<BillPage>(
    "/incomes/bills",
    { q: keyword || undefined, currency, page: 1, pageSize: 100 },
    root.epoch,
  );
  const bills = (data?.items || []).filter((b) => b.status !== "VOID");
  const options = bills.map((b) => ({
    value: b.id,
    label: `${b.recordNo} · ${b.payerName || ""} · ${b.projectName || ""} ${b.unitNo || ""}`,
  }));
  if (row?.billId && !options.some((i) => i.value === row.billId))
    options.unshift({ value: row.billId, label: row.billNo || row.billId });
  async function save(values: Row) {
    setSaving(true);
    try {
      const body = {
        issuedOn: values.issuedOn.format("YYYY-MM-DD"),
        dueOn: values.dueOn.format("YYYY-MM-DD"),
        remark: values.remark || "",
      };
      if (row)
        await api.patch(`/invoices/${row.id}`, {
          ...body,
          revision: row.revision,
        });
      else await api.post("/invoices", { ...body, billId: values.billId });
      root.invalidate();
      message.success(t("发票草稿已保存"));
      onClose();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Drawer
      open
      width={560}
      title={t(row ? "编辑发票草稿" : "新增发票")}
      onClose={onClose}
      footer={
        <Space className="flex justify-end">
          <Button disabled={saving} onClick={onClose}>
            {t("取消")}
          </Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {t("保存草稿")}
          </Button>
        </Space>
      }
    >
      <p className="mb-5 text-sm text-[#73819a]">
        {t(
          "按账单开票，收款前可先保存草稿。核对后执行出具；已出具发票只能作废或重开。",
        )}
      </p>
      <Form
        form={form}
        layout="vertical"
        disabled={saving}
        onFinish={save}
        initialValues={{
          billId: row?.billId,
          issuedOn: row ? dayjs(row.issuedOn) : dayjs(),
          dueOn: row?.dueOn ? dayjs(row.dueOn) : undefined,
          remark: row?.snapshot?.remark,
        }}
      >
        {error && (
          <Alert
            type="error"
            message={error}
            className="mb-4"
            action={<Button onClick={reload}>{t("重试")}</Button>}
          />
        )}
        <Form.Item label={t("币种")}>
          <Select
            value={currency}
            disabled={!!row}
            options={["HKD", "CNY", "USD"].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(value) => {
              setCurrency(value);
              form.setFieldsValue({ billId: undefined, dueOn: undefined });
            }}
          />
        </Form.Item>
        <Form.Item
          name="billId"
          label={t("关联账单")}
          rules={[{ required: true, message: t("请选择账单") }]}
        >
          <Select
            showSearch
            filterOption={false}
            loading={loading}
            disabled={!!row}
            options={options}
            onSearch={setKeyword}
            onChange={(id) => {
              const bill = bills.find((b) => b.id === id);
              if (bill?.dueOn) form.setFieldValue("dueOn", dayjs(bill.dueOn));
            }}
            placeholder={t("搜索账单编号、付款人或订单")}
          />
        </Form.Item>
        <Form.Item
          name="issuedOn"
          label={t("出具日期")}
          rules={[{ required: true }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item
          name="dueOn"
          label={t("到期日")}
          rules={[{ required: true }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item name="remark" label={t("发票备注")}>
          <Input.TextArea maxLength={3000} rows={4} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
