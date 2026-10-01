import { RequestError as Alert } from "../../../../components/feedback/RequestError";
import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { api, errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { AccountActionNote } from "../../components/AccountActionNote";

export function DisableUserModal({
  id,
  open,
  onClose,
  onDisabled,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  onDisabled: () => void;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(values: { reason: string }) {
    setSaving(true);
    setError("");
    try {
      await api.post(`/users/${id}/disable`, values);
      form.resetFields();
      onDisabled();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      centered
      title={t("停用账号")}
      onCancel={onClose}
      closable={!saving}
      maskClosable={!saving}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={saving}>
            {t("取消")}
          </Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {t("确认停用")}
          </Button>
        </div>
      }
    >
      <div className="mt-5 mb-4">
        <AccountActionNote>
          {t("停用后该账号无法登录，历史订单、佣金和操作记录仍会保留。")}
        </AccountActionNote>
      </div>
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="reason"
          label={t("停用原因")}
          rules={[
            { required: true, whitespace: true, message: t("请输入停用原因") },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder={t("请输入原因")}
          />
        </Form.Item>
      </Form>
      {error && (
        <Alert className="mt-3" type="error" showIcon message={t(error)} />
      )}
    </Modal>
  );
}
