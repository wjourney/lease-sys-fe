import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Modal } from "antd";
import { useState } from "react";
import { createPortal } from "react-dom";
import { UnitDrawer } from "../../../units/components/UnitDrawer";
import { RecordHistory } from "../../../../components/resource-detail/RecordHistory";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { ProjectBasicModal } from "./ProjectBasicModal";
import { ProjectDeleteModal } from "./ProjectDeleteModal";
import {
  MaterialSection,
  ProjectMaterialsModal,
} from "./ProjectMaterialsModal";
import { MediaGalleryModal, type MediaCategory } from "./MediaGalleryModal";
import { ProjectLogoPreview } from "./ProjectLogoPreview";
import { ProjectOverviewDetails } from "./ProjectOverviewDetails";
import { UnitDetailModal } from "./UnitDetailModal";
import { ProjectUnits } from "./ProjectUnits";

type Section = "basic" | MaterialSection;
type ProjectMediaCategory = Exclude<MediaCategory, "LOGO">;
const mediaTitles: Record<ProjectMediaCategory, string> = {
  PHOTO: "项目图片",
  VIDEO: "项目视频",
  PROJECT_FILE: "项目文件",
};

export function ProjectDetailView({
  fields,
  onEdit,
  onDelete,
}: {
  fields: { key: string; label: string }[];
  onEdit: () => void;
  onDelete: (reason: string) => Promise<void>;
}) {
  const { row, id, root, navigate, logs } = useRecordDetail();
  const [section, setSection] = useState<Section>();
  const [mediaCategory, setMediaCategory] = useState<ProjectMediaCategory>();
  const [showHistory, setShowHistory] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [unitEditor, setUnitEditor] = useState<Row | true>();
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
        <h1 className="!m-0 truncate text-[19px] font-semibold leading-6 text-[#26334a]">
          {t(row.name)}
        </h1>
        <p className="m-0 mt-1 text-[11px] text-[#7f8b9d]">
          {t("房源编号")} {t(row.code)}
        </p>
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
                  onClick={() => setUnitEditor(true)}
                >
                  {t("新建单位")}
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
              {root.canWrite("projects") && (
                <Button
                  className="!h-9"
                  icon={<HistoryOutlined aria-hidden />}
                  onClick={() => setShowHistory(true)}
                >
                  {t("操作记录")}
                </Button>
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
                    { key: "PROJECT_FILE", label: t("项目文件") },
                    { key: "basic", label: t("基本资料") },
                    { key: "OFFICIAL", label: t("官方文件") },
                    { key: "MARKETING", label: t("营销资料") },
                    { key: "GUIDE", label: t("开单资料") },
                  ],
                  onClick: ({ key }) => {
                    if (key === "PROJECT_FILE") setMediaCategory(key);
                    else setSection(key as Section);
                  },
                }}
              >
                <Button className="!h-9" icon={<FileTextOutlined aria-hidden />}>
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
          onEditUnit={setUnitEditor}
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
            setUnitEditor(unit);
          }}
        />
      )}
      {unitEditor && (
        <UnitDrawer
          row={unitEditor === true ? undefined : unitEditor}
          initial={{ projectId: id }}
          onClose={() => setUnitEditor(undefined)}
          onSaved={() => {
            setUnitEditor(undefined);
            root.invalidate();
          }}
        />
      )}
      <ProjectBasicModal
        row={row}
        open={section === "basic"}
        onClose={() => setSection(undefined)}
        canEdit={root.canWrite("projects")}
        onEdit={() => {
          setSection(undefined);
          onEdit();
        }}
      />
      <ProjectDeleteModal
        open={showDelete}
        projectName={row.name}
        onClose={() => setShowDelete(false)}
        onConfirm={onDelete}
      />
      <ProjectMaterialsModal
        projectId={id}
        materials={row.materials || []}
        section={section === "basic" ? undefined : section}
        onClose={() => setSection(undefined)}
      />
      <MediaGalleryModal
        category={mediaCategory}
        title={mediaCategory ? mediaTitles[mediaCategory] : "项目素材"}
        items={materials.filter((item: Row) => item.category === mediaCategory)}
        onClose={() => setMediaCategory(undefined)}
      />
      <Modal
        open={showHistory}
        title={t("操作记录")}
        width={760}
        onCancel={() => setShowHistory(false)}
        footer={
          <Button onClick={() => setShowHistory(false)}>{t("关闭")}</Button>
        }
      >
        <div className="max-h-[65vh] overflow-y-auto pt-2">
          <RecordHistory logs={logs} fields={fields} onlyUpdates inModal />
        </div>
      </Modal>
    </>
  );
}
