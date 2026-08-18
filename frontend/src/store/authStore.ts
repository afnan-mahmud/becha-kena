import { create } from 'zustand';
import type { IUser } from '../types';
import { getMe } from '../services/user.service';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
  setUser: (user: IUser) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isVerified: false,

  setUser: (user) => set({
    user,
    isAuthenticated: true,
    isLoading: false,
    isVerified: user.isVerified,
  }),

  clearUser: () => set({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isVerified: false,
  }),

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const response = await getMe();
      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isVerified: response.data.isVerified,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isVerified: false,
        isLoading: false,
      });
    }
  },

  updateUser: (updates) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, ...updates };
    return {
      user: updatedUser,
      isVerified: updatedUser.isVerified,
    };
  }),
}));
