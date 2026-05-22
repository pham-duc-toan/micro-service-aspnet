import { gatewayClient } from './axios';
import type { BasketCheckoutInput, Cart } from '@/types';

export async function getBasket(username: string): Promise<Cart | null> {
  try {
    const { data } = await gatewayClient.get<Cart>(`/baskets/${encodeURIComponent(username)}`);
    return data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function upsertBasket(cart: Cart): Promise<Cart> {
  const { data } = await gatewayClient.post<Cart>('/baskets', cart);
  return data;
}

export async function deleteBasket(username: string): Promise<void> {
  await gatewayClient.delete(`/baskets/${encodeURIComponent(username)}`);
}

export async function checkoutBasket(payload: BasketCheckoutInput): Promise<void> {
  await gatewayClient.post('/baskets/checkout', payload);
}

export interface ReminderEmailInput {
  emailTo: string;
  subject: string;
  templateName?: string;
}

export async function sendReminderEmail(input: ReminderEmailInput): Promise<unknown> {
  const { data } = await gatewayClient.post('/baskets/email', input);
  return data;
}
