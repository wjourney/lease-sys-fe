import { observer } from "mobx-react-lite";
import { useRoot } from "../stores/root";
import { Tag, Typography } from "antd";
import { amount, dateText } from "./api";
import { feeLabels, roleLabels, statusLabels } from "./config";
import { t } from "./i18n";
const { Text } = Typography;
export function Status({
  value,
  resource,
}: {
  value: string;
  resource?: string;
}) {
  const positive = [
    "ACTIVE",
    "AVAILABLE",
    "PAID",
    "CONFIRMED",
    "READY",
    "SENT",
    "DONE",
  ];
  const negative = ["DISABLED", "REJECTED", "VOID", "FAILED", "CLOSED"];
  const color = positive.includes(value)
    ? "green"
    : negative.includes(value)
      ? "default"
      : [
            "PARTIAL",
            "PENDING",
            "UNPAID",
            "LOCKED",
            "UNSET",
            "OPEN",
            "UNKNOWN",
          ].includes(value)
        ? "gold"
        : "blue";
  let label = statusLabels[value] ?? value;
  if (resource === "orders" && value === "DRAFT") label = "待完善";
  if (resource === "orders" && value === "ACTIVE") label = "租赁中";
  if (resource === "incomes" && value === "PAID") label = "已付款";
  if (resource === "incomes" && ["OPEN", "PARTIAL"].includes(value))
    label = "待付款";
  if (resource === "receipts" && value === "PENDING") label = "待核对";
  if (resource === "expenses" && value === "PAID") label = "已付款";
  if (resource === "commissions" && ["OPEN", "UNPAID"].includes(value))
    label = "待付款";
  if (resource === "commissions" && value === "PARTIAL") label = "部分付款";
  return (
    <Tag bordered={false} color={color}>
      {t(label || "—")}
    </Tag>
  );
}
export function valueView(key: string, value: any, resource?: string) {
  if (value === null || value === undefined || value === "")
    return <Text type="secondary">—</Text>;
  if (key === "role") return t(roleLabels[value] || value);
  if (key === "feeType") return t(feeLabels[value] || value);
  if (key === "registrationNoType")
    return t(
      (
        {
          BR: "商业登记号码",
          CR: "公司注册号码",
          HKID: "香港身份证",
          PASSPORT: "护照",
        } as Record<string, string>
      )[value] || value,
    );
  if (key === "depositPlan")
    return t(
      (
        {
          ONE_ONE: "押一付一",
          TWO_ONE: "押二付一",
          THREE_ONE: "押三付一",
          OTHER: "其他",
        } as Record<string, string>
      )[value] || value,
    );
  if (key.toLowerCase().includes("status"))
    return <Status value={value} resource={resource} />;
  if (
    [
      "amount",
      "total",
      "confirmed",
      "remaining",
      "available",
      "pending",
      "paidAmount",
      "remainingAmount",
      "monthlyRent",
      "depositAmount",
      "referenceRent",
      "minRent",
      "maxRent",
      "depositDeductionAmount",
    ].includes(key)
  )
    return (
      <span className="whitespace-nowrap tabular-nums">{t(amount(value))}</span>
    );
  if (
    key.endsWith("On") ||
    key.endsWith("At") ||
    key === "periodStart" ||
    key === "periodEnd"
  )
    return dateText(value);
  if (typeof value === "boolean") return t(value ? "是" : "否");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}
export const Brand = observer(function Brand() {
  const { site } = useRoot();
  return (
    <div className="brand flex h-[86px] items-center gap-2.5 overflow-hidden px-[18px] text-white whitespace-nowrap [&_strong]:block [&_strong]:text-[13px] [&_strong]:tracking-[1.1px] [&_small]:mt-[5px] [&_small]:block [&_small]:text-[10px] [&_small]:tracking-[3px] [&_small]:text-[#b7c0ce]">
      {site.logoUrl ? (
        <img
          src={site.logoUrl}
          alt={site.siteName}
          className="h-9 w-9 shrink-0 object-contain"
          onError={(event) => {
            if (!event.currentTarget.src.includes("/site-config/logo"))
              event.currentTarget.src = `/api/v1/site-config/logo?v=${site.revision}`;
          }}
        />
      ) : (
        <svg width="36" height="30" viewBox="0 0 40 32" aria-hidden="true">
          <path
            d="M3 5v22l15-8 18 8V5L18 14z"
            fill="none"
            stroke="#c6a16a"
            strokeWidth="2"
          />
          <path d="M3 5l15 9V4" stroke="#c6a16a" fill="none" />
        </svg>
      )}
      <div className="min-w-0">
        <strong className="truncate" title={site.siteName}>
          {site.siteName}
        </strong>
        <small className="truncate" title={site.subtitle}>
          {site.subtitle}
        </small>
      </div>
    </div>
  );
});
export function BuildingArt({ index = 0 }: { index?: number }) {
  const towerClassName =
    "absolute -bottom-[14px] grid -skew-y-[5deg] gap-[5px] bg-[#e7eaec] p-[11px] shadow-[9px_0_0_#acbdc9] [&_i]:block [&_i]:min-h-2.5 [&_i]:min-w-2 [&_i]:bg-[linear-gradient(110deg,#b8cbd7,#a3b9ca)]";
  return (
    <div
      className={
        "relative h-[145px] overflow-hidden " +
        [
          "bg-[linear-gradient(140deg,#e2e9ec,#c4d4df)]",
          "bg-[linear-gradient(130deg,#e3e7dd,#c3d0c5)]",
          "bg-[linear-gradient(140deg,#e7dfd4,#ccd8df)]",
        ][index % 3]
      }
    >
      <div className="absolute top-[11px] left-[18%] size-[76px] rounded-full bg-[#f6f1e6] opacity-70" />
      <div
        className={`${towerClassName} left-[15%] h-[114px] w-[50px] grid-cols-3`}
      >
        {t(
          Array.from(
            {
              length: 18,
            },
            (_, i) => <i key={i} />,
          ),
        )}
      </div>
      <div
        className={`${towerClassName} left-[40%] h-[145px] w-[65px] grid-cols-4`}
      >
        {t(
          Array.from(
            {
              length: 24,
            },
            (_, i) => <i key={i} />,
          ),
        )}
      </div>
      <div
        className={`${towerClassName} left-[72%] h-[88px] w-[43px] grid-cols-3`}
      >
        {t(
          Array.from(
            {
              length: 12,
            },
            (_, i) => <i key={i} />,
          ),
        )}
      </div>
      <div className="absolute bottom-[13px] left-[17px] bg-[#ffffff99] px-[7px] py-[5px] text-[8px] tracking-[2px] text-[#465e71]">
        SUPREME BAY RESIDENCES
      </div>
    </div>
  );
}
