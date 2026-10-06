import { ResourceList } from "../../../components/resource-list/ResourceList";
import { api, errorMessage, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
import { App, Button, Descriptions, Drawer, Form, Input, Modal } from "antd";
import { useState } from "react";

function DeleteFundAccountModal({
  account,
  onClose,
  onDeleted,
}: {
  account: Row;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [form] = Form.useForm<{ reason: string }>();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  async function remove({ reason }: { reason: string }) {
    setSaving(true);
    try {
      await api.delete(`/fund-accounts/${account.id}`, {
        data: { reason: reason.trim() },
      });
      onDeleted();
    } catch (cause) {
      message.error(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      centered
      title={t("删除资金账户")}
      onCancel={onClose}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
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
      <p className="text-sm text-[#52617a]">
        {t("确定删除资金账户")}
        <strong className="mx-1 text-[#243248]">{t(account.name)}</strong>
        {t("吗？已关联收付款记录的账户无法删除，可在编辑中停用。")}
      </p>
      <Form form={form} layout="vertical" onFinish={remove}>
        <Form.Item
          name="reason"
          label={t("删除原因")}
          rules={[
            { required: true, whitespace: true, message: t("请填写删除原因") },
          ]}
        >
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function FundAccountListPage() {
  const root = useRoot();
  const { message } = App.useApp();
  const [viewing, setViewing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [listVersion, setListVersion] = useState(0);

  return (
    <>
      <ResourceList
        key={listVersion}
        resource="fund-accounts"
        onViewRow={setViewing}
        renderRowActions={(row) =>
          root.canWrite("fund-accounts") ? (
            <Button danger size="small" onClick={() => setDeleting(row)}>
              {t("删除")}
            </Button>
          ) : null
        }
      />
      <Drawer
        open={!!viewing}
        title={t("资金账户信息")}
        width={520}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label={t("账户名称")}>
              {t(viewing.name)}
            </Descriptions.Item>
            <Descriptions.Item label={t("银行名称")}>
              {t(viewing.bankName || "—")}
            </Descriptions.Item>
            <Descriptions.Item label={t("银行账号")}>
              {viewing.accountIdentifier || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("币种")}>
              {viewing.currency || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("启用")}>
              {t(viewing.enabled ? "是" : "否")}
            </Descriptions.Item>
            <Descriptions.Item label={t("备注")}>
              {t(viewing.remark || "—")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
      {deleting && (
        <DeleteFundAccountModal
          account={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            root.invalidate();
            setListVersion((version) => version + 1);
            message.success(t("已删除"));
          }}
        />
      )}
    </>
  );
}
