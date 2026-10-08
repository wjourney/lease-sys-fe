import { EnvironmentOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { type ReactNode, useState } from "react";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { ProjectLocationModal } from "../../components/ProjectLocationModal";
import { projectLocation } from "../../project-location";

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
  const [showMap, setShowMap] = useState(false);
  const location = projectLocation(row.latitude, row.longitude);
  return (
    <div className="min-w-0 flex-1">
      <dl className="m-0 grid max-w-[680px] grid-cols-[minmax(0,210px)_minmax(0,1fr)] gap-x-5 gap-y-2 text-[14px] leading-6 max-[700px]:grid-cols-1">
        <DetailItem label="区域" value={t(row.region || "—")} />
        <DetailItem
          label="详细地址"
          value={
            <span className="inline-flex flex-wrap items-center gap-x-2">
              <span>{t(row.address || "—")}</span>
              {location && (
                <Button
                  type="link"
                  size="small"
                  className="!h-auto !p-0"
                  icon={<EnvironmentOutlined aria-hidden />}
                  onClick={() => setShowMap(true)}
                >
                  {t("查看地图")}
                </Button>
              )}
            </span>
          }
        />
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
      {showMap && location && (
        <ProjectLocationModal
          location={location}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
