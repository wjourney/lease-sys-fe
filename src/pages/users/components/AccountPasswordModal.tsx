import { Button, Modal, Typography } from "antd";
import { t } from "../../../shared/i18n";

export function AccountPasswordModal({
  open,
  username,
  initialPassword,
  companyName,
  onClose,
  reset = false,
}: {
  open: boolean;
  username: string;
  initialPassword: string;
  companyName?: string;
  onClose: () => void;
  reset?: boolean;
}) {
  return (
    <Modal
      open={open}
      centered
      title={t(reset ? "初始密码已重置" : "账号创建成功")}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          {t("完成")}
        </Button>
      }
      destroyOnClose
    >
      <dl className="mt-5 grid grid-cols-[110px_1fr] gap-x-4 gap-y-4 rounded-lg bg-[#f5f7fa] p-4 text-sm">
        <dt className="text-[#78869a]">{t("登录账号")}</dt>
        <dd className="m-0">
          <Typography.Text copyable className="font-medium text-[#25334a]">
            {username}
          </Typography.Text>
        </dd>
        <dt className="text-[#78869a]">{t("初始密码")}</dt>
        <dd className="m-0">
          <Typography.Text copyable className="font-semibold text-[#25334a]">
            {initialPassword}
          </Typography.Text>
        </dd>
        {companyName && (
          <>
            <dt className="text-[#78869a]">{t("所属公司")}</dt>
            <dd className="m-0 text-[#25334a]">{t(companyName)}</dd>
          </>
        )}
      </dl>
      <p className="mb-0 mt-4 text-xs text-[#77859a]">
        {t(
          "请安全交付此密码。关闭弹窗后将无法再次查看，用户首次登录后可修改密码。",
        )}
      </p>
    </Modal>
  );
}
