import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listOrdersByUser } from '@/api/orders';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/lib/format';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { OrderStatusMap } from '@/types';

export default function Orders() {
  const profile = useAuthStore((s) => s.profile);
  const username = profile?.userName || '';

  const ordersQuery = useQuery({
    queryKey: ['orders', username],
    queryFn: () => listOrdersByUser(username),
    enabled: !!username,
  });

  if (!username) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Cần đăng nhập</h1>
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

      {ordersQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : ordersQuery.isError ? (
        <div className="text-red-600 py-12 text-center">Không tải được đơn hàng.</div>
      ) : (ordersQuery.data || []).length === 0 ? (
        <EmptyState
          title="Bạn chưa có đơn hàng nào"
          description="Khám phá sản phẩm và đặt hàng đầu tiên của bạn ngay!"
          action={<Link to="/products" className="btn-primary">Mua sắm ngay</Link>}
        />
      ) : (
        <div className="space-y-3">
          {(ordersQuery.data || []).map((order) => {
            const status = OrderStatusMap[order.status] || { label: 'Khác', color: 'bg-gray-100 text-gray-700' };
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="text-sm text-gray-500">Mã đơn: <span className="font-mono">{order.documentNo}</span></div>
                  <div className="font-semibold text-gray-900 mt-1">
                    {order.firstName} {order.lastName} — {order.emailAddress}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Giao tới: {order.shippingAddress}
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-1">
                  <span className={`badge ${status.color}`}>{status.label}</span>
                  <div className="text-lg font-bold text-brand-600">
                    {formatCurrency(order.totalPrice)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
