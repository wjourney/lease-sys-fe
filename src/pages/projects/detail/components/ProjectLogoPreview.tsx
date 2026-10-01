import { PictureOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { options, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { useRoot } from "../../../../stores/root";
import { MediaGalleryModal } from "./MediaGalleryModal";

export function ProjectLogoPreview({ projectId }: { projectId: string }) {
  const root = useRoot();
  const [logos, setLogos] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLogos([]);
    void options("materials", { projectId })
      .then((rows) => {
        if (active)
          setLogos(
            rows
              .filter((row) => row.category === "LOGO" && row.storageKey)
              .sort(
                (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
              ),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [projectId, root.epoch]);

  const primary = logos[0];
  return (
    <>
      {primary ? (
        <button
          type="button"
          className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#dfe6ee] bg-[#f5f6f8] p-1 transition-colors hover:border-[#9cb0c9] focus-visible:outline-2 focus-visible:outline-[#192d4c] max-[600px]:size-20"
          onClick={() => setOpen(true)}
          aria-label={t(`预览项目 Logo，共 ${logos.length} 张`)}
        >
          <img
            src={`/api/v1/materials/${primary.id}/download`}
            alt={t("项目 Logo")}
            className="max-h-full max-w-full object-contain"
          />
        </button>
      ) : (
        <div
          className="flex size-28 shrink-0 items-center justify-center rounded-md border border-[#dfe6ee] bg-[#f5f6f8] text-[#9eacbf] max-[600px]:size-20"
          aria-label={t("暂无项目 Logo")}
        >
          <PictureOutlined className="text-3xl" aria-hidden />
        </div>
      )}
      {open && (
        <MediaGalleryModal
          category="LOGO"
          title="项目 Logo"
          items={logos}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
