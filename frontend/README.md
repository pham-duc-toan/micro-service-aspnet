# TeduShop Frontend

Frontend cho hệ thống thương mại điện tử **TeduShop** (microservices). Dự án dùng:

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** cho UI
- **React Router v6** cho routing
- **TanStack React Query** cho data fetching / caching
- **Zustand** cho state management (auth, cart) + persist vào `localStorage`
- **Axios** + interceptor JWT
- **React Hook Form** cho form
- **react-hot-toast** cho thông báo

## Yêu cầu

- Node.js >= 18
- Backend đã chạy:
  - Identity Server: `http://localhost:6011`
  - API Gateway (Ocelot): `http://localhost:6001`

## Khởi chạy backend

Tại thư mục gốc repo (theo `API_REFERENCE.md`):

```powershell
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  -f Business-Services/src/docker-compose.local-ports.yml `
  up -d --build

docker compose -f tedu-microserivces.idp/src/docker-compose.yml up -d --build
```

## Cài đặt frontend

```powershell
cd frontend
npm install
```

## Chạy dev server

```powershell
npm run dev
```

Mặc định mở tại `http://localhost:5173`.

## Build production

```powershell
npm run typecheck   # kiểm tra TypeScript
npm run build       # build sản phẩm vào dist/
npm run preview     # preview build
```

## Tài khoản demo

| Tên đăng nhập | Mật khẩu | Vai trò |
| --- | --- | --- |
| `alicesmith@example.com` | `alice123` | Administrator (đầy đủ quyền) |

Customer seed trong Customer Service: `customer1`, `customer2` (chỉ có trong DB Customer, chưa có ở Identity, dùng để tra cứu).

## Biến môi trường

Sao chép `.env.example` → `.env` rồi chỉnh nếu cần:

```env
VITE_GATEWAY_URL=http://localhost:6001
VITE_IDENTITY_URL=http://localhost:6011
VITE_CLIENT_ID=tedu_microservices_postman
VITE_CLIENT_SECRET=SuperStrongSecret
```

## Cấu trúc thư mục

```
src/
├── api/                # Axios clients + per-service modules
│   ├── axios.ts        # Gateway/Identity clients + JWT interceptor
│   ├── auth.ts         # ROPC login, refresh, account
│   ├── products.ts
│   ├── basket.ts
│   ├── orders.ts
│   ├── inventory.ts
│   ├── customers.ts
│   ├── permissions.ts
│   └── jobs.ts
├── components/
│   ├── layout/         # StorefrontLayout, AdminLayout
│   ├── ui/             # Modal, Spinner, ConfirmDialog, EmptyState
│   ├── product/        # ProductCard, ProductGrid
│   └── ProtectedRoute.tsx
├── lib/                # jwt, format helpers
├── pages/
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── storefront/
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Orders.tsx
│   │   └── OrderDetail.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── ProductsManage.tsx
│       ├── OrdersManage.tsx
│       ├── InventoryManage.tsx
│       ├── CustomersManage.tsx
│       └── JobsManage.tsx
├── stores/             # Zustand (auth, cart) + persist
├── types/              # TS types khớp với DTO backend
├── App.tsx             # Routing
├── main.tsx            # Entry point
└── index.css           # Tailwind
```

## Các route chính

### Storefront (`/`)

| Đường dẫn | Mô tả | Auth |
| --- | --- | --- |
| `/` | Trang chủ + sản phẩm nổi bật | Public (cần đăng nhập để xem sản phẩm) |
| `/products` | Danh sách + search + sort | Cần token (PRODUCT.VIEW) |
| `/products/:id` | Chi tiết, tồn kho, mua | Cần token |
| `/cart` | Giỏ hàng (localStorage) | Public |
| `/checkout` | Đặt hàng (Basket Checkout hoặc Order trực tiếp) | Cần token |
| `/orders` | Danh sách đơn của user hiện tại | Cần token |
| `/orders/:id` | Chi tiết đơn | Cần Administrator (theo backend) |
| `/login` | Đăng nhập (OAuth2 password grant) | Public |

### Admin (`/admin`) — yêu cầu role `Administrator`

| Đường dẫn | Mô tả |
| --- | --- |
| `/admin` | Dashboard tóm tắt |
| `/admin/products` | CRUD sản phẩm |
| `/admin/orders` | Tra cứu / sửa / xóa đơn hàng theo username |
| `/admin/inventory` | Nhập/xuất kho + phân trang sổ kho |
| `/admin/customers` | Tra cứu customer theo username |
| `/admin/jobs` | Lên lịch/hủy email + welcome jobs (Hangfire) |

## Authentication flow

1. Người dùng nhập username/password tại `/login`.
2. Frontend gọi `POST /connect/token` (Identity Server, ROPC grant) với client
   `tedu_microservices_postman` / secret `SuperStrongSecret`.
3. Lưu `access_token` (+ optional `refresh_token`) vào `localStorage` qua Zustand persist.
4. Mọi request tới Gateway/Identity gắn header `Authorization: Bearer <token>` qua axios
   interceptor (`src/api/axios.ts`).
5. Khi gặp `401`, interceptor sẽ clear auth state và redirect về `/login`.

## Lưu ý mua hàng

- Form `/checkout` có 2 chế độ:
  - **Basket Checkout** (mặc định): upsert giỏ lên Basket API → gọi `/baskets/checkout`
    (publish event, sẽ tạo order qua message queue).
  - **Order trực tiếp**: gọi thẳng `POST /v1/orders`.
- Username lấy từ JWT (`preferred_username` / `email`). Vì seed mặc định chỉ có
  Administrator, các đơn hàng demo sẽ ở dưới username `alicesmith@example.com` trừ khi bạn
  thêm user khác vào Identity.

## Trục trặc thường gặp

- **CORS**: Identity và các service đã cấu hình allow `localhost:5020`, `5001`, `6001`...
  Nếu cần thêm origin `5173`, sửa `Config.cs` (`AllowedCorsOrigins`) trong
  `tedu-microserivces.idp` và rebuild.
- **401 sau khi login**: token hết hạn hoặc chưa cấu hình `roles` scope. Đã yêu cầu trong
  `src/api/auth.ts`.
- **403**: tài khoản chưa có quyền tương ứng. Đăng nhập bằng `alicesmith@example.com`
  hoặc cấp quyền qua trang Permissions của Identity.
