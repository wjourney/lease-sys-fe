import { PictureOutlined } from "@ant-design/icons";
import { useState } from "react";
import { type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { projectImages } from "../../project-images";
import { MediaGalleryModal } from "./MediaGalleryModal";

export function ProjectLogoPreview({ materials }: { materials: Row[] }) {
  const images = projectImages(materials);
  const [open, setOpen] = useState(false);

  const primary = images[0];
  return (
    <>
      {primary ? (
        <button
          type="button"
          className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#dfe6ee] bg-[#f5f6f8] p-1 transition-colors hover:border-[#9cb0c9] focus-visible:outline-2 focus-visible:outline-[#192d4c] max-[600px]:size-20"
          onClick={() => setOpen(true)}
          aria-label={t(`预览项目图片，共 ${images.length} 张`)}
        >
          <img
            src={
              primary.previewUrl ||
              primary.downloadUrl ||
              `/api/v1/materials/${primary.id}/download`
            }
            alt={t("项目 Logo")}
            className="max-h-full max-w-full object-contain"
          />
        </button>
      ) : (
        <div
          className="flex size-24 shrink-0 items-center justify-center rounded-md border border-[#dfe6ee] bg-[#f5f6f8] text-[#9eacbf] max-[600px]:size-20"
          aria-label={t("暂无项目 Logo")}
        >
          <PictureOutlined className="text-3xl" aria-hidden />
        </div>
      )}
      {open && (
        <MediaGalleryModal
          category="PHOTO"
          title="项目图片"
          items={images}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
