import { RequestError as Alert } from "../../../../components/feedback/RequestError";
import { UploadOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Upload,
} from "antd";
import type { UploadFile } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import {
  api,
  errorMessage,
  options,
  type Page,
  type Row,
} from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { useRoot } from "../../../../stores/root";

const regionOptions = ["香港岛", "九龙", "新界", "离岛"].map((name) => ({
  label: t(name),
  value: name,
}));
const fieldClass =
  "min-w-0 !mb-4 [&_.ant-input]:!h-10 [&_.ant-picker]:!h-10 [&_.ant-select-selector]:!min-h-10";

function CompanyImageUpload({
  label,
  prompt,
  files,
  onChange,
  multiple,
}: {
  label: string;
  prompt: string;
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  multiple?: boolean;
}) {
  const { message } = App.useApp();
  return (
    <div className="min-w-0">
      <div className="mb-2 text-xs text-[#73819a]">{t(label)}</div>
      <Upload
        accept=".jpg,.jpeg,.png,.webp"
        multiple={multiple}
        fileList={files}
        beforeUpload={(file) => {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 30 * 1024 * 1024
          ) {
            message.error(t("请上传小于 30 MB 的 JPG、PNG 或 WebP 图片"));
            return Upload.LIST_IGNORE;
          }
          return false;
        }}
        onChange={({ fileList }) =>
          onChange(multiple ? fileList : fileList.slice(-1))
        }
        className="[&_.ant-upload]:!block"
      >
        <Button
          block
          icon={<UploadOutlined aria-hidden />}
          className="!h-10 !border-dashed !text-left"
        >
          {t(prompt)}
        </Button>
      </Upload>
    </div>
  );
}

