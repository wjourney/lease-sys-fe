import { InfoCircleOutlined } from "@ant-design/icons";
import { unitTypeDetails } from "../unit-type-display";
import { Form, Input, Select, Tooltip } from "antd";
import type { UploadFile } from "antd";
import { type Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { UnitMediaCategory, UnitMediaField } from "./UnitMediaField";
type Option = { value: string; label: string };
export function UnitFormSections({
  projects,
  unitTypes,
  projectLocked,
  selectedType,
  media,
  onMediaChange,
}: {
  projects: Option[];
  unitTypes: Option[];
  projectLocked: boolean;
  selectedType?: Row;
  media: Record<UnitMediaCategory, UploadFile[]>;
  onMediaChange: (category: UnitMediaCategory, files: UploadFile[]) => void;
}) {
  const required = [{ required: true, message: t("请填写此项") }];
  const typeHint = "以上资料由项目的单位类型统一配置，在此不可修改。";
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e0e6ed] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold">{t("单位信息（必填）")}</h2>
        <div className="grid grid-cols-3 gap-x-5 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
          <Form.Item name="projectId" label={t("所属项目")} rules={required}>
            <Select options={projects} disabled={projectLocked} />
          </Form.Item>
          <Form.Item name="unitTypeCode" label={t("单位类型")} rules={required}>
            <Select options={unitTypes} placeholder={t("请选择单位类型")} />
          </Form.Item>
          <Form.Item
            name="roomNo"
            label={t("房号")}
            rules={[
              ...required,
              { whitespace: true, message: t("请填写房号") },
            ]}
          >
            <Input placeholder={t("例如：1201")} />
          </Form.Item>
        </div>
        {selectedType && (
          <section className="overflow-hidden rounded-lg border border-[#e0e6ed] bg-[#f8fafc]">
            <div className="flex min-h-11 items-center gap-2 border-b border-[#e0e6ed] px-4 py-3">
              <h3 className="m-0 text-sm font-semibold leading-5 text-[#26334a]">
                {t("类型资料（自动带入）")}
              </h3>
              <Tooltip title={t(typeHint)}>
                <button
                  type="button"
                  aria-label={t("查看类型资料说明")}
                  className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border-0 bg-transparent p-0 leading-none text-[#8291a5] hover:text-[#17355d] focus-visible:outline-2 focus-visible:outline-[#17355d]"
                >
                  <InfoCircleOutlined
                    aria-hidden
                    className="relative -top-[2px] flex items-center justify-center leading-none [&_svg]:block"
                  />
                </button>
              </Tooltip>
            </div>
            <dl className="m-0 grid grid-cols-3 gap-px bg-[#e7edf3] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
              {unitTypeDetails(selectedType).map(([label, value]) => (
                <div key={label} className="min-w-0 bg-[#f8fafc] px-4 py-3">
                  <dt className="text-xs leading-5 text-[#75839a]">
                    {t(label)}
                  </dt>
                  <dd className="m-0 mt-1 break-words text-sm font-medium leading-5 text-[#26334a]">
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </section>
      <section className="rounded-lg border border-[#e0e6ed] bg-white p-6">
        <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
          {(
            [
              ["PHOTO", "单位图片", "添加图片"],
              ["VIDEO", "单位视频", "添加视频"],
              ["PROJECT_FILE", "单位文件", "添加文件"],
            ] as const
          ).map(([category, label, prompt]) => (
            <UnitMediaField
              key={category}
              category={category}
              label={label}
              prompt={prompt}
              files={media[category]}
              onChange={onMediaChange}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
