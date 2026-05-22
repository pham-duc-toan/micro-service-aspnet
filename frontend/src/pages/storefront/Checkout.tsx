import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { upsertBasket, checkoutBasket } from '@/api/basket';
import { createOrder } from '@/api/orders';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/lib/format';
import { extractErrorMessage } from '@/api/axios';
import Spinner from '@/components/ui/Spinner';
import type { BasketCheckoutInput } from '@/types';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  emailAddress: string;
  shippingAddress: string;
  invoiceAddress: string;
  paymentMethod: 'cod' | 'bank';
  useBasketCheckout: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clear);
  const [submitting, setSubmitting] = useState(false);

  const username = profile?.userName || 'customer1';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      emailAddress: profile?.email || '',
      shippingAddress: '',
      invoiceAddress: '',
      paymentMethod: 'cod',
      useBasketCheckout: true,
    },
  });

  const useBasket = watch('useBasketCheckout');

  const basketMutation = useMutation({
    mutationFn: upsertBasket,
  });
  const checkoutMutation = useMutation({
    mutationFn: (payload: BasketCheckoutInput) => checkoutBasket(payload),
  });
  const orderMutation = useMutation({
    mutationFn: createOrder,
  });

  async function onSubmit(values: CheckoutForm) {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống.');
      return;
    }
    setSubmitting(true);
    try {
      if (values.useBasketCheckout) {
        await basketMutation.mutateAsync({
          username,
          emailAddress: values.emailAddress,
          items: items.map((i) => ({
            itemNo: i.itemNo,
            itemName: i.itemName,
            itemPrice: i.itemPrice,
            quantity: i.quantity,
          })),
        });
        await checkoutMutation.mutateAsync({
          userName: username,
          firstName: values.firstName,
          lastName: values.lastName,
          emailAddress: values.emailAddress,
          shippingAddress: values.shippingAddress,
          invoiceAddress: values.invoiceAddress || values.shippingAddress,
        });
        toast.success('Đặt hàng thành công qua Basket Checkout!');
      } else {
        await orderMutation.mutateAsync({
          userName: username,
          totalPrice,
          firstName: values.firstName,
          lastName: values.lastName,
          emailAddress: values.emailAddress,
          shippingAddress: values.shippingAddress,
          invoiceAddress: values.invoiceAddress || values.shippingAddress,
        });
        toast.success('Tạo đơn hàng trực tiếp thành công!');
      }
      clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Đặt hàng thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Giỏ hàng trống</h1>
        <p className="text-gray-600 mb-4">Bạn cần có sản phẩm trong giỏ trước khi thanh toán.</p>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Quay lại mua sắm
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-lg mb-4">Thông tin khách hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Họ</label>
                <input
                  className="input"
                  {...register('firstName', { required: 'Bắt buộc' })}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="label">Tên</label>
                <input
                  className="input"
                  {...register('lastName', { required: 'Bắt buộc' })}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  {...register('emailAddress', {
                    required: 'Bắt buộc',
                    pattern: { value: /^[^@\s]+@[^@\s]+$/, message: 'Email không hợp lệ' },
                  })}
                />
                {errors.emailAddress && (
                  <p className="text-xs text-red-600 mt-1">{errors.emailAddress.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="label">Địa chỉ giao hàng</label>
                <input
                  className="input"
                  placeholder="Số nhà, tên đường, phường, quận, tỉnh/thành"
                  {...register('shippingAddress', { required: 'Bắt buộc' })}
                />
                {errors.shippingAddress && (
                  <p className="text-xs text-red-600 mt-1">{errors.shippingAddress.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="label">Địa chỉ xuất hóa đơn (tùy chọn)</label>
                <input className="input" {...register('invoiceAddress')} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-lg mb-4">Phương thức thanh toán</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand-400">
                <input type="radio" value="cod" {...register('paymentMethod')} />
                <div>
                  <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                  <div className="text-xs text-gray-500">Thanh toán bằng tiền mặt khi giao hàng</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand-400">
                <input type="radio" value="bank" {...register('paymentMethod')} />
                <div>
                  <div className="font-medium">Chuyển khoản ngân hàng</div>
                  <div className="text-xs text-gray-500">Thanh toán qua tài khoản ngân hàng</div>
                </div>
              </label>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-lg mb-3">Phương thức đặt hàng</h2>
            <label className="flex items-start gap-3">
              <input type="checkbox" {...register('useBasketCheckout')} className="mt-1" />
              <div className="text-sm">
                <div className="font-medium">Sử dụng quy trình Basket Checkout</div>
                <div className="text-gray-500">
                  Đẩy giỏ hàng lên Basket Service rồi gọi <code>/baskets/checkout</code> (đi qua
                  Inventory gRPC để kiểm tra tồn kho và publish event). Bỏ chọn để gọi thẳng
                  Order API tạo đơn cứng.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-semibold text-lg mb-4">Đơn hàng của bạn</h2>
            <ul className="divide-y divide-gray-100 mb-4 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.itemNo} className="py-2 flex justify-between text-sm">
                  <span className="truncate pr-2">
                    {item.itemName} <span className="text-gray-400">×{item.quantity}</span>
                  </span>
                  <span className="whitespace-nowrap">
                    {formatCurrency(item.itemPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <dt>Tạm tính</dt>
                <dd>{formatCurrency(totalPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Vận chuyển</dt>
                <dd className="text-green-600">Miễn phí</dd>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <dt>Tổng</dt>
                <dd className="text-brand-600">{formatCurrency(totalPrice)}</dd>
              </div>
            </dl>
            <div className="text-xs text-gray-500 mt-2">
              Người mua: <span className="font-medium">{username}</span>{' '}
              {useBasket ? '(qua Basket)' : '(trực tiếp)'}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-4"
            >
              {submitting ? <Spinner size="sm" className="text-white" /> : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
