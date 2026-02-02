import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
  
  // Actions
  login: (token: string, user: User, expiresAt: number) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,

      login: (token, user, expiresAt) => {
        set({
          user,
          token,
          expiresAt,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const { expiresAt, isAuthenticated } = get();
        
        // Check if session expired
        if (isAuthenticated && expiresAt && Date.now() > expiresAt) {
          get().logout();
          return false;
        }
        
        return isAuthenticated;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
