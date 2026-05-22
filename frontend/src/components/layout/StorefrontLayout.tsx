import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

export default function StorefrontLayout() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const clearAuth = useAuthStore((s) => s.clear);
  const totalItems = useCartStore((s) => s.totalItems());

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-600">
              <span className="inline-block bg-brand-600 text-white rounded-lg w-9 h-9 flex items-center justify-center">
                T
              </span>
              TeduShop
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'text-brand-600' : 'text-gray-700 hover:text-brand-600'
                }
              >
                Trang chủ
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive ? 'text-brand-600' : 'text-gray-700 hover:text-brand-600'
                }
              >
                Sản phẩm
              </NavLink>
              {isAuthenticated && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    isActive ? 'text-brand-600' : 'text-gray-700 hover:text-brand-600'
                  }
                >
                  Đơn hàng
                </NavLink>
              )}
              {profile?.isAdmin && (
                <NavLink
                  to="/admin"
                  className="text-gray-700 hover:text-brand-600"
                >
                  Quản trị
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/cart"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
                aria-label="Giỏ hàng"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
                  />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm text-gray-700">
                    {profile?.fullName || profile?.userName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-red-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-sm">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300 mt-12">
        <div className="container mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-white font-bold text-lg mb-2">TeduShop</div>
              <p className="text-sm">
                Hệ thống thương mại điện tử dựa trên kiến trúc microservices, tích hợp Identity
                Server và Ocelot API Gateway.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white mb-2">Liên kết</div>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/products" className="hover:text-white">
                    Tất cả sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-white">
                    Đơn hàng của tôi
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-white">
                    Giỏ hàng
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-2">Hỗ trợ</div>
              <ul className="space-y-1 text-sm">
                <li>Email: support@tedushop.local</li>
                <li>Hotline: 1900 1234</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-sm text-gray-400">
            © {new Date().getFullYear()} TeduShop. Demo bài tập lớn môn HTPT.
          </div>
        </div>
      </footer>
    </div>
  );
}
