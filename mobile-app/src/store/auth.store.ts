import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { User } from '@/types/user.types';
import {
  saveTokens,
  clearTokens,
  saveUser as cacheUser,
  clearUser as clearCachedUser,
  clearSessionData,
  getUser as getCachedUser,
  getRefreshToken,
  getOnboarded,
  setOnboarded as setStorageOnboarded,
} from '@/lib/storage';
import { apiClient } from '@/services/api';
import { ApiError } from '@/types/api.types';
import { ENDPOINTS } from '@/constants/api';
import { disconnectSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chat.store';
import { queryClient } from '@/lib/queryClient';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  hasOnboarded: boolean;

  // Actions
  login: (authData: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  localLogout: (redirectTo?: '/(auth)/login' | '/(auth)/welcome') => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<User | null>;
  bootstrap: () => Promise<void>;
  setOnboarded: (hasOnboarded?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isBootstrapping: true,
      hasOnboarded: false,

      /**
       * Login with verified OTP response data:
       * Saves tokens in SecureStore, user in storage, sets state.
       */
      login: async ({ user, accessToken, refreshToken }) => {
        await saveTokens({ accessToken, refreshToken });
        await cacheUser(user);
        set({
          user,
          isAuthenticated: true,
          isBootstrapping: false,
        });
      },

      /**
       * Logout user:
       * Calls POST /auth/logout (ignoring errors), disconnects socket,
       * clears tokens, cached user, chat store, resets state, redirects to login.
       */
      logout: async () => {
        try {
          await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
        } catch {
          // Ignore API logout errors as specified
        }

        disconnectSocket();
        await clearTokens();
        await clearCachedUser();
        await clearSessionData().catch(() => {});
        useChatStore.getState().reset();
        queryClient.clear();

        set({
          user: null,
          isAuthenticated: false,
        });

        try {
          router.replace('/(auth)/login');
        } catch {
          // Navigation fallback
        }
      },

      /**
       * Local logout without hitting the API:
       * Used after account deletion or when token refresh fails.
       */
      localLogout: async (redirectTo = '/(auth)/login') => {
        disconnectSocket();
        await clearTokens();
        await clearCachedUser();
        await clearSessionData().catch(() => {});
        useChatStore.getState().reset();
        queryClient.clear();

        set({
          user: null,
          isAuthenticated: false,
        });

        try {
          router.replace(redirectTo);
        } catch {
          // Navigation fallback
        }
      },

      /**
       * Set user manually and update cache
       */
      setUser: (user: User | null) => {
        if (user) {
          cacheUser(user).catch(() => {});
        } else {
          clearCachedUser().catch(() => {});
        }
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      /**
       * Fetch fresh user data from GET /users/me and update store
       */
      refreshUser: async () => {
        try {
          const user = await apiClient.get<User>(ENDPOINTS.USER.ME);
          if (user) {
            await cacheUser(user);
            set({
              user,
              isAuthenticated: true,
            });
            return user;
          }
          return null;
        } catch {
          return null;
        }
      },

      /**
       * App startup bootstrap check:
       * Reads onboarding flag + tokens.
       * If refresh token exists, re-validates via GET /users/me.
       * On success sets user & isAuthenticated, on failure performs localLogout.
       * Always finishes with isBootstrapping = false.
       */
      bootstrap: async () => {
        try {
          const [storedOnboarded, refreshToken] = await Promise.all([
            getOnboarded(),
            getRefreshToken(),
          ]);

          const hasOnboarded = storedOnboarded || get().hasOnboarded;
          set({ hasOnboarded });

          if (refreshToken) {
            try {
              // The axios interceptor refreshes an expired access token automatically
              const user = await apiClient.get<User>(ENDPOINTS.USER.ME);
              if (user) {
                await cacheUser(user);
                set({
                  user,
                  isAuthenticated: true,
                });
              } else {
                await get().localLogout();
              }
            } catch (err) {
              // Offline at startup: keep the cached session instead of logging out (Prompt 46)
              const cached = get().user ?? (await getCachedUser());
              if (err instanceof ApiError && err.code === 'NETWORK_ERROR' && cached) {
                set({ user: cached, isAuthenticated: true });
              } else {
                await get().localLogout();
              }
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
            });
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isBootstrapping: false });
        }
      },

      /**
       * Sets the onboarding completed flag in AsyncStorage and state
       */
      setOnboarded: async (hasOnboarded: boolean = true) => {
        await setStorageOnboarded(hasOnboarded);
        set({ hasOnboarded });
      },
    }),
    {
      name: 'bk_auth_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        hasOnboarded: state.hasOnboarded,
      }),
    }
  )
);
