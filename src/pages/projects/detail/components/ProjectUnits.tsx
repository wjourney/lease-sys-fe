import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Pagination, Select, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ResourceList } from "../../../../components/resource-list/ResourceList";
import { amount, options, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { shouldOpenRow } from "../../../../shared/row-navigation";
import { ListStore, useRoot } from "../../../../stores/root";
import { UnitDeleteModal } from "./UnitDeleteModal";
import { ProjectStats, type ProjectUnitStatus } from "./ProjectStats";

export const ProjectUnits = observer(function ProjectUnits({
  projectId,
  stats,
  allowExactRent,
  onViewUnit,
  onEditUnit,
}: {
  projectId: string;
  stats: Row;
  allowExactRent: boolean;
  onViewUnit: (unit: Row) => void;
  onEditUnit: (unit: Row) => void;
}) {
  const root = useRoot();
  const [unitTypeCode, setUnitTypeCode] = useState<string>();
  const [sort, setSort] = useState("default");
  const [statusFilter, setStatusFilter] = useState<ProjectUnitStatus>();
  const [unitTypes, setUnitTypes] = useState<
    { label: string; value: string }[]
  >([]);
  const [unitToDelete, setUnitToDelete] = useState<Row>();
  useEffect(() => {
    let active = true;
    options("settings", { key: "unit_types" })
      .then((rows) => {
        if (active)
          setUnitTypes(
            (rows[0]?.value ?? []).map((item: Row) => ({
              label: t(item.name),
              value: item.code,
            })),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [root.epoch]);

  return (
    <>
      <section className="project-unit-section rounded-[7px] border border-[#e0e6ed] bg-white">
        <ResourceList
          key={projectId}
          resource="units"
          fixed={{
            projectId,
            status: statusFilter || "",
            ...(unitTypeCode ? { unitTypeCode } : {}),
            ...(sort !== "default" ? { sortBy: "referenceRent", sort } : {}),
          }}
          embedded
          pageSize={9}
          hideCreate
          hideStatus
          listToolbar={
            <ProjectStats
              row={stats}
              status={statusFilter}
              onChange={setStatusFilter}
            />
          }
          onResetExtras={() => {
            setStatusFilter(undefined);
            setUnitTypeCode(undefined);
            setSort("default");
          }}
          filterExtras={
            <div className="flex shrink-0 items-center gap-4 text-sm text-[#718095] max-[760px]:flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="whitespace-nowrap">{t("单位类型")}</span>
                <Select
                  className="w-40"
                  allowClear
                  placeholder={t("全部类型")}
                  value={unitTypeCode}
                  options={unitTypes}
                  onChange={setUnitTypeCode}
                />
              </div>
              {allowExactRent && (
                <div className="flex items-center gap-2.5">
                  <span className="whitespace-nowrap">{t("价格排序")}</span>
                  <Select
                    className="w-40"
                    value={sort}
                    options={[
                      { value: "default", label: t("默认排序") },
                      { value: "asc", label: t("价格从低到高") },
                      { value: "desc", label: t("价格从高到低") },
                    ]}
                    onChange={setSort}
                  />
                </div>
              )}
            </div>
          }
          renderItems={({ store, page, onPageChange }) => (
            <UnitGrid
              store={store}
              page={page}
              onPageChange={onPageChange}
              canEdit={root.canWrite("units")}
              onViewUnit={onViewUnit}
              onEditUnit={onEditUnit}
              onDeleteUnit={setUnitToDelete}
            />
          )}
        />
      </section>
      {unitToDelete && (
        <UnitDeleteModal
          unit={unitToDelete}
          onClose={() => setUnitToDelete(undefined)}
          onDeleted={() => {
            setUnitToDelete(undefined);
            root.invalidate();
          }}
        />
      )}
    </>
  );
});

const UnitGrid = observer(function UnitGrid({
  store,
  page,
  onPageChange,
  canEdit,
  onViewUnit,
  onEditUnit,
  onDeleteUnit,
}: {
  store: ListStore;
  page: number;
  onPageChange?: (page: number) => void;
  canEdit: boolean;
  onViewUnit: (unit: Row) => void;
  onEditUnit: (unit: Row) => void;
  onDeleteUnit: (unit: Row) => void;
}) {
  return (
    <Spin spinning={store.loading}>
      <div className="embedded-list-scroll">
        <div className="grid grid-cols-4 gap-4 max-[1500px]:grid-cols-3 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
          {store.items.map((unit) => (
            <Card
              key={unit.id}
              className="project-card min-w-0 cursor-pointer overflow-hidden !border-[#e6eaf0] transition-colors hover:!border-[#afc1d6] [&_.ant-card-body]:!p-[14px]"
              onClick={(event) => {
                if (shouldOpenRow(event)) onViewUnit(unit);
              }}
              cover={
                unit.coverUrl ? (
                  <img
                    src={unit.coverUrl}
                    alt={t(`${unit.unitNo}的首张图片`)}
                    loading="lazy"
                    className="h-[145px] w-full bg-[#f2f5f8] object-cover"
                  />
                ) : (
                  <div className="flex h-[145px] items-center justify-center bg-[#f2f5f8] text-[#9eacbf]">
                    <PictureOutlined className="text-2xl" aria-hidden />
                  </div>
                )
              }
            >
              <h3 className="m-0 truncate text-[15px] font-semibold text-[#26334a]">
                {t(unit.unitNo)}
              </h3>
              <p className="my-2.5 truncate text-[13px] font-medium text-[#1b355d]">
                {t("参考月租")}{" "}
                {unit.referenceRent != null
                  ? t(amount(unit.referenceRent))
                  : `${t(amount(unit.minRent))} – ${t(amount(unit.maxRent))}`}
              </p>
              <div
                className="flex gap-2 border-t border-[#eff1f5] pt-2.5"
                data-row-action
              >
                <Button
                  size="small"
                  className="flex-1"
                  onClick={() => onViewUnit(unit)}
                >
                  {t("查看")}
                </Button>
                {canEdit && (
                  <>
                    <Button
                      size="small"
                      className="flex-1"
                      icon={<EditOutlined aria-hidden />}
                      onClick={() => onEditUnit(unit)}
                    >
                      {t("编辑")}
                    </Button>
                    <Button
                      size="small"
                      className="flex-1"
                      danger
                      icon={<DeleteOutlined aria-hidden />}
                      onClick={() => onDeleteUnit(unit)}
                    >
                      {t("删除")}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
        {!store.items.length && !store.loading && !store.error && (
          <Empty description={t("暂无单位")} className="py-6" />
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <span className="text-xs text-[#8793a6]">
          {t(`共 ${store.total} 个单位`)}
        </span>
        <Pagination
          current={page}
          pageSize={9}
          total={store.total}
          showSizeChanger={false}
          onChange={onPageChange}
        />
      </div>
    </Spin>
  );
});
