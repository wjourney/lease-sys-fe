import { ArrowRightOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Pagination, Spin, Tag, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { NavigateFunction, SetURLSearchParams } from "react-router-dom";
import { t } from "../../../../shared/i18n";
import { BuildingArt } from "../../../../shared/ui";
import { ListStore } from "../../../../stores/root";
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
  return (
    <Spin spinning={store.loading}>
      <div className="project-grid grid grid-cols-3 gap-[22px] max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
        {store.items.map((row, i) => (
          <Card
            key={row.id}
            className="project-card overflow-hidden !border-[#e6eaf0] [&_.ant-card-body]:!p-[19px]"
            cover={
              row.coverUrl ? (
                <img
                  className="h-[190px] w-full object-cover"
                  src={row.coverUrl}
                  alt={row.name}
                />
              ) : (
                <BuildingArt index={i} />
              )
            }
          >
            <div className="flex items-center justify-between gap-1 [&_h4]:!mb-2 [&_h4]:!text-base">
              <Title level={4}>{t(row.name)}</Title>
              <Tag color="green" bordered={false}>
                {t("可租")}
                {t(row.availableCount)}
                {t("套")}
              </Tag>
            </div>
            <div className="my-[5px] mb-[19px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#8290a2]">
              <EnvironmentOutlined aria-hidden={true} /> {t(row.region)} ·{" "}
              {t(row.address)}
            </div>
            <div className="mb-5 flex gap-3 border-t border-[#eff1f5] pt-3.5 text-[11px] text-[#8290a2] [&_b]:ml-[3px] [&_b]:font-medium [&_b]:text-[#45546b]">
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
            <Button block onClick={() => navigate(`/projects/${row.id}`)}>
              {t("查看项目")}
              <ArrowRightOutlined aria-hidden={true} />
            </Button>
          </Card>
        ))}
      </div>
      {!store.items.length && !store.loading && (
        <Empty description={t("暂无项目")} />
      )}
      <div className="mt-[26px] flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
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
  );
});
