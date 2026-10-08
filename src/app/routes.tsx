import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useRoot } from "../stores/root";
const BatchCreateUnitsPage = lazy(
  () => import("../pages/units/BatchCreateUnitsPage"),
);
const CompanyFinancePage = lazy(() => import("../pages/company-finance"));

const LedgerPage = lazy(() => import("../pages/finance/LedgerPage"));
const StatisticsPage = lazy(() => import("../pages/finance/StatisticsPage"));
const SettingsPage = lazy(() => import("../pages/settings"));
const ResourceEditPage = lazy(
  () => import("../components/record-editor/ResourceEditPage"),
);
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
export const AppRoutes = observer(function AppRoutes() {
  const root = useRoot();
  const { pathname } = useLocation();
  if (root.salesRole) {
    if (
      /^\/(users|settings|fund-accounts|fund-ledger|finance-statistics|incomes|expenses|invoices)(\/|$)/.test(
        pathname,
      )
    )
      return <Navigate to="/projects" replace />;
    if (/^\/commissions(\/|$)/.test(pathname))
      return (
        <Navigate
          to={
            pathname.split("/")[2]
              ? `/company-commissions?commissionId=${encodeURIComponent(pathname.split("/")[2])}`
              : "/company-commissions"
          }
          replace
        />
      );
    if (pathname === "/sales-companies" && root.user?.salesCompanyId)
      return (
        <Navigate to={`/sales-companies/${root.user.salesCompanyId}`} replace />
      );
  }
  return (
    <Routes>
      <Route
        path="/company-finance"
        element={
          root.salesRole ? (
            <CompanyFinancePage />
          ) : (
            <Navigate to="/projects" replace />
          )
        }
      />
      <Route
        path="/company-commissions"
        element={
          root.salesRole ? (
            <CompanyFinancePage details />
          ) : (
            <Navigate to="/projects" replace />
          )
        }
      />
      <Route path="/fund-ledger" element={<LedgerPage />} />
      <Route path="/finance-statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route
        path="/projects/new"
        element={<ResourceEditPage resource="projects" />}
      />
      <Route
        path="/projects/:id/edit"
        element={<ResourceEditPage resource="projects" />}
      />
      <Route
        path="/projects/:projectId/units/new"
        element={<ResourceEditPage resource="units" />}
      />
      <Route
        path="/projects/:projectId/units/:id/edit"
        element={<ResourceEditPage resource="units" />}
      />
      <Route
        path="/projects/:projectId/units/batch"
        element={<BatchCreateUnitsPage />}
      />
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
});
