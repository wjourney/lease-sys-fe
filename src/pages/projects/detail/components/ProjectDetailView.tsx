import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { ProjectDeleteModal } from "./ProjectDeleteModal";
import { ProjectDetailsContent } from "./ProjectDetailsContent";
import { UnitDetailModal } from "./UnitDetailModal";
import { ProjectUnits } from "./ProjectUnits";

type DetailTab = "details" | "units";

export function ProjectDetailView({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: (reason: string) => Promise<void>;
}) {
  const { row, id, root, navigate } = useRecordDetail();
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [showDelete, setShowDelete] = useState(false);
  const [unitDetail, setUnitDetail] = useState<Row>();
  const location = useLocation();
  const openUnitEditor = (unit?: Row) =>
    navigate(
      unit
        ? `/projects/${id}/units/${unit.id}/edit`
        : `/projects/${id}/units/new`,
      {
        state: { returnTo: location.pathname + location.search },
      },
    );
  const allowExactRent =
    ["SUPER_ADMIN", "OPERATIONS", "FINANCE"].includes(root.user?.role) ||
    !!row.salesCanViewExactRent;
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
      <h1
        className="!m-0 min-w-0 truncate text-[14px] font-semibold leading-6 text-[#26334a]"
        title={`${t(row.name)}${row.address ? ` · ${t(row.address)}` : ""}`}
      >
        {t(row.name)}
        {row.address ? ` · ${t(row.address)}` : null}
      </h1>
    </div>
  );

  return (
    <>
      {headerHost ? createPortal(heading, headerHost) : heading}
      <div className="project-detail-layout">
        <div
          role="tablist"
          aria-label={t("项目详情")}
          className="project-detail-tabs flex shrink-0 gap-2 border-b border-[#dfe6ef]"
        >
          {(
            [
              ["details", "项目资料"],
              ["units", `单位列表（${row.unitCount ?? 0}）`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`project-tab-${key}`}
              aria-controls={`project-panel-${key}`}
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`min-h-11 border-b-[3px] px-5 text-[14px] font-medium transition-colors hover:text-[#17355d] focus-visible:outline-2 focus-visible:outline-[#17355d] ${activeTab === key ? "border-[#17355d] text-[#17355d]" : "border-transparent text-[#72819a]"}`}
            >
              {t(label)}
            </button>
          ))}
        </div>
        {activeTab === "details" ? (
          <div
            id="project-panel-details"
            role="tabpanel"
            aria-labelledby="project-tab-details"
            className="project-detail-panel"
          >
            {root.canWrite("projects") && (
              <div className="mb-5 flex flex-wrap justify-start gap-2 border-b border-[#e4eaf1] pb-4">
                <Button icon={<EditOutlined />} onClick={onEdit}>
                  {t("编辑项目")}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined aria-hidden />}
                  onClick={() => setShowDelete(true)}
                >
                  {t("删除项目")}
                </Button>
              </div>
            )}
            <ProjectDetailsContent row={row} allowExactRent={allowExactRent} />
          </div>
        ) : (
          <div
            id="project-panel-units"
            role="tabpanel"
            aria-labelledby="project-tab-units"
            className="project-detail-panel project-detail-units-panel"
          >
            {root.canWrite("units") && (
              <div className="flex flex-wrap justify-start gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openUnitEditor()}
                >
                  {t("新建单位")}
                </Button>
                <Button onClick={() => navigate(`/projects/${id}/units/batch`)}>
                  {t("批量创建单位")}
                </Button>
              </div>
            )}
            <ProjectUnits
              projectId={id}
              stats={row}
              onViewUnit={setUnitDetail}
              onEditUnit={openUnitEditor}
              allowExactRent={allowExactRent}
            />
          </div>
        )}
      </div>
      {unitDetail && (
        <UnitDetailModal
          unit={unitDetail}
          projectName={row.name}
          allowExactRent={allowExactRent}
          canEdit={root.canWrite("units")}
          onClose={() => setUnitDetail(undefined)}
          onEdit={(unit) => {
            setUnitDetail(undefined);
            openUnitEditor(unit);
          }}
        />
      )}
      <ProjectDeleteModal
        open={showDelete}
        projectName={row.name}
        onClose={() => setShowDelete(false)}
        onConfirm={onDelete}
      />
    </>
  );
}
