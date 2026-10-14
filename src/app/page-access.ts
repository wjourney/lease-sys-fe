import type { RootStore } from "../stores/root";

const resources = new Set([
  "projects",
  "orders",
  "users",
  "sales-companies",
  "incomes",
  "expenses",
  "commissions",
  "invoices",
  "materials",
  "fund-accounts",
  "settings",
  "deposits",
  "fund-ledger",
  "finance-statistics",
  "company-finance",
  "company-commissions",
]);

/** Check before mounting pages so denied deep links never start data requests. */
export function canAccessRoute(root: RootStore, pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const resource = segments[0];
  if (!resources.has(resource)) return true;
  if (resource === "projects") {
    if (segments[2] === "units") {
      const action = segments.at(-1);
      return ["new", "edit", "batch"].includes(action ?? "")
        ? root.canWrite("units")
        : root.canRead("units");
    }
    if (segments[1] === "new" || segments.at(-1) === "edit")
      return root.canWrite("projects");
  }
  return root.canAccessPage(resource);
}
