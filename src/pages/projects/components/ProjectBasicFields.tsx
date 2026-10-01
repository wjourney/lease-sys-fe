import { DatePicker, Form, Input, InputNumber, Select } from "antd";
import dayjs from "dayjs";
import { t } from "../../../shared/i18n";
import { ProjectUploads, ProjectUploadCategory } from "./ProjectUploadField";
import type { UploadFile } from "antd";
import { ProjectCreateSection } from "./ProjectCreateSection";
import { ProjectLogoField } from "./ProjectLogoField";
import { ProjectUploadField } from "./ProjectUploadField";

const regionOptions = ["港岛", "九龙", "新界", "离岛"].map((value) => ({
  value,
  label: t(value),
}));

export function ProjectBasicFields({
  uploads,
  onUploadChange,
  isEdit,
}: {
  uploads: ProjectUploads;
  onUploadChange: (
    category: ProjectUploadCategory,
    files: UploadFile[],
  ) => void;
  isEdit?: boolean;
}) {
  const form = Form.useFormInstance();
  const completionDate = Form.useWatch("completionDate", form);
  const age = completionDate
    ? Math.max(0, dayjs().diff(completionDate, "year"))
    : undefined;

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
      <ProjectLogoField
        files={uploads.LOGO}
        onChange={(files) => onUploadChange("LOGO", files)}
      />
      <ProjectUploadField
        category="PHOTO"
        label="项目图片"
        prompt="上传项目图片"
        files={uploads}
        onChange={onUploadChange}
        accept=".png,.jpg,.jpeg,.webp"
        allowedTypes={["image/png", "image/jpeg", "image/webp"]}
      />
      <ProjectUploadField
        category="VIDEO"
        label="项目视频"
        prompt="上传项目视频"
        files={uploads}
        onChange={onUploadChange}
        accept=".mp4"
        allowedTypes={["video/mp4"]}
      />
      <ProjectUploadField
        category="PROJECT_FILE"
        label="项目文件"
        prompt="上传项目文件"
        files={uploads}
        onChange={onUploadChange}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        allowedTypes={[
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
        ]}
      />
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
      <Form.Item
        name="propertyName"
        label={t("物业名称")}
        rules={[{ required: true, message: "请输入物业名称" }]}
      >
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
      <Form.Item name="developmentDate" label={t("开发日期")}>
        <DatePicker placeholder={t("请选择日期")} />
      </Form.Item>
      <Form.Item name="completionDate" label={t("落成日期")}>
        <DatePicker placeholder={t("请选择日期")} />
      </Form.Item>
      <Form.Item label={t("楼龄")}>
        <Input
          readOnly
          value={age === undefined ? "" : `${age} 年`}
          placeholder={t("根据落成日期自动计算")}
        />
      </Form.Item>
      <Form.Item name="salesStatus" label={t("销售状态")}>
        <Select
          options={["现售", "待售", "售罄"].map((value) => ({
            value,
            label: t(value),
          }))}
        />
      </Form.Item>
      <Form.Item name="buildingStatus" label={t("现况")}>
        <Select
          options={["现楼", "楼花", "建设中"].map((value) => ({
            value,
            label: t(value),
          }))}
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
