import { RequestError as Alert } from "../../../../components/feedback/RequestError";
import { EditOutlined, UserOutlined } from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Spin,
  Upload,
} from "antd";
import type { UploadFile } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage, options, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { useRoot } from "../../../../stores/root";

const fieldClass =
  "min-w-0 [&_.ant-input]:!h-10 [&_.ant-select]:!h-10 [&_.ant-input-affix-wrapper]:!h-10 [&_.ant-input-affix-wrapper_.ant-input]:!h-auto";

export function UserDrawer({
  open,
  onClose,
  onCreated,
  onSaved,
  account,
  initialSalesCompanyId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (account: Row) => void;
  onSaved?: () => void;
  account?: Row;
  initialSalesCompanyId?: string;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [companies, setCompanies] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<UploadFile[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [createdAccount, setCreatedAccount] = useState<Row>();
  const [error, setError] = useState("");
  const currentRevision = useRef(account?.revision);
  const role = Form.useWatch("role", form);
  const companyId = Form.useWatch("salesCompanyId", form);
  const companyAdmin = root.user?.role === "SALES_COMPANY_ADMIN";
  const company = companies.find((item) => item.id === companyId);
  const salesRole = ["SALES", "SALES_COMPANY_ADMIN"].includes(role);
  const phoneLocked = !!account && account.username === account.phone;

  useEffect(() => {
    const file = avatar[0]?.originFileObj;
    if (!file) {
      setAvatarPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  useEffect(() => {
    if (!open) return;
    currentRevision.current = account?.revision;
    setAvatar([]);
    setError("");
    form.setFieldsValue(
      account
        ? {
            role: account.role,
            name: account.name,
            nameEn: account.nameEn,
            phone: account.phone,
            email: account.email,
            salesCompanyId: account.salesCompanyId || undefined,
            branchCode: account.branchCode || undefined,
            positionCode: account.positionCode || undefined,
            expiresAt: account.expiresAt ? dayjs(account.expiresAt) : null,
            status: account.status,
          }
        : {
            role: companyAdmin || initialSalesCompanyId ? "SALES" : undefined,
            status: "ACTIVE",
            salesCompanyId:
              initialSalesCompanyId || root.user?.salesCompanyId || undefined,
          },
    );
    setLoading(true);
    options("sales-companies")
      .then(setCompanies)
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, [
    open,
    account?.id,
    initialSalesCompanyId,
    companyAdmin,
    root.user?.salesCompanyId,
  ]);

  useEffect(() => {
    if (
      open &&
      !account &&
      initialSalesCompanyId &&
      salesRole &&
      !form.getFieldValue("salesCompanyId")
    ) {
      form.setFieldValue("salesCompanyId", initialSalesCompanyId);
    }
  }, [open, account, initialSalesCompanyId, salesRole, form]);

  function close() {
    if (saving) return;
    setError("");
    form.resetFields();
    setAvatar([]);
    if (createdAccount && onCreated) {
      onCreated(createdAccount);
      setCreatedAccount(undefined);
    } else onClose();
  }

  async function save(values: Row) {
    setSaving(true);
    setError("");
    let accountCreated = !!createdAccount;
    let detailsSaved = false;
    try {
      const {
        password,
        expiresAt,
        salesCompanyId,
        branchCode,
        positionCode,
        ...rest
      } = values;
      const selectedAvatar =
        avatar[0]?.originFileObj ||
        (avatar[0] instanceof File ? avatar[0] : undefined);
      const loginPhone = values.phone.trim();
      if (avatar.length && !selectedAvatar)
        throw new Error(t("头像文件读取失败，请重新选择"));
      const accountData = account
        ? (
            await api.patch<Row>(`/users/${account.id}`, {
              ...rest,
              phone: loginPhone,
              expiresAt: expiresAt
                ? (expiresAt as Dayjs).format("YYYY-MM-DD")
                : null,
              salesCompanyId: salesRole ? salesCompanyId : null,
              branchCode: salesRole ? branchCode || "" : "",
              positionCode: salesRole ? positionCode || "" : "",
              revision: currentRevision.current,
            })
          ).data
        : createdAccount ||
          (
            await api.post<Row>("/users", {
              ...rest,
              phone: loginPhone,
              username: loginPhone,
              ...(password ? { password } : {}),
              ...(expiresAt
                ? { expiresAt: (expiresAt as Dayjs).format("YYYY-MM-DD") }
                : {}),
              salesCompanyId: salesRole
                ? initialSalesCompanyId || salesCompanyId
                : null,
              ...(salesRole ? { branchCode, positionCode } : {}),
            })
          ).data;
      if (account) {
        currentRevision.current = accountData.revision;
        detailsSaved = true;
      }
      const created = {
        ...accountData,
        initialPassword: accountData.initialPassword || password,
      };
      if (!account) {
        setCreatedAccount(created);
        accountCreated = true;
      }
      let result = created;
      if (selectedAvatar) {
        const payload = new FormData();
        payload.append("file", selectedAvatar, avatar[0].name);
        const { data } = await api.post<Row>(
          `/users/${accountData.id}/avatar`,
          payload,
        );
        result = { ...created, ...data };
      }
      form.resetFields();
      setAvatar([]);
      setCreatedAccount(undefined);
      if (account) {
        message.success(t("账号资料已更新"));
        root.invalidate();
        onSaved?.();
      } else onCreated?.(result);
    } catch (cause) {
      setError(
        detailsSaved
          ? t(`资料已保存，头像上传失败；请重试：${errorMessage(cause)}`)
          : accountCreated
            ? t(`账号已创建，头像上传失败；请重试：${errorMessage(cause)}`)
            : errorMessage(cause),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      placement="right"
      width={760}
      title={t(account ? "编辑账号" : "新建成员账号")}
      onClose={close}
      closable={!saving}
      maskClosable={!saving}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={close} disabled={saving}>
            {t("取消")}
          </Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {t(account ? "保存修改" : "创建账号")}
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="error" showIcon message={t(error)} className="mb-4" />
      )}
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={save}
          className="[&_.ant-form-item-label_label]:!text-xs [&_.ant-form-item-label_label]:!text-[#718099]"
        >
          <section className="rounded-lg bg-[#f5f6f8] p-5 max-[600px]:p-4">
            <h2 className="mb-4 text-sm font-semibold text-[#26344a]">
              {t("成员资料")}
            </h2>
            <div className="mb-5">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#718099]">
                <span>{t(account ? "头像" : "头像（选填）")}</span>
                <span className="text-[#8a96a8]">
                  {t("支持 JPG、PNG、WebP，最大 2MB")}
                </span>
              </div>
              <Upload
                accept=".jpg,.jpeg,.png,.webp"
                fileList={avatar}
                showUploadList={false}
                beforeUpload={(file) => {
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 2 * 1024 * 1024
                  ) {
                    setError(t("请上传小于 2MB 的 JPG、PNG 或 WebP 图片"));
                    return Upload.LIST_IGNORE;
                  }
                  setError("");
                  return false;
                }}
                onChange={({ fileList }) => setAvatar(fileList.slice(-1))}
                maxCount={1}
                className="[&_.ant-upload]:!inline-block"
              >
                <div
                  className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-[#cbd5e1] bg-white text-[#718099] hover:border-[#233b5e] focus-within:border-[#233b5e]"
                  role="button"
                  tabIndex={0}
                  aria-label={t(account ? "更换头像" : "上传头像")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.currentTarget.click();
                    }
                  }}
                >
                  {avatarPreview || account?.avatarUrl ? (
                    <Avatar
                      shape="circle"
                      size={96}
                      src={avatarPreview || account?.avatarUrl}
                      alt={t("成员头像")}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-xs">
                      <UserOutlined className="text-2xl" aria-hidden />
                      {t("头像")}
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#172b49]/80 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <EditOutlined className="text-base" aria-hidden />
                    {t(account ? "更换头像" : "上传头像")}
                  </div>
                </div>
              </Upload>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-[680px]:grid-cols-2 max-[480px]:grid-cols-1">
              <Form.Item
                name="role"
                label={t("角色")}
                className={fieldClass}
                rules={[{ required: true, message: t("请选择角色") }]}
              >
                <Select
                  placeholder={t("请选择角色")}
                  options={
                    companyAdmin
                      ? [{ value: "SALES", label: t("销售员工") }]
                      : initialSalesCompanyId
                        ? [
                            {
                              value: "SALES_COMPANY_ADMIN",
                              label: t("销售管理员"),
                            },
                            { value: "SALES", label: t("销售员工") },
                          ]
                        : [
                            ...(["SUPER_ADMIN", "OPERATIONS"].includes(
                              root.user?.role,
                            )
                              ? [
                                  {
                                    value: "SUPER_ADMIN",
                                    label: t("超级管理员"),
                                  },
                                ]
                              : []),
                            { value: "OPERATIONS", label: t("内部运营") },
                            { value: "FINANCE", label: t("内部财务") },
                            {
                              value: "SALES_COMPANY_ADMIN",
                              label: t("销售管理员"),
                            },
                            { value: "SALES", label: t("销售员工") },
                          ]
                  }
                />
              </Form.Item>
              <Form.Item
                name="name"
                label={t("用户名（中文）")}
                className={fieldClass}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t("请输入用户名（中文）"),
                  },
                ]}
              >
                <Input placeholder={t("请输入用户名（中文）")} />
              </Form.Item>
              <Form.Item
                name="nameEn"
                label={t("英文名")}
                className={fieldClass}
              >
                <Input placeholder={t("请输入英文名")} />
              </Form.Item>
              <Form.Item
                name="phone"
                label={t("手机号码")}
                className={fieldClass}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t("请输入手机号码"),
                  },
                  {
                    validator: (_, value: string) =>
                      !value || /^\d{8,20}$/.test(value.trim())
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(t("请输入 8 至 20 位数字手机号")),
                          ),
                  },
                ]}
              >
                <Input
                  inputMode="numeric"
                  maxLength={20}
                  placeholder={t("请输入手机号码")}
                  disabled={phoneLocked}
                />
              </Form.Item>
              {phoneLocked && (
                <p className="col-span-3 -mt-3 mb-3 text-xs text-[#8491a3] max-[680px]:col-span-2 max-[480px]:col-span-1">
                  {t("该手机号是登录账号，暂不支持修改。")}
                </p>
              )}
              <Form.Item
                name="email"
                label="Email"
                className={fieldClass}
                rules={[{ type: "email", message: t("邮箱格式不正确") }]}
              >
                <Input placeholder={t("请输入 Email")} />
              </Form.Item>
              {salesRole && (
                <>
                  <Form.Item
                    name="salesCompanyId"
                    label={t("所属销售公司")}
                    className={fieldClass}
                    rules={[{ required: true, message: t("请选择销售公司") }]}
                  >
                    <Select
                      options={companies
                        .filter(
                          (item) =>
                            item.status === "ACTIVE" || item.id === companyId,
                        )
                        .map((item) => ({
                          value: item.id,
                          label: t(item.name),
                        }))}
                      placeholder={t("请选择销售公司")}
                      disabled={companyAdmin || !!initialSalesCompanyId}
                      allowClear={!companyAdmin && !initialSalesCompanyId}
                      showSearch
                      optionFilterProp="label"
                      onChange={() =>
                        form.setFieldsValue({
                          branchCode: undefined,
                          positionCode: undefined,
                        })
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    name="branchCode"
                    label={t("分行")}
                    className={fieldClass}
                    preserve={false}
                  >
                    <Select
                      options={(company?.branches || [])
                        .filter((item: Row) => item.enabled)
                        .map((item: Row) => ({
                          value: item.code,
                          label: t(item.name),
                        }))}
                      placeholder={t("请选择分行")}
                      disabled={!companyId}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item
                    name="positionCode"
                    label={t("职位")}
                    className={fieldClass}
                    preserve={false}
                  >
                    <Select
                      options={(company?.positions || [])
                        .filter((item: Row) => item.enabled)
                        .map((item: Row) => ({
                          value: item.code,
                          label: t(item.name),
                        }))}
                      placeholder={t("请选择职位")}
                      disabled={!companyId}
                      allowClear
                    />
                  </Form.Item>
                </>
              )}
              <Form.Item
                name="expiresAt"
                label={t("账号有效期")}
                className={fieldClass}
              >
                <DatePicker
                  className="!h-10 !w-full"
                  placeholder={t("请选择日期，不填则长期有效")}
                />
              </Form.Item>
              {!account && (
                <Form.Item
                  name="password"
                  label={t("初始密码（选填，至少 10 位）")}
                  className={fieldClass}
                  rules={[{ min: 10, message: t("初始密码至少 10 位") }]}
                >
                  <Input.Password
                    placeholder={t("留空则由系统生成")}
                    autoComplete="new-password"
                  />
                </Form.Item>
              )}
              <Form.Item
                name="status"
                label={t("启用状态")}
                className={`${fieldClass} col-span-3 max-[680px]:col-span-2 max-[480px]:col-span-1`}
              >
                <Select
                  options={[
                    { value: "ACTIVE", label: t("启用") },
                    { value: "DISABLED", label: t("停用") },
                  ]}
                  disabled={
                    !!account &&
                    (account.id === root.user?.id ||
                      !["SUPER_ADMIN", "OPERATIONS"].includes(root.user?.role))
                  }
                />
              </Form.Item>
            </div>
            <p className="mb-0 text-[11px] text-[#8a96a8]">
              {t(
                "选择销售角色后填写销售公司、分行和职位。停用不删除历史订单、佣金和操作记录。",
              )}
            </p>
          </section>
        </Form>
      </Spin>
    </Drawer>
  );
}
