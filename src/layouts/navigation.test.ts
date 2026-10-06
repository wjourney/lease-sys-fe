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
  expect(nav[0].label).toBe("项目");
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
