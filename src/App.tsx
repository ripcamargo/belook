import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MorePage } from './pages/MorePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductFormPage } from './pages/ProductFormPage'
import { ComponentsPage } from './pages/ComponentsPage'
import { ComponentFormPage } from './pages/ComponentFormPage'
import { InventoryPage } from './pages/InventoryPage'
import { InventoryHistoryPage } from './pages/InventoryHistoryPage'
import { MovementFormPage } from './pages/MovementFormPage'
import { MovementDetailPage } from './pages/MovementDetailPage'
import { SalesPage } from './pages/SalesPage'
import { SaleFormPage } from './pages/SaleFormPage'
import { SaleDetailPage } from './pages/SaleDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerFormPage } from './pages/CustomerFormPage'
import { CostSheetsPage } from './pages/CostSheetsPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { SupplierFormPage } from './pages/SupplierFormPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ExpenseFormPage } from './pages/ExpenseFormPage'
import { FinancePage } from './pages/FinancePage'
import { SettingsPage } from './pages/SettingsPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderFormPage } from './pages/OrderFormPage'
import { ProductionPage } from './pages/ProductionPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />

            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/movement" element={<MovementFormPage />} />
            <Route path="/inventory/history" element={<InventoryHistoryPage />} />
            <Route path="/inventory/movements/:id" element={<MovementDetailPage />} />

            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/new" element={<SaleFormPage />} />
            <Route path="/sales/:id" element={<SaleDetailPage />} />

            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderFormPage />} />

            <Route path="/production" element={<ProductionPage />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductFormPage />} />

            <Route path="/components" element={<ComponentsPage />} />
            <Route path="/components/:id" element={<ComponentFormPage />} />

            <Route path="/costs" element={<CostSheetsPage />} />

            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerFormPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/suppliers/:id" element={<SupplierFormPage />} />

            <Route path="/finance" element={<FinancePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/:id" element={<ExpenseFormPage />} />

            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/more" element={<MorePage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  )
}
