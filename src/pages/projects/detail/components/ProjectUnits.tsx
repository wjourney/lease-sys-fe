import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Empty, Pagination, Select, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ResourceList } from "../../../../components/resource-list/ResourceList";
import { amount, options, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { shouldOpenRow } from "../../../../shared/row-navigation";
import { ListStore, useRoot } from "../../../../stores/root";
import { UnitDeleteModal } from "./UnitDeleteModal";

export const ProjectUnits = observer(function ProjectUnits({
  projectId,
  allowExactRent,
  onViewUnit,
  onEditUnit,
}: {
  projectId: string;
  allowExactRent: boolean;
  onViewUnit: (unit: Row) => void;
  onEditUnit: (unit: Row) => void;
}) {
  const root = useRoot();
  const [unitTypeCode, setUnitTypeCode] = useState<string>();
  const [sort, setSort] = useState("default");
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
      <section className="rounded-[7px] border border-[#e0e6ed] bg-white">
        <ResourceList
          key={`${projectId}:${unitTypeCode ?? ""}:${sort}`}
          resource="units"
          fixed={{
            projectId,
            ...(unitTypeCode ? { unitTypeCode } : {}),
            ...(sort !== "default" ? { sortBy: "referenceRent", sort } : {}),
          }}
          embedded
          pageSize={9}
          listToolbar={
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[#718095]">
              <span>{t("单位类型")}</span>
              <Select
                className="w-44"
                allowClear
                placeholder={t("全部类型")}
                value={unitTypeCode}
                options={unitTypes}
                onChange={setUnitTypeCode}
              />
              {allowExactRent && (
                <>
                  <span>{t("价格排序")}</span>
                  <Select
                    className="w-44"
                    value={sort}
                    options={[
                      { value: "default", label: t("默认排序") },
                      { value: "asc", label: t("价格从低到高") },
                      { value: "desc", label: t("价格从高到低") },
                    ]}
                    onChange={setSort}
                  />
                </>
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
      <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
        {store.items.map((unit) => (
          <article
            key={unit.id}
            className="group relative flex min-w-0 cursor-pointer overflow-hidden rounded-[7px] border border-[#e4e9f0] transition-colors hover:border-[#afc1d6]"
            onClick={(event) => {
              if (shouldOpenRow(event)) onViewUnit(unit);
            }}
          >
            {unit.coverUrl ? (
              <img
                src={unit.coverUrl}
                alt={t(`${unit.unitNo}的首张图片`)}
                loading="lazy"
                className="h-28 w-32 shrink-0 bg-[#f2f5f8] object-cover max-[480px]:w-24"
              />
            ) : (
              <div className="flex h-28 w-32 shrink-0 items-center justify-center bg-[#f2f5f8] text-[#9eacbf] max-[480px]:w-24">
                <PictureOutlined className="text-2xl" aria-hidden />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3">
              <h3 className="m-0 truncate text-[16px] font-semibold text-[#26334a]">
                {t(unit.unitNo)}
              </h3>
              <p className="m-0 truncate text-[14px] font-medium text-[#1b355d]">
                {t("参考月租")}{" "}
                {unit.referenceRent != null
                  ? t(amount(unit.referenceRent))
                  : `${t(amount(unit.minRent))} – ${t(amount(unit.maxRent))}`}
              </p>
            </div>
            {canEdit && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "edit",
                      label: t("编辑单位"),
                      icon: <EditOutlined />,
                      onClick: () => onEditUnit(unit),
                    },
                    {
                      key: "delete",
                      label: t("删除"),
                      danger: true,
                      icon: <DeleteOutlined />,
                      onClick: () => onDeleteUnit(unit),
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined aria-hidden />}
                  aria-label={t(`${unit.unitNo}的操作`)}
                  className="!absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={(event) => event.stopPropagation()}
                />
              </Dropdown>
            )}
          </article>
        ))}
      </div>
      {!store.items.length && !store.loading && !store.error && (
        <Empty description={t("暂无单位")} className="py-12" />
      )}
      <div className="mt-6 flex items-center justify-end gap-4">
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
