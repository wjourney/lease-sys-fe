import { expect, it } from "vitest";
import { RootStore } from "../stores/root";
import { canAccessRoute } from "./page-access";

function store(
  role: string,
  read: string[],
  write: string[],
  finance = false,
  manageOrders = false,
) {
  const root = new RootStore();
  root.user = { role, capabilities: { read, write, finance, manageOrders } };
  return root;
}

it("operations can read bills and order commissions without standalone financial access", () => {
  const root = store(
    "OPERATIONS",
    ["projects", "units", "orders", "incomes", "users", "settings"],
    ["projects", "units", "orders", "users", "settings"],
    false,
    true,
  );
  expect(canAccessRoute(root, "/incomes/bill")).toBe(true);
  expect(root.viewOrderCommissions).toBe(true);
  for (const path of [
    "/commissions/commission",
    "/expenses/expense",
    "/invoices/invoice",
    "/deposits",
    "/finance-statistics",
    "/fund-ledger",
  ])
    expect(canAccessRoute(root, path)).toBe(false);
  expect(canAccessRoute(root, "/projects/project/units/unit/edit/")).toBe(true);
});

it("finance can view records but cannot mount project editors or website settings", () => {
  const root = store(
    "FINANCE",
    ["projects", "units", "orders", "settings", "invoices"],
    ["invoices"],
    true,
  );
  for (const path of [
    "/projects/project",
    "/projects/project/units/unit",
    "/invoices/invoice",
    "/deposits",
  ])
    expect(canAccessRoute(root, path)).toBe(true);
  for (const path of [
    "/projects/new",
    "/projects/project/edit",
    "/projects/project/units/new",
    "/projects/project/units/batch",
    "/settings",
  ])
    expect(canAccessRoute(root, path)).toBe(false);
});

it.each(["SALES", "SALES_COMPANY_ADMIN"])(
  "%s keeps embedded data rights while blocking standalone pages and stale editing capabilities",
  (role) => {
    const resources = [
      "projects",
      "units",
      "orders",
      "incomes",
      "invoices",
      "commissions",
      "users",
      "sales-companies",
      "materials",
      "settings",
      "fund-accounts",
    ];
    const root = store(role, resources, resources, true, true);
    expect(root.canRead("incomes")).toBe(true);
    expect(root.canRead("users")).toBe(true);
    expect(canAccessRoute(root, "/company-finance")).toBe(true);
    expect(canAccessRoute(root, "/materials/material")).toBe(true);
    for (const path of [
      "/incomes/bill",
      "/users/user",
      "/invoices",
      "/fund-accounts",
      "/settings",
      "/projects/new",
      "/projects/project/units/batch",
      "/deposits",
    ])
      expect(canAccessRoute(root, path)).toBe(false);
    root.user!.capabilities.read = ["projects"];
    expect(canAccessRoute(root, "/company-commissions")).toBe(false);
  },
);

it("denies unreadable detail pages before they mount, including for an administrator", () => {
  const root = store("SUPER_ADMIN", ["projects"], ["projects"]);
  expect(canAccessRoute(root, "/orders/order")).toBe(false);
  expect(canAccessRoute(root, "/projects/project/units/unit")).toBe(false);
  expect(canAccessRoute(root, "/projects/new")).toBe(true);
});
