import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="text-7xl font-extrabold text-brand-600">404</div>
      <h1 className="text-2xl font-bold mt-2">Không tìm thấy trang</h1>
      <p className="text-gray-600 mt-2">Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Về trang chủ
      </Link>
    </div>
  );
}
