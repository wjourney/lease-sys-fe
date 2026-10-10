import { Button, Space } from "antd";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { OrderTable } from "./OrderTable";
import { OrderFigures } from "./OrderFigures";
import { sumMoney, remainingMoney } from "../order-financials";

export function OrderCommissions() {
  const { row, id, root, openAction, navigate } = useRecordDetail();
  const commissions: Row[] = row.commissions ?? [];
  const active = commissions.filter((item) => item.status !== "VOID");
  const agreement = row.orderCommission ?? active[0];
  const mode =
    (
      {
        MONTHLY: "单月结付",
        YEARLY: "按年结付",
        ONE_TIME: "一次性结付",
        RECURRING_MONTHLY: "按月结付",
      } as Row
    )[agreement?.mode] ||
    agreement?.mode ||
    "—";
  const payable = (item: Row) =>
    Number(item.availableAmount) > 0 &&
    Number(item.availableAmount) === Number(item.remainingAmount);
  const next = active.find(payable);
  const totalKnown =
    active.length > 0 && active.every((item) => item.amount != null);
  function pay(item: Row) {
    openAction(
      `登记佣金付款 · ${dateText(item.periodStart)}`,
      [
        {
          key: "amount",
          label: "付款金额（一次付清）",
          type: "money",
          readOnly: true,
        },
        ...financialFields,
      ],
      `/commissions/${item.id}/payments`,
      { amount: item.availableAmount, paymentMethod: "BANK" },
      { sourceKey: crypto.randomUUID() },
    );
  }
  return (
    <OrderTable
      title="订单佣金"
      rows={commissions}
      actions={
        root.finance && next ? (
          <Button type="primary" onClick={() => pay(next)}>
            {t("登记付款")}
          </Button>
        ) : undefined
      }
      summary={
        <>
          <p className="m-0 mb-5 text-sm text-[#52627a]">
            {t("收款方")}：
            {t(
              [
                active[0]?.companyName || row.companyName,
                active[0]?.salesName || row.salesName,
              ]
                .filter(Boolean)
                .join(" · ") || "—",
            )}{" "}
            <span className="ml-4">
              {t("结付方式")}：{t(mode)}
            </span>
          </p>
          <OrderFigures
            items={[
              {
                label:
                  agreement?.mode === "RECURRING_MONTHLY"
                    ? "每月佣金"
                    : "约定佣金",
                value:
                  agreement?.amount != null ? amount(agreement.amount) : "—",
              },
              {
                label: "租期应付",
                value: totalKnown ? amount(sumMoney(active, "amount")) : "—",
              },
              { label: "已付", value: amount(sumMoney(active, "paidAmount")) },
              {
                label: "剩余应付",
                value: totalKnown
                  ? amount(
                      active.reduce(
                        (total, item) =>
                          total + Math.round(remainingMoney(item) * 100),
                        0,
                      ) / 100,
                    )
                  : "—",
                emphasis: true,
              },
              { label: "首笔结付日期", value: dateText(agreement?.dueOn) },
            ]}
          />
          <h3 className="mb-1 mt-5 text-base font-semibold text-[#263650]">
            {t("佣金明细")}
          </h3>
        </>
      }
      columns={[
        {
          title: t("结算期间"),
          render: (_, item) => (
            <>
              {dateText(item.periodStart)} 至 {dateText(item.periodEnd)}
              {item.status === "VOID" && (
                <div className="text-xs text-[#8793a4]">{t("已作废")}</div>
              )}
            </>
          ),
        },
        {
          title: t("应付金额"),
          dataIndex: "amount",
          render: (value) => (value == null ? "—" : amount(value)),
        },
        { title: t("已付金额"), dataIndex: "paidAmount", render: amount },
        {
          title: t("剩余金额"),
          render: (_, item) =>
            item.status === "VOID"
              ? "—"
              : item.remainingAmount == null
                ? "—"
                : amount(item.remainingAmount),
        },
        { title: t("结付日期"), dataIndex: "dueOn", render: dateText },
        {
          title: t("操作"),
          render: (_, item) => (
            <Space wrap size={4}>
              {root.finance && item.status !== "VOID" && payable(item) && (
                <Button type="link" size="small" onClick={() => pay(item)}>
                  {t("登记付款")}
                </Button>
              )}
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/commissions/${item.id}`)}
              >
                {t("查看记录")}
              </Button>
              {root.manageOrders &&
                item.status !== "VOID" &&
                Number(item.paidAmount) === 0 &&
                Number(item.availableAmount) === Number(item.amount) && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() =>
                      openAction(
                        "作废佣金",
                        [
                          {
                            key: "reason",
                            label: "作废原因",
                            type: "textarea",
                          },
                        ],
                        `/orders/${id}/commissions/${item.id}/void`,
                      )
                    }
                  >
                    {t("作废")}
                  </Button>
                )}
            </Space>
          ),
        },
      ]}
      supplementary={
        agreement?.remark && (
          <p className="mb-0 mt-4 border-t border-[#edf0f4] pt-3 text-sm text-[#78869a]">
            {t("佣金备注")}：{t(agreement.remark)}
          </p>
        )
      }
    />
  );
}
