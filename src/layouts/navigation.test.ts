import { expect, it } from "vitest";
import { RootStore } from "../stores/root";
import { getNavigation } from "./navigation";

const resources = [
  "projects",
  "units",
  "orders",
  "users",
  "sales-companies",
  "incomes",
  "expenses",
  "commissions",
  "invoices",
  "materials",
  "settings",
  "fund-accounts",
];
function store(role: string) {
  const root = new RootStore();
  root.user = {
    role,
    capabilities: {
      read: resources,
      write: resources,
      finance: true,
      manageOrders: true,
    },
  };
  return root;
}
it("sales administrators get only the five company-scoped menus, even with stale capabilities", () => {
  const root = store("SALES_COMPANY_ADMIN");
  const nav = getNavigation(root);
  expect(nav.map((i) => i.key)).toEqual([
    "/projects",
    "/sales-companies",
    "/orders",
    "/company-finance",
    "/company-commissions",
  ]);
  expect(nav[0].label).toBe("可租项目");
  expect(resources.filter((r) => root.canWrite(r))).toEqual([
    "sales-companies",
  ]);
  expect(root.finance).toBe(false);
  expect(root.manageOrders).toBe(false);
  expect(root.canRead("fund-accounts")).toBe(false);
});
it("super administrator navigation and full capabilities stay available", () => {
  const root = store("SUPER_ADMIN");
  const nav = getNavigation(root);
  expect(nav.map((i) => i.key)).toEqual([
    "/projects",
    "/sales-companies",
    "/orders",
    "/users",
    "finance",
    "settings",
  ]);
  expect(nav[0].label).toBe("项目管理");
  expect(resources.every((r) => root.canWrite(r))).toBe(true);
  expect(root.finance && root.manageOrders).toBe(true);
});
it("sales employees have five menus and read-only business permissions", () => {
  const root = store("SALES");
  expect(getNavigation(root).map((i) => i.key)).toEqual([
    "/projects",
    "/sales-companies",
    "/orders",
    "/company-finance",
    "/company-commissions",
  ]);
  expect(resources.some((r) => root.canWrite(r))).toBe(false);
  expect(root.canRead("settings")).toBe(false);
  expect(root.finance || root.manageOrders).toBe(false);
});
it("operations manages business and settings without finance navigation", () => {
  const root = store("OPERATIONS");
  expect(getNavigation(root).map((i) => i.key)).toEqual([
    "/projects",
    "/sales-companies",
    "/orders",
    "/users",
    "/incomes",
    "settings",
  ]);
  for (const r of [
    "projects",
    "units",
    "orders",
    "users",
    "sales-companies",
    "settings",
    "fund-accounts",
  ])
    expect(root.canWrite(r)).toBe(true);
  expect(root.manageOrders).toBe(true);
  expect(root.finance).toBe(false);
});

it("deposit management is available only to finance roles", () => {
  for (const role of ["SUPER_ADMIN", "FINANCE"])
    expect(
      getNavigation(store(role))
        .find((i) => i.key === "finance")
        ?.children?.some((i) => i.key === "/deposits"),
    ).toBe(true);
  for (const role of ["OPERATIONS", "SALES", "SALES_COMPANY_ADMIN"])
    expect(
      getNavigation(store(role)).some((i) =>
        i.children?.some((child) => child.key === "/deposits"),
      ),
    ).toBe(false);
});

it("uses scoped sales labels and hides commission menus without read permission", () => {
  const admin = store("SALES_COMPANY_ADMIN");
  expect(getNavigation(admin).map((item) => item.label)).toEqual([
    "可租项目",
    "本公司资料",
    "本公司订单",
    "佣金统计",
    "佣金明细",
  ]);
  const sales = store("SALES");
  expect(getNavigation(sales).map((item) => item.label)).toEqual([
    "可租项目",
    "所属公司",
    "我的订单",
    "佣金统计",
    "佣金明细",
  ]);
  sales.user!.capabilities.read = ["projects", "orders", "sales-companies"];
  expect(getNavigation(sales).map((item) => item.key)).toEqual([
    "/projects",
    "/sales-companies",
    "/orders",
  ]);
});

it("adds invoices for financial readers and names read-only accounts as queries", () => {
  const root = store("FINANCE");
  root.user!.capabilities.write = [
    "incomes",
    "expenses",
    "commissions",
    "invoices",
    "fund-accounts",
    "materials",
  ];
  const nav = getNavigation(root);
  expect(nav.find((item) => item.key === "/users")?.label).toBe("账号查询");
  expect(nav.find((item) => item.key === "/sales-companies")?.label).toBe(
    "销售公司",
  );
  expect(
    nav
      .find((item) => item.key === "finance")
      ?.children?.map((item) => item.key),
  ).toEqual([
    "/incomes",
    "/deposits",
    "/commissions",
    "/expenses",
    "/invoices",
    "/fund-ledger",
    "/finance-statistics",
  ]);
  expect(nav.find((item) => item.key === "settings")?.children).toEqual([
    { key: "/fund-accounts", label: "银行账户" },
  ]);
});
