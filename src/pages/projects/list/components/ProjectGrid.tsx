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
  Tag,
  Typography,
} from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { NavigateFunction, SetURLSearchParams } from "react-router-dom";
import { api, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { shouldOpenRow } from "../../../../shared/row-navigation";
import { BuildingArt } from "../../../../shared/ui";
import { ListStore, useRoot } from "../../../../stores/root";
import { ProjectDrawer } from "../../components/ProjectDrawer";
import { ProjectDeleteModal } from "../../detail/components/ProjectDeleteModal";
const { Title } = Typography;
export const ProjectGrid = observer(function ProjectGrid({
  store,
  navigate,
  page,
  setSearch,
  query,
}: {
  store: ListStore;
  navigate: NavigateFunction;
  page: number;
  setSearch: SetURLSearchParams;
  query: string;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [editing, setEditing] = useState<Row>();
  const [deleting, setDeleting] = useState<Row>();
  return (
    <>
      <Spin spinning={store.loading}>
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
                <Tag color="green" bordered={false}>
                  {t("可租")}
                  {t(row.availableCount)}
                  {t("套")}
                </Tag>
              </div>
              <div className="my-[5px] mb-3 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#8290a2]">
                <EnvironmentOutlined aria-hidden={true} /> {t(row.region)} ·{" "}
                {t(row.address)}
              </div>
              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#eff1f5] pt-2.5 text-[11px] text-[#8290a2] [&_b]:ml-[3px] [&_b]:font-medium [&_b]:text-[#45546b]">
                <span>
                  {t("单位总数")}
                  <b>{t(row.unitCount)}</b>
                </span>
                <span>
                  {t("已锁定")}
                  <b>{t(row.lockedCount)}</b>
                </span>
                <span>
                  {t("出租中")}
                  <b>{t(row.occupiedCount)}</b>
                </span>
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
                      onClick={() => setEditing(row)}
                    >
                      {t("编辑")}
                    </Button>
                    <Button
                      size="small"
                      className="flex-1"
                      danger
                      icon={<DeleteOutlined aria-hidden />}
                      onClick={() => setDeleting(row)}
                    >
                      {t("删除")}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
        {!store.items.length && !store.loading && (
          <Empty description={t("暂无项目")} />
        )}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <span className="whitespace-nowrap text-xs text-[#8793a6]">
            {t("共")}
            {t(store.total)}
            {t("个项目")}
          </span>
          <Pagination
            current={page}
            pageSize={9}
            total={store.total}
            onChange={(v) =>
              setSearch({
                q: query,
                page: String(v),
              })
            }
          />
        </div>
      </Spin>
      {editing && (
        <ProjectDrawer
          row={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => setEditing(undefined)}
        />
      )}
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
