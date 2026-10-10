import { Alert, DatePicker, Form, Input, Modal } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { api, dateText, errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { renewalEndDate } from "../renewal";

export function OrderLeaseAction({
  action,
  onClose,
}: {
  action: "renew" | "terminate";
  onClose: () => void;
}) {
  const { row, id, root, message } = useRecordDetail();
  const [form] = Form.useForm<{ date?: Dayjs; reason?: string }>();
  const [saving, setSaving] = useState(false);
  const renew = action === "renew";
  const selected = Form.useWatch("date", form);
  const end = selected?.format("YYYY-MM-DD") || renewalEndDate(row.endsOn);
  async function submit() {
    if (saving) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.post(
        `/orders/${id}/${action}`,
        renew
          ? {
              revision: row.revision,
              endsOn: values.date?.format("YYYY-MM-DD"),
            }
          : {
              revision: row.revision,
              date: values.date?.format("YYYY-MM-DD"),
              reason: values.reason?.trim() || undefined,
            },
      );
      root.invalidate();
      message.success(
        t(
          renew ? "续约成功，新增租期账单已生成" : "租约已结束，单位已恢复可租",
        ),
      );
      onClose();
    } catch (error: any) {
      if (!error.errorFields) message.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      title={t(renew ? "一键续约" : "提前结束租约")}
      width={520}
      onCancel={() => !saving && onClose()}
      onOk={() => void submit()}
      confirmLoading={saving}
      okText={t(renew ? "确认续约" : "确认提前结束")}
      cancelText={t("取消")}
      okButtonProps={{ danger: !renew }}
      cancelButtonProps={{ disabled: saving }}
      maskClosable={!saving}
      keyboard={!saving}
      closable={!saving}
    >
      <p className="mb-4 text-sm text-[#718197]">
        {t(`订单 ${row.orderNo} · ${row.unitNo || ""}`)}
      </p>
      <div className="mb-4 rounded-md bg-[#f5f7fa] px-4 py-3 text-sm">
        {t("原到期日")}：{dateText(row.endsOn)}
      </div>
      <Form
        form={form}
        layout="vertical"
        initialValues={renew ? {} : { date: dayjs().startOf("day") }}
      >
        <Form.Item
          name="date"
          label={t(renew ? "新到期日（选填）" : "实际结束日期")}
          extra={
            renew
              ? t(`不填默认延长一年：${renewalEndDate(row.endsOn)}`)
              : undefined
          }
          rules={[
            ...(!renew
              ? [{ required: true, message: t("请选择实际结束日期") }]
              : []),
            {
              validator: (_, value?: Dayjs) => {
                if (!value) return Promise.resolve();
                if (
                  renew
                    ? !value.isAfter(dayjs(row.endsOn), "day")
                    : !value.isBefore(dayjs(row.endsOn), "day")
                )
                  return Promise.reject(
                    new Error(
                      t(
                        renew
                          ? "新到期日须晚于原到期日"
                          : "提前结束日期须早于原到期日",
                      ),
                    ),
                  );
                if (!renew && value.isAfter(dayjs(), "day"))
                  return Promise.reject(
                    new Error(t("实际结束日期不能晚于今天")),
                  );
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            className="!w-full"
            format="YYYY-MM-DD"
            placeholder={t(
              renew
                ? `默认 ${renewalEndDate(row.endsOn)}`
                : "请选择实际结束日期",
            )}
            disabledDate={(date) =>
              renew
                ? !date.isAfter(dayjs(row.endsOn), "day")
                : !date.isBefore(dayjs(row.endsOn), "day") ||
                  date.isAfter(dayjs(), "day")
            }
          />
        </Form.Item>
        {!renew && (
          <Form.Item name="reason" label={t("说明（选填）")}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        )}
      </Form>
      <Alert
        type={renew ? "info" : "warning"}
        showIcon
        message={t(
          renew
            ? `新增账单：${dayjs(row.endsOn).add(1, "day").format("YYYY-MM-DD")} 至 ${end}。已有账单、收付款及押金保持不变。`
            : "确认后订单变为已结束，单位恢复可租。后续租金按结束日期核算，未收款及退款仍可继续处理。",
        )}
      />
    </Modal>
  );
}
