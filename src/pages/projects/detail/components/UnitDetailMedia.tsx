import {
  FileTextOutlined,
  PictureOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import { useState, type ReactNode } from "react";
import type { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { MediaGalleryModal, type MediaCategory } from "./MediaGalleryModal";

const mediaUrl = (item: Row) =>
  item.previewUrl ||
  item.downloadUrl ||
  `/api/v1/materials/${item.id}/download`;

function MediaSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#e0e6ed] bg-white p-4">
      <h3 className="m-0 mb-3 text-[14px] font-semibold text-[#26334a]">
        {t(title)}（{count}）
      </h3>
      {children}
    </section>
  );
}

export function UnitDetailMedia({ materials }: { materials: Row[] }) {
  const [preview, setPreview] = useState<{
    category: MediaCategory;
    index: number;
  }>();
  const photos = materials.filter((item) => item.category === "PHOTO");
  const videos = materials.filter((item) => item.category === "VIDEO");
  const files = materials.filter((item) => item.category === "PROJECT_FILE");
  const selectedItems =
    preview?.category === "PHOTO"
      ? photos
      : preview?.category === "VIDEO"
        ? videos
        : files;

  return (
    <>
      <div className="space-y-3">
        {(
          [
            ["PHOTO", "单位图片", photos],
            ["VIDEO", "单位视频", videos],
          ] as const
        ).map(([category, title, items]) => (
          <MediaSection key={category} title={title} count={items.length}>
            {items.length ? (
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreview({ category, index })}
                    aria-label={t(`查看第 ${index + 1} 个${title}`)}
                    className="group relative h-[84px] w-[112px] shrink-0 overflow-hidden rounded-md border border-[#dfe6ee] bg-[#f3f6f9] hover:border-[#17355d] focus-visible:outline-2 focus-visible:outline-[#17355d]"
                  >
                    {category === "PHOTO" ? (
                      <img
                        src={mediaUrl(item)}
                        alt={t(item.originalName || `单位图片 ${index + 1}`)}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <video
                          src={mediaUrl(item)}
                          preload="metadata"
                          muted
                          aria-hidden
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                          <PlayCircleFilled
                            className="text-3xl drop-shadow"
                            aria-hidden
                          />
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center gap-2 rounded-md bg-[#f6f8fa] text-[13px] text-[#8390a3]">
                {category === "PHOTO" ? (
                  <PictureOutlined aria-hidden />
                ) : (
                  <PlayCircleFilled aria-hidden />
                )}
                {t(`暂无${title}`)}
              </div>
            )}
          </MediaSection>
        ))}
        <MediaSection title="单位文件" count={files.length}>
          {files.length ? (
            <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
              {files.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setPreview({ category: "PROJECT_FILE", index })
                  }
                  title={t(item.originalName || item.title || "文件")}
                  className="flex min-w-0 items-center gap-2 rounded-md border border-[#dfe6ee] px-3 py-2.5 text-left text-[13px] text-[#26334a] hover:border-[#17355d] hover:bg-[#f6f8fa] focus-visible:outline-2 focus-visible:outline-[#17355d]"
                >
                  <FileTextOutlined
                    className="shrink-0 text-[#6681a4]"
                    aria-hidden
                  />
                  <span className="truncate">
                    {t(item.originalName || item.title || "文件")}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center gap-2 rounded-md bg-[#f6f8fa] text-[13px] text-[#8390a3]">
              <FileTextOutlined aria-hidden />
              {t("暂无单位文件")}
            </div>
          )}
        </MediaSection>
      </div>
      <MediaGalleryModal
        category={preview?.category}
        title={
          preview?.category === "PHOTO"
            ? "单位图片"
            : preview?.category === "VIDEO"
              ? "单位视频"
              : "单位文件"
        }
        items={selectedItems}
        initialIndex={preview?.index || 0}
        onClose={() => setPreview(undefined)}
      />
    </>
  );
}
