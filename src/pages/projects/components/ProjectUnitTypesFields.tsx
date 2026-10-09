import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Tooltip } from "antd";
import { t } from "../../../shared/i18n";

export function ProjectUnitTypesFields({
  usage = {},
}: {
  usage?: Record<string, number>;
}) {
  const form = Form.useFormInstance();
  const typeConfigs = Form.useWatch("typeConfigs", form) ?? [];
  const required = [{ required: true, message: t("请填写此项") }];
  return (
    <section className="rounded-lg border border-[#e0e6ed] bg-white p-6 max-[640px]:p-4">
      <h2 className="mb-2 text-sm font-semibold">
        {t("项目单位类型（必填）")}
      </h2>
      <p className="mb-4 text-sm text-[#73819a]">
        {t(
          "每个类型固定期/座、楼层、面积等信息，创建单位时自动带入。不同楼层或户型请分别配置；已有单位使用的类型不能删除。",
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
                .map((row: { name?: string }) => row.name?.trim())
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
                className="mb-4 rounded-md border border-[#e0e6ed] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <strong>{t(`单位类型 ${name + 1}`)}</strong>
                  <div className="flex gap-2">
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const value = form.getFieldValue(["typeConfigs", name]);
                        add({
                          ...value,
                          code: crypto.randomUUID(),
                          name: `${value.name || "类型"}（副本）`,
                        });
                      }}
                    >
                      {t("复制类型")}
                    </Button>
                    <Tooltip
                      title={
                        usage[typeConfigs[name]?.code]
                          ? t("已有单位使用该类型，无法删除")
                          : fields.length === 1
                            ? t("至少保留一个单位类型")
                            : undefined
                      }
                    >
                      <span
                        className="inline-flex"
                        tabIndex={
                          usage[typeConfigs[name]?.code] || fields.length === 1
                            ? 0
                            : undefined
                        }
                      >
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label={t("删除类型")}
                          disabled={
                            !!usage[typeConfigs[name]?.code] ||
                            fields.length === 1
                          }
                          onClick={() => remove(name)}
                        />
                      </span>
                    </Tooltip>
                  </div>
                </div>
                <Form.Item {...rest} name={[name, "code"]} hidden>
                  <Input />
                </Form.Item>
                <div className="grid grid-cols-2 gap-x-5 max-[640px]:grid-cols-1">
                  {[
                    ["name", "类型名称", "例如：A座12楼两房"],
                    ["building", "期 / 座", "例如：A座"],
                    ["floor", "楼层", "例如：12"],
                    ["layout", "间隔", "例如：1室1厅"],
                  ].map(([field, label, placeholder]) => (
                    <Form.Item
                      key={field}
                      {...rest}
                      name={[name, field]}
                      label={t(label)}
                      rules={[
                        ...required,
                        { whitespace: true, message: t("请填写此项") },
                      ]}
                    >
                      <Input placeholder={t(placeholder)} />
                    </Form.Item>
                  ))}
                  <Form.Item
                    {...rest}
                    name={[name, "area"]}
                    label={t("实用面积（㎡）")}
                    rules={required}
                  >
                    <InputNumber
                      className="!w-full"
                      stringMode
                      min="0.01"
                      precision={2}
                    />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, "minRent"]}
                    label={t("最低价（HKD）")}
                    rules={required}
                  >
                    <InputNumber
                      className="!w-full"
                      stringMode
                      min="0"
                      precision={2}
                    />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, "maxRent"]}
                    label={t("最高价（HKD）")}
                    dependencies={[["typeConfigs", name, "minRent"]]}
                    rules={[
                      ...required,
                      {
                        validator: async (_, value) => {
                          if (
                            value != null &&
                            Number(value) <
                              Number(
                                form.getFieldValue([
                                  "typeConfigs",
                                  name,
                                  "minRent",
                                ]),
                              )
                          )
                            throw new Error(t("最高价不得低于最低价"));
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      className="!w-full"
                      stringMode
                      min="0"
                      precision={2}
                    />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, "referenceRent"]}
                    label={t("月租价格（HKD）")}
                    dependencies={[
                      ["typeConfigs", name, "minRent"],
                      ["typeConfigs", name, "maxRent"],
                    ]}
                    rules={[
                      ...required,
                      {
                        validator: async (_, value) => {
                          const type = form.getFieldValue([
                            "typeConfigs",
                            name,
                          ]);
                          if (
                            value != null &&
                            type?.minRent != null &&
                            type?.maxRent != null &&
                            (Number(value) < Number(type.minRent) ||
                              Number(value) > Number(type.maxRent))
                          )
                            throw new Error(
                              t("月租价格须在最低价和最高价之间"),
                            );
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      className="!w-full"
                      stringMode
                      min="0"
                      precision={2}
                    />
                  </Form.Item>
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
