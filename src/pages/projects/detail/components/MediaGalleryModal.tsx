import {
  DownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Empty, Modal } from "antd";
import { useEffect, useState } from "react";
import type { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export type MediaCategory = "PHOTO" | "VIDEO" | "PROJECT_FILE";

const mediaUrl = (item: Row) =>
  item.previewUrl ||
  item.downloadUrl ||
  `/api/v1/materials/${item.id}/download`;

const attachmentUrl = (item: Row) =>
  `${item.downloadUrl || `/api/v1/materials/${item.id}/download`}?download=1`;

export function MediaGalleryModal({
  category,
  title,
  items,
  initialIndex = 0,
  onClose,
}: {
  category?: MediaCategory;
  title: string;
  items: Row[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => setIndex(initialIndex), [category, initialIndex]);
  const currentIndex = Math.min(index, Math.max(0, items.length - 1));
  const item = items[currentIndex];
  const name = item?.originalName || item?.title || "文件";
  const isImage = category === "PHOTO" || item?.mimeType?.startsWith("image/");
  const isPdf = item?.mimeType === "application/pdf";

  return (
    <Modal
      open={!!category}
      title={t(title)}
      width={900}
      onCancel={onClose}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t("关闭")}</Button>
          {item && (
            <Button
              type="primary"
              icon={<DownloadOutlined aria-hidden />}
              href={attachmentUrl(item)}
            >
              {t("下载")}
            </Button>
          )}
        </div>
      }
    >
      {!item ? (
        <Empty description={t("暂无资料")} className="py-8" />
      ) : (
        <div>
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3 text-sm">
            <span
              className="min-w-0 truncate font-medium text-[#26334a]"
              title={name}
            >
              {t(name)}
            </span>
            <span className="shrink-0 text-[#7d8a9d]">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
          <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 max-[600px]:grid-cols-[32px_minmax(0,1fr)_32px] max-[600px]:gap-1">
            <Button
              type="text"
              icon={<LeftOutlined aria-hidden />}
              aria-label={t("上一个")}
              disabled={items.length < 2}
              onClick={() =>
                setIndex((value) => (value - 1 + items.length) % items.length)
              }
            />
            <div className="flex h-[min(55vh,520px)] min-h-52 min-w-0 items-center justify-center overflow-hidden rounded-md bg-[#f5f6f8]">
              {isImage ? (
                <img
                  key={item.id}
                  src={mediaUrl(item)}
                  alt={name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : category === "VIDEO" ? (
                <video
                  key={item.id}
                  controls
                  preload="metadata"
                  aria-label={t(name)}
                  src={mediaUrl(item)}
                  className="max-h-full w-full bg-black"
                />
              ) : isPdf ? (
                <iframe
                  key={item.id}
                  title={t(name)}
                  src={mediaUrl(item)}
                  className="h-full w-full border-0 bg-white"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#7d8a9d]">
                  <FileTextOutlined className="text-4xl" aria-hidden />
                  <span>{t("此文件可下载查看")}</span>
                </div>
              )}
            </div>
            <Button
              type="text"
              icon={<RightOutlined aria-hidden />}
              aria-label={t("下一个")}
              disabled={items.length < 2}
              onClick={() => setIndex((value) => (value + 1) % items.length)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
