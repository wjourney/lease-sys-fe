import { Empty, TabsProps } from "antd";
import { DetailContextValue } from "../../../../components/resource-detail/DetailContext";
import { t } from "../../../../shared/i18n";
import { OrderBills } from "./OrderBills";
import { OrderDepositSummary } from "./OrderDepositSummary";
import { OrderCommissions } from "./OrderCommissions";
import { OrderFiles } from "./OrderFiles";
export function getOrderTabs(
  ctx: DetailContextValue,
): NonNullable<TabsProps["items"]> {
  const denied = <Empty description={t("暂无此栏目的访问权限")} />;
  return [
    {
      key: "bills",
      label: t("收款与账单"),
      children: ctx.root.canRead("incomes") ? <OrderBills /> : denied,
    },
    { key: "deposit", label: t("押金管理"), children: <OrderDepositSummary /> },
    {
      key: "commissions",
      label: t("订单佣金"),
      children: ctx.root.canRead("commissions") ? <OrderCommissions /> : denied,
    },
    {
      key: "materials",
      label: t("文件与资料"),
      children: ctx.root.canRead("materials") ? <OrderFiles /> : denied,
    },
  ];
}
