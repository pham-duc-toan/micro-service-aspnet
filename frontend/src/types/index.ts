export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  scope?: string;
}

export interface DecodedToken {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  user_name?: string;
  given_name?: string;
  family_name?: string;
  address?: string;
  roles?: string | string[];
  role?: string | string[];
  exp?: number;
  iat?: number;
}

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  isAdmin: boolean;
}

export interface Product {
  id: number;
  no: string;
  name: string;
  summary: string;
  description: string;
  price: number;
}

export interface CreateProductInput {
  no: string;
  name: string;
  summary: string;
  description: string;
  price: number;
}

export type UpdateProductInput = Omit<CreateProductInput, 'no'>;

export interface CartItem {
  itemNo: string;
  itemName: string;
  quantity: number;
  itemPrice: number;
  availableQuantity?: number;
}

export interface Cart {
  username: string;
  emailAddress?: string;
  items: CartItem[];
  totalPrice?: number;
  lastModifiedDate?: string;
  jobId?: string | null;
}

export interface BasketCheckoutInput {
  userName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  shippingAddress: string;
  invoiceAddress: string;
}

export const OrderStatusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Mới', color: 'bg-blue-100 text-blue-700' },
  2: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700' },
  3: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700' },
  4: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  5: { label: 'Hoàn tất', color: 'bg-green-100 text-green-700' },
};

export interface Order {
  id: number;
  documentNo: string;
  userName: string;
  totalPrice: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  shippingAddress: string;
  invoiceAddress: string;
  status: number;
}

export interface CreateOrderInput {
  userName: string;
  totalPrice: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  shippingAddress: string;
  invoiceAddress: string;
}

export type UpdateOrderInput = Omit<CreateOrderInput, 'userName'> & { status?: number };

export const DocumentTypeMap: Record<number, string> = {
  0: 'Tất cả',
  101: 'Nhập kho',
  102: 'Nhập nội bộ',
  201: 'Xuất bán',
  202: 'Xuất nội bộ',
};

export interface InventoryEntry {
  id: string;
  documentType: number;
  documentNo: string;
  itemNo: string;
  quantity: number;
  externalDocumentNo: string;
}

export interface InventoryPagedResult<T> {
  items: T[];
  metaData: {
    totalItemCount: number;
    pageSize: number;
    pageNumber: number;
    firstItemOnPage: number;
    lastItemOnPage: number;
  };
}

export interface CustomerProfile {
  userName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
}

export interface ScheduleEmailInput {
  email: string;
  subject: string;
  content: string;
  enqueue: string;
}

export interface RolePermission {
  function: string;
  command: string;
}
