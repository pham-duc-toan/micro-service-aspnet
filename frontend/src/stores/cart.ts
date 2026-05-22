import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (itemNo: string) => void;
  updateQuantity: (itemNo: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  replaceAll: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.itemNo === product.no);
        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
        } else {
          items.push({
            itemNo: product.no,
            itemName: product.name,
            itemPrice: product.price,
            quantity,
          });
        }
        set({ items });
      },
      removeItem: (itemNo) => set({ items: get().items.filter((i) => i.itemNo !== itemNo) }),
      updateQuantity: (itemNo, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.itemNo !== itemNo) });
          return;
        }
        set({
          items: get().items.map((i) => (i.itemNo === itemNo ? { ...i, quantity } : i)),
        });
      },
      clear: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.itemPrice * i.quantity, 0),
    }),
    {
      name: 'tedu-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
