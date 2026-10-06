import {
  ApartmentOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { t } from "../shared/i18n";
import { RootStore } from "../stores/root";

export function getNavigation(root: RootStore) {
  return [
    {
      key: "/projects",
      icon: <ApartmentOutlined aria-hidden />,
      label: t("项目管理"),
      resource: "projects",
    },
    {
      key: "/sales-companies",
      icon: <TeamOutlined aria-hidden />,
      label: t("销售组织"),
      resource: "sales-companies",
    },
    {
      key: "/orders",
      icon: <FileTextOutlined aria-hidden />,
      label: t("订单管理"),
      resource: "orders",
    },
    {
      key: "/users",
      icon: <UserOutlined aria-hidden />,
      label: t("账号管理"),
      resource: "users",
    },
    {
      key: "finance",
      icon: <DollarCircleOutlined aria-hidden />,
      label: t("财务管理"),
      children: [
        ["incomes", "账单管理"],
        ["commissions", "佣金管理"],
        ["fund-ledger", "资金流水"],
        ["finance-statistics", "财务统计"],
        ["expenses", "支出管理"],
      ]
        .filter(([resource]) =>
          ["fund-ledger", "finance-statistics"].includes(resource)
            ? root.finance
            : root.canRead(resource),
        )
        .map(([resource, label]) => ({ key: `/${resource}`, label: t(label) })),
    },
    {
      key: "settings",
      icon: <SettingOutlined aria-hidden />,
      label: t("系统设置"),
      children: [
        ...(root.canRead("fund-accounts")
          ? [{ key: "/fund-accounts", label: t("资金账户") }]
          : []),
        ...(root.canWrite("settings")
          ? [{ key: "/settings", label: t("网站配置") }]
          : []),
      ],
    },
  ]
    .filter(
      (item) =>
        !("resource" in item) || !item.resource || root.canRead(item.resource),
    )
    .filter((item) => !item.children || item.children.length);
}
