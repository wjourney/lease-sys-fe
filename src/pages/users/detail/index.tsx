import { RequestError } from "../../../components/feedback/RequestError";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { App, Avatar, Button, Empty, Spin, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { api, dateText, errorMessage } from "../../../shared/api";
import { dateTimeText } from "../../../shared/date-time";
import { t } from "../../../shared/i18n";
import { roleLabels } from "../../../shared/resource-config";
import { useRoot } from "../../../stores/root";
import { AccountStatusTag } from "../components/AccountStatusTag";
import { AccountPasswordModal } from "../components/AccountPasswordModal";
import { DisableUserModal } from "./components/DisableUserModal";
import { UserDrawer } from "../list/components/UserDrawer";
import { useUserDetail } from "./useUserDetail";

function maskedPhone(phone?: string) {
  if (!phone) return "—";
  return phone.length > 7
    ? `${phone.slice(0, 3)}****${phone.slice(-4)}`
    : phone;
}

const UserDetailPage = observer(function UserDetailPage() {
  const { id = "" } = useParams();
  const root = useRoot();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { row, loading, error, load } = useUserDetail(id, root.epoch);
  const [disableOpen, setDisableOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const self = row?.id === root.user?.id;
  const canWrite = root.canWrite("users");
  const canManageStatus = ["SUPER_ADMIN", "OPERATIONS"].includes(
    root.user?.role,
  );
  const headerHost = document.getElementById("record-detail-header");

  async function resetPassword() {
    setBusy(true);
    try {
      const { data } = await api.post<{ initialPassword: string }>(
        `/users/${id}/reset-password`,
      );
      setPassword(data.initialPassword);
      root.invalidate();
    } catch (cause) {
      message.error(t(errorMessage(cause)));
    } finally {
      setBusy(false);
    }
  }

  async function enableAccount() {
    if (!row) return;
    setBusy(true);
    try {
      await api.patch(`/users/${id}`, {
        status: "ACTIVE",
        revision: row.revision,
        reason: "重新启用账号",
      });
      root.invalidate();
      message.success(t("账号已启用"));
    } catch (cause) {
      message.error(t(errorMessage(cause)));
    } finally {
      setBusy(false);
    }
  }

  if (!root.canRead("users"))
    return <Empty description={t("暂无此模块的访问权限")} />;
  if (error)
    return (
      <RequestError
        type="error"
        showIcon
        message={t(error)}
        action={<Button onClick={load}>{t("重试")}</Button>}
      />
    );
  if (!row) return <Spin spinning={loading} />;

  const fields: { label: string; value: string }[] = [
    { label: "登录账号", value: row.username || "—" },
    { label: "姓名", value: row.name || "—" },
    { label: "英文姓名", value: row.nameEn || "—" },
    { label: "手机号码", value: maskedPhone(row.phone) },
    { label: "电子邮箱", value: row.email || "—" },
    { label: "角色", value: roleLabels[row.role] || row.role || "—" },
    {
      label: "所属销售公司",
      value: row.salesCompanyId ? row.companyName || "—" : "内部",
    },
    { label: "分行编码", value: row.branchCode || "—" },
    { label: "职位编码", value: row.positionCode || "—" },
    {
      label: "账号有效期",
      value: row.expiresAt ? dateText(row.expiresAt) : "长期有效",
    },
    { label: "账号状态", value: row.status === "ACTIVE" ? "启用" : "停用" },
    {
      label: "最近登录",
      value: dateTimeText(row.lastLoginAt, "Asia/Hong_Kong"),
    },
  ];
  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        aria-label={t("返回上级")}
        onClick={() => navigate("/users")}
      />
      <h1 className="record-header-title" title={t(row.name || row.username)}>
        {t(row.name || row.username)}
      </h1>
    </div>
  );

  return (
    <>
      {headerHost ? createPortal(heading, headerHost) : heading}
      <Spin spinning={loading}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-[#283a55]">
            {t("成员信息")}
          </h2>
          {canWrite && (
            <Button onClick={() => setEditing(true)}>{t("编辑资料")}</Button>
          )}
        </div>
        <section className="rounded-lg border border-[#e5eaf0] bg-white p-7 max-[700px]:p-4">
          <dl className="m-0 grid grid-cols-3 gap-x-7 gap-y-6 text-sm max-[1100px]:grid-cols-2 max-[650px]:grid-cols-1">
            <div className="col-span-full grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3 max-[650px]:grid-cols-[92px_minmax(0,1fr)]">
              <dt className="whitespace-nowrap text-[#8995a6]">{t("头像")}</dt>
              <dd className="m-0">
                <Avatar
                  size={64}
                  src={row.avatarUrl}
                  alt={t("成员头像")}
                  icon={<UserOutlined />}
                  className="!bg-[#edf2f8] !text-[#647894]"
                />
              </dd>
            </div>
            {fields.map(({ label, value }) => (
              <div
                key={label}
                className="grid min-w-0 grid-cols-[100px_minmax(0,1fr)] gap-3 max-[650px]:grid-cols-[92px_minmax(0,1fr)]"
              >
                <dt className="whitespace-nowrap text-[#8995a6]">{t(label)}</dt>
                <dd className="m-0 min-w-0 break-words font-medium text-[#27364f]">
                  {label === "账号状态" ? (
                    <AccountStatusTag status={row.status} />
                  ) : (
                    t(value)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        {canWrite && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Tooltip
              title={self ? t("当前登录账号请在个人中心修改密码") : undefined}
            >
              <span>
                <Button
                  disabled={self}
                  loading={busy}
                  onClick={() =>
                    modal.confirm({
                      title: t("重置初始密码"),
                      content: t(
                        "重置后原密码立即失效，并会结束该账号已有的登录会话。",
                      ),
                      okText: t("确认重置"),
                      cancelText: t("取消"),
                      onOk: resetPassword,
                    })
                  }
                >
                  {t("重置初始密码")}
                </Button>
              </span>
            </Tooltip>
            {canManageStatus && row.status === "ACTIVE" ? (
              <Tooltip title={self ? t("不能停用当前登录账号") : undefined}>
                <span>
                  <Button
                    danger
                    disabled={self}
                    onClick={() => setDisableOpen(true)}
                  >
                    {t("停用账号")}
                  </Button>
                </span>
              </Tooltip>
            ) : canManageStatus && row.status === "DISABLED" ? (
              <Button
                loading={busy}
                onClick={() =>
                  modal.confirm({
                    title: t("启用账号"),
                    content: t("确定重新启用此账号？"),
                    okText: t("确认启用"),
                    cancelText: t("取消"),
                    onOk: enableAccount,
                  })
                }
              >
                {t("启用账号")}
              </Button>
            ) : null}
          </div>
        )}
        {canWrite && self && (
          <p className="mb-0 mt-2 text-xs text-[#8190a4]">
            {t("当前登录账号不能重置初始密码；请在个人中心修改自己的密码。")}
          </p>
        )}
      </Spin>
      {editing && (
        <UserDrawer
          open
          account={row}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            root.invalidate();
          }}
        />
      )}
      <DisableUserModal
        id={id}
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onDisabled={() => {
          setDisableOpen(false);
          root.invalidate();
          message.success(t("账号已停用"));
        }}
      />
      <AccountPasswordModal
        open={!!password}
        username={row.username}
        initialPassword={password}
        companyName={row.companyName}
        reset
        onClose={() => setPassword("")}
      />
    </>
  );
});

export default UserDetailPage;
