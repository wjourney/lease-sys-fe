import type { RootStore } from "../stores/root";

/** Shared by navigation and page breadcrumbs so each role sees the same names. */
export function pageLabel(root: RootStore, resource: string): string {
  switch (resource) {
    case "projects":
      return root.salesRole ? "可租项目" : "项目管理";
    case "sales-companies":
      return root.companyAdmin
        ? "本公司资料"
        : root.salesRole
          ? "所属公司"
          : "销售公司";
    case "orders":
      return root.companyAdmin
        ? "本公司订单"
        : root.salesRole
          ? "我的订单"
          : "订单管理";
    case "users":
      return root.canWrite("users") ? "账号管理" : "账号查询";
    case "incomes":
      return root.user?.role === "OPERATIONS" ? "账单查询" : "账单管理";
    case "deposits":
      return "押金管理";
    case "commissions":
      return "佣金管理";
    case "expenses":
      return "支出管理";
    case "invoices":
      return "发票管理";
    case "materials":
      return "文件与资料";
    case "fund-ledger":
      return "资金流水";
    case "finance-statistics":
      return "财务统计";
    case "company-finance":
      return "佣金统计";
    case "company-commissions":
      return "佣金明细";
    case "fund-accounts":
      return "银行账户";
    case "settings":
      return "网站设置";
    default:
      return resource;
  }
}

export function orderDepositLabel(root: RootStore) {
  return root.finance ? "押金结算" : "押金情况";
}
