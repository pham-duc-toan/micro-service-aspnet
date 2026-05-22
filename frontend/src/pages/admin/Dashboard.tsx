import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listProducts } from '@/api/products';
import { listOrdersByUser } from '@/api/orders';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/lib/format';
import Spinner from '@/components/ui/Spinner';
import { OrderStatusMap } from '@/types';

export default function Dashboard() {
  const profile = useAuthStore((s) => s.profile);

  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts });
  const ordersQuery = useQuery({
    queryKey: ['orders', profile?.userName],
    queryFn: () => listOrdersByUser(profile!.userName),
    enabled: !!profile?.userName,
  });

  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgPrice =
    products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;

  const cards = [
    {
      label: 'Tổng sản phẩm',
      value: products.length,
      hint: `Giá trung bình: ${formatCurrency(avgPrice)}`,
      icon: '📦',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Đơn hàng của tôi',
      value: orders.length,
      hint: 'Theo username admin hiện tại',
      icon: '🧾',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Doanh thu (đơn của tôi)',
      value: formatCurrency(totalRevenue),
      hint: 'Cộng dồn TotalPrice',
      icon: '💰',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Vai trò hiện tại',
      value: profile?.roles?.[0] || '-',
      hint: profile?.isAdmin ? 'Quyền: tất cả modules' : 'Hạn chế',
      icon: '🔐',
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">{c.label}</div>
                <div className="text-2xl font-bold mt-1">
                  {productsQuery.isLoading || ordersQuery.isLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    c.value
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">{c.hint}</div>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${c.color}`}>
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Sản phẩm mới nhất</h2>
            <Link to="/admin/products" className="text-sm text-brand-600 hover:underline">
              Quản lý →
            </Link>
          </div>
          {productsQuery.isLoading ? (
            <Spinner />
          ) : (
            <ul className="divide-y divide-gray-100">
              {products.slice(-5).reverse().map((p) => (
                <li key={p.id} className="py-2 flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">SKU: {p.no}</div>
                  </div>
                  <div className="text-brand-600 font-semibold">{formatCurrency(p.price)}</div>
                </li>
              ))}
              {products.length === 0 && (
                <li className="text-sm text-gray-500 py-2">Chưa có sản phẩm.</li>
              )}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-sm text-brand-600 hover:underline">
              Quản lý →
            </Link>
          </div>
          {ordersQuery.isLoading ? (
            <Spinner />
          ) : (
            <ul className="divide-y divide-gray-100">
              {orders.slice(-5).reverse().map((o) => {
                const status = OrderStatusMap[o.status] || { label: '-', color: 'bg-gray-100 text-gray-700' };
                return (
                  <li key={o.id} className="py-2 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-mono text-xs text-gray-500">{o.documentNo}</div>
                      <div className="font-medium">{o.firstName} {o.lastName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${status.color}`}>{status.label}</span>
                      <div className="text-brand-600 font-semibold">
                        {formatCurrency(o.totalPrice)}
                      </div>
                    </div>
                  </li>
                );
              })}
              {orders.length === 0 && (
                <li className="text-sm text-gray-500 py-2">Chưa có đơn hàng.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
