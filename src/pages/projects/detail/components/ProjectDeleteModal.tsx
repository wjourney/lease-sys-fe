import { RequestError as Alert } from "../../../../components/feedback/RequestError";
import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export function ProjectDeleteModal({
  open,
  projectName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [form] = Form.useForm<{ reason: string }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    try {
      const { reason } = await form.validateFields();
      setSaving(true);
      setError("");
      await onConfirm(reason.trim());
      form.resetFields();
      onClose();
    } catch (cause: any) {
      if (!cause.errorFields) setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  function close() {
    if (saving) return;
    form.resetFields();
    setError("");
    onClose();
  }

  return (
    <Modal
      open={open}
      centered
      title={t("确认删除项目")}
      onCancel={close}
      closable={!saving}
      maskClosable={!saving}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={close} disabled={saving}>
            {t("取消")}
          </Button>
          <Button danger type="primary" loading={saving} onClick={confirm}>
            {t("确认删除")}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-[#52617a]">
        {t("确定删除项目")}
        <strong className="mx-1 text-[#243248]">{t(projectName)}</strong>
        {t("吗？请填写删除原因后确认。")}
      </p>
      {error && (
        <Alert type="error" showIcon message={t(error)} className="mb-4" />
      )}
      <Form form={form} layout="vertical">
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
