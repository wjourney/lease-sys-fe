import type { UploadFile } from "antd";
import { t } from "../../../shared/i18n";
import {
  ProjectUploadCategory,
  ProjectUploadField,
  ProjectUploads,
} from "./ProjectUploadField";
import { ProjectCreateSection } from "./ProjectCreateSection";

export function ProjectFilesFields({
  uploads,
  onUploadChange,
}: {
  uploads: ProjectUploads;
  onUploadChange: (
    category: ProjectUploadCategory,
    files: UploadFile[],
  ) => void;
}) {
  return (
    <ProjectCreateSection
      title="文件与开单资料"
      columns={2}
      footer={
        <p className="m-0 text-xs text-[#8190a6]">
          {t("官方文件保留版本与检视记录；资料分类在项目详情中管理。")}
        </p>
      }
    >
      <ProjectUploadField
        category="OFFICIAL"
        label="官方文件"
        prompt="上传说明书、价单、销售安排等"
        files={uploads}
        onChange={onUploadChange}
      />
      <ProjectUploadField
        category="MARKETING"
        label="营销资料"
        prompt="上传相册、视频、攻略及资讯"
        files={uploads}
        onChange={onUploadChange}
      />
      <ProjectUploadField
        category="GUIDE"
        label="开单指南"
        prompt="入票 / 退票方法、文字或文件"
        files={uploads}
        onChange={onUploadChange}
      />
      <ProjectUploadField
        category="TEMPLATE"
        label="合同模板"
        prompt="上传销售 / 租赁合同模板"
        files={uploads}
        onChange={onUploadChange}
      />
    </ProjectCreateSection>
  );
}
