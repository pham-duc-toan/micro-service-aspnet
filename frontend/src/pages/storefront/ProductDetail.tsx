import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getProduct } from '@/api/products';
import { getInventoryByItem } from '@/api/inventory';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

function buildImage(seed: string, size = '800/600'): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size}`;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
    enabled: isAuthenticated && !!productId,
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventory-by-item', productQuery.data?.no],
    queryFn: () => getInventoryByItem(productQuery.data!.no),
    enabled: !!productQuery.data?.no,
  });

  const stock = (inventoryQuery.data || []).reduce((sum, entry) => sum + entry.quantity, 0);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Cần đăng nhập</h1>
        <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem chi tiết sản phẩm.</p>
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  if (productQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h1>
        <Link to="/products" className="btn-primary">Quay lại danh sách</Link>
      </div>
    );
  }

  const product = productQuery.data;

  function handleAdd() {
    addItem(product, quantity);
    toast.success(`Đã thêm ${quantity} × "${product.name}" vào giỏ`);
  }

  function handleBuyNow() {
    addItem(product, quantity);
    navigate('/cart');
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-brand-600">Sản phẩm</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="card overflow-hidden aspect-square">
            <img
              src={buildImage(product.no || String(product.id))}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card overflow-hidden aspect-square">
                <img
                  src={buildImage(`${product.no}-${i}`, '200/200')}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">SKU: {product.no}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-3 text-3xl font-bold text-brand-600">
            {formatCurrency(product.price)}
          </div>

          {product.summary && (
            <p className="mt-4 text-gray-700">{product.summary}</p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
            <div className="card p-3">
              <div className="text-gray-500">Tồn kho ước tính</div>
              <div className="font-semibold mt-0.5">
                {inventoryQuery.isLoading ? '...' : `${stock} đơn vị`}
              </div>
            </div>
            <div className="card p-3">
              <div className="text-gray-500">Mã sản phẩm</div>
              <div className="font-semibold mt-0.5">#{product.id}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Số lượng:</span>
            <div className="inline-flex items-center border border-gray-300 rounded-lg">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1 text-lg"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 text-center border-x border-gray-300 py-1 outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-1 text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={handleAdd} className="btn-outline flex-1">
              Thêm vào giỏ
            </button>
            <button onClick={handleBuyNow} className="btn-primary flex-1">
              Mua ngay
            </button>
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
