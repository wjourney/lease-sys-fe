import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export function ProjectStats({ row }: { row: Row }) {
  const stats = [
    { label: "单位总数", value: row.unitCount, color: "bg-[#8995aa]" },
    { label: "可租", value: row.availableCount, color: "bg-[#52c52e]" },
    { label: "已锁定", value: row.lockedCount, color: "bg-[#ffb62c]" },
    { label: "出租中", value: row.occupiedCount, color: "bg-[#2878f0]" },
  ];

  return (
    <div className="grid grid-cols-4 content-center gap-3 border-l border-[#e1e7ef] pl-6 max-[1100px]:border-l-0 max-[1100px]:border-t max-[1100px]:pl-0 max-[1100px]:pt-4 max-[600px]:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0 text-center">
          <div className="flex items-center justify-center gap-2 text-[28px] font-semibold leading-8 text-[#132c53]">
            <span className={`size-2.5 shrink-0 rounded-full ${stat.color}`} />
            <span>{stat.value ?? 0}</span>
          </div>
          <div className="mt-1 text-xs font-medium text-[#31445f]">
            {t(stat.label)}
          </div>
        </div>
      ))}
    </div>
  );
}
