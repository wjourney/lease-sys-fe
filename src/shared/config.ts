import { CommissionConfig } from "../pages/commissions/commissions.config";
import { ExpenseConfig } from "../pages/expenses/expenses.config";
import { FundAccountConfig } from "../pages/fund-accounts/fund-accounts.config";
import { IncomeConfig } from "../pages/incomes/incomes.config";
import { InvoiceConfig } from "../pages/invoices/invoices.config";
import { MaterialConfig } from "../pages/materials/materials.config";
import { OrderConfig } from "../pages/orders/orders.config";
import { ProjectConfig } from "../pages/projects/projects.config";
import { SalesCompanyConfig } from "../pages/sales-companies/sales-companies.config";
import { SettingConfig } from "../pages/settings/settings.config";
import { UserConfig } from "../pages/users/users.config";
import { Config } from "./resource-config";
export { feeLabels, roleLabels, statusLabels } from "./resource-config";
export type { Config, Field } from "./resource-config";
export const configs: Record<string, Config> = {
  "sales-companies": SalesCompanyConfig,
  users: UserConfig,
  projects: ProjectConfig,
  orders: OrderConfig,
  incomes: IncomeConfig,
  expenses: ExpenseConfig,
  commissions: CommissionConfig,
  invoices: InvoiceConfig,
  materials: MaterialConfig,
  "fund-accounts": FundAccountConfig,
  settings: SettingConfig,
};
