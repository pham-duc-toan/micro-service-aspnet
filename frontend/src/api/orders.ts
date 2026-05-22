import { gatewayClient } from './axios';
import type { CreateOrderInput, Order, UpdateOrderInput } from '@/types';

const VERSION = 'v1';

interface ApiResult<T> {
  isSucceeded: boolean;
  message: string;
  data: T;
}

export async function listOrdersByUser(username: string): Promise<Order[]> {
  const { data } = await gatewayClient.get<ApiResult<Order[]>>(
    `/${VERSION}/orders/${encodeURIComponent(username)}`,
  );
  return data?.data ?? [];
}

export async function getOrderById(id: number): Promise<Order> {
  const { data } = await gatewayClient.get<Order>(`/${VERSION}/orders/by-id/${id}`);
  return data;
}

export async function createOrder(input: CreateOrderInput): Promise<number> {
  const { data } = await gatewayClient.post<ApiResult<number>>(`/${VERSION}/orders`, input);
  return data?.data ?? 0;
}

export async function updateOrder(id: number, input: UpdateOrderInput): Promise<Order> {
  const { data } = await gatewayClient.put<ApiResult<Order>>(`/${VERSION}/orders/${id}`, input);
  return data?.data;
}

export async function deleteOrder(id: number): Promise<void> {
  await gatewayClient.delete(`/${VERSION}/orders/${id}`);
}

export async function deleteOrderByDocNo(documentNo: string): Promise<void> {
  await gatewayClient.delete(`/${VERSION}/orders/document-no/${encodeURIComponent(documentNo)}`);
}
