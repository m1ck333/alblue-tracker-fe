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
import { StanjePage } from './pages/magacin/StanjePage';
import { StockEntryPage } from './pages/magacin/StockEntryPage';
import { IstorijaPage } from './pages/magacin/IstorijaPage';
import { StockMovementType } from '@alblue/shared-types';
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
          path="/magacin/stanje"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.Coordinator, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <StanjePage />
            </RequireRole>
          }
        />
        <Route
          path="/magacin/ulaz"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <StockEntryPage type={StockMovementType.Ulaz} />
            </RequireRole>
          }
        />
        <Route
          path="/magacin/izlaz"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <StockEntryPage type={StockMovementType.Izlaz} />
            </RequireRole>
          }
        />
        <Route
          path="/magacin/istorija"
          element={
            <RequireRole roles={[UserRole.Admin, UserRole.Manager, UserRole.Coordinator, UserRole.SuperAdmin, UserRole.Magacioner]}>
              <IstorijaPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
