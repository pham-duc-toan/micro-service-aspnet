import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

const navItems: Array<{ to: string; label: string; icon: string }> = [
  { to: '/admin', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/products', label: 'Sản phẩm', icon: '📦' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: '🧾' },
  { to: '/admin/inventory', label: 'Kho hàng', icon: '🏭' },
  { to: '/admin/customers', label: 'Khách hàng', icon: '👥' },
  { to: '/admin/jobs', label: 'Tác vụ nền', icon: '⏰' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const clearAuth = useAuthStore((s) => s.clear);

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-800">
          <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="inline-block bg-brand-600 rounded-lg w-8 h-8 flex items-center justify-center">
              T
            </span>
            TeduShop Admin
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <Link
            to="/"
            className="block px-3 py-2 text-sm text-gray-400 hover:text-white"
          >
            ← Về trang khách
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Khu vực quản trị</h1>
          <div className="text-sm text-gray-600">
            Xin chào, <span className="font-medium">{profile?.fullName || profile?.userName}</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
