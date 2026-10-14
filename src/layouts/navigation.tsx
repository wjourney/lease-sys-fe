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
import { pageLabel } from "../shared/page-labels";

export function getNavigation(root: RootStore) {
  return [
    {
      key: "/projects",
      icon: <ApartmentOutlined aria-hidden />,
      label: t(pageLabel(root, "projects")),
      resource: "projects",
    },
    {
      key: "/sales-companies",
      icon: <TeamOutlined aria-hidden />,
      label: t(pageLabel(root, "sales-companies")),
      resource: "sales-companies",
    },
    {
      key: "/orders",
      icon: <FileTextOutlined aria-hidden />,
      label: t(pageLabel(root, "orders")),
      resource: "orders",
    },
    {
      key: "/users",
      icon: <UserOutlined aria-hidden />,
      label: t(pageLabel(root, "users")),
      resource: "users",
    },
    ...(root.user?.role === "OPERATIONS"
      ? [
          {
            key: "/incomes",
            icon: <DollarCircleOutlined aria-hidden />,
            label: t(pageLabel(root, "incomes")),
            resource: "incomes",
          },
        ]
      : []),
    {
      key: "finance",
      icon: <DollarCircleOutlined aria-hidden />,
      label: t("财务管理"),
      children: [
        "incomes",
        "invoices",
        "deposits",
        "commissions",
        "expenses",
        "fund-ledger",
        "finance-statistics",
      ]
        .filter((resource) => root.canAccessPage(resource))
        .map((resource) => ({
          key: `/${resource}`,
          label: t(pageLabel(root, resource)),
        })),
    },
    {
      key: "settings",
      icon: <SettingOutlined aria-hidden />,
      label: t("系统设置"),
      children: [
        ...(root.canRead("fund-accounts")
          ? [{ key: "/fund-accounts", label: t("银行账户") }]
          : []),
        ...(root.canWrite("settings")
          ? [{ key: "/settings", label: t(pageLabel(root, "settings")) }]
          : []),
      ],
    },
  ]
    .filter(
      (item) => root.user?.role !== "OPERATIONS" || item.key !== "finance",
    )
    .filter(
      (item) => !root.salesRole || !["finance", "settings"].includes(item.key),
    )
    .filter(
      (item) =>
        !("resource" in item) ||
        !item.resource ||
        root.canAccessPage(item.resource),
    )
    .filter((item) => !item.children || item.children.length)
    .concat(
      root.canAccessPage("company-commissions")
        ? [
            {
              key: "/company-finance",
              icon: <DollarCircleOutlined aria-hidden />,
              label: t(pageLabel(root, "company-finance")),
              resource: "commissions",
            },
            {
              key: "/company-commissions",
              icon: <FileTextOutlined aria-hidden />,
              label: t(pageLabel(root, "company-commissions")),
              resource: "commissions",
            },
          ]
        : [],
    );
}
