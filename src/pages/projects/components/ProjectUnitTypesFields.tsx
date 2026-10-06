import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber } from "antd";
import { t } from "../../../shared/i18n";

export function ProjectUnitTypesFields() {
  const form = Form.useFormInstance();
  const required = [{ required: true, message: t("请填写此项") }];
  return (
    <section className="rounded-lg bg-[#f5f6f8] p-5">
      <h2 className="mb-2 text-sm font-semibold">{t("项目单位类型")}</h2>
      <p className="mb-4 text-sm text-[#73819a]">
        {t(
          "类型仅用于当前项目；创建单位时带入对应的面积、参考月租范围。已有单位使用的类型不能删除。",
        )}
      </p>
      <Form.List
        name="typeConfigs"
        rules={[
          {
            validator: async (_, rows) => {
              if (!rows?.length)
                throw new Error(t("请至少配置一种项目单位类型"));
              const names = rows
                .map((r: { name?: string }) => r?.name?.trim())
                .filter(Boolean);
              if (new Set(names).size !== names.length)
                throw new Error(t("同一项目的类型名称不能重复"));
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <div
                key={key}
                className="mb-3 rounded-md border border-[#e0e6ed] bg-white p-3"
              >
                <Form.Item {...rest} name={[name, "code"]} hidden>
                  <Input />
                </Form.Item>
                <div className="flex items-start gap-3">
                  <Form.Item
                    {...rest}
                    name={[name, "name"]}
                    label={t("类型名称")}
                    rules={[
                      ...required,
                      { whitespace: true, message: t("请填写类型名称") },
                    ]}
                    className="flex-1"
                  >
                    <Input
                      placeholder={t("例如：大单位、小单位")}
                      maxLength={50}
                    />
                  </Form.Item>
                  <Button
                    className="mt-7"
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label={t("删除类型")}
                    onClick={() => remove(name)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-4 max-[560px]:grid-cols-1">
                  {(
                    [
                      ["minArea", "最小面积（㎡）"],
                      ["maxArea", "最大面积（㎡）"],
                      ["minRent", "最低月租（HKD）"],
                      ["maxRent", "最高月租（HKD）"],
                    ] as const
                  ).map(([field, label]) => (
                    <Form.Item
                      key={field}
                      {...rest}
                      name={[name, field]}
                      label={t(label)}
                      rules={[
                        ...required,
                        {
                          validator: async (_, value) => {
                            if (value == null || value === "") return;
                            const lower =
                              field === "maxArea"
                                ? "minArea"
                                : field === "maxRent"
                                  ? "minRent"
                                  : undefined;
                            if (
                              lower &&
                              Number(value) <
                                Number(
                                  form.getFieldValue([
                                    "typeConfigs",
                                    name,
                                    lower,
                                  ]),
                                )
                            )
                              throw new Error(t("上限不能小于下限"));
                          },
                        },
                      ]}
                      dependencies={
                        field === "maxArea"
                          ? [["typeConfigs", name, "minArea"]]
                          : field === "maxRent"
                            ? [["typeConfigs", name, "minRent"]]
                            : []
                      }
                    >
                      <InputNumber
                        className="!w-full"
                        stringMode
                        min={field.includes("Area") ? "0.01" : "0"}
                        precision={2}
                      />
                    </Form.Item>
                  ))}
                </div>
              </div>
            ))}
            <Form.ErrorList errors={errors} />
            <Button
              icon={<PlusOutlined />}
              onClick={() => add({ code: crypto.randomUUID() })}
            >
              {t("新增类型")}
            </Button>
          </>
        )}
      </Form.List>
    </section>
  );
}
