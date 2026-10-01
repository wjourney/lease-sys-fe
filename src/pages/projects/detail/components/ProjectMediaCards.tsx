import {
  FileTextOutlined,
  PictureOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Alert, Empty, Image, Modal, Spin } from "antd";
import { useEffect, useState } from "react";
import { Row, errorMessage, options } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { useRoot } from "../../../../stores/root";

type MediaKind = "photos" | "videos" | "files";
const downloadUrl = (id: string) => `/api/v1/materials/${id}/download`;

export function ProjectMediaCards({ projectId }: { projectId: string }) {
  const root = useRoot();
  const [materials, setMaterials] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<MediaKind>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    options("materials", { projectId })
      .then((rows) => {
        if (active) setMaterials(rows.filter((row) => row.storageKey));
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, root.epoch]);

  const photos = materials.filter((row) => row.category === "PHOTO");
  const videos = materials.filter((row) => row.category === "VIDEO");
  const files = materials.filter((row) => row.category === "PROJECT_FILE");
  const cards = [
    {
      key: "photos" as const,
      title: "项目图片",
      hint: `${photos.length} 张`,
      icon: <PictureOutlined aria-hidden />,
    },
    {
      key: "videos" as const,
      title: "项目视频",
      hint: `${videos.length} 个`,
      icon: <PlayCircleOutlined aria-hidden />,
    },
    {
      key: "files" as const,
      title: "项目文件",
      hint: files.length ? `${files.length} 个文件` : "暂无文件",
      icon: <FileTextOutlined aria-hidden />,
    },
  ];
  const chosen =
    open === "photos" ? photos : open === "videos" ? videos : files;

  return (
    <>
      {error && (
        <Alert type="error" showIcon message={t(error)} className="mb-3" />
      )}
      <Spin spinning={loading}>
        <div className="grid grid-cols-3 max-[600px]:grid-cols-1">
          {cards.map((card) => (
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
                {t(card.hint)}
              </span>
            </button>
          ))}
        </div>
      </Spin>
      <Modal
        open={!!open}
        title={t(cards.find((card) => card.key === open)?.title || "项目资料")}
        footer={null}
        width={720}
        onCancel={() => setOpen(undefined)}
        destroyOnClose
      >
        {!chosen.length ? (
          <Empty description={t("暂无资料")} />
        ) : open === "photos" ? (
          <Image.PreviewGroup>
            <div className="grid grid-cols-3 gap-3 max-[620px]:grid-cols-2">
              {chosen.map((item) => (
                <Image
                  key={item.id}
                  src={downloadUrl(item.id)}
                  alt={item.originalName || item.title}
                  className="!h-[145px] !w-full rounded object-cover"
                />
              ))}
            </div>
          </Image.PreviewGroup>
        ) : open === "videos" ? (
          <div className="space-y-5">
            {chosen.map((item) => (
              <div key={item.id}>
                <p className="mb-2 font-medium">
                  {t(item.originalName || item.title)}
                </p>
                <video
                  controls
                  preload="metadata"
                  className="max-h-[400px] w-full rounded bg-black"
                  src={downloadUrl(item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {chosen.map((item) => (
              <a
                key={item.id}
                href={downloadUrl(item.id)}
                target="_blank"
                rel="noreferrer"
                className="block rounded border border-[#e2e7ee] px-4 py-3 text-[#192d4c] hover:bg-[#f5f6f8]"
              >
                <FileTextOutlined aria-hidden className="mr-2" />
                {t(item.originalName || item.title)}
              </a>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
