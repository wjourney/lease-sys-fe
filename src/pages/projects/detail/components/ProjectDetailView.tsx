import {
  AppstoreAddOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { ProjectDeleteModal } from "./ProjectDeleteModal";
import { ProjectDetailsContent } from "./ProjectDetailsContent";
import { ProjectUnits } from "./ProjectUnits";
import { unitDetailPath, unitListPath } from "../../../units/unit-navigation";

type DetailTab = "details" | "units";

export function ProjectDetailView({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: (reason: string) => Promise<void>;
}) {
  const { row, id, root, navigate } = useRecordDetail();
  const [showDelete, setShowDelete] = useState(false);
  const location = useLocation();
  const activeTab: DetailTab =
    new URLSearchParams(location.search).get("tab") === "units"
      ? "units"
      : "details";
  const listReturnTo = unitListPath(id, location.search);
  const changeTab = (tab: DetailTab) => {
    const search = new URLSearchParams(location.search);
    if (tab === "units") search.set("tab", "units");
    else search.delete("tab");
    navigate(
      { pathname: location.pathname, search: search.toString() },
      { replace: true },
    );
  };
  const openUnitEditor = (unit?: Row) =>
    navigate(
      unit
        ? `/projects/${id}/units/${unit.id}/edit`
        : `/projects/${id}/units/new`,
      {
        state: { returnTo: listReturnTo, listReturnTo },
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
        className="record-header-title"
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
              onClick={() => changeTab(key)}
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
                <Tooltip
                  title={
                    Number(row.occupiedCount) > 0
                      ? t("已有单位正在租赁，不能删除项目")
                      : undefined
                  }
                >
                  <span>
                    <Button
                      danger
                      disabled={Number(row.occupiedCount) > 0}
                      icon={<DeleteOutlined aria-hidden />}
                      onClick={() => setShowDelete(true)}
                    >
                      {t("删除项目")}
                    </Button>
                  </span>
                </Tooltip>
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
                <Button
                  icon={<AppstoreAddOutlined aria-hidden />}
                  onClick={() =>
                    navigate(`/projects/${id}/units/batch`, {
                      state: { returnTo: listReturnTo },
                    })
                  }
                >
                  {t("批量创建单位")}
                </Button>
              </div>
            )}
            <ProjectUnits
              projectId={id}
              stats={row}
              onViewUnit={(unit) =>
                navigate(unitDetailPath(id, unit.id), {
                  state: { returnTo: listReturnTo },
                })
              }
              onEditUnit={openUnitEditor}
              allowExactRent={allowExactRent}
            />
          </div>
        )}
      </div>
      <ProjectDeleteModal
        open={showDelete}
        projectName={row.name}
        onClose={() => setShowDelete(false)}
        onConfirm={onDelete}
      />
    </>
  );
}
