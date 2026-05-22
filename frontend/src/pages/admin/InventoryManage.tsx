import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  deleteInventory,
  getInventoryPaged,
  purchaseItem,
  saleItem,
} from '@/api/inventory';
import { listProducts } from '@/api/products';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatNumber } from '@/lib/format';
import { extractErrorMessage } from '@/api/axios';
import { DocumentTypeMap, type InventoryEntry } from '@/types';

interface MovementForm {
  itemNo: string;
  quantity: number;
  externalDocNo?: string;
  type: 'purchase' | 'sale';
}

export default function InventoryManage() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<InventoryEntry | null>(null);

  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts });

  const pagedQuery = useQuery({
    queryKey: ['inventory-paged', selectedItem],
    queryFn: () => getInventoryPaged(selectedItem),
    enabled: !!selectedItem,
  });

  const form = useForm<MovementForm>({
    defaultValues: { itemNo: '', quantity: 1, externalDocNo: '', type: 'purchase' },
  });

  const purchaseMutation = useMutation({
    mutationFn: (v: MovementForm) => purchaseItem(v.itemNo, v.quantity, v.externalDocNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-paged'] });
      toast.success('Đã nhập kho');
      form.reset({ ...form.getValues(), quantity: 1, externalDocNo: '' });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const saleMutation = useMutation({
    mutationFn: (v: MovementForm) => saleItem(v.itemNo, v.quantity, v.externalDocNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-paged'] });
      toast.success('Đã xuất kho');
      form.reset({ ...form.getValues(), quantity: 1, externalDocNo: '' });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-paged'] });
      toast.success('Đã xóa entry');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  function onSubmit(v: MovementForm) {
    if (!v.itemNo) {
      toast.error('Vui lòng chọn sản phẩm.');
      return;
    }
    if (v.type === 'purchase') purchaseMutation.mutate(v);
    else saleMutation.mutate(v);
  }

  const items = pagedQuery.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý kho hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-5">
          <h2 className="font-semibold mb-4">Nhập / xuất kho</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="label">Sản phẩm (SKU)</label>
              <select className="input" {...form.register('itemNo', { required: true })}>
                <option value="">-- Chọn sản phẩm --</option>
                {(productsQuery.data || []).map((p) => (
                  <option key={p.id} value={p.no}>
                    {p.no} - {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Loại giao dịch</label>
              <select className="input" {...form.register('type')}>
                <option value="purchase">Nhập kho (Purchase)</option>
                <option value="sale">Xuất kho (Sale)</option>
              </select>
            </div>
            <div>
              <label className="label">Số lượng</label>
              <input
                type="number"
                min="1"
                className="input"
                {...form.register('quantity', { required: true, valueAsNumber: true, min: 1 })}
              />
            </div>
            <div>
              <label className="label">Số chứng từ ngoài (tùy chọn)</label>
              <input
                className="input"
                placeholder="EXT-001"
                {...form.register('externalDocNo')}
              />
            </div>
            <button
              type="submit"
              disabled={purchaseMutation.isPending || saleMutation.isPending}
              className="btn-primary w-full"
            >
              {purchaseMutation.isPending || saleMutation.isPending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                'Tạo giao dịch'
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-semibold">Sổ kho theo sản phẩm</h2>
            <select
              className="input md:w-72"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <option value="">-- Chọn sản phẩm để xem --</option>
              {(productsQuery.data || []).map((p) => (
                <option key={p.id} value={p.no}>
                  {p.no} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {!selectedItem ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Chọn một sản phẩm để xem lịch sử nhập/xuất kho.
            </p>
          ) : pagedQuery.isLoading ? (
            <Spinner />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Document No</th>
                      <th>External Doc</th>
                      <th className="text-right">SL</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-gray-500">
                          Chưa có giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      items.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <span className="badge bg-gray-100 text-gray-700">
                              {DocumentTypeMap[entry.documentType] || entry.documentType}
                            </span>
                          </td>
                          <td className="font-mono text-xs">{entry.documentNo}</td>
                          <td className="font-mono text-xs">{entry.externalDocumentNo}</td>
                          <td className="text-right font-semibold">{formatNumber(entry.quantity)}</td>
                          <td className="text-right">
                            <button
                              onClick={() => setConfirmDelete(entry)}
                              className="text-red-600 hover:underline"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {items.length > 0 && (
                <div className="mt-3 text-sm text-gray-500 text-right">
                  Hiển thị {items.length} giao dịch
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Xóa entry kho"
        message={`Bạn có chắc muốn xóa entry ${confirmDelete?.documentNo}?`}
        danger
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
      />
    </div>
  );
}
