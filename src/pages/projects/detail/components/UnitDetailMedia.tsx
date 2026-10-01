import {
  FileTextOutlined,
  PictureOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useState, type ReactNode } from "react";
import type { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { MediaCategory, MediaGalleryModal } from "./MediaGalleryModal";

export function UnitDetailMedia({ materials }: { materials: Row[] }) {
  const [open, setOpen] = useState<MediaCategory>();
  const categories: {
    key: MediaCategory;
    title: string;
    icon: ReactNode;
    countLabel: string;
  }[] = [
    {
      key: "PHOTO",
      title: "单位图片",
      icon: <PictureOutlined aria-hidden />,
      countLabel: "张",
    },
    {
      key: "VIDEO",
      title: "单位视频",
      icon: <PlayCircleOutlined aria-hidden />,
      countLabel: "个",
    },
    {
      key: "PROJECT_FILE",
      title: "单位文件",
      icon: <FileTextOutlined aria-hidden />,
      countLabel: "份",
    },
  ];
  const chosen = materials.filter((item) => item.category === open);

  return (
    <>
      <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
        {categories.map((category) => {
          const count = materials.filter(
            (item) => item.category === category.key,
          ).length;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setOpen(category.key)}
              className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-[#dfe6ee] bg-[#f5f6f8] px-4 text-left text-[#1b355d] transition-colors enabled:hover:border-[#a6b8cf] enabled:hover:bg-[#eef3fa] disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[#192d4c]"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span className="text-lg" aria-hidden>
                  {category.icon}
                </span>
                <span>{t(category.title)}</span>
              </span>
              <span className="shrink-0 text-xs text-[#7d8a9d]">
                {count
                  ? t(`${count} ${category.countLabel} · 预览`)
                  : t("暂无")}
              </span>
            </button>
          );
        })}
      </div>
      <MediaGalleryModal
        category={open}
        title={
          categories.find((item) => item.key === open)?.title || "单位资料"
        }
        items={chosen}
        onClose={() => setOpen(undefined)}
      />
    </>
  );
}
