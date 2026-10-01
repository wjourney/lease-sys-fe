import {
  FileTextOutlined,
  PictureOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Image, Modal, Spin } from "antd";
import { useState, type ReactNode } from "react";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

type MediaKind = "PHOTO" | "VIDEO" | "PROJECT_FILE";

const downloadUrl = (id: string) => `/api/v1/materials/${id}/download`;

export function UnitDetailMedia({
  materials,
  loading,
  error,
}: {
  materials: Row[];
  loading: boolean;
  error: string;
}) {
  const [open, setOpen] = useState<MediaKind>();
  const categories: {
    key: MediaKind;
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
      {error && <Alert type="error" showIcon message={t(error)} />}
      <Spin spinning={loading}>
        <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
          {categories.map((category) => {
            const count = materials.filter(
              (item) => item.category === category.key,
            ).length;
            return (
              <button
                key={category.key}
                type="button"
                disabled={loading}
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
      </Spin>
      <Modal
        open={!!open}
        title={t(
          categories.find((item) => item.key === open)?.title || "单位资料",
        )}
        width={760}
        footer={<Button onClick={() => setOpen(undefined)}>{t("关闭")}</Button>}
        onCancel={() => setOpen(undefined)}
        destroyOnClose
      >
        <div className="max-h-[65vh] overflow-y-auto">
          {!chosen.length ? (
            <Empty description={t("暂无资料")} className="py-6" />
          ) : open === "PHOTO" ? (
            <Image.PreviewGroup>
              <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-2">
                {chosen.map((item) => (
                  <Image
                    key={item.id}
                    src={downloadUrl(item.id)}
                    alt={item.originalName || item.title}
                    className="!h-40 !w-full rounded object-cover"
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : open === "VIDEO" ? (
            <div className="space-y-4">
              {chosen.map((item) => (
                <div key={item.id}>
                  <p className="mb-2 text-sm font-medium text-[#26334a]">
                    {t(item.originalName || item.title)}
                  </p>
                  <video
                    controls
                    preload="metadata"
                    aria-label={t(item.originalName || item.title)}
                    src={downloadUrl(item.id)}
                    className="max-h-[420px] w-full rounded bg-black"
                  />
                </div>
              ))}
            </div>
          ) : open === "PROJECT_FILE" ? (
            <div className="space-y-2">
              {chosen.map((item) => (
                <a
                  key={item.id}
                  href={downloadUrl(item.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded border border-[#dfe6ee] px-4 py-3 text-[13px] text-[#192d4c] hover:bg-[#f5f8fc]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileTextOutlined aria-hidden />
                    <span className="truncate">
                      {t(item.originalName || item.title)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[#77869c]">{t("预览")}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
