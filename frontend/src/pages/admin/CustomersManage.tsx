import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCustomer } from '@/api/customers';
import Spinner from '@/components/ui/Spinner';
import { extractErrorMessage } from '@/api/axios';

export default function CustomersManage() {
  const [username, setUsername] = useState('customer1');
  const [searched, setSearched] = useState('customer1');

  const customerQuery = useQuery({
    queryKey: ['customer', searched],
    queryFn: () => getCustomer(searched),
    enabled: !!searched,
    retry: 0,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý khách hàng</h1>

      <div className="card p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearched(username.trim());
              }}
              placeholder="customer1"
            />
          </div>
          <button onClick={() => setSearched(username.trim())} className="btn-primary">
            Tra cứu
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          API <code>/customers/&#123;username&#125;</code> chỉ hỗ trợ tra cứu theo username.
          Seed có sẵn: <code>customer1</code>, <code>customer2</code>.
        </p>
      </div>

      {customerQuery.isLoading ? (
        <div className="card p-8 flex justify-center">
          <Spinner />
        </div>
      ) : customerQuery.isError ? (
        <div className="card p-6 text-red-600 text-sm">
          Không tìm thấy khách hàng: {extractErrorMessage(customerQuery.error)}
        </div>
      ) : customerQuery.data ? (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-bold">
              {customerQuery.data.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-xl font-bold">
                {customerQuery.data.firstName} {customerQuery.data.lastName}
              </div>
              <div className="text-sm text-gray-500">@{customerQuery.data.userName}</div>
            </div>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{customerQuery.data.emailAddress}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Username</dt>
              <dd className="font-medium">{customerQuery.data.userName}</dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-2 flex-wrap">
            <a
              href={`mailto:${customerQuery.data.emailAddress}`}
              className="btn-outline text-sm"
            >
              Gửi email
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(customerQuery.data!.userName);
                toast.success('Đã sao chép username');
              }}
              className="btn-outline text-sm"
            >
              Sao chép username
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
