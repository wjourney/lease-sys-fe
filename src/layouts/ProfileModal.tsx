import { RequestError as Alert } from "../components/feedback/RequestError";
import { CameraOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { App as AntApp, Avatar, Button, Form, Input, Modal, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { api, dateText, errorMessage, type Row } from "../shared/api";
import { dateTimeText } from "../shared/date-time";
import { t } from "../shared/i18n";
import { roleLabels } from "../shared/resource-config";
import { useRoot } from "../stores/root";

const empty = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const hongKongTime = (value: unknown) =>
  dateTimeText(value, "Asia/Hong_Kong").slice(0, 16);
const avatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-2 text-xs text-[#8290a5]">{t(label)}</dt>
      <dd className="m-0 break-words text-sm text-[#23334c]">{t(value)}</dd>
    </div>
  );
}

export const ProfileModal = observer(function ProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const root = useRoot();
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();
  const [account, setAccount] = useState<Row>();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setPendingAvatar(null);
      form.resetFields();
    }
  }, [form, open]);

  useEffect(() => {
    if (!pendingAvatar) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(pendingAvatar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingAvatar]);

  useEffect(() => {
    if (!open || !root.user?.id) return;
    let active = true;
    setLoading(true);
    setError("");
    setAccount(undefined);
    api
      .get<Row>(`/users/${root.user.id}`)
      .then(({ data }) => {
        if (!active) return;
        setAccount(data);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, root.user?.id, root.epoch]);

  const current = account || root.user;
  const salesAccount = !!current?.salesCompanyId;
  const personal = [
    { label: "中文名", value: empty(current?.name) },
    { label: "英文名", value: empty(current?.nameEn) },
    { label: "手机号", value: empty(current?.phone) },
    { label: "邮件", value: empty(current?.email) },
    ...(salesAccount
      ? [{ label: "所属销售公司", value: empty(current?.companyName) }]
      : []),
  ];
  const accountFields = [
    {
      label: "账号状态",
      value: current?.status === "DISABLED" ? "停用" : "启用",
    },
    {
      label: "账号有效期",
      value: current?.expiresAt ? dateText(current.expiresAt) : "长期有效",
    },
    { label: "最近登录", value: hongKongTime(current?.lastLoginAt) },
  ];

  function selectAvatar(file: File) {
    if (!avatarTypes.has(file.type) || file.size > 2 * 1024 * 1024) {
      message.error(t("请上传小于 2MB 的 JPG、PNG 或 WebP 图片"));
      return;
    }
    setPendingAvatar(file);
  }

  async function saveAvatar() {
    if (!pendingAvatar || !current?.id) return;
    setAvatarSaving(true);
    try {
      const payload = new FormData();
      payload.append("file", pendingAvatar, pendingAvatar.name);
      const { data } = await api.post<Row>(
        `/users/${current.id}/avatar`,
        payload,
      );
      const avatarUrl = `${data.avatarUrl}?v=${Date.now()}`;
      setAccount((previous) => ({ ...previous, ...data, avatarUrl }));
      root.setAvatarUrl(avatarUrl);
      setPendingAvatar(null);
      root.invalidate();
      message.success(t("头像已更新"));
    } catch (cause) {
      message.error(t(errorMessage(cause)));
    } finally {
      setAvatarSaving(false);
    }
  }

  function startEditing() {
    form.setFieldsValue({
      name: current?.name || "",
      nameEn: current?.nameEn || "",
      phone: current?.phone || "",
      email: current?.email || "",
    });
    setEditing(true);
  }

  async function saveProfile(values: {
    name: string;
    nameEn: string;
    phone: string;
    email: string;
  }) {
    setSaving(true);
    try {
      const { data } = await api.patch<Row>("/auth/me", values);
      setAccount((previous) => ({ ...previous, ...data }));
      await root.init();
      root.invalidate();
      setEditing(false);
      message.success(t("个人资料已更新"));
    } catch (cause) {
      message.error(t(errorMessage(cause)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      centered
      width={760}
      title={
        <span className="text-[21px] font-semibold text-[#26344b]">
          {t("个人中心")}
        </span>
      }
      onCancel={() => {
        if (!saving && !avatarSaving) onClose();
      }}
      closable={!saving && !avatarSaving}
      maskClosable={!saving && !avatarSaving}
      destroyOnClose
      footer={
        editing ? (
          <div className="flex justify-end gap-2">
            <Button disabled={saving} onClick={() => setEditing(false)}>
              {t("取消")}
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => form.submit()}
            >
              {t("保存修改")}
            </Button>
          </div>
        ) : (
          <Button onClick={onClose} disabled={avatarSaving}>
            {t("关闭")}
          </Button>
        )
      }
      className="[&_.ant-modal-content]:!p-6 max-[700px]:[&_.ant-modal-content]:!p-4 [&_.ant-modal-close]:!h-10 [&_.ant-modal-close]:!w-10 [&_.ant-modal-close]:!rounded-md [&_.ant-modal-close]:!border [&_.ant-modal-close]:!border-[#e2e8ef] [&_.ant-modal-footer]:!mt-6"
    >
      {error && (
        <Alert type="error" showIcon message={t(error)} className="mb-4" />
      )}
      <Spin spinning={loading}>
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <label className="group relative inline-flex size-16 shrink-0 cursor-pointer rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#15243f]">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              aria-label={t("更换头像")}
              className="sr-only"
              disabled={avatarSaving}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) selectAvatar(file);
                event.target.value = "";
              }}
            />
            <Avatar
              size={64}
              src={previewUrl || current?.avatarUrl}
              icon={<UserOutlined />}
              className="!bg-[#edf1f6] !text-[#73849c]"
            />
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full bg-[#15243f]/75 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <CameraOutlined className="text-base" aria-hidden />
              {t("修改")}
            </span>
          </label>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-[#22324c]">
              {t(empty(current?.name))} ·{" "}
              {t(roleLabels[current?.role] || current?.role || "—")}
            </div>
            <div className="mt-1 text-sm text-[#8190a5]">
              {t("登录账号：")} {empty(current?.username)}
            </div>
          </div>
        </div>
        {pendingAvatar && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#dce4ef] bg-[#f8fafc] px-4 py-3 text-xs text-[#718099]">
            <span className="min-w-0 flex-1 truncate">
              {t("预览头像：")} {pendingAvatar.name} ·{" "}
              {t("JPG、PNG、WebP，最大 2MB")}
            </span>
            <Button
              size="small"
              onClick={() => setPendingAvatar(null)}
              disabled={avatarSaving}
            >
              {t("取消更换")}
            </Button>
            <Button
              size="small"
              type="primary"
              loading={avatarSaving}
              onClick={saveAvatar}
            >
              {t("保存头像")}
            </Button>
          </div>
        )}
        <section className="mb-5 rounded-lg bg-[#f5f6f8] p-4 max-[700px]:p-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-medium text-[#26344b]">
              {t("个人信息")}
            </h2>
            {!editing && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={startEditing}
              >
                {t("编辑资料")}
              </Button>
            )}
          </div>
          {editing ? (
            <Form form={form} layout="vertical" onFinish={saveProfile}>
              <div className="grid grid-cols-2 gap-x-6 max-[600px]:grid-cols-1">
                <Form.Item
                  name="name"
                  label={t("中文名")}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t("请输入中文名"),
                    },
                  ]}
                >
                  <Input maxLength={500} />
                </Form.Item>
                <Form.Item name="nameEn" label={t("英文名")}>
                  <Input maxLength={3000} />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label={t("电话")}
                  extra={
                    current?.username === current?.phone
                      ? t("手机号是登录账号，暂不支持在资料中修改")
                      : undefined
                  }
                >
                  <Input
                    maxLength={500}
                    disabled={current?.username === current?.phone}
                  />
                </Form.Item>
                <Form.Item
                  name="email"
                  label={t("邮件")}
                  rules={[
                    { type: "email", message: t("请输入有效的邮箱地址") },
                  ]}
                >
                  <Input maxLength={3000} />
                </Form.Item>
              </div>
              {salesAccount && (
                <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-6 max-[600px]:grid-cols-1">
                  <ProfileField
                    label="所属销售公司"
                    value={empty(current?.companyName)}
                  />
                </dl>
              )}
            </Form>
          ) : (
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5 max-[600px]:grid-cols-1">
              {personal.map((field) => (
                <ProfileField key={field.label} {...field} />
              ))}
            </dl>
          )}
        </section>
        <section className="rounded-lg bg-[#f5f6f8] p-4 max-[700px]:p-3">
          <h2 className="mb-4 mt-0 text-base font-medium text-[#26344b]">
            {t("账号状态")}
          </h2>
          <dl className="m-0 grid grid-cols-3 gap-x-6 gap-y-5 max-[600px]:grid-cols-2 max-[450px]:grid-cols-1">
            {accountFields.map((field) => (
              <ProfileField key={field.label} {...field} />
            ))}
          </dl>
        </section>
      </Spin>
    </Modal>
  );
});

export const ChangePasswordModal = observer(function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const root = useRoot();
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={open}
      title={t("修改密码")}
      onCancel={onClose}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={saving}>
            {t("取消")}
          </Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {t("确认修改")}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-5"
        onFinish={async (values) => {
          setSaving(true);
          try {
            await api.post("/auth/password", values);
            message.success(t("密码已更新，请重新登录"));
            onClose();
            root.clear();
          } catch (cause) {
            message.error(t(errorMessage(cause)));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form.Item
          name="currentPassword"
          label={t("当前密码")}
          rules={[{ required: true, message: t("请输入当前密码") }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t("新密码")}
          rules={[{ required: true, min: 10, message: t("新密码至少 10 位") }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
});
