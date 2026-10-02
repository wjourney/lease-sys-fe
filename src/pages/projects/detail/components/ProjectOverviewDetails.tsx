import { ReactNode } from "react";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <dt className="shrink-0 whitespace-nowrap text-[#71809a]">
        {t(label)}：
      </dt>
      <dd className="m-0 min-w-0 break-words whitespace-pre-line text-[#1e3454]">
        {value}
      </dd>
    </div>
  );
}

export function ProjectOverviewDetails({
  row,
  actions,
}: {
  row: Row;
  actions: ReactNode;
}) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-3 max-[850px]:grid-cols-1">
      <dl className="col-span-2 grid grid-cols-3 gap-x-5 text-[14px] leading-6 max-[1250px]:grid-cols-2 max-[850px]:col-span-1 max-[700px]:grid-cols-1 max-[700px]:gap-y-2">
        <DetailItem label="区域" value={t(row.region || "—")} />
        <DetailItem label="详细地址" value={t(row.address || "—")} />
        <DetailItem
          label="销售端价格"
          value={
            row.salesCanViewExactRent ? t("可查看具体租金") : t("仅显示范围")
          }
        />
      </dl>
      <dl className="min-w-0 text-[14px] leading-6">
        <DetailItem
          label="项目介绍"
          value={t(row.description || "暂无项目介绍")}
        />
      </dl>
      <div className="flex flex-wrap justify-end gap-2 max-[850px]:justify-start">
        {actions}
      </div>
    </div>
  );
}
