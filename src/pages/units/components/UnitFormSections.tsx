import { unitTypeDetails } from "../unit-type-display";
import { Collapse, Descriptions, Form, Input, Select } from "antd";
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
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e0e6ed] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold">{t("单位信息（必填）")}</h2>
        <div className="grid grid-cols-2 gap-x-6 max-[640px]:grid-cols-1">
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
          <div className="mt-2 rounded-md bg-[#f5f7fa] p-5">
            <h3 className="mb-4 text-sm font-semibold">
              {t("类型资料（自动带入）")}
            </h3>
            <Descriptions
              column={{ xs: 1, sm: 2, md: 2 }}
              items={unitTypeDetails(selectedType).map(([label, value]) => ({
                key: label,
                label: t(label),
                children: value ?? "—",
              }))}
            />
            <p className="mb-0 text-sm text-[#73819a]">
              {t("以上资料由项目的单位类型统一配置，在此不可修改。")}
            </p>
          </div>
        )}
      </section>
      <Collapse
        items={[
          {
            key: "media",
            label: t("补充资料（选填）"),
            children: (
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
            ),
          },
        ]}
      />
    </div>
  );
}