export function SalesCompanyDrawer({
  company,
  onClose,
  onSaved,
}: {
  company?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [logo, setLogo] = useState<UploadFile[]>([]);
  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdCompany, setCreatedCompany] = useState<Row>();
  const [adminAccount, setAdminAccount] = useState<Row>();
  const [imagesLoading, setImagesLoading] = useState(!!company);
  const existingImageIds = useRef(new Set<string>());
  const currentRevision = useRef<number>(company?.revision ?? 0);
  const uploaded = useRef(new Set<string>());
  useEffect(() => {
    if (!company) return;
    form.setFieldsValue({
      name: company.name,
      nameEn: company.nameEn,
      contactName: company.contactName,
      phone: company.phone,
      email: company.email,
      address: company.address,
      serviceArea: String(company.serviceArea || "")
        .split(" / ")
        .filter(Boolean),
      registrationNo: company.registrationNo,
      registrationExpiresOn: company.registrationExpiresOn
        ? dayjs(company.registrationExpiresOn)
        : undefined,
      serviceStartsOn: company.serviceStartsOn
        ? dayjs(company.serviceStartsOn)
        : undefined,
      serviceEndsOn: company.serviceEndsOn
        ? dayjs(company.serviceEndsOn)
        : undefined,
    });
    let active = true;
    if (!root.canRead("materials")) {
      setImagesLoading(false);
      return;
    }
    options("materials", { salesCompanyId: company.id })
      .then((rows) => {
        if (!active) return;
        const toFile = (row: Row): UploadFile => ({
          uid: row.id,
          name: row.originalName || row.title || t("图片"),
          status: "done",
          url: `/api/v1/materials/${row.id}/download`,
        });
        const existing = rows.filter(
          (row) => ["LOGO", "PHOTO"].includes(row.category) && row.storageKey,
        );
        existingImageIds.current = new Set(existing.map((row) => row.id));
        setLogo(
          existing
            .filter((row) => row.category === "LOGO")
            .sort((a, b) =>
              String(b.createdAt).localeCompare(String(a.createdAt)),
            )
            .slice(0, 1)
            .map(toFile),
        );
        setPhotos(
          existing.filter((row) => row.category === "PHOTO").map(toFile),
        );
      })
      .catch((cause) => {
        if (active) setError(t(`图片加载失败：${errorMessage(cause)}`));
      })
      .finally(() => {
        if (active) setImagesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [company?.id, form]);
  useEffect(() => {
    if (!company || !root.canRead("users")) return;
    let active = true;
    api
      .get<Page>("/users", {
        params: {
          salesCompanyId: company.id,
          role: "SALES_COMPANY_ADMIN",
          page: 1,
          pageSize: 1,
        },
      })
      .then(({ data }) => {
        if (active) setAdminAccount(data.items[0]);
      })
      .catch(() => {
        if (active) setAdminAccount(undefined);
      });
    return () => {
      active = false;
    };
  }, [company?.id]);
  const serviceEndsOn = Form.useWatch("serviceEndsOn", form) as
    Dayjs | undefined;
  const remainingDays = serviceEndsOn
    ? Math.max(
        0,
        serviceEndsOn.startOf("day").diff(dayjs().startOf("day"), "day"),
      )
    : undefined;

  async function uploadImages(companyId: string) {
    for (const [category, files] of [
      ["LOGO", logo],
      ["PHOTO", photos],
    ] as const) {
      for (const file of files) {
        if (!file.originFileObj || uploaded.current.has(file.uid)) continue;
        const payload = new FormData();
        payload.append(
          "payload",
          JSON.stringify({
            salesCompanyId: companyId,
            category,
            title: file.name,
            visibility: "SHARED",
          }),
        );
        payload.append("file", file.originFileObj, file.name);
        await api.post("/materials/upload", payload);
        uploaded.current.add(file.uid);
      }
    }
  }

  async function save(values: Row) {
    setSaving(true);
    setError("");
    let savedCompany = createdCompany;
    try {
      const serviceStartsOn = (
        values.serviceStartsOn as Dayjs | undefined
      )?.format("YYYY-MM-DD");
      const serviceEndsOn = (values.serviceEndsOn as Dayjs | undefined)?.format(
        "YYYY-MM-DD",
      );
      if (serviceStartsOn && serviceEndsOn && serviceEndsOn < serviceStartsOn) {
        form.setFields([
          { name: "serviceEndsOn", errors: [t("服务到期日不能早于开通时间")] },
        ]);
        return;
      }
      const payload = {
        name: values.name.trim(),
        nameEn: values.nameEn?.trim() || "",
        contactName: values.contactName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address?.trim() || "",
        serviceArea: (values.serviceArea || []).join(" / "),
        registrationNo: values.registrationNo.trim(),
        registrationExpiresOn: (values.registrationExpiresOn as Dayjs).format(
          "YYYY-MM-DD",
        ),
        serviceStartsOn,
        serviceEndsOn,
      };
      if (company) {
        savedCompany = (
          await api.patch<Row>(`/sales-companies/${company.id}`, {
            ...payload,
            revision: currentRevision.current,
          })
        ).data;
        currentRevision.current = savedCompany.revision;
      } else if (!savedCompany) {
        savedCompany = (await api.post<Row>("/sales-companies", payload)).data;
        setCreatedCompany(savedCompany);
      }
      await uploadImages(savedCompany!.id);
      if (company) {
        const retained = new Set([...logo, ...photos].map((file) => file.uid));
        for (const id of existingImageIds.current) {
          if (retained.has(id)) continue;
          await api.delete(`/materials/${id}`, {
            data: { reason: t("更新销售公司图片") },
          });
          existingImageIds.current.delete(id);
        }
      }
      message.success(t(company ? "销售公司修改成功" : "销售公司创建成功"));
      root.invalidate();
      onSaved();
    } catch (cause) {
      setError(
        savedCompany
          ? t(`公司资料已保存，图片处理失败；请重试：${errorMessage(cause)}`)
          : errorMessage(cause),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open
      width="min(880px, 100vw)"
      title={t(company ? "编辑销售公司" : "新建销售公司")}
      onClose={() => {
        if (!saving) onClose();
      }}
      closable={!saving}
      maskClosable={!saving}
      destroyOnClose
      classNames={{
        header: "!border-0 !px-6 !py-5 max-[640px]:!px-4",
        body: "!px-6 !pt-0 !pb-6 max-[640px]:!px-4",
        footer: "!border-0 !px-6 !py-3 max-[640px]:!px-4",
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={saving}>
            {t("取消")}
          </Button>
          <Button
            type="primary"
            loading={saving || imagesLoading}
            onClick={() => form.submit()}
          >
            {t(
              company
                ? "保存修改"
                : createdCompany
                  ? "继续上传图片"
                  : "创建公司",
            )}
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="error" showIcon message={error} className="mb-4" />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={save}
        initialValues={company ? undefined : { serviceStartsOn: dayjs() }}
        className="[&_.ant-form-item-label]:!pb-1 [&_.ant-form-item-label_label]:!text-xs [&_.ant-form-item-label_label]:!text-[#73819a]"
      >
        <section className="rounded-lg bg-[#f5f6f8] p-4 max-[600px]:p-3">
          <h2 className="mb-4 text-sm font-semibold text-[#26344a]">
            {t("公司资料")}
          </h2>
          <div className="grid grid-cols-3 gap-x-4 max-[700px]:grid-cols-2 max-[500px]:grid-cols-1">
            <Form.Item
              name="name"
              label={t("中文名称")}
              className={fieldClass}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t("请输入中文名称"),
                },
              ]}
            >
              <Input placeholder={t("请输入公司中文名称")} />
            </Form.Item>
            <Form.Item
              name="nameEn"
              label={t("英文名称")}
              className={fieldClass}
            >
              <Input placeholder={t("请输入公司英文名称")} />
            </Form.Item>
            <CompanyImageUpload
              label="Logo"
              prompt="上传 / 替换 Logo"
              files={logo}
              onChange={setLogo}
            />
            <Form.Item
              name="contactName"
              label={t("联系人")}
              className={fieldClass}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t("请输入联系人"),
                },
              ]}
            >
              <Input placeholder={t("请输入联系人")} />
            </Form.Item>
            <Form.Item
              name="phone"
              label={t("电话")}
              className={fieldClass}
              rules={[
                { required: true, whitespace: true, message: t("请输入电话") },
              ]}
            >
              <Input placeholder={t("请输入电话")} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              className={fieldClass}
              rules={[
                {
                  required: true,
                  type: "email",
                  message: t("请输入有效的 Email"),
                },
              ]}
            >
              <Input placeholder={t("请输入 Email")} />
            </Form.Item>
            <Form.Item
              name="address"
              label={t("公司地址")}
              className={fieldClass}
            >
              <Input placeholder={t("请输入公司地址")} />
            </Form.Item>
            <Form.Item
              name="serviceArea"
              label={t("服务区域")}
              className={fieldClass}
            >
              <Select
                mode="multiple"
                maxTagCount="responsive"
                placeholder={t("请选择服务区域")}
                options={regionOptions}
              />
            </Form.Item>
            <Form.Item
              name="registrationNo"
              label={t("商业登记号码")}
              className={fieldClass}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t("请输入商业登记号码"),
                },
              ]}
            >
              <Input placeholder={t("请输入商业登记号码")} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4 max-[500px]:grid-cols-1">
            <CompanyImageUpload
              label="公司照片"
              prompt="上传照片"
              files={photos}
              onChange={setPhotos}
              multiple
            />
            <Form.Item
              name="registrationExpiresOn"
              label={t("商业登记届满日期")}
              className={fieldClass}
              rules={[{ required: true, message: t("请选择商业登记届满日期") }]}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>
        </section>
        <section className="mt-4 rounded-lg bg-[#f5f6f8] p-4 max-[600px]:p-3">
          <h2 className="mb-4 text-sm font-semibold text-[#26344a]">
            {t("账号与服务")}
          </h2>
          <div className="grid grid-cols-3 gap-x-4 max-[700px]:grid-cols-2 max-[500px]:grid-cols-1">
            <Form.Item label={t("会员 / 公司编号")} className={fieldClass}>
              <Input
                disabled
                value={
                  company?.companyNo ||
                  createdCompany?.companyNo ||
                  t("系统自动生成")
                }
              />
            </Form.Item>
            <Form.Item label={t("管理员账号")} className={fieldClass}>
              <Input
                disabled
                value={
                  adminAccount?.username ||
                  t(company ? "尚未开通" : "创建公司后在账号管理开通")
                }
              />
            </Form.Item>
            <Form.Item label={t("管理员姓名")} className={fieldClass}>
              <Input
                disabled
                value={
                  adminAccount?.name ||
                  t(company ? "尚未填写" : "创建公司后在账号管理填写")
                }
              />
            </Form.Item>
            <Form.Item
              name="serviceStartsOn"
              label={t("开通时间")}
              className={fieldClass}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="serviceEndsOn"
              label={t("服务到期日")}
              className={fieldClass}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label={t("剩余期限")} className={fieldClass}>
              <Input
                disabled
                value={
                  remainingDays === undefined
                    ? t("选择服务到期日后计算")
                    : t(`${remainingDays} 天`)
                }
              />
            </Form.Item>
          </div>
          <p className="mb-0 text-xs text-[#8491a3]">
            {t(
              "子账号数、分行数、职位数与最后修改日期由系统统计。管理员账号需在账号管理中单独创建。",
            )}
          </p>
        </section>
      </Form>
    </Drawer>
  );
}
