import { Card, Empty } from "antd";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { amount, dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { OrderConfig } from "../../orders.config";
import { OrderFiles } from "./OrderFiles";

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)] items-center gap-3 border-b border-[#edf0f4] py-3 text-sm">
      <dt className="text-[#78869a]">{t(label)}</dt>
      <dd className="m-0 min-w-0 break-words font-medium text-[#273650]">
        {t(String(value == null || value === "" ? "—" : value))}
      </dd>
    </div>
  );
}
export function OrderBasicInfo() {
  const { row, root } = useRecordDetail();
  const option = (key: string) =>
    OrderConfig.fields
      .find((f) => f.key === key)
      ?.options?.find((x) => x.value === row[key])?.label || "—";
  const tenantRows: [string, unknown][] = [
    ["租客类型", row.tenantType === "COMPANY" ? "公司" : "个人"],
    [row.tenantType === "COMPANY" ? "公司名称" : "租客姓名", row.tenantName],
    ["联系电话", row.tenantPhone],
    ["电子邮箱", row.tenantEmail],
    ...(row.tenantType === "COMPANY"
      ? ([
          ["注册号码类型", option("registrationNoType")],
          ["注册号码", row.tenantRegistrationNo],
          ["联系人", row.tenantContactName],
        ] as [string, unknown][])
      : []),
    ["销售公司", row.companyName],
    ["负责销售", row.salesName],
  ];
  const leaseRows: [string, unknown][] = [
    ["所属项目", row.projectName],
    ["单位", row.unitNo],
    ["起租日期", dateText(row.startsOn)],
    ["到期日期", dateText(row.endsOn)],
    ["成交月租", row.monthlyRent == null ? "—" : amount(row.monthlyRent)],
    ["约定押金", row.depositAmount == null ? "—" : amount(row.depositAmount)],
    ["押付方式", option("depositPlan")],
    ["每月交租日", row.rentDueDay ? `${row.rentDueDay} 日` : "—"],
    ...(row.actualTerminationOn
      ? ([["实际结束日期", dateText(row.actualTerminationOn)]] as [
          string,
          unknown,
        ][])
      : []),
    [
      "付款频率",
      row.paymentIntervalMonths ? `每 ${row.paymentIntervalMonths} 个月` : "—",
    ],
  ];
  const cardClass =
    "!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-head-title]:!text-base [&_.ant-card-body]:!px-5 [&_.ant-card-body]:!py-2";
  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3.4fr)]">
        <Card title={t("租客与销售归属")} className={cardClass}>
          <dl className="m-0">
            {tenantRows.map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
          </dl>
        </Card>
        <Card title={t("租约信息")} className={cardClass}>
          <dl className="m-0 grid gap-x-6 sm:grid-cols-2">
            {leaseRows.map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
          </dl>
          <dl className="m-0">
            <InfoRow label="备注" value={row.remark} />
          </dl>
          <p className="my-3 text-xs leading-5 text-[#78869a]">
            {t(
              row.firstPeriodProration !== false &&
                row.lastPeriodProration !== false
                ? "不足月按天折算：月租 × 实际租用天数 ÷ 完整账期天数（包含起止日）。"
                : `不足月租金：首期${row.firstPeriodProration !== false ? "按天折算" : "按整月计算"}，末期${row.lastPeriodProration !== false ? "按天折算" : "按整月计算"}`,
            )}
          </p>
        </Card>
      </div>
      {root.canRead("materials") ? (
        <OrderFiles />
      ) : (
        <Card title={t("合同与附件")}>
          <Empty description={t("暂无此栏目的访问权限")} />
        </Card>
      )}
    </div>
  );
}
