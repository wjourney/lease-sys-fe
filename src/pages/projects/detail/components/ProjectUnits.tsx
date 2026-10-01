import {
  DeleteOutlined,
  PictureOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Input, Pagination, Select, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { amount, options, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { shouldOpenRow } from "../../../../shared/row-navigation";
import { ListStore, useRoot } from "../../../../stores/root";
import { UnitDeleteModal } from "./UnitDeleteModal";

type Filters = {
  q: string;
  status?: string;
  unitTypeCode?: string;
  sort?: string;
};

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
  const store = useMemo(() => new ListStore(), []);
  const [draft, setDraft] = useState<Filters>({ q: "" });
  const [filters, setFilters] = useState<Filters>({ q: "" });
  const [page, setPage] = useState(1);
  const [unitToDelete, setUnitToDelete] = useState<Row>();
  const [unitTypes, setUnitTypes] = useState<
    { label: string; value: string }[]
  >([]);

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

  const query = useMemo(
    () => ({
      projectId,
      page,
      pageSize: 10,
      q: filters.q || undefined,
      status: filters.status,
      unitTypeCode: filters.unitTypeCode,
      ...(filters.sort && filters.sort !== "default"
        ? {
            sortBy: "referenceRent",
            sort: filters.sort,
          }
        : {}),
    }),
    [projectId, page, filters],
  );
  useEffect(() => {
    void store.load("units", query, root.epoch, root.user?.id || "");
  }, [store, query, root.epoch, root.user?.id]);

  const apply = () => {
    setPage(1);
    setFilters({ ...draft });
  };
  const reset = () => {
    setDraft({ q: "" });
    setFilters({ q: "" });
    setPage(1);
  };

  return (
    <section className="rounded-[7px] border border-[#e0e6ed] bg-white px-[26px] py-[26px] max-[760px]:px-4">
      <div className="mb-6 grid grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,1fr))_auto_auto] items-end gap-4 border-b border-[#e1e7ef] pb-6 max-[1250px]:grid-cols-4 max-[760px]:grid-cols-2 max-[480px]:grid-cols-1">
        <label className="flex min-w-0 flex-col gap-2 text-sm text-[#71809a]">
          <span>{t("关键词")}</span>
          <Input
            className="min-w-0 !h-11"
            value={draft.q}
            prefix={<SearchOutlined className="text-[#8fa0ba]" aria-hidden />}
            placeholder={t("请输入单位名称或编号")}
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
            onPressEnter={apply}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm text-[#71809a]">
          <span>{t("单位类型")}</span>
          <Select
            className="min-w-0 !h-11"
            value={draft.unitTypeCode}
            placeholder={t("全部类型")}
            allowClear
            options={unitTypes}
            onChange={(value) => setDraft({ ...draft, unitTypeCode: value })}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm text-[#71809a]">
          <span>{t("状态")}</span>
          <Select
            className="min-w-0 !h-11"
            value={draft.status}
            placeholder={t("全部状态")}
            allowClear
            options={[
              { value: "AVAILABLE", label: t("可租") },
              { value: "LOCKED", label: t("已锁定") },
              { value: "OCCUPIED", label: t("出租中") },
            ]}
            onChange={(value) => setDraft({ ...draft, status: value })}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm text-[#71809a]">
          <span>{t("价格排序")}</span>
          <Select
            className="min-w-0 !h-11"
            value={draft.sort || "default"}
            options={[
              { value: "default", label: t("默认排序") },
              ...(allowExactRent
                ? [
                    { value: "asc", label: t("价格从低到高") },
                    { value: "desc", label: t("价格从高到低") },
                  ]
                : []),
            ]}
            onChange={(value) => setDraft({ ...draft, sort: value })}
          />
        </label>
        <Button
          className="!h-11"
          type="primary"
          icon={<SearchOutlined aria-hidden />}
          onClick={apply}
        >
          {t("查询")}
        </Button>
        <Button className="!h-11" onClick={reset}>
          {t("重置")}
        </Button>
      </div>
      {store.error && (
        <Alert
          type="error"
          showIcon
          message={t(store.error)}
          className="mb-4"
          action={
            <Button
              onClick={() =>
                void store.load(
                  "units",
                  query,
                  root.epoch,
                  root.user?.id || "",
                  true,
                )
              }
            >
              {t("重试")}
            </Button>
          }
        />
      )}
      <Spin spinning={store.loading}>
        {store.items.length ? (
          <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
            {store.items.map((unit) => (
              <article
                key={unit.id}
                className="cursor-pointer overflow-hidden rounded-[7px] border border-[#dfe6ee] transition-colors hover:border-[#afc1d6]"
                onClick={(event) => {
                  if (shouldOpenRow(event)) onViewUnit(unit);
                }}
              >
                {unit.coverUrl ? (
                  <img
                    src={unit.coverUrl}
                    alt={t(`${unit.unitNo}的首张图片`)}
                    loading="lazy"
                    className="h-44 w-full bg-[#f2f5f8] object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#f2f5f8] text-[#9eacbf]">
                    <PictureOutlined className="text-4xl" aria-hidden />
                  </div>
                )}
                <div className="px-[26px] py-[22px]">
                  <h3 className="m-0 text-[20px] font-semibold text-[#26334a]">
                    {t(unit.unitNo)}
                  </h3>
                  <p className="mb-[18px] mt-5 text-[13px] text-[#78879b]">
                    {[
                      unit.layout,
                      unit.area != null ? `${unit.area}㎡` : "",
                      unit.decoration,
                    ]
                      .filter(Boolean)
                      .map(t)
                      .join(" · ") || "—"}
                  </p>
                  <p className="m-0 text-[18px] font-semibold text-[#192d4c]">
                    {unit.referenceRent != null
                      ? `${t("参考月租")} ${t(amount(unit.referenceRent))}`
                      : `${t("参考月租范围")} ${t(amount(unit.minRent))} – ${t(amount(unit.maxRent))}`}
                  </p>
                  <p className="my-[19px] text-[12px] text-[#8190a2]">
                    {t("单位类型")}：
                    {t(unit.unitTypeName || unit.unitTypeCode || "—")}
                    {" · "}
                    {t("文件可在详情中下载")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => onViewUnit(unit)}>
                      {t("查看单位")}
                    </Button>
                    {root.canWrite("units") && (
                      <>
                        <Button onClick={() => onEditUnit(unit)}>
                          {t("编辑单位")}
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined aria-hidden />}
                          onClick={() => setUnitToDelete(unit)}
                        >
                          {t("删除")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : !store.loading && !store.error ? (
          <Empty
            description={
              <div className="space-y-2 text-center">
                <p className="m-0 font-medium text-[#26334a]">
                  {t("暂无单位")}
                </p>
                <p className="m-0 text-sm text-[#8190a2]">
                  {t("新建单位后，可在此管理出租状态与价格。")}
                </p>
              </div>
            }
            className="py-16"
          />
        ) : null}
      </Spin>
      <div className="mt-6 flex items-center justify-between gap-4 max-[620px]:flex-col max-[620px]:items-end">
        <span className="text-[12px] text-[#8190a2]">
          {t(`共 ${store.total} 个单位`)}
        </span>
        <Pagination
          current={page}
          pageSize={10}
          total={store.total}
          showSizeChanger={false}
          onChange={setPage}
        />
      </div>
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
    </section>
  );
});
