import {
  FileTextOutlined,
  PictureOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { MediaCategory, MediaGalleryModal } from "./MediaGalleryModal";

export function ProjectMediaCards({
  materials: allMaterials,
}: {
  materials: Row[];
}) {
  const materials = allMaterials.filter((row) => row.storageKey);
  const [open, setOpen] = useState<MediaCategory>();

  const cards = [
    {
      key: "PHOTO" as const,
      title: "项目图片",
      suffix: "张",
      icon: <PictureOutlined aria-hidden />,
    },
    {
      key: "VIDEO" as const,
      title: "项目视频",
      suffix: "个",
      icon: <PlayCircleOutlined aria-hidden />,
    },
    {
      key: "PROJECT_FILE" as const,
      title: "项目文件",
      suffix: "个文件",
      icon: <FileTextOutlined aria-hidden />,
    },
  ];
  const chosen = materials.filter((item) => item.category === open);

  return (
    <>
      <div className="grid grid-cols-3 max-[600px]:grid-cols-1">
        {cards.map((card) => {
          const count = materials.filter(
            (item) => item.category === card.key,
          ).length;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setOpen(card.key)}
              className="flex min-h-12 min-w-0 items-center justify-center gap-1 border-r border-[#e1e7ef] px-1 text-[13px] font-medium text-[#1b355d] transition-colors hover:bg-[#f5f8fc] last:border-r-0 focus-visible:outline-2 focus-visible:outline-[#192d4c] max-[600px]:border-r-0 max-[600px]:border-b max-[600px]:last:border-b-0"
            >
              <span className="text-[18px]" aria-hidden>
                {card.icon}
              </span>
              <span className="whitespace-nowrap">{t(card.title)}</span>
              <span className="shrink-0 whitespace-nowrap text-[11px] font-normal text-[#8290a8]">
                {t(
                  count
                    ? `${count} ${card.suffix}`
                    : card.key === "PROJECT_FILE"
                      ? "暂无文件"
                      : `0 ${card.suffix}`,
                )}
              </span>
            </button>
          );
        })}
      </div>
      <MediaGalleryModal
        category={open}
        title={cards.find((card) => card.key === open)?.title || "项目资料"}
        items={chosen}
        onClose={() => setOpen(undefined)}
      />
    </>
  );
}
