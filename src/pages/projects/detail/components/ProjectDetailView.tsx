import {
  ArrowLeftOutlined,
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  PlusOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useState, type ReactNode } from "react";
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
import { ProjectMediaCards } from "./ProjectMediaCards";
import { ProjectLogoPreview } from "./ProjectLogoPreview";
import { ProjectOverviewDetails } from "./ProjectOverviewDetails";
import { ProjectStats } from "./ProjectStats";
import { UnitDetailModal } from "./UnitDetailModal";
import { ProjectUnits } from "./ProjectUnits";

type Section = "basic" | MaterialSection;

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
  const sections: { key: Section; label: string; icon: ReactNode }[] = [
    { key: "basic", label: "基本资料", icon: <ProfileOutlined /> },
    { key: "OFFICIAL", label: "官方文件", icon: <FolderOpenOutlined /> },
    { key: "MARKETING", label: "营销资料", icon: <BarChartOutlined /> },
    { key: "GUIDE", label: "开单资料", icon: <FileTextOutlined /> },
  ];

  return (
    <>
      {headerHost ? createPortal(heading, headerHost) : heading}
      <div className="space-y-5 max-[760px]:space-y-4">
        <section className="rounded-[7px] border border-[#e0e6ed] bg-white px-5 py-5 max-[760px]:px-4 max-[760px]:py-4">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[24px] font-semibold leading-8 text-[#142d51] max-[600px]:text-[21px]">
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
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 pb-5 max-[1100px]:grid-cols-1">
            <div className="flex min-w-0 items-start gap-5 max-[600px]:gap-3">
              <ProjectLogoPreview materials={row.materials || []} />
              <div className="min-w-0 flex-1">
                <ProjectOverviewDetails row={row} />
              </div>
            </div>
            <ProjectStats row={row} />
          </div>
          <div className="grid grid-cols-[3fr_4fr] border-t border-[#e1e7ef] pt-3 max-[1200px]:grid-cols-1">
            <ProjectMediaCards materials={row.materials || []} />
            <nav
              className="grid grid-cols-4 border-l border-[#e1e7ef] max-[1200px]:mt-3 max-[1200px]:border-l-0 max-[1200px]:border-t max-[1200px]:pt-3 max-[600px]:grid-cols-2"
              aria-label={t("项目资料分类")}
            >
              {sections.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="flex min-h-12 items-center justify-center gap-2 border-r border-[#e1e7ef] px-2 text-[14px] font-medium text-[#1b355d] transition-colors hover:bg-[#f5f8fc] last:border-r-0 focus-visible:outline-2 focus-visible:outline-[#192d4c] max-[600px]:even:border-r-0"
                  onClick={() => setSection(item.key)}
                >
                  <span className="text-[20px]" aria-hidden>
                    {item.icon}
                  </span>
                  <span>{t(item.label)}</span>
                </button>
              ))}
            </nav>
          </div>
        </section>

        <ProjectUnits
          projectId={id}
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
