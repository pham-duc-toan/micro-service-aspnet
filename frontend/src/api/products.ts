import { gatewayClient } from './axios';
import type { CreateProductInput, Product, UpdateProductInput } from '@/types';

export async function listProducts(): Promise<Product[]> {
  const { data } = await gatewayClient.get<Product[]>('/products');
  return data;
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await gatewayClient.get<Product>(`/products/${id}`);
  return data;
}

export async function getProductByNo(productNo: string): Promise<Product> {
  const { data } = await gatewayClient.get<Product>(`/products/get-product-by-no/${productNo}`);
  return data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await gatewayClient.post<Product>('/products', input);
  return data;
}

export async function updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
  const { data } = await gatewayClient.put<Product>(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await gatewayClient.delete(`/products/${id}`);
}
