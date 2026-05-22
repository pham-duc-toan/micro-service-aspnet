import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { extractErrorMessage } from '@/api/axios';
import Spinner from '@/components/ui/Spinner';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      username: 'alicesmith@example.com',
      password: 'alice123',
    },
  });

  async function onSubmit(values: LoginForm) {
    setLoading(true);
    try {
      const token = await login(values.username, values.password);
      setSession({
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresIn: token.expires_in,
      });
      toast.success('Đăng nhập thành công!');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || '/', { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center gap-2 text-2xl font-bold text-brand-600">
              <span className="inline-block bg-brand-600 text-white rounded-lg w-10 h-10 flex items-center justify-center">
                T
              </span>
              TeduShop
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sử dụng tài khoản Identity Server để tiếp tục
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Tên đăng nhập / Email</label>
            <input
              type="text"
              className="input"
              autoComplete="username"
              {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="label">Mật khẩu</label>
            <input
              type="password"
              className="input"
              autoComplete="current-password"
              {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner size="sm" className="text-white" /> : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <div className="font-semibold mb-1">Tài khoản demo (Administrator):</div>
          <div>Username: <code className="bg-white px-1 rounded">alicesmith@example.com</code></div>
          <div>Mật khẩu: <code className="bg-white px-1 rounded">alice123</code></div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/" className="hover:text-brand-600">← Tiếp tục mua sắm</Link>
        </div>
      </div>
    </div>
  );
}
