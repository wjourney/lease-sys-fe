import type { UploadFile } from "antd";
import { ProjectCreateSection } from "./ProjectCreateSection";
import { ProjectImageField } from "./ProjectImageField";
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
    <ProjectCreateSection title="项目素材与文件（选填）">
      <ProjectImageField
        files={uploads.PHOTO}
        onChange={(files) => onUploadChange("PHOTO", files)}
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
