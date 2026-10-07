import { Form, Input, InputNumber, Select } from "antd";
import { t } from "../../../shared/i18n";
import { ProjectCreateSection } from "./ProjectCreateSection";

const regionOptions = ["港岛", "九龙", "新界", "离岛"].map((value) => ({
  value,
  label: t(value),
}));

export function ProjectBasicFields({ isEdit }: { isEdit?: boolean }) {
  return (
    <ProjectCreateSection title="基本资料">
      <Form.Item
        name="name"
        label={t("项目中文名称")}
        rules={[{ required: true, message: "请输入项目中文名称" }]}
      >
        <Input placeholder={t("请输入项目中文名称")} />
      </Form.Item>
      <Form.Item name="nameEn" label={t("项目英文名称")}>
        <Input placeholder={t("请输入项目英文名称")} />
      </Form.Item>
      <Form.Item
        name="region"
        label={t("区域")}
        rules={[{ required: true, message: "请选择区域" }]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder={t("请选择区域")}
          options={regionOptions}
        />
      </Form.Item>
      <Form.Item name="propertyName" label={t("物业名称")}>
        <Input placeholder={t("请输入物业名称")} />
      </Form.Item>
      <Form.Item name="developer" label={t("发展商")}>
        <Input placeholder={t("请输入发展商")} />
      </Form.Item>
      <Form.Item
        name="address"
        label={t("详细地址")}
        rules={[{ required: true, message: "请输入详细地址" }]}
      >
        <Input placeholder={t("请输入详细地址")} />
      </Form.Item>
      <Form.Item name="longitude" label={t("地图经度")}>
        <InputNumber
          min={-180}
          max={180}
          precision={8}
          controls={false}
          placeholder={t("请输入经度")}
        />
      </Form.Item>
      <Form.Item name="latitude" label={t("地图纬度")}>
        <InputNumber
          min={-90}
          max={90}
          precision={8}
          controls={false}
          placeholder={t("请输入纬度")}
        />
      </Form.Item>
      <Form.Item name="usage" label={t("用途")}>
        <Select
          options={["住宅", "商业", "办公", "综合"].map((value) => ({
            value,
            label: t(value),
          }))}
        />
      </Form.Item>
      {isEdit && (
        <Form.Item name="status" label={t("项目状态")}>
          <Select
            options={[
              { value: "ACTIVE", label: t("启用") },
              { value: "DISABLED", label: t("停用") },
            ]}
          />
        </Form.Item>
      )}
    </ProjectCreateSection>
  );
}
