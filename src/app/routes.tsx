import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const LedgerPage = lazy(() => import("../pages/finance/LedgerPage"));
const StatisticsPage = lazy(() => import("../pages/finance/StatisticsPage"));
const SettingsPage = lazy(() => import("../pages/settings"));
const ProjectListPage = lazy(() => import("../pages/projects/list"));
const ProjectDetailPage = lazy(() => import("../pages/projects/detail"));
const OrderListPage = lazy(() => import("../pages/orders/list"));
const OrderDetailPage = lazy(() => import("../pages/orders/detail"));
const IncomeListPage = lazy(() => import("../pages/incomes/list"));
const IncomeDetailPage = lazy(() => import("../pages/incomes/detail"));
const ExpenseListPage = lazy(() => import("../pages/expenses/list"));
const ExpenseDetailPage = lazy(() => import("../pages/expenses/detail"));
const CommissionListPage = lazy(() => import("../pages/commissions/list"));
const CommissionDetailPage = lazy(() => import("../pages/commissions/detail"));
const InvoiceListPage = lazy(() => import("../pages/invoices/list"));
const InvoiceDetailPage = lazy(() => import("../pages/invoices/detail"));
const SalesCompanyListPage = lazy(
  () => import("../pages/sales-companies/list"),
);
const SalesCompanyDetailPage = lazy(
  () => import("../pages/sales-companies/detail"),
);
const UserListPage = lazy(() => import("../pages/users/list"));
const UserDetailPage = lazy(() => import("../pages/users/detail"));
const MaterialListPage = lazy(() => import("../pages/materials/list"));
const MaterialDetailPage = lazy(() => import("../pages/materials/detail"));
const FundAccountListPage = lazy(() => import("../pages/fund-accounts/list"));
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/fund-ledger" element={<LedgerPage />} />
      <Route path="/finance-statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/orders" element={<OrderListPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/incomes" element={<IncomeListPage />} />
      <Route path="/incomes/:id" element={<IncomeDetailPage />} />
      <Route path="/expenses" element={<ExpenseListPage />} />
      <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
      <Route path="/commissions" element={<CommissionListPage />} />
      <Route path="/commissions/:id" element={<CommissionDetailPage />} />
      <Route path="/invoices" element={<InvoiceListPage />} />
      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
      <Route path="/sales-companies" element={<SalesCompanyListPage />} />
      <Route path="/sales-companies/:id" element={<SalesCompanyDetailPage />} />
      <Route path="/users" element={<UserListPage />} />
      <Route path="/users/:id" element={<UserDetailPage />} />
      <Route path="/materials" element={<MaterialListPage />} />
      <Route path="/materials/:id" element={<MaterialDetailPage />} />
      <Route path="/fund-accounts" element={<FundAccountListPage />} />
      <Route
        path="/fund-accounts/:id"
        element={<Navigate to="/fund-accounts" replace />}
      />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}
