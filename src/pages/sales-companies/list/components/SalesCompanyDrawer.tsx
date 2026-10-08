import { RequestError } from "../../../../components/feedback/RequestError";
import { App, Button, DatePicker, Drawer, Form, Input, Select } from "antd";
import type { UploadFile } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage, options, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { useRoot } from "../../../../stores/root";
import { ProjectImageField } from "../../../projects/components/ProjectImageField";

const regionOptions = ["香港岛", "九龙", "新界", "离岛"].map((name) => ({
  label: t(name),
  value: name,
}));
const fieldClass =
  "min-w-0 !mb-4 [&_.ant-input]:!h-10 [&_.ant-picker]:!h-10 [&_.ant-select-selector]:!min-h-10";

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
  const [images, setImages] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdCompany, setCreatedCompany] = useState<Row>();
  const [imagesLoading, setImagesLoading] = useState(!!company);
  const existingImageIds = useRef(new Set<string>());
  const currentRevision = useRef<number>(company?.revision ?? 0);
  const uploaded = useRef(new Map<string, string>());
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
      payoutBankName: company.payoutBankName,
      payoutAccountName: company.payoutAccountName,
      payoutAccountNo: company.payoutAccountNo,
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
        const sorted = existing.sort(
          (a, b) =>
            Number(a.sortOrder || 0) - Number(b.sortOrder || 0) ||
            (a.category === "LOGO" ? -1 : 0) -
              (b.category === "LOGO" ? -1 : 0) ||
            String(a.createdAt).localeCompare(String(b.createdAt)),
        );
        setImages(sorted.map(toFile));
        for (const row of sorted) uploaded.current.set(row.id, row.id);
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
  const serviceEndsOn = Form.useWatch("serviceEndsOn", form) as
    Dayjs | undefined;
  const remainingDays = serviceEndsOn
    ? Math.max(
        0,
        serviceEndsOn.startOf("day").diff(dayjs().startOf("day"), "day"),
      )
    : undefined;

  async function uploadImages(companyId: string) {
    for (const [index, file] of images.entries()) {
      if (!file.originFileObj || uploaded.current.has(file.uid)) continue;
      const payload = new FormData();
      payload.append(
        "payload",
        JSON.stringify({
          salesCompanyId: companyId,
          category: "PHOTO",
          title: file.name,
          visibility: "SHARED",
          sortOrder: index,
        }),
      );
      payload.append("file", file.originFileObj, file.name);
      const { data } = await api.post<Row>("/materials/upload", payload);
      uploaded.current.set(file.uid, data.id);
    }
  }

  async function save(values: Row) {
    setSaving(true);
    setError("");
    let savedCompany = createdCompany;
    let detailsSaved = false;
    try {
      const serviceStartsOn = (
        values.serviceStartsOn as Dayjs | undefined
      )?.format("YYYY-MM-DD");
      const serviceEndsOn = (values.serviceEndsOn as Dayjs | undefined)?.format(
        "YYYY-MM-DD",
      );
      if (
        !root.companyAdmin &&
        serviceStartsOn &&
        serviceEndsOn &&
        serviceEndsOn < serviceStartsOn
      ) {
        form.setFields([
          { name: "serviceEndsOn", errors: [t("服务到期日不能早于开通时间")] },
        ]);
        return;
      }
      const payload = {
        name: values.name.trim(),
        nameEn: values.nameEn?.trim() || "",
        contactName: values.contactName?.trim() || "",
        phone: values.phone?.trim() || "",
        email: values.email?.trim() || "",
        address: values.address?.trim() || "",
        serviceArea: (values.serviceArea || []).join(" / "),
        registrationNo: values.registrationNo?.trim() || "",
        payoutBankName: values.payoutBankName?.trim() || "",
        payoutAccountName: values.payoutAccountName?.trim() || "",
        payoutAccountNo: values.payoutAccountNo?.trim() || "",
        registrationExpiresOn: (
          values.registrationExpiresOn as Dayjs | undefined
        )?.format("YYYY-MM-DD"),
        ...(!root.companyAdmin ? { serviceStartsOn, serviceEndsOn } : {}),
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
      detailsSaved = true;
      await uploadImages(savedCompany!.id);
      if (company) {
        const retained = new Set(images.map((file) => file.uid));
        for (const id of existingImageIds.current) {
          if (retained.has(id)) continue;
          await api.delete(`/materials/${id}`, {
            data: { reason: t("更新销售公司图片") },
          });
          existingImageIds.current.delete(id);
        }
      }
      const imageIds = images.map((file) => uploaded.current.get(file.uid));
      if (imageIds.some((id) => !id)) throw new Error(t("公司图片上传未完成"));
      await api.patch(`/sales-companies/${savedCompany!.id}/images/order`, {
        ids: imageIds,
      });
      message.success(t(company ? "销售公司修改成功" : "销售公司创建成功"));
      root.invalidate();
      onSaved();
    } catch (cause) {
      setError(
        detailsSaved
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
        <RequestError type="error" showIcon message={error} className="mb-4" />
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
            <Form.Item
              name="contactName"
              label={t("联系人")}
              className={fieldClass}
            >
              <Input placeholder={t("请输入联系人")} />
            </Form.Item>
            <Form.Item name="phone" label={t("电话")} className={fieldClass}>
              <Input placeholder={t("请输入电话")} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              className={fieldClass}
              rules={[{ type: "email", message: t("请输入有效的 Email") }]}
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
            >
              <Input placeholder={t("请输入商业登记号码")} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4 max-[500px]:grid-cols-1">
            <Form.Item
              name="registrationExpiresOn"
              label={t("商业登记届满日期")}
              className={fieldClass}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <ProjectImageField
            title="公司图片"
            logoLabel="公司 Logo"
            files={images}
            onChange={setImages}
          />
        </section>
        <section className="mt-4 rounded-lg bg-[#f5f6f8] p-4 max-[600px]:p-3">
          <h2 className="mb-1 text-sm font-semibold text-[#26344a]">
            {t("收款账户（选填）")}
          </h2>
          <p className="mb-4 text-xs text-[#8491a3]">
            {t("用于向销售公司付款，请按银行资料填写并在付款前核对。")}
          </p>
          <div className="grid grid-cols-3 gap-x-4 max-[700px]:grid-cols-2 max-[500px]:grid-cols-1">
            <Form.Item
              name="payoutBankName"
              label={t("开户银行")}
              className={fieldClass}
            >
              <Input maxLength={191} placeholder={t("请输入开户银行")} />
            </Form.Item>
            <Form.Item
              name="payoutAccountName"
              label={t("账户名称")}
              className={fieldClass}
            >
              <Input maxLength={191} placeholder={t("请输入账户名称")} />
            </Form.Item>
            <Form.Item
              name="payoutAccountNo"
              label={t("银行账号")}
              className={fieldClass}
            >
              <Input maxLength={191} placeholder={t("请输入银行账号")} />
            </Form.Item>
          </div>
        </section>
        <section className="mt-4 rounded-lg bg-[#f5f6f8] p-4 max-[600px]:p-3">
          <h2 className="mb-4 text-sm font-semibold text-[#26344a]">
            {t("服务期限")}
          </h2>
          {root.companyAdmin ? (
            <p className="mb-0 text-sm text-[#52617a]">
              {t("服务期限由平台管理员维护：")}
              {company?.serviceStartsOn || "—"} ~{" "}
              {company?.serviceEndsOn || "—"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 max-[500px]:grid-cols-1">
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
              </div>
              {remainingDays !== undefined && (
                <p className="mb-0 text-sm text-[#52617a]">
                  {t(`剩余期限：${remainingDays} 天`)}
                </p>
              )}
            </>
          )}
        </section>
      </Form>
    </Drawer>
  );
}
