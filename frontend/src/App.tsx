import { Navigate, Route, Routes } from 'react-router-dom';
import StorefrontLayout from '@/components/layout/StorefrontLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Home from '@/pages/storefront/Home';
import Products from '@/pages/storefront/Products';
import ProductDetail from '@/pages/storefront/ProductDetail';
import Cart from '@/pages/storefront/Cart';
import Checkout from '@/pages/storefront/Checkout';
import Orders from '@/pages/storefront/Orders';
import OrderDetail from '@/pages/storefront/OrderDetail';
import Dashboard from '@/pages/admin/Dashboard';
import ProductsManage from '@/pages/admin/ProductsManage';
import OrdersManage from '@/pages/admin/OrdersManage';
import InventoryManage from '@/pages/admin/InventoryManage';
import CustomersManage from '@/pages/admin/CustomersManage';
import JobsManage from '@/pages/admin/JobsManage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsManage />} />
        <Route path="orders" element={<OrdersManage />} />
        <Route path="inventory" element={<InventoryManage />} />
        <Route path="customers" element={<CustomersManage />} />
        <Route path="jobs" element={<JobsManage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
