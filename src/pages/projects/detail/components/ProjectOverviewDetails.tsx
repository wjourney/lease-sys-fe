import { type ReactNode } from "react";
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

export function ProjectOverviewDetails({ row }: { row: Row }) {
  return (
    <div className="min-w-0 flex-1">
      <dl className="m-0 grid max-w-[680px] grid-cols-[minmax(0,210px)_minmax(0,1fr)] gap-x-5 gap-y-2 text-[14px] leading-6 max-[700px]:grid-cols-1">
        <DetailItem label="区域" value={t(row.region || "—")} />
        <DetailItem label="详细地址" value={t(row.address || "—")} />
        <DetailItem
          label="销售端价格"
          value={
            row.salesCanViewExactRent ? t("可查看具体租金") : t("仅显示范围")
          }
        />
        <DetailItem
          label="项目介绍"
          value={t(row.description || "暂无项目介绍")}
        />
      </dl>
    </div>
  );
}
