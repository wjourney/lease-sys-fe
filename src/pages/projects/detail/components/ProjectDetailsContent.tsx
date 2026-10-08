import {
  EnvironmentOutlined,
  FileOutlined,
  PictureOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import { Button, Spin } from "antd";
import { lazy, Suspense, useState } from "react";
import { amount, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { ProjectLocationModal } from "../../components/ProjectLocationModal";
import { projectImages } from "../../project-images";
import { projectLocation } from "../../project-location";
import { MediaGalleryModal, type MediaCategory } from "./MediaGalleryModal";

const ProjectLocationMap = lazy(
  () => import("../../components/ProjectLocationMap"),
);
const fileCategories = [
  "PROJECT_FILE",
  "OFFICIAL",
  "MARKETING",
  "GUIDE",
  "TEMPLATE",
];
const mediaUrl = (item: Row) =>
  item.previewUrl ||
  item.downloadUrl ||
  `/api/v1/materials/${item.id}/download`;
const present = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : t(String(value));
const money = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : t(amount(value));
const fileSize = (bytes: unknown) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0 || bytes == null) return "—";
  return size >= 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 mb-3 text-[14px] font-semibold leading-6 text-[#17345e]">
      {children}
    </h2>
  );
}

function ProjectMediaStrip({
  items,
  category,
  onOpen,
}: {
  items: Row[];
  category: "PHOTO" | "VIDEO";
  onOpen: (index: number) => void;
}) {
  const isVideo = category === "VIDEO";
  const label = isVideo ? "视频" : "图片";
  if (!items.length) {
    return (
      <div className="flex h-24 items-center justify-center gap-2 rounded-md border border-dashed border-[#dbe4ee] bg-[#f6f8fa] text-[#8390a3]">
        {isVideo ? (
          <PlayCircleFilled className="text-xl" aria-hidden />
        ) : (
          <PictureOutlined className="text-xl" aria-hidden />
        )}
        {t(`暂无项目${label}`)}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={t(`查看第 ${index + 1} 个项目${label}`)}
          className="relative h-[90px] w-[120px] shrink-0 overflow-hidden rounded-md border border-[#e1e8f0] bg-[#f3f6f9] transition-colors hover:border-[#17355d] focus-visible:outline-2 focus-visible:outline-[#17355d]"
        >
          {isVideo ? (
            <>
              <video
                src={mediaUrl(item)}
                preload="metadata"
                muted
                aria-hidden
                className="h-full w-full object-cover opacity-80"
              />
              <span className="absolute inset-0 flex items-center justify-center text-white">
                <PlayCircleFilled
                  className="text-3xl drop-shadow"
                  aria-hidden
                />
              </span>
            </>
          ) : (
            <img
              src={mediaUrl(item)}
              alt={t(item.originalName || `项目图片 ${index + 1}`)}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
        </button>
      ))}
    </div>
  );
}

