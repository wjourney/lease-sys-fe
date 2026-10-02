import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export type ProjectUnitStatus = "AVAILABLE" | "LOCKED" | "OCCUPIED";

export function ProjectStats({
  row,
  status,
  onChange,
}: {
  row: Row;
  status?: ProjectUnitStatus;
  onChange: (status?: ProjectUnitStatus) => void;
}) {
  const stats: {
    label: string;
    value: number;
    status?: ProjectUnitStatus;
    color?: string;
  }[] = [
    { label: "单位总数", value: row.unitCount ?? 0 },
    {
      label: "可租",
      value: row.availableCount ?? 0,
      status: "AVAILABLE",
      color: "bg-[#52c52e]",
    },
    {
      label: "已锁定",
      value: row.lockedCount ?? 0,
      status: "LOCKED",
      color: "bg-[#ffb62c]",
    },
    {
      label: "出租中",
      value: row.occupiedCount ?? 0,
      status: "OCCUPIED",
      color: "bg-[#2878f0]",
    },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("单位状态")}
      className="mb-4 flex flex-wrap gap-x-5 border-b border-[#e1e7ef] max-[700px]:gap-x-2"
    >
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          role="tab"
          aria-selected={status === stat.status}
          className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-[3px] px-2 text-[14px] font-medium transition-colors hover:text-[#142d51] focus-visible:outline-2 focus-visible:outline-[#192d4c] ${
            status === stat.status
              ? "border-[#142d51] text-[#142d51]"
              : "border-transparent text-[#43546f]"
          }`}
          onClick={() => onChange(stat.status)}
        >
          {stat.color && (
            <span
              className={`size-2.5 rounded-full ${stat.color}`}
              aria-hidden
            />
          )}
          <span>{t(stat.label)}</span>
          <strong className="font-semibold">{t(stat.value)}</strong>
        </button>
      ))}
    </div>
  );
}
