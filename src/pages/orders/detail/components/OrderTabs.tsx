import { TabsProps } from "antd";
import { DetailContextValue } from "../../../../components/resource-detail/DetailContext";
import { ResourceList } from "../../../../components/resource-list/ResourceList";
import { t } from "../../../../shared/i18n";
export function getOrderTabs(
  ctx: DetailContextValue,
): NonNullable<TabsProps["items"]> {
  const { resource, root, id } = ctx;
  const tabs: NonNullable<TabsProps["items"]> = [];
  if (resource === "orders") {
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
