import type { UploadFile } from "antd";
import { ProjectCreateSection } from "./ProjectCreateSection";
import { ProjectLogoField } from "./ProjectLogoField";
import {
  ProjectUploadField,
  type ProjectUploads,
  type ProjectUploadCategory,
} from "./ProjectUploadField";

export function ProjectMediaFields({
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
    <ProjectCreateSection title="项目图片与展示资料">
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
    </ProjectCreateSection>
  );
}
