import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Pagination,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { NavigateFunction, useLocation } from "react-router-dom";
import { api, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { shouldOpenRow } from "../../../../shared/row-navigation";
import { BuildingArt } from "../../../../shared/ui";
import { ListStore, useRoot } from "../../../../stores/root";
import { ProjectDeleteModal } from "../../detail/components/ProjectDeleteModal";
const { Title } = Typography;
export const ProjectGrid = observer(function ProjectGrid({
  store,
  navigate,
  page,
  onPageChange,
}: {
  store: ListStore;
  navigate: NavigateFunction;
  page: number;
  onPageChange?: (page: number) => void;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const location = useLocation();
  const [deleting, setDeleting] = useState<Row>();
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const visibleIds = store.items.map((item) => item.id).join(",");
  useEffect(() => setSelectedIds([]), [visibleIds]);
  const selectable = store.items.filter((item) => Number(item.unitCount) === 0);
  const selected = store.items.filter((item) => selectedIds.includes(item.id));
  return (
    <>
      <Spin spinning={store.loading}>
        {root.canWrite("projects") && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3"
            data-row-action
          >
            <Checkbox
              checked={
                selectable.length > 0 && selected.length === selectable.length
              }
              indeterminate={
                selected.length > 0 && selected.length < selectable.length
              }
              disabled={!selectable.length}
              onChange={(event) =>
                setSelectedIds(
                  event.target.checked ? selectable.map((item) => item.id) : [],
                )
              }
            >
              {t("全选本页可删除项目")}
            </Checkbox>
            <span className="text-sm text-[#718095]">
              {t(`已选 ${selected.length} 个`)}
            </span>
            <Button
              danger
              icon={<DeleteOutlined aria-hidden />}
              disabled={!selected.length}
              onClick={() => setBatchDeleting(true)}
            >
              {t("批量删除")}
            </Button>
          </div>
        )}
        <div className="list-scroll-area">
          <div className="project-grid grid grid-cols-4 gap-4 max-[1500px]:grid-cols-3 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
            {store.items.map((row, i) => (
              <Card
                key={row.id}
                className="project-card cursor-pointer overflow-hidden !border-[#e6eaf0] [&_.ant-card-body]:!p-[14px]"
                onClick={(event) => {
                  if (shouldOpenRow(event)) navigate(`/projects/${row.id}`);
                }}
                cover={
                  row.coverUrl ? (
                    <img
                      className="h-[145px] w-full object-cover"
                      src={row.coverUrl}
                      alt={row.name}
                    />
                  ) : (
                    <BuildingArt index={i} />
                  )
                }
              >
                <div className="flex items-center justify-between gap-1 [&_h4]:!mb-1 [&_h4]:!text-[15px]">
                  <Title level={4}>{t(row.name)}</Title>
                  {root.canWrite("projects") && (
                    <Tooltip
                      title={
                        Number(row.unitCount) > 0
                          ? t("请先删除项目下的单位")
                          : undefined
                      }
                    >
                      <span data-row-action>
                        <Checkbox
                          aria-label={t(`选择项目 ${row.name}`)}
                          disabled={Number(row.unitCount) > 0}
                          checked={selectedIds.includes(row.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setSelectedIds((ids) =>
                              event.target.checked
                                ? [...ids, row.id]
                                : ids.filter((id) => id !== row.id),
                            )
                          }
                        />
                      </span>
                    </Tooltip>
                  )}
                </div>
                <div className="my-[5px] mb-3 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#8290a2]">
                  <EnvironmentOutlined aria-hidden={true} /> {t(row.region)} ·{" "}
                  {t(row.address)}
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2 border-t border-[#eff1f5] pt-3 text-center">
                  {[
                    {
                      label: "总计",
                      count: row.unitCount,
                      color: "bg-[#f1f4f8] text-[#26334a]",
                    },
                    {
                      label: "在租",
                      count: row.occupiedCount,
                      color: "bg-[#eaf2ff] text-[#2463b0]",
                    },
                    {
                      label: "可租",
                      count: row.availableCount,
                      color: "bg-[#edf8ee] text-[#258349]",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-md px-1 py-2 ${item.color}`}
                    >
                      <div className="text-[12px] font-medium">
                        {t(item.label)}
                      </div>
                      <div className="mt-0.5 text-[18px] font-bold leading-none">
                        {t(item.count ?? 0)}
                        <span className="ml-0.5 text-[11px] font-normal">
                          {t("套")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2" data-row-action>
                  <Button
                    size="small"
                    className="flex-1"
                    onClick={() => navigate(`/projects/${row.id}`)}
                  >
                    {t("查看")}
                  </Button>
                  {root.canWrite("projects") && (
                    <>
                      <Button
                        size="small"
                        className="flex-1"
                        icon={<EditOutlined aria-hidden />}
                        onClick={() =>
                          navigate(`/projects/${row.id}/edit`, {
                            state: {
                              returnTo: location.pathname + location.search,
                            },
                          })
                        }
                      >
                        {t("编辑")}
                      </Button>
                      <Tooltip
                        title={
                          Number(row.unitCount) > 0
                            ? t("请先删除项目下的单位")
                            : undefined
                        }
                      >
                        <span className="flex-1">
                          <Button
                            size="small"
                            className="w-full"
                            danger
                            disabled={Number(row.unitCount) > 0}
                            icon={<DeleteOutlined aria-hidden />}
                            onClick={() => setDeleting(row)}
                          >
                            {t("删除")}
                          </Button>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {!store.items.length && !store.loading && (
            <Empty description={t("暂无项目")} />
          )}
        </div>
        <div className="list-pagination flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <span className="whitespace-nowrap text-xs text-[#8793a6]">
            {t("共")}
            {t(store.total)}
            {t("个项目")}
          </span>
          <Pagination
            current={page}
            pageSize={12}
            total={store.total}
            onChange={onPageChange}
          />
        </div>
      </Spin>
      {deleting && (
        <ProjectDeleteModal
          open
          projectName={deleting.name}
          onClose={() => setDeleting(undefined)}
          onConfirm={async (reason) => {
            await api.delete("/projects", {
              data: { ids: [deleting.id], reason },
            });
            message.success(t("已删除"));
            root.invalidate();
          }}
        />
      )}
      {batchDeleting && (
        <ProjectDeleteModal
          open
          projectNames={selected.map((item) => item.name)}
          onClose={() => setBatchDeleting(false)}
          onConfirm={async (reason) => {
            await api.delete("/projects", {
              data: { ids: selected.map((item) => item.id), reason },
            });
            message.success(t(`已删除 ${selected.length} 个项目`));
            setSelectedIds([]);
            root.invalidate();
          }}
        />
      )}
    </>
  );
});
