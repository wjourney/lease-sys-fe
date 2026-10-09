import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Pagination,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
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
  return (
    <>
      <Spin spinning={store.loading}>
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
                <div className="flex items-center justify-between gap-1 [&_h4]:!mb-1 [&_h4]:!text-[16px]">
                  <Title level={4}>{t(row.name)}</Title>
                </div>
                <div className="my-[5px] mb-3 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#8290a2]">
                  <EnvironmentOutlined aria-hidden={true} /> {t(row.region)} ·{" "}
                  {t(row.address)}
                </div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-[#eff1f5] pt-3 text-[12px] text-[#8290a2]">
                  {[
                    { label: "总计", count: row.unitCount, dot: "" },
                    {
                      label: "在租",
                      count: row.occupiedCount,
                      dot: "bg-[#4b83db]",
                    },
                    {
                      label: "可租",
                      count: row.availableCount,
                      dot: "bg-[#4eab69]",
                    },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center whitespace-nowrap"
                    >
                      {item.dot && (
                        <span
                          aria-hidden
                          className={`mr-1.5 size-[7px] rounded-full ${item.dot}`}
                        />
                      )}
                      {t(item.label)}
                      <strong className="ml-1.5 text-[18px] font-semibold leading-none text-[#26334a]">
                        {t(item.count ?? 0)}
                      </strong>
                      <span className="ml-0.5">{t("套")}</span>
                    </span>
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
                          row.canDelete === false ||
                          (row.canDelete === undefined &&
                            Number(row.occupiedCount) > 0)
                            ? t(row.deleteReason || "有在租单位，不可删除项目")
                            : undefined
                        }
                      >
                        <span className="flex-1">
                          <Button
                            size="small"
                            className="w-full"
                            danger
                            disabled={
                              row.canDelete === false ||
                              (row.canDelete === undefined &&
                                Number(row.occupiedCount) > 0)
                            }
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
            await api.delete(`/projects/${deleting.id}`, { data: { reason } });
            message.success(t("已删除"));
            root.invalidate();
          }}
        />
      )}
    </>
  );
});
