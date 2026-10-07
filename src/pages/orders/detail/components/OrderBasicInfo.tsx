import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Card } from "antd";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { amount, dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { OrderConfig } from "../../orders.config";

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid min-w-0 grid-cols-[104px_minmax(0,1fr)] gap-3 text-sm max-[520px]:grid-cols-[88px_minmax(0,1fr)]">
      <dt className="text-[#8793a4]">{t(label)}</dt>
      <dd className="m-0 min-w-0 break-words font-medium text-[#273650]">
        {t(String(value ?? "—"))}
      </dd>
    </div>
  );
}

export function OrderBasicInfo() {
  const { row } = useRecordDetail();
  const [more, setMore] = useState(false);
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
    ["项目 / 单位", [row.projectName, row.unitNo].filter(Boolean).join(" · ")],
    ["租期", `${dateText(row.startsOn)} 至 ${dateText(row.endsOn)}`],
    ["实际成交月租", row.monthlyRent == null ? "—" : amount(row.monthlyRent)],
    ["约定押金", row.depositAmount == null ? "—" : amount(row.depositAmount)],
  ];
  const extraRows: [string, unknown][] = [
    ["押付方式", option("depositPlan")],
    [
      "付款频率",
      row.paymentIntervalMonths ? `每 ${row.paymentIntervalMonths} 个月` : "—",
    ],
    ["每月交租日", row.rentDueDay ? `${row.rentDueDay} 日` : "—"],
    ["账单生成方式", row.billingVersion === 2 ? "整租期按月生成" : "历史周期出账"],
    ["首期不足月", row.firstPeriodProration ? "按天折算" : "按整月计算"],
    ["末期不足月", row.lastPeriodProration ? "按天折算" : "按整月计算"],
    ["办理入住日期", dateText(row.moveInOn)],
    ["实际退租日期", dateText(row.actualTerminationOn)],
    ["交还日期", dateText(row.handedOverAt)],
    ["订单备注", row.remark || "—"],
  ];
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card
        title={t("租客与销售归属")}
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-head-title]:!text-base [&_.ant-card-body]:!p-6"
      >
        <dl className="m-0 grid gap-4">
          {tenantRows.map(([label, value]) => (
            <InfoRow key={label} label={label} value={value} />
          ))}
        </dl>
      </Card>
      <Card
        title={t("租约信息")}
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-head-title]:!text-base [&_.ant-card-body]:!p-6"
      >
        <dl className="m-0 grid gap-4">
          {leaseRows.map(([label, value]) => (
            <InfoRow key={label} label={label} value={value} />
          ))}
          {more && (
            <div className="mt-1 grid gap-4 border-t border-[#edf0f4] pt-5">
              {extraRows.map(([label, value]) => (
                <InfoRow key={label} label={label} value={value} />
              ))}
            </div>
          )}
        </dl>
        <Button
          type="link"
          className="!mt-5 !h-auto !p-0"
          icon={more ? <UpOutlined /> : <DownOutlined />}
          iconPosition="end"
          aria-expanded={more}
          onClick={() => setMore((v) => !v)}
        >
          {t(more ? "收起租约规则" : "查看更多租约规则")}
        </Button>
      </Card>
    </div>
  );
}
