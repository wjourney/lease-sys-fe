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
        ["incomes", "收入管理"],
        ["expenses", "支出管理"],
        ["commissions", "佣金管理"],
        ["invoices", "发票管理"],
      ]
        .filter(([resource]) => root.canRead(resource))
        .map(([resource, label]) => ({ key: `/${resource}`, label: t(label) })),
    },
    {
      key: "settings",
      icon: <SettingOutlined aria-hidden />,
      label: t("系统设置"),
      children: root.canRead("settings")
        ? [{ key: "/settings", label: t("单位类型配置") }]
        : [],
    },
  ]
    .filter(
      (item) =>
        !("resource" in item) || !item.resource || root.canRead(item.resource),
    )
    .filter((item) => !item.children || item.children.length);
}
