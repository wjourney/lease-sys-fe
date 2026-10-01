import { CopyOutlined } from "@ant-design/icons";
import { App, Button, Modal, Typography } from "antd";
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
  const { message } = App.useApp();

  async function copyCredentials() {
    try {
      const credentials = `${t("登录账号")}：${username}\n${t("初始密码")}：${initialPassword}`;
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(credentials);
          copied = true;
        } catch {
          // Some browsers expose Clipboard API but reject it in this context.
        }
      }
      if (!copied) {
        const input = document.createElement("textarea");
        input.value = credentials;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("copy failed");
      }
      message.success(t("账号和初始密码已复制"));
    } catch {
      message.error(t("复制失败，请分别复制账号和密码"));
    }
  }

  return (
    <Modal
      open={open}
      centered
      title={t(reset ? "初始密码已重置" : "账号创建成功")}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            icon={<CopyOutlined />}
            onClick={copyCredentials}
            disabled={!username || !initialPassword}
          >
            {t("复制账号和密码")}
          </Button>
          <Button type="primary" onClick={onClose}>
            {t("完成")}
          </Button>
        </div>
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
