import { RequestError } from "../../../../components/feedback/RequestError";
import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export function ProjectDeleteModal({
  open,
  projectName,
  projectNames,
  onClose,
  onConfirm,
}: {
  open: boolean;
  projectName?: string;
  projectNames?: string[];
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
      title={t(
        projectNames?.length
          ? `批量删除项目（${projectNames.length}）`
          : "确认删除项目",
      )}
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
        {t(projectNames?.length ? "确定删除所选项目吗？" : "确定删除项目")}
        {!projectNames?.length && (
          <strong className="mx-1 text-[#243248]">{t(projectName)}</strong>
        )}
        {t(
          projectNames?.length
            ? "有单位的项目无法删除，整批将撤销。请填写删除原因后确认。"
            : "吗？有单位的项目无法删除。请填写删除原因后确认。",
        )}
      </p>
      {!!projectNames?.length && (
        <div className="mb-4 max-h-24 overflow-auto rounded bg-[#f5f7fa] px-3 py-2 text-sm text-[#52617a]">
          {projectNames.map(t).join("、")}
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
