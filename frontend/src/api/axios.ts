import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:6001';
const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL || 'http://localhost:6011';

export const gatewayClient = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 15_000,
});

export const identityClient = axios.create({
  baseURL: IDENTITY_URL,
  timeout: 15_000,
});

function attachToken(config: InternalAxiosRequestConfig) {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
}

gatewayClient.interceptors.request.use(attachToken);
identityClient.interceptors.request.use(attachToken);

function handleError(error: AxiosError<{ message?: string; title?: string; errors?: unknown }>) {
  const status = error.response?.status;
  if (status === 401) {
    useAuthStore.getState().clear();
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  } else if (status === 403) {
    toast.error('Bạn không có quyền thực hiện hành động này.');
  } else if (status && status >= 500) {
    toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
  }
  return Promise.reject(error);
}

gatewayClient.interceptors.response.use((r) => r, handleError);
identityClient.interceptors.response.use((r) => r, handleError);

interface ApiErrorBody {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function extractErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object') {
      const body = data as ApiErrorBody;
      if (body.detail) return body.detail;
      if (body.message) return body.message;
      if (body.title) return body.title;
      if (body.errors) {
        const first = Object.values(body.errors)[0];
        if (Array.isArray(first) && first[0]) return first[0];
      }
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
