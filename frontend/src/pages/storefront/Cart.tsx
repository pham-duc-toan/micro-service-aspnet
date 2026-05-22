import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart';
import { formatCurrency } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';

function buildImage(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/100/100`;
}

export default function Cart() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Giỏ hàng trống"
          description="Hãy khám phá các sản phẩm tuyệt vời trên TeduShop"
          action={
            <Link to="/products" className="btn-primary">
              Khám phá sản phẩm
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn ({items.length} sản phẩm)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.itemNo} className="card p-4 flex gap-4">
              <img
                src={buildImage(item.itemNo)}
                alt={item.itemName}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">SKU: {item.itemNo}</div>
                <div className="font-semibold text-gray-900">{item.itemName}</div>
                <div className="text-brand-600 font-bold mt-1">
                  {formatCurrency(item.itemPrice)}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.itemNo)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Xóa
                </button>
                <div className="inline-flex items-center border border-gray-300 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.itemNo, item.quantity - 1)}
                    className="px-2 py-0.5"
                  >
                    −
                  </button>
                  <span className="w-10 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.itemNo, item.quantity + 1)}
                    className="px-2 py-0.5"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <button onClick={clear} className="text-sm text-red-600 hover:underline">
              Xóa toàn bộ giỏ hàng
            </button>
            <Link to="/products" className="text-sm text-brand-600 hover:underline">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-semibold text-lg mb-4">Tóm tắt đơn hàng</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Tạm tính</dt>
                <dd>{formatCurrency(totalPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Phí vận chuyển</dt>
                <dd className="text-green-600">Miễn phí</dd>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-base">
                <dt>Tổng cộng</dt>
                <dd className="text-brand-600">{formatCurrency(totalPrice)}</dd>
              </div>
            </dl>
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full mt-4"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
