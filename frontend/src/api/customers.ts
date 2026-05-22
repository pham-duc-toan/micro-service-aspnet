import { gatewayClient } from './axios';
import type { CustomerProfile } from '@/types';

interface ActionResult<T> {
  value?: T;
  statusCode?: number;
}

export async function getCustomer(username: string): Promise<CustomerProfile> {
  const { data } = await gatewayClient.get<ActionResult<CustomerProfile> | CustomerProfile>(
    `/customers/${encodeURIComponent(username)}`,
  );
  // ASP.NET serialises OkObjectResult as { value: T, statusCode: 200 }
  if (data && typeof data === 'object' && 'value' in data && (data as ActionResult<CustomerProfile>).value) {
    return (data as ActionResult<CustomerProfile>).value!;
  }
  return data as CustomerProfile;
}
