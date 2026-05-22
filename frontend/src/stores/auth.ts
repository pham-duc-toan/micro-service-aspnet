import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import { profileFromToken, isTokenExpired } from '@/lib/jwt';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  profile: UserProfile | null;
  setSession: (tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      profile: null,
      setSession: ({ accessToken, refreshToken, expiresIn }) => {
        const profile = profileFromToken(accessToken);
        const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;
        set({
          accessToken,
          refreshToken: refreshToken ?? get().refreshToken ?? null,
          expiresAt,
          profile,
        });
      },
      clear: () =>
        set({ accessToken: null, refreshToken: null, expiresAt: null, profile: null }),
      isAuthenticated: () => {
        const { accessToken } = get();
        if (!accessToken) return false;
        return !isTokenExpired(accessToken);
      },
    }),
    {
      name: 'tedu-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        profile: state.profile,
      }),
    },
  ),
);
