import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { ProjectBasicModal } from "./ProjectBasicModal";
import { ProjectDeleteModal } from "./ProjectDeleteModal";
import { MediaGalleryModal, type MediaCategory } from "./MediaGalleryModal";
import { ProjectLogoPreview } from "./ProjectLogoPreview";
import { ProjectOverviewDetails } from "./ProjectOverviewDetails";
import { projectImages } from "../../project-images";
import { UnitDetailModal } from "./UnitDetailModal";
import { ProjectUnits } from "./ProjectUnits";

type ProjectMediaCategory = MediaCategory;
const mediaTitles: Record<ProjectMediaCategory, string> = {
  PHOTO: "项目图片",
  VIDEO: "项目视频",
  PROJECT_FILE: "项目文件",
};

export function ProjectDetailView({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: (reason: string) => Promise<void>;
}) {
  const { row, id, root, navigate } = useRecordDetail();
  const [showBasic, setShowBasic] = useState(false);
  const [mediaCategory, setMediaCategory] = useState<ProjectMediaCategory>();
  const [showDelete, setShowDelete] = useState(false);
  const location = useLocation();
  const openUnitEditor = (unit?: Row) =>
    navigate(
      unit
        ? `/projects/${id}/units/${unit.id}/edit`
        : `/projects/${id}/units/new`,
      { state: { returnTo: location.pathname + location.search } },
    );
  const [unitDetail, setUnitDetail] = useState<Row>();
  const headerHost = document.getElementById("record-detail-header");
  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <Button
        type="text"
        icon={<ArrowLeftOutlined aria-hidden />}
        aria-label={t("返回上级")}
        title={t("返回上级")}
        onClick={() => navigate("/projects")}
      />
      <div className="min-w-0">
        <h1
          className="!m-0 truncate text-[19px] font-semibold leading-6 text-[#26334a]"
          title={`${t(row.name)}${row.address ? ` · ${t(row.address)}` : ""}`}
        >
          {t(row.name)}
          {row.address ? ` · ${t(row.address)}` : null}
        </h1>
      </div>
    </div>
  );
  const materials = (row.materials || []).filter(
    (item: Row) => item.storageKey,
  );

  return (
    <>
      {headerHost ? createPortal(heading, headerHost) : heading}
      <div className="project-detail-layout">
        <section className="rounded-[7px] border border-[#e0e6ed] bg-white px-5 py-4 max-[760px]:px-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[22px] font-semibold leading-8 text-[#142d51] max-[600px]:text-[20px]">
              {t("项目概览")}
            </h2>
            <div className="flex min-w-0 flex-wrap justify-end gap-2">
              {root.canWrite("units") && (
                <Button
                  className="!h-9"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openUnitEditor()}
                >
                  {t("新建单位")}
                </Button>
              )}
              {root.canWrite("units") && (
                <Button
                  className="!h-9"
                  onClick={() => navigate(`/projects/${id}/units/batch`)}
                >
                  {t("批量创建单位")}
                </Button>
              )}
              {root.canWrite("projects") && (
                <>
                  <Button
                    className="!h-9"
                    icon={<EditOutlined />}
                    onClick={onEdit}
                  >
                    {t("编辑项目")}
                  </Button>
                  <Button
                    className="!h-9"
                    danger
                    icon={<DeleteOutlined aria-hidden />}
                    onClick={() => setShowDelete(true)}
                  >
                    {t("删除项目")}
                  </Button>
                </>
              )}
              <Dropdown
                menu={{
                  items: [
                    { key: "PHOTO", label: t("项目图片") },
                    { key: "VIDEO", label: t("项目视频") },
                  ],
                  onClick: ({ key }) =>
                    setMediaCategory(key as ProjectMediaCategory),
                }}
              >
                <Button className="!h-9" icon={<PictureOutlined aria-hidden />}>
                  {t("项目素材")} <DownOutlined aria-hidden />
                </Button>
              </Dropdown>
              <Dropdown
                menu={{
                  items: [
                    { key: "basic", label: t("基本资料与单位类型") },
                    { key: "PROJECT_FILE", label: t("项目文件") },
                  ],
                  onClick: ({ key }) => {
                    if (key === "PROJECT_FILE") setMediaCategory(key);
                    else setShowBasic(true);
                  },
                }}
              >
                <Button
                  className="!h-9"
                  icon={<FileTextOutlined aria-hidden />}
                >
                  {t("项目资料")} <DownOutlined aria-hidden />
                </Button>
              </Dropdown>
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-4 max-[600px]:gap-3">
            <ProjectLogoPreview materials={row.materials || []} />
            <ProjectOverviewDetails row={row} />
          </div>
        </section>

        <ProjectUnits
          projectId={id}
          stats={row}
          onViewUnit={setUnitDetail}
          onEditUnit={openUnitEditor}
          allowExactRent={
            ["SUPER_ADMIN", "OPERATIONS", "FINANCE"].includes(
              root.user?.role,
            ) || !!row.salesCanViewExactRent
          }
        />
      </div>
      {unitDetail && (
        <UnitDetailModal
          unit={unitDetail}
          projectName={row.name}
          allowExactRent={
            ["SUPER_ADMIN", "OPERATIONS", "FINANCE"].includes(
              root.user?.role,
            ) || !!row.salesCanViewExactRent
          }
          canEdit={root.canWrite("units")}
          onClose={() => setUnitDetail(undefined)}
          onEdit={(unit) => {
            setUnitDetail(undefined);
            openUnitEditor(unit);
          }}
        />
      )}
      <ProjectBasicModal
        row={row}
        open={showBasic}
        onClose={() => setShowBasic(false)}
        canEdit={root.canWrite("projects")}
        onEdit={() => {
          setShowBasic(false);
          onEdit();
        }}
      />
      <ProjectDeleteModal
        open={showDelete}
        projectName={row.name}
        onClose={() => setShowDelete(false)}
        onConfirm={onDelete}
      />
      <MediaGalleryModal
        category={mediaCategory}
        title={mediaCategory ? mediaTitles[mediaCategory] : "项目素材"}
        items={
          mediaCategory === "PHOTO"
            ? projectImages(materials)
            : materials.filter((item: Row) =>
                mediaCategory === "PROJECT_FILE"
                  ? [
                      "PROJECT_FILE",
                      "OFFICIAL",
                      "MARKETING",
                      "GUIDE",
                      "TEMPLATE",
                    ].includes(item.category)
                  : item.category === mediaCategory,
              )
        }
        onClose={() => setMediaCategory(undefined)}
      />
    </>
  );
}
