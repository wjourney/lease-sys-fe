import { RequestError } from "../../../../components/feedback/RequestError";
import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { api, errorMessage, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export function UnitDeleteModal({
  unit,
  units,
  onClose,
  onDeleted,
}: {
  unit?: Row;
  units?: Row[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [form] = Form.useForm<{ reason: string }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit({ reason }: { reason: string }) {
    setSaving(true);
    setError("");
    try {
      await api.delete("/units", {
        data: {
          ids: units?.map((item) => item.id) ?? [unit!.id],
          reason: reason.trim(),
        },
      });
      onDeleted();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      centered
      title={t(units?.length ? `批量删除单位（${units.length}）` : "删除单位")}
      onCancel={() => {
        if (!saving) onClose();
      }}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={saving}>
            {t("取消")}
          </Button>
          <Button
            danger
            type="primary"
            loading={saving}
            onClick={() => form.submit()}
          >
            {t("确认删除")}
          </Button>
        </div>
      }
    >
      <p className="mt-5 text-sm text-[#52617a]">
        {t(units?.length ? "确定删除所选单位吗？" : "确定删除单位")}
        {!units?.length && (
          <strong className="mx-1 text-[#243248]">{t(unit?.unitNo)}</strong>
        )}
        {t(
          units?.length
            ? "已有订单引用的单位无法删除，整批将撤销。"
            : "吗？已有订单引用的单位无法删除。",
        )}
      </p>
      {!!units?.length && (
        <div className="mb-4 max-h-24 overflow-auto rounded bg-[#f5f7fa] px-3 py-2 text-sm text-[#52617a]">
          {units.map((item) => t(item.unitNo)).join("、")}
        </div>
      )}
      {error && (
        <RequestError
          type="error"
          showIcon
          message={t(error)}
          className="mb-4"
        />
      )}
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="reason"
          label={t("删除原因")}
          rules={[
            { required: true, whitespace: true, message: t("请填写删除原因") },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder={t("请填写删除原因")}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
