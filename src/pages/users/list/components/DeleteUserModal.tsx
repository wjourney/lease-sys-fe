import { Alert, Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { api, errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export function DeleteUserModal({
  id,
  name,
  onClose,
  onDeleted,
}: {
  id: string;
  name: string;
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
      await api.delete(`/users/${id}`, { data: { reason: reason.trim() } });
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
      title={t("删除账号")}
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
          <Button danger type="primary" loading={saving} onClick={() => form.submit()}>
            {t("确认删除")}
          </Button>
        </div>
      }
    >
      <p className="mt-5 text-sm text-[#52617a]">
        {t("确定删除账号")}
        <strong className="mx-1 text-[#243248]">{t(name)}</strong>
        {t("吗？删除后该账号将无法登录。")}
      </p>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={t("已有业务引用的账号无法删除，请改为停用。")}
      />
      {error && (
        <Alert type="error" showIcon message={t(error)} className="mb-4" />
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
