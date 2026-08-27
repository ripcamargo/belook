import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MorePage } from './pages/MorePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductFormPage } from './pages/ProductFormPage'
import { ComponentsPage } from './pages/ComponentsPage'
import { ComponentFormPage } from './pages/ComponentFormPage'
import { InventoryPage } from './pages/InventoryPage'
import { InventoryHistoryPage } from './pages/InventoryHistoryPage'
import { MovementFormPage } from './pages/MovementFormPage'

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

            <Route path="/sales" element={<ComingSoonPage title="Vendas" icon="bi-cart3" />} />
            <Route path="/sales/new" element={<ComingSoonPage title="Nova venda" icon="bi-cart-plus" />} />

            <Route path="/orders" element={<ComingSoonPage title="Pedidos" icon="bi-bag" />} />
            <Route path="/orders/new" element={<ComingSoonPage title="Novo pedido" icon="bi-clipboard-plus" />} />
            <Route path="/orders/:id" element={<ComingSoonPage title="Pedido" icon="bi-bag-check" />} />

            <Route path="/production" element={<ComingSoonPage title="Produção" icon="bi-gear-wide-connected" />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductFormPage />} />

            <Route path="/components" element={<ComponentsPage />} />
            <Route path="/components/:id" element={<ComponentFormPage />} />

            <Route path="/costs" element={<ComingSoonPage title="Fichas de custo" icon="bi-calculator" />} />

            <Route path="/customers" element={<ComingSoonPage title="Clientes" icon="bi-people" />} />
            <Route path="/suppliers" element={<ComingSoonPage title="Fornecedores" icon="bi-truck" />} />

            <Route path="/finance" element={<ComingSoonPage title="Financeiro" icon="bi-wallet2" />} />
            <Route path="/expenses" element={<ComingSoonPage title="Despesas" icon="bi-receipt" />} />

            <Route path="/settings" element={<ComingSoonPage title="Configurações" icon="bi-gear" />} />

            <Route path="/more" element={<MorePage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  )
}
