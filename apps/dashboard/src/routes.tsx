import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RequireRole } from '@alblue/auth';
import { UserRole } from '@alblue/shared-types';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/login/LoginPage';
import { AboutPage } from './pages/about/AboutPage';
import { TutorialPage } from './pages/tutorial/TutorialPage';
import { WhatsNewPage } from './pages/whats-new/WhatsNewPage';
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { OrderListPage } from './pages/orders/OrderListPage';
import { SalesDashboard } from './pages/sales/SalesDashboard';
import { BlockRequestsPage } from './pages/block-requests/BlockRequestsPage';
import { ChangeRequestsPage } from './pages/change-requests/ChangeRequestsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ProcessesPage } from './pages/admin/ProcessesPage';
import { ProductCategoriesPage } from './pages/admin/ProductCategoriesPage';
import { SpecialRequestTypesPage } from './pages/admin/SpecialRequestTypesPage';
import { OrderTypesPage } from './pages/admin/OrderTypesPage';
import { TenantsPage } from './pages/admin/TenantsPage';
import { ShiftsPage } from './pages/admin/ShiftsPage';
import { MaterialsPage } from './pages/admin/MaterialsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { StockPage } from './pages/warehouse/StockPage';
import { StockEntryPage } from './pages/warehouse/StockEntryPage';
import { HistoryPage } from './pages/warehouse/HistoryPage';
import { StockMovementType } from '@alblue/shared-types';
import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { RoleRedirect } from './components/RoleRedirect';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* Authenticated */}
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<RoleRedirect />} />

        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/whats-new" element={<WhatsNewPage />} />

        <Route
          path="/dashboard"
          element={
            <RequireRole
              roles={[UserRole.Coordinator, UserRole.Manager, UserRole.Admin, UserRole.SuperAdmin]}
            >
              <CoordinatorDashboard />
            </RequireRole>
          }
        />

        <Route path="/orders" element={<OrderListPage />} />

        <Route
          path="/sales"
          element={
            <RequireRole roles={[UserRole.SalesManager]}>
              <SalesDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/block-requests"
          element={
            <RequireRole
              roles={[UserRole.Coordinator, UserRole.Manager, UserRole.Admin, UserRole.SuperAdmin]}
            >
              <BlockRequestsPage />
            </RequireRole>
          }
        />
        <Route
          path="/change-requests"
          element={
            <RequireRole
              roles={[UserRole.Coordinator, UserRole.Manager, UserRole.Admin, UserRole.SuperAdmin]}
            >
              <ChangeRequestsPage />
            </RequireRole>
          }
        />

        <Route
          path="/reports"
          element={
            <RequireRole
              roles={[UserRole.Coordinator, UserRole.Manager, UserRole.Admin, UserRole.SuperAdmin]}
            >
              <ReportsPage />
            </RequireRole>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin]}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/processes"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin]}>
              <ProcessesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/product-categories"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin]}>
              <ProductCategoriesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/special-request-types"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin]}>
              <SpecialRequestTypesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/order-types"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin]}>
              <OrderTypesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/tenants"
          element={
            <RequireRole roles={[UserRole.SuperAdmin]}>
              <TenantsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/shifts"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin]}>
              <ShiftsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/materials"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <MaterialsPage />
            </RequireRole>
          }
        />

        {/* Magacin (warehouse) — Saša 08.06.2026 */}
        <Route
          path="/warehouse/stock"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.Coordinator, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <StockPage />
            </RequireRole>
          }
        />
        <Route
          path="/warehouse/inflow"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <StockEntryPage type={StockMovementType.Inflow} />
            </RequireRole>
          }
        />
        <Route
          path="/warehouse/outflow"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <StockEntryPage type={StockMovementType.Outflow} />
            </RequireRole>
          }
        />
        <Route
          path="/warehouse/history"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.Coordinator, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <HistoryPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
