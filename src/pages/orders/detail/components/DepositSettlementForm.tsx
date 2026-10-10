import { Alert, Button, Form, Input, InputNumber, Select, Space } from "antd";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { api, errorMessage, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { cents } from "../order-state";
import { formatMoney } from "../../../finance/finance-data";
import { FormSurface } from "../../../../components/forms/FormSurface";
export function DepositSettlementForm({
  onClose,
  presentation,
  onSavingChange,
}: {
  onClose: () => void;
  presentation?: "drawer" | "inline";
  onSavingChange?: (saving: boolean) => void;
}) {
  const { row, id, root, message } = useRecordDetail();
  const amount = (value: any) => formatMoney(value, row.currency);
  const revising = Boolean(row.depositSettledAt);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const items: Row[] = Form.useWatch("items", form) || [];
  const deducted = items.reduce((n, x) => n + cents(x?.amount), 0);
  const received = cents(row.deposit.received);
  const previousOffsets = new Map<string, number>();
  for (const item of row.depositDeductions || []) {
    if (item.incomeId)
      previousOffsets.set(
        item.incomeId,
        (previousOffsets.get(item.incomeId) || 0) + cents(item.amount),
      );
  }
  const available = (bill: Row) =>
    (cents(bill.remaining) + (previousOffsets.get(bill.id) || 0)) / 100;
  async function submit() {
    if (saving) return;
    try {
      const values = await form.validateFields();
      if (deducted > received) {
        message.error(t("扣款不能超过已确认收取的押金"));
        return;
      }
      setSaving(true);
      await api.post(`/orders/${id}/deposit-settlement`, {
        ...values,
        revision: row.revision,
        items: values.items || [],
        deductionAmount: (deducted / 100).toFixed(2),
      });
      root.invalidate();
      message.success(t("押金结算已保存"));
      onClose();
    } catch (e: any) {
      if (!e.errorFields) message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <FormSurface
      width={760}
      title={revising ? "修正押金结算" : "办理押金结算"}
      saving={saving}
      presentation={presentation}
      onSavingChange={onSavingChange}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button disabled={saving} onClick={onClose}>
            {t("取消")}
          </Button>
          <Button type="primary" loading={saving} onClick={() => void submit()}>
            {t("确认结算")}
          </Button>
        </div>
      }
    >
      <Alert
        type="info"
        showIcon
        message={t(
          "有应退金额时生成待付款退款单；全额扣款时无需退款。超过押金的欠款仍保留在账单中。",
        )}
        className="mb-4"
      />
      <Form
        form={form}
        layout="vertical"
        disabled={saving}
        initialValues={{
          items: row.depositDeductions || [],
          reason: row.depositDeductionReason || "",
        }}
      >
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <div
                  key={key}
                  className="mb-4 rounded border border-[#e5e9ef] p-4"
                >
                  <div className="grid grid-cols-2 gap-x-4">
                    <Form.Item
                      name={[name, "label"]}
                      label={t("扣款项目")}
                      rules={[{ required: true, message: t("请填写扣款项目") }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name={[name, "amount"]}
                      label={t("扣款金额")}
                      rules={[{ required: true, message: t("请填写扣款金额") }]}
                    >
                      <InputNumber
                        stringMode
                        min="0.01"
                        precision={2}
                        className="w-full"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name={[name, "incomeId"]}
                    label={t("抵扣欠款账单（可选）")}
                  >
                    <Select
                      allowClear
                      options={(row.bills ?? [])
                        .filter(
                          (b: Row) =>
                            b.feeType !== "DEPOSIT" &&
                            b.status !== "VOID" &&
                            available(b) > 0 &&
                            Number(b.pending) === 0,
                        )
                        .map((b: Row) => ({
                          value: b.id,
                          label: `${b.recordNo} · ${amount(available(b))}`,
                        }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name={[name, "note"]}
                    label={t("扣款原因")}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: t("请填写扣款原因"),
                      },
                    ]}
                  >
                    <Input.TextArea />
                  </Form.Item>
                  <Form.Item
                    name={[name, "materialId"]}
                    label={t("关联订单凭证（可选）")}
                  >
                    <Select
                      allowClear
                      options={(row.materials ?? [])
                        .filter((m: Row) => m.orderId === id)
                        .map((m: Row) => ({
                          value: m.id,
                          label: m.title || m.originalName,
                        }))}
                    />
                  </Form.Item>
                  <Button danger onClick={() => remove(name)}>
                    {t("移除项目")}
                  </Button>
                </div>
              ))}
              <Button onClick={() => add({})} className="mb-4">
                {t("添加扣款项目")}
              </Button>
            </>
          )}
        </Form.List>
        <Form.Item name="reason" label={t("结算说明（选填）")}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
      <p className="text-sm text-[#738198]">
        {t(
          "按已确认的实收押金办理结算；尚未收取的押金余额将在结算后终止，不再催收。退款以实际登记付款为准。",
        )}
      </p>
      <Space direction="vertical">
        <span>
          {t("已确认实收")}：{amount(received / 100)}
        </span>
        <span>
          {t("扣款合计")}：{amount(deducted / 100)}
        </span>
        <strong>
          {t("应退租客")}：{amount((received - deducted) / 100)}
        </strong>
      </Space>
    </FormSurface>
  );
}
