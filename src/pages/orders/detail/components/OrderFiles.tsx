import { PlayCircleFilled } from "@ant-design/icons";
import { Button, Card, Space, Table, Tag, Tooltip } from "antd";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import {
  MediaGalleryModal,
  type MediaCategory,
} from "../../../projects/detail/components/MediaGalleryModal";

const mediaUrl = (file: Row) =>
  file.previewUrl ||
  file.downloadUrl ||
  `/api/v1/materials/${file.id}/download`;
export function OrderFiles() {
  const { row } = useRecordDetail();
  const [preview, setPreview] = useState<{
    category: MediaCategory;
    index: number;
  }>();
  const files: Row[] = row.materials ?? [];
  const photos = files.filter(
    (file) =>
      file.category !== "CONTRACT" &&
      (file.category === "PHOTO" || file.mimeType?.startsWith("image/")),
  );
  const videos = files.filter(
    (file) =>
      file.category !== "CONTRACT" &&
      (file.category === "VIDEO" || file.mimeType?.startsWith("video/")),
  );
  const documents = files
    .filter((file) => !photos.includes(file) && !videos.includes(file))
    .sort((a, b) => {
      if (a.category !== b.category)
        return (
          Number(b.category === "CONTRACT") - Number(a.category === "CONTRACT")
        );
      if (a.category === "CONTRACT")
        return (
          Number(Boolean(b.isCurrent)) - Number(Boolean(a.isCurrent)) ||
          b.versionNo - a.versionNo
        );
      return 0;
    });
  const hasMedia = photos.length > 0 || videos.length > 0;
  const items =
    preview?.category === "PHOTO"
      ? photos
      : preview?.category === "VIDEO"
        ? videos
        : documents;
  return (
    <>
      <Card
        title={t("合同与附件")}
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-5"
      >
        <div
          className={`grid items-start gap-5 ${hasMedia ? "xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}`}
        >
          <div className="min-w-0 overflow-x-auto">
            <Table<Row>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={documents}
              locale={{ emptyText: t("暂无合同或文件") }}
              columns={[
                {
                  title: t("文件名称"),
                  render: (_, file) => (
                    <span className="break-all">
                      {t(file.title || file.originalName || "未命名文件")}
                    </span>
                  ),
                },
                {
                  title: t("版本"),
                  width: 70,
                  render: (_, file) =>
                    file.category === "CONTRACT"
                      ? `V${file.versionNo || 1}`
                      : "—",
                },
                {
                  title: t("状态"),
                  width: 112,
                  render: (_, file) =>
                    file.category === "CONTRACT" ? (
                      <Tooltip
                        title={
                          !file.isCurrent || file.status === "VOID"
                            ? [
                                file.voidReason,
                                file.voidedAt &&
                                  `${t("作废时间")}：${dateText(file.voidedAt)}`,
                              ]
                                .filter(Boolean)
                                .join(" · ")
                            : undefined
                        }
                      >
                        <Tag
                          color={
                            file.isCurrent && file.status !== "VOID"
                              ? "green"
                              : undefined
                          }
                        >
                          {t(
                            file.isCurrent && file.status !== "VOID"
                              ? "当前有效"
                              : "已作废",
                          )}
                        </Tag>
                      </Tooltip>
                    ) : (
                      "—"
                    ),
                },
                {
                  title: t("生成 / 上传日期"),
                  dataIndex: "createdAt",
                  width: 140,
                  render: dateText,
                },
                {
                  title: t("操作"),
                  width: 132,
                  render: (_, file) => (
                    <Space size={4}>
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          setPreview({
                            category: "PROJECT_FILE",
                            index: documents.indexOf(file),
                          })
                        }
                      >
                        {t("预览")}
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        href={`${file.downloadUrl || `/api/v1/materials/${file.id}/download`}${(file.downloadUrl || "").includes("?") ? "&" : "?"}download=1`}
                      >
                        {t("下载")}
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
          {hasMedia && (
            <div className="min-w-0 space-y-4 xl:border-l xl:border-[#edf0f4] xl:pl-5">
              {(
                [
                  ["PHOTO", "图片", photos],
                  ["VIDEO", "视频", videos],
                ] as const
              )
                .filter(([, , list]) => list.length > 0)
                .map(([category, title, list]) => (
                  <section key={category}>
                    <h3 className="m-0 mb-2 text-sm font-medium text-[#263650]">
                      {t(title)}（{list.length}）
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {list.map((file, index) => (
                        <button
                          key={file.id}
                          type="button"
                          title={file.originalName || file.title}
                          aria-label={t(`预览${title} ${index + 1}`)}
                          onClick={() => setPreview({ category, index })}
                          className="group relative h-[88px] w-[132px] overflow-hidden rounded-md border border-[#dfe6ee] bg-[#f5f7fa] hover:border-[#193a68] focus-visible:outline-2 focus-visible:outline-[#193a68]"
                        >
                          {category === "PHOTO" ? (
                            <img
                              src={mediaUrl(file)}
                              alt={
                                file.originalName || file.title || t("订单图片")
                              }
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <>
                              <video
                                src={mediaUrl(file)}
                                muted
                                preload="metadata"
                                aria-hidden
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                                <PlayCircleFilled
                                  className="text-3xl"
                                  aria-hidden
                                />
                              </span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>
      </Card>
      <MediaGalleryModal
        category={preview?.category}
        title={
          preview?.category === "PHOTO"
            ? "订单图片"
            : preview?.category === "VIDEO"
              ? "订单视频"
              : "合同与附件"
        }
        items={items}
        initialIndex={preview?.index ?? 0}
        onClose={() => setPreview(undefined)}
      />
    </>
  );
}
