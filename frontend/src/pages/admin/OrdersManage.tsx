import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  deleteOrder,
  getOrderById,
  listOrdersByUser,
  updateOrder,
} from '@/api/orders';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/format';
import { extractErrorMessage } from '@/api/axios';
import { OrderStatusMap, type Order, type UpdateOrderInput } from '@/types';

export default function OrdersManage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('customer1');
  const [searchUsername, setSearchUsername] = useState('customer1');
  const [editing, setEditing] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['admin-orders', searchUsername],
    queryFn: () => listOrdersByUser(searchUsername),
    enabled: !!searchUsername,
  });

  const viewQuery = useQuery({
    queryKey: ['order', viewing],
    queryFn: () => getOrderById(viewing!),
    enabled: !!viewing,
  });

  const editForm = useForm<UpdateOrderInput>({
    defaultValues: {
      firstName: '',
      lastName: '',
      emailAddress: '',
      shippingAddress: '',
      invoiceAddress: '',
      totalPrice: 0,
      status: 1,
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateOrderInput }) => updateOrder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Đã cập nhật đơn hàng');
      setEditing(null);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Đã xóa đơn hàng');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  function startEdit(order: Order) {
    setEditing(order);
    editForm.reset({
      firstName: order.firstName,
      lastName: order.lastName,
      emailAddress: order.emailAddress,
      shippingAddress: order.shippingAddress,
      invoiceAddress: order.invoiceAddress,
      totalPrice: order.totalPrice,
      status: order.status,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      </div>

      <div className="card p-4 mb-4 flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Lọc theo username</label>
          <input
            className="input"
            value={username}
            placeholder="customer1, customer2..."
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearchUsername(username.trim());
            }}
          />
        </div>
        <button onClick={() => setSearchUsername(username.trim())} className="btn-primary">
          Tìm
        </button>
        <span className="text-xs text-gray-500 ml-2">
          API yêu cầu username (không hỗ trợ liệt kê toàn bộ).
        </span>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Document No</th>
              <th>Khách hàng</th>
              <th>Email</th>
              <th>Địa chỉ giao</th>
              <th className="text-right">Tổng tiền</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <Spinner />
                </td>
              </tr>
            ) : (ordersQuery.data || []).length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  Không có đơn hàng cho username này.
                </td>
              </tr>
            ) : (
              (ordersQuery.data || []).map((o) => {
                const status = OrderStatusMap[o.status] || {
                  label: '-',
                  color: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td className="font-mono text-xs">{o.documentNo}</td>
                    <td>{o.firstName} {o.lastName}</td>
                    <td>{o.emailAddress}</td>
                    <td className="max-w-xs truncate">{o.shippingAddress}</td>
                    <td className="text-right text-brand-600 font-semibold">
                      {formatCurrency(o.totalPrice)}
                    </td>
                    <td>
                      <span className={`badge ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewing(o.id)}
                        className="text-gray-600 hover:underline mr-3"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => startEdit(o)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => setConfirmDelete(o)}
                        className="text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewQuery.data ? `Đơn #${viewQuery.data.id}` : 'Chi tiết đơn'}
        size="lg"
        footer={
          <button type="button" className="btn-outline" onClick={() => setViewing(null)}>
            Đóng
          </button>
        }
      >
        {viewQuery.isLoading ? (
          <Spinner />
        ) : viewQuery.data ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Document No</dt><dd className="font-mono">{viewQuery.data.documentNo}</dd></div>
            <div><dt className="text-gray-500">Username</dt><dd>{viewQuery.data.userName}</dd></div>
            <div><dt className="text-gray-500">Khách hàng</dt><dd>{viewQuery.data.firstName} {viewQuery.data.lastName}</dd></div>
            <div><dt className="text-gray-500">Email</dt><dd>{viewQuery.data.emailAddress}</dd></div>
            <div className="col-span-2"><dt className="text-gray-500">Giao tới</dt><dd>{viewQuery.data.shippingAddress}</dd></div>
            <div className="col-span-2"><dt className="text-gray-500">Hóa đơn</dt><dd>{viewQuery.data.invoiceAddress}</dd></div>
            <div><dt className="text-gray-500">Tổng tiền</dt><dd className="text-brand-600 font-bold">{formatCurrency(viewQuery.data.totalPrice)}</dd></div>
            <div><dt className="text-gray-500">Trạng thái</dt><dd>{OrderStatusMap[viewQuery.data.status]?.label}</dd></div>
          </dl>
        ) : (
          <p className="text-red-600 text-sm">Không tải được dữ liệu.</p>
        )}
      </Modal>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`Sửa đơn #${editing?.id ?? ''}`}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Hủy
            </button>
            <button
              type="submit"
              form="edit-order-form"
              className="btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Spinner size="sm" className="text-white" /> : 'Lưu'}
            </button>
          </>
        }
      >
        <form
          id="edit-order-form"
          onSubmit={editForm.handleSubmit((v) =>
            editing ? updateMutation.mutate({ id: editing.id, input: v }) : undefined,
          )}
          className="grid grid-cols-2 gap-3"
        >
          <div>
            <label className="label">Họ</label>
            <input className="input" {...editForm.register('firstName')} />
          </div>
          <div>
            <label className="label">Tên</label>
            <input className="input" {...editForm.register('lastName')} />
          </div>
          <div className="col-span-2">
            <label className="label">Email</label>
            <input className="input" {...editForm.register('emailAddress')} />
          </div>
          <div className="col-span-2">
            <label className="label">Địa chỉ giao</label>
            <input className="input" {...editForm.register('shippingAddress')} />
          </div>
          <div className="col-span-2">
            <label className="label">Địa chỉ hóa đơn</label>
            <input className="input" {...editForm.register('invoiceAddress')} />
          </div>
          <div>
            <label className="label">Tổng tiền</label>
            <input
              type="number"
              step="0.01"
              className="input"
              {...editForm.register('totalPrice', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="label">Trạng thái</label>
            <select className="input" {...editForm.register('status', { valueAsNumber: true })}>
              {Object.entries(OrderStatusMap).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Xóa đơn hàng"
        message={`Bạn có chắc muốn xóa đơn ${confirmDelete?.documentNo}?`}
        danger
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
      />
    </div>
  );
}
