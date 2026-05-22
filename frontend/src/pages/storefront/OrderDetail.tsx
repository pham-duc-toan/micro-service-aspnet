import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '@/api/orders';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';
import { OrderStatusMap } from '@/types';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  if (orderQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
        <p className="text-gray-600 mb-4">
          Lưu ý: API <code>/v1/orders/by-id/&#123;id&#125;</code> yêu cầu quyền Administrator.
        </p>
        <Link to="/orders" className="btn-primary">Về danh sách đơn</Link>
      </div>
    );
  }

  const order = orderQuery.data;
  const status = OrderStatusMap[order.status] || { label: 'Khác', color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link to="/orders" className="text-sm text-brand-600 hover:underline">← Quay lại danh sách</Link>
      <div className="card p-6 mt-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Đơn hàng #{order.id}</h1>
            <div className="text-sm text-gray-500 mt-1 font-mono">{order.documentNo}</div>
          </div>
          <span className={`badge ${status.color} text-sm px-3 py-1`}>{status.label}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Khách hàng</div>
            <div className="font-medium">{order.firstName} {order.lastName}</div>
            <div className="text-gray-600">{order.emailAddress}</div>
            <div className="text-gray-600">Username: {order.userName}</div>
          </div>
          <div>
            <div className="text-gray-500">Địa chỉ giao hàng</div>
            <div className="font-medium">{order.shippingAddress}</div>
            <div className="text-gray-500 mt-2">Địa chỉ xuất hóa đơn</div>
            <div className="font-medium">{order.invoiceAddress}</div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-between items-center">
          <div className="text-gray-700">Tổng giá trị đơn hàng</div>
          <div className="text-2xl font-bold text-brand-600">
            {formatCurrency(order.totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}
