import { RequestError } from "../feedback/RequestError";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Upload } from "antd";
import { useEffect, useState } from "react";
import { api, errorMessage, options, Row } from "../../shared/api";
import { configs } from "../../shared/config";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
export function MaterialEditor({
  owner,
  onClose,
  onSaved,
  versionOf,
}: {
  owner?: Row;
  onClose: () => void;
  onSaved: () => void;
  versionOf?: string;
}) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refs, setRefs] = useState<any[]>([]);
  const kind = Form.useWatch("ownerType", form);
  const root = useRoot();
  useEffect(() => {
    if (kind && !owner)
      options(kind)
        .then((rows) =>
          setRefs(
            rows.map((r) => ({
              value: r.id,
              label:
                r.name ??
                r.unitNo ??
                r.orderNo ??
                r.recordNo ??
                r.expenseNo ??
                r.invoiceNo,
            })),
          ),
        )
        .catch((e) => setError(errorMessage(e)));
  }, [kind]);
  const ownerTypes: Record<string, string> = {
    projects: "projectId",
    units: "unitId",
    orders: "orderId",
    incomes: "incomeId",
    expenses: "expenseId",
    invoices: "invoiceId",
    "sales-companies": "salesCompanyId",
    users: "userId",
  };
  async function save() {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const payload = {
        ...owner,
        ...(!owner
          ? {
              [ownerTypes[v.ownerType]]: v.ownerId,
            }
          : {}),
        title: t(v.title),
        category: v.category,
        description: t(v.description),
        body: v.body,
        visibility: v.visibility || "SHARED",
      };
      if (file || versionOf) {
        const data = new FormData();
        data.append("payload", JSON.stringify(payload));
        if (file) data.append("file", file);
        await api.post(
          versionOf ? `/materials/${versionOf}/versions` : "/materials/upload",
          data,
        );
      } else await api.post("/materials", payload);
      root.invalidate();
      onSaved();
    } catch (e: any) {
      if (!e.errorFields) setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Drawer
      open
      width={580}
      zIndex={1300}
      title={t(versionOf ? "上传新版本" : "新增文件与资料")}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2.5 p-[5px]">
          <Button onClick={onClose}>{t("取消")}</Button>
          <Button type="primary" onClick={save} loading={saving}>
            {t("保存资料")}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          category: owner?.category || "OTHER",
          title: versionOf ? owner?.title : undefined,
          description: versionOf ? owner?.description : undefined,
          body: versionOf ? owner?.body : undefined,
          visibility: owner?.visibility || "SHARED",
          ownerType: "projects",
        }}
      >
        {error && <RequestError message={t(error)} type="error" showIcon />}
        {!owner && !versionOf && (
          <>
            <Form.Item
              label={t("归属模块")}
              name="ownerType"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                options={Object.keys(ownerTypes)
                  .filter((k) => root.canRead(k))
                  .map((k) => ({
                    value: k,
                    label: t(configs[k].title),
                  }))}
              />
            </Form.Item>
            <Form.Item
              label={t("所属记录")}
              name="ownerId"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select showSearch optionFilterProp="label" options={refs} />
            </Form.Item>
          </>
        )}
        <Form.Item
          label={t("资料名称")}
          name="title"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t("资料分类")}
          name="category"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={Object.entries({
              OFFICIAL: "官方文件",
              MARKETING: "营销资料",
              GUIDE: "开单 / 入住指南",
              TEMPLATE: "合同模板",
              PHOTO: "图片",
              LOGO: "项目 Logo",
              VOUCHER: "收付款凭证",
              OTHER: "其他资料",
            }).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
        {root.canWrite("materials") && (
          <Form.Item label={t("可见范围")} name="visibility">
            <Select
              options={[
                {
                  label: t("按业务权限共享"),
                  value: "SHARED",
                },
                {
                  label: t("仅内部人员"),
                  value: "INTERNAL",
                },
              ]}
            />
          </Form.Item>
        )}
        <Form.Item label={t("说明")} name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label={t("文字内容（可选）")} name="body">
          <Input.TextArea rows={5} />
        </Form.Item>
        <Form.Item label={t("文件（PDF / 图片 / MP4，最大 30MB）")}>
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            maxCount={1}
            onRemove={() => setFile(undefined)}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4"
          >
            <Button icon={<UploadOutlined aria-hidden={true} />}>
              {t("选择文件")}
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
