import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '@/api/products';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/format';
import { extractErrorMessage } from '@/api/axios';
import type { CreateProductInput, Product } from '@/types';

interface ProductFormValues extends CreateProductInput {}

export default function ProductsManage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts });

  const createForm = useForm<ProductFormValues>({
    defaultValues: { no: '', name: '', summary: '', description: '', price: 0 },
  });
  const editForm = useForm<ProductFormValues>({
    defaultValues: { no: '', name: '', summary: '', description: '', price: 0 },
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Tạo sản phẩm thành công');
      setShowCreate(false);
      createForm.reset();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProductFormValues }) =>
      updateProduct(id, {
        name: input.name,
        summary: input.summary,
        description: input.description,
        price: input.price,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Cập nhật sản phẩm thành công');
      setEditing(null);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã xóa sản phẩm');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const filtered = (productsQuery.data || []).filter((p) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      p.no.toLowerCase().includes(term)
    );
  });

  function startEdit(product: Product) {
    setEditing(product);
    editForm.reset({
      no: product.no,
      name: product.name,
      summary: product.summary || '',
      description: product.description || '',
      price: product.price,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Thêm sản phẩm
        </button>
      </div>

      <div className="card p-4 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên, SKU..."
          className="input md:w-96"
        />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Tên sản phẩm</th>
              <th>Tóm tắt</th>
              <th className="text-right">Giá</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Spinner />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td className="font-mono">{p.no}</td>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-gray-500 max-w-xs truncate">{p.summary}</td>
                  <td className="text-right text-brand-600 font-semibold">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
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

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Thêm sản phẩm mới"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="create-product-form"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Spinner size="sm" className="text-white" /> : 'Tạo'}
            </button>
          </>
        }
      >
        <form
          id="create-product-form"
          onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-3"
        >
          <div>
            <label className="label">SKU (No) *</label>
            <input className="input" {...createForm.register('no', { required: true })} />
          </div>
          <div>
            <label className="label">Tên sản phẩm *</label>
            <input className="input" {...createForm.register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Giá (VND) *</label>
            <input
              type="number"
              step="0.01"
              className="input"
              {...createForm.register('price', { required: true, valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="label">Tóm tắt</label>
            <input className="input" {...createForm.register('summary')} />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea
              rows={4}
              className="input"
              {...createForm.register('description')}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`Sửa sản phẩm #${editing?.id ?? ''}`}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Hủy
            </button>
            <button
              type="submit"
              form="edit-product-form"
              className="btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Spinner size="sm" className="text-white" /> : 'Lưu'}
            </button>
          </>
        }
      >
        <form
          id="edit-product-form"
          onSubmit={editForm.handleSubmit((v) =>
            editing ? updateMutation.mutate({ id: editing.id, input: v }) : undefined,
          )}
          className="space-y-3"
        >
          <div>
            <label className="label">SKU (No)</label>
            <input className="input bg-gray-50" disabled {...editForm.register('no')} />
            <p className="text-xs text-gray-500 mt-1">SKU không thể thay đổi qua API update.</p>
          </div>
          <div>
            <label className="label">Tên sản phẩm *</label>
            <input className="input" {...editForm.register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Giá (VND) *</label>
            <input
              type="number"
              step="0.01"
              className="input"
              {...editForm.register('price', { required: true, valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="label">Tóm tắt</label>
            <input className="input" {...editForm.register('summary')} />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea rows={4} className="input" {...editForm.register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa "${confirmDelete?.name}"?`}
        danger
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
      />
    </div>
  );
}