export function ProjectDetailsContent({
  row,
  allowExactRent,
}: {
  row: Row;
  allowExactRent: boolean;
}) {
  const materials: Row[] = (row.materials || []).filter(
    (item: Row) => item.storageKey,
  );
  const photos = projectImages(materials);
  const videos = materials.filter((item) => item.category === "VIDEO");
  const files = materials.filter((item) =>
    fileCategories.includes(item.category),
  );
  const types: Row[] = Array.isArray(row.typeConfigs) ? row.typeConfigs : [];
  const extra: Row = row.extra || {};
  const location = projectLocation(row.latitude, row.longitude);
  const [media, setMedia] = useState<{
    category: MediaCategory;
    index: number;
  }>();
  const [showMap, setShowMap] = useState(false);
  const detailRows: [string, unknown][] = [
    ["项目中文名称", row.name],
    ["区域", row.region],
    ["详细地址", row.address],
    ["物业名称", row.propertyName],
    ["用途", extra.usage],
    ["发展商", row.developer],
    ["落成年份", extra.completionYear ?? row.completionDate?.slice(0, 4)],
    ["项目英文名称", row.nameEn],
    ["楼层数目", extra.floorCount],
    ["业权", extra.ownership],
    ["停车场", extra.parking],
    ["港铁站", extra.mtrStation],
    ["项目介绍", row.description],
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 max-[850px]:grid-cols-1">
        <div className="min-w-0 space-y-5">
          <section className="min-w-0">
            <SectionTitle>
              {t("项目图片")}（{photos.length}）
            </SectionTitle>
            <ProjectMediaStrip
              items={photos}
              category="PHOTO"
              onOpen={(index) => setMedia({ category: "PHOTO", index })}
            />
          </section>
          <section className="min-w-0">
            <SectionTitle>
              {t("项目视频")}（{videos.length}）
            </SectionTitle>
            <ProjectMediaStrip
              items={videos}
              category="VIDEO"
              onOpen={(index) => setMedia({ category: "VIDEO", index })}
            />
          </section>
          <section className="min-w-0 border-t border-[#e4eaf1] pt-5">
            <SectionTitle>{t("项目位置")}</SectionTitle>
            {location ? (
              <div className="relative">
                <Suspense
                  fallback={
                    <div className="flex h-72 items-center justify-center rounded-md bg-[#f3f6f9]">
                      <Spin />
                    </div>
                  }
                >
                  <ProjectLocationMap
                    latitude={location.latitude}
                    longitude={location.longitude}
                    compact
                  />
                </Suspense>
                <Button
                  className="!absolute bottom-3 right-3 !z-[500]"
                  icon={<EnvironmentOutlined />}
                  onClick={() => setShowMap(true)}
                >
                  {t("查看地图")}
                </Button>
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[#dbe4ee] bg-[#f6f8fa] text-[#8390a3]">
                <EnvironmentOutlined className="text-3xl" aria-hidden />
                {t("尚未设置项目位置")}
              </div>
            )}
          </section>
        </div>

        <section className="min-w-0 border-l border-[#e4eaf1] pl-6 max-[850px]:border-l-0 max-[850px]:pl-0">
          <SectionTitle>{t("基本资料")}</SectionTitle>
          <dl className="m-0 grid grid-cols-2 border-t border-[#e4eaf1] text-[14px] max-[1200px]:grid-cols-1">
            {detailRows.map(([label, value]) => (
              <div
                key={label}
                className={`grid grid-cols-[minmax(82px,auto)_minmax(0,1fr)] gap-3 border-b border-[#e4eaf1] py-2.5 pr-4 max-[1200px]:pr-0 ${label === "项目介绍" ? "col-span-2 max-[1200px]:col-span-1" : ""}`}
              >
                <dt className="text-[#7585a0]">{t(label)}</dt>
                <dd className="m-0 break-words whitespace-pre-line font-medium text-[#263953]">
                  {present(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="space-y-6 border-t border-[#e4eaf1] pt-5">
        <section className="min-w-0">
          <SectionTitle>
            {t("单位类型")}（{types.length}）
          </SectionTitle>
          {types.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[14px] text-[#263953]">
                <thead className="border-b border-[#dce4ed] text-[#7585a0]">
                  <tr>
                    {[
                      "单位类型",
                      "期 / 座",
                      "楼层",
                      "实用面积",
                      "间隔",
                      "最低价",
                      "最高价",
                      "月租价格",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-3 py-2 font-medium first:pl-0"
                      >
                        {t(label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {types.map((type, index) => (
                    <tr
                      key={type.code || index}
                      className="border-b border-[#e4eaf1]"
                    >
                      <td className="whitespace-nowrap px-3 py-3 pl-0 font-medium">
                        {present(type.name || type.code)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {present(type.building)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {present(type.floor)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {type.area == null ? "—" : `${present(type.area)} ㎡`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {present(type.layout)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {money(type.minRent)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {money(type.maxRent)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium">
                        {allowExactRent ? money(type.referenceRent) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="m-0 text-sm text-[#8390a3]">{t("暂无单位类型")}</p>
          )}
        </section>
        <section className="min-w-0 border-t border-[#e4eaf1] pt-5">
          <SectionTitle>
            {t("项目文件")}（{files.length}）
          </SectionTitle>
          {files.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-[14px] text-[#263953]">
                <thead className="border-b border-[#dce4ed] text-[#7585a0]">
                  <tr>
                    <th className="py-2 font-medium">{t("文件名称")}</th>
                    <th className="py-2 font-medium">{t("上传日期")}</th>
                    <th className="py-2 font-medium">{t("文件大小")}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={file.id} className="border-b border-[#e4eaf1]">
                      <td className="py-2.5">
                        <button
                          type="button"
                          className="flex max-w-[260px] items-center gap-2 text-left text-[#245184] hover:underline"
                          onClick={() =>
                            setMedia({ category: "PROJECT_FILE", index })
                          }
                        >
                          <FileOutlined aria-hidden />
                          <span className="truncate">
                            {t(file.originalName || file.title || "文件")}
                          </span>
                        </button>
                      </td>
                      <td className="py-2.5">
                        {present(file.createdAt?.slice?.(0, 10))}
                      </td>
                      <td className="py-2.5">{fileSize(file.sizeBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="m-0 text-sm text-[#8390a3]">{t("暂无项目文件")}</p>
          )}
        </section>
      </div>
      {showMap && location && (
        <ProjectLocationModal
          location={location}
          onClose={() => setShowMap(false)}
        />
      )}
      <MediaGalleryModal
        category={media?.category}
        title={
          media?.category === "PHOTO"
            ? "项目图片"
            : media?.category === "VIDEO"
              ? "项目视频"
              : "项目文件"
        }
        items={
          media?.category === "PHOTO"
            ? photos
            : media?.category === "VIDEO"
              ? videos
              : files
        }
        initialIndex={media?.index || 0}
        onClose={() => setMedia(undefined)}
      />
    </div>
  );
}
