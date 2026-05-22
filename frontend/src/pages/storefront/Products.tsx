import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/api/products';
import ProductGrid from '@/components/product/ProductGrid';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/auth';
import { Link } from 'react-router-dom';
import EmptyState from '@/components/ui/EmptyState';

type SortKey = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export default function Products() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('name-asc');

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
    enabled: isAuthenticated,
  });

  const filtered = useMemo(() => {
    const data = productsQuery.data || [];
    const term = search.trim().toLowerCase();
    const result = term
      ? data.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.no.toLowerCase().includes(term) ||
            (p.summary || '').toLowerCase().includes(term),
        )
      : [...data];
    switch (sort) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }
    return result;
  }, [productsQuery.data, search, sort]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tất cả sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            {productsQuery.data
              ? `${filtered.length} / ${productsQuery.data.length} sản phẩm`
              : 'Đang tải...'}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, SKU..."
            className="input md:w-72"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input md:w-48">
            <option value="name-asc">Tên A-Z</option>
            <option value="name-desc">Tên Z-A</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
          </select>
        </div>
      </div>

      {!isAuthenticated ? (
        <EmptyState
          title="Cần đăng nhập"
          description="Backend yêu cầu quyền Administrator + PRODUCT.VIEW để xem danh sách sản phẩm."
          action={
            <Link to="/login" className="btn-primary">
              Đăng nhập
            </Link>
          }
        />
      ) : productsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : productsQuery.isError ? (
        <div className="text-center text-red-600 py-12">Không tải được sản phẩm.</div>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </div>
  );
}
