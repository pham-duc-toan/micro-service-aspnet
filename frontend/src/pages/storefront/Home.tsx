import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/api/products';
import ProductGrid from '@/components/product/ProductGrid';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
    enabled: isAuthenticated,
  });

  const featured = (productsQuery.data || []).slice(0, 8);

  return (
    <div>
      <section className="bg-gradient-to-r from-brand-500 to-orange-400 text-white">
        <div className="container mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Mua sắm thông minh với <span className="block">TeduShop</span>
            </h1>
            <p className="mt-4 text-white/90 text-lg max-w-md">
              Hệ sinh thái thương mại điện tử microservices: sản phẩm, kho hàng, giỏ hàng, đơn
              hàng — tất cả trên một nền tảng.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="btn bg-white text-brand-600 hover:bg-gray-100">
                Khám phá sản phẩm
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="btn border border-white text-white hover:bg-white/10">
                  Đăng nhập ngay
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-72 h-72 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-56 h-56 rounded-full bg-white/30 flex items-center justify-center text-7xl">
                🛍️
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🚚', title: 'Giao hàng nhanh', desc: 'Giao tới tận nhà 1-3 ngày' },
            { icon: '🔒', title: 'Thanh toán bảo mật', desc: 'OAuth2 + JWT' },
            { icon: '💎', title: 'Sản phẩm chất lượng', desc: 'Kiểm định kho hàng' },
            { icon: '↩️', title: 'Đổi trả 7 ngày', desc: 'Miễn phí đổi trả' },
          ].map((f) => (
            <div key={f.title} className="card p-4 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-gray-900 text-sm">{f.title}</div>
              <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
            <p className="text-sm text-gray-500 mt-1">Khám phá những món hàng hot nhất hiện nay</p>
          </div>
          <Link to="/products" className="text-sm text-brand-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {!isAuthenticated ? (
          <EmptyState
            title="Vui lòng đăng nhập để xem sản phẩm"
            description="Hệ thống yêu cầu xác thực qua Identity Server để truy cập danh mục sản phẩm."
            action={
              <Link to="/login" className="btn-primary">
                Đăng nhập
              </Link>
            }
          />
        ) : productsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : productsQuery.isError ? (
          <div className="text-center text-red-600 py-12">
            Không tải được sản phẩm. Vui lòng kiểm tra API Gateway.
          </div>
        ) : (
          <ProductGrid products={featured} />
        )}
      </section>
    </div>
  );
}
