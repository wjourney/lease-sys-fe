import { Alert, Card, Descriptions, TabsProps } from "antd";
import { DetailContextValue } from "../../../../components/resource-detail/DetailContext";
import { ResourceList } from "../../../../components/resource-list/ResourceList";
import { amount, dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
export function getOrderTabs(
  ctx: DetailContextValue,
): NonNullable<TabsProps["items"]> {
  const { resource, root, id } = ctx;
  const tabs: NonNullable<TabsProps["items"]> = [];
  if (resource === "orders") {
    const payment = ctx.row.initialPayment;
    if (payment && Object.keys(payment).length)
      tabs.push({
        key: "initial-payment",
        label: t("首期收款填报"),
        children: (
          <Card>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message={t(
                "以下为创建订单时的填报信息，实际到账及单据以财务核对记录为准。",
              )}
            />
            <Descriptions
              column={{ xs: 1, sm: 2, lg: 3 }}
              items={[
                ["是否已付首期款", payment.paid ? "已付款" : "未付款"],
                ["首期租金", payment.rentPaid ? "已付款" : "未付款"],
                ["押金", payment.depositPaid ? "已付款" : "未付款"],
                ["首期实收", amount(payment.rentReceived)],
                ["押金实收", amount(payment.depositReceived)],
                [
                  payment.receivedOn ? "到账日期" : "到期日期",
                  dateText(payment.receivedOn || payment.dueOn),
                ],
              ].map(([label, value]) => ({
                key: label,
                label: t(label),
                children: t(value),
              }))}
            />
          </Card>
        ),
      });
    if (root.canRead("incomes"))
      tabs.push({
        key: "incomes",
        label: t("收入 / 账单"),
        children: (
          <ResourceList
            resource="incomes"
            fixed={{
              orderId: id,
            }}
            embedded
          />
        ),
      });
    if (root.canRead("commissions"))
      tabs.push({
        key: "commissions",
        label: t("订单佣金"),
        children: (
          <ResourceList
            resource="commissions"
            fixed={{
              orderId: id,
            }}
            embedded
          />
        ),
      });
  }
  return tabs;
}
