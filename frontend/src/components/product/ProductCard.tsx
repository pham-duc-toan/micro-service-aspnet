import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/format';
import { useCartStore } from '@/stores/cart';

interface ProductCardProps {
  product: Product;
}

function buildImage(product: Product): string {
  const seed = encodeURIComponent(product.no || product.id);
  return `https://picsum.photos/seed/${seed}/600/400`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem(product, 1);
    toast.success(`Đã thêm "${product.name}" vào giỏ`);
  }

  return (
    <div className="card overflow-hidden group flex flex-col">
      <Link to={`/products/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={buildImage(product)}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-gray-500 mb-1">SKU: {product.no}</div>
        <Link to={`/products/${product.id}`} className="font-semibold text-gray-900 hover:text-brand-600 line-clamp-2">
          {product.name}
        </Link>
        {product.summary && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{product.summary}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-bold text-brand-600">{formatCurrency(product.price)}</div>
          <button onClick={handleAdd} className="btn-primary text-sm py-1.5 px-3">
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}
