import { RequestError as Alert } from "../feedback/RequestError";
import { App, Button, Drawer, Form, Input } from "antd";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { api, errorMessage, options, Row } from "../../shared/api";
import { configs } from "../../shared/config";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { renderFieldControl } from "./FieldControl";
export const Editor = observer(function Editor({
  resource,
  row,
  initial = {},
  onClose,
  onSaved,
  lockedFields = [],
}: {
  lockedFields?: string[];
  resource: string;
  row?: Row;
  initial?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookups, setLookups] = useState<Record<string, any[]>>({});
  const config = configs[resource];
  const fields = config.fields
    .filter((f) => !(row && f.createOnly) && !lockedFields.includes(f.key))
    .filter(
      (f) =>
        !(
          resource === "users" &&
          row &&
          f.key === "phone" &&
          row.username === row.phone
        ),
    )
    .map((f) =>
      resource === "users" &&
      f.key === "role" &&
      root.user?.role === "SALES_COMPANY_ADMIN"
        ? {
            ...f,
            options: [
              {
                label: t("销售员工"),
                value: "SALES",
              },
            ],
          }
        : f,
    )
    .filter(
      (f) =>
        !(
          resource === "users" &&
          f.key === "salesCompanyId" &&
          root.user?.role === "SALES_COMPANY_ADMIN"
        ),
    );
  useEffect(() => {
    const values: Row = {
      ...Object.fromEntries(
        fields
          .filter((f) => f.initial !== undefined)
          .map((f) => [f.key, f.initial]),
      ),
      ...initial,
      ...row,
    };
    for (const f of fields) {
      if (f.type === "date" && values[f.key])
        values[f.key] = dayjs(values[f.key]);
      if (f.type === "json" && values[f.key])
        values[f.key] = JSON.stringify(values[f.key], null, 2);
      if (f.type === "money" && values[f.key] != null)
        values[f.key] = String(values[f.key]);
    }
    if (resource === "incomes")
      values.recurrenceRule = values.recurrenceRule?.frequency ?? "ONCE";
    if (resource === "users" && root.user?.role === "SALES_COMPANY_ADMIN")
      values.role = "SALES";
    if (resource === "orders" && root.user?.role === "SALES")
      values.salesUserId = root.user.id;
    form.setFieldsValue(values);
    let live = true;
    Promise.all(
      [...new Set(fields.map((f) => f.source).filter(Boolean))].map(
        async (source) => {
          let data: Row[];
          if (source === "unit-types") {
            const settings = await options("settings", {
              key: "unit_types",
            });
            data = (settings[0]?.value ?? [])
              .filter((x) => x.enabled || row?.unitTypeCode === x.code)
              .map((x) => ({
                value: x.code,
                label: t(x.name),
              }));
          } else {
            const rows = await options(
              source === "sales-users" ? "users" : source!,
            );
            data = rows
              .filter(
                (x) =>
                  source !== "sales-users" ||
                  ["SALES", "SALES_COMPANY_ADMIN"].includes(x.role),
              )
              .map((x) => ({
                value: x.id,
                label:
                  x.name ?? x.orderNo ?? `${x.projectName ?? ""} · ${x.unitNo}`,
              }));
          }
          return [source, data] as const;
        },
      ),
    )
      .then((entries) => {
        if (live) setLookups(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      });
    return () => {
      live = false;
    };
  }, [resource, row?.id]);
  async function save() {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError("");
      const data: Row = {};
      for (const f of fields) {
        let value = values[f.key];
        if (value === undefined || value === null || value === "") {
          if (f.type === "json") continue;
          if (f.type === "switch") value = false;
          else if (
            row &&
            !f.required &&
            ["text", "textarea"].includes(f.type || "text")
          )
            value = "";
          else continue;
        }
        if (f.type === "date") value = value.format("YYYY-MM-DD");
        if (f.type === "json") value = JSON.parse(value);
        data[f.key] = value;
      }
      if (resource === "incomes")
        data.recurrenceRule = {
          frequency: values.recurrenceRule || "ONCE",
        };
      for (const key of lockedFields) data[key] = initial[key];
      if (row) {
        data.revision = row.revision;
        if (resource === "orders") data.reason = values.reason;
        await api.patch(`/${resource}/${row.id}`, data);
      } else await api.post("/" + resource, data);
      message.success(row ? "修改已保存" : "创建成功");
      root.invalidate();
      onSaved();
    } catch (e: any) {
      if (!e.errorFields) setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Drawer
      title={t((row ? "编辑" : "新建") + config.title.replace("管理", ""))}
      open
      width={720}
      onClose={onClose}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2.5 p-[5px]">
          <Button onClick={onClose}>{t("取消")}</Button>
          <Button type="primary" loading={loading} onClick={save}>
            {t("保存")}
            {t(row ? "修改" : "")}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="[&_.ant-form-item-label_label]:text-xs"
      >
        {error && (
          <Alert type="error" showIcon message={t(error)} className="mb-5" />
        )}
        <div className="mb-5 bg-[#f5f7fa] px-[15px] py-3 font-semibold">
          {t("基本信息")}
        </div>
        <div className="grid grid-cols-2 gap-x-5 max-[760px]:grid-cols-1">
          {fields.map((f) => (
            <Form.Item
              key={f.key}
              name={f.key}
              label={t(f.label)}
              valuePropName={f.type === "switch" ? "checked" : "value"}
              className={
                f.span === 2 ? "col-span-2 max-[760px]:col-span-1" : ""
              }
              rules={[
                {
                  required: f.required,
                  message: "请填写" + f.label,
                },
                ...(f.key === "password"
                  ? [
                      {
                        min: 10,
                        message: "密码至少 10 位",
                      },
                    ]
                  : []),
              ]}
            >
              {t(renderFieldControl(f, lookups))}
            </Form.Item>
          ))}
          {row && resource === "orders" && (
            <Form.Item
              name="reason"
              label={t("修改原因")}
              rules={[
                {
                  required: true,
                },
              ]}
              className="col-span-2 max-[760px]:col-span-1"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          )}
        </div>
      </Form>
    </Drawer>
  );
});
