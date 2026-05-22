import { gatewayClient } from './axios';
import type { InventoryEntry } from '@/types';

export async function getInventoryByItem(itemNo: string): Promise<InventoryEntry[]> {
  const { data } = await gatewayClient.get<InventoryEntry[]>(
    `/inventory/items/${encodeURIComponent(itemNo)}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getInventoryPaged(
  itemNo: string,
  pageIndex = 1,
  pageSize = 10,
): Promise<InventoryEntry[]> {
  const { data } = await gatewayClient.get<InventoryEntry[]>(
    `/inventory/items/${encodeURIComponent(itemNo)}/paging`,
    { params: { pageIndex, pageSize } },
  );
  return Array.isArray(data) ? data : [];
}

export async function getInventoryById(id: string): Promise<InventoryEntry> {
  const { data } = await gatewayClient.get<InventoryEntry>(`/inventory/${id}`);
  return data;
}

export async function purchaseItem(itemNo: string, quantity: number, externalDocNo?: string): Promise<unknown> {
  const body: Record<string, unknown> = { quantity };
  if (externalDocNo) body.externalDocNo = externalDocNo;
  const { data } = await gatewayClient.post(`/inventory/purchase/${encodeURIComponent(itemNo)}`, body);
  return data;
}

export async function saleItem(itemNo: string, quantity: number, externalDocNo?: string): Promise<unknown> {
  const body: Record<string, unknown> = { quantity };
  if (externalDocNo) body.externalDocNo = externalDocNo;
  const { data } = await gatewayClient.post(`/inventory/sales/${encodeURIComponent(itemNo)}`, body);
  return data;
}

export async function deleteInventory(id: string): Promise<void> {
  await gatewayClient.delete(`/inventory/${id}`);
}
