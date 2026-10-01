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

export function ProjectOverviewDetails({ row }: { row: Row }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] leading-6 max-[700px]:grid-cols-1">
      <DetailItem label="区域" value={t(row.region || "—")} />
      <DetailItem label="详细地址" value={t(row.address || "—")} />
      <DetailItem
        label="项目介绍"
        value={t(row.description || "暂无项目介绍")}
      />
      <DetailItem
        label="销售端价格"
        value={
          row.salesCanViewExactRent ? t("可查看具体租金") : t("仅显示范围")
        }
      />
    </dl>
  );
}
