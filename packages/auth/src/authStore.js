import { Platform } from 'react-native';
import { create } from 'zustand/index.js';
import { persist } from 'zustand/middleware.js';
import { createStorageAdapter } from './storageAdapter';

// Unified storage so the same code works on web & native
const storageAdapter = createStorageAdapter();

const zustandStorage = {
  getItem: storageAdapter.getItem,
  setItem: storageAdapter.setItem,
  removeItem: storageAdapter.removeItem,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // core pieces
      session: null,
      user: null,
      userProfile: null,
      authState: 'LOADING',
      notifications: [],

      // setters
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setAuthState: (state) => set({ authState: state }),

      // notifications helpers
      addNotification: (notif) =>
        set((s) => ({ notifications: [...s.notifications, notif] })),
      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      // clear all but preserve preference-managed items
      clearAuth: () =>
        set({
          session: null,
          user: null,
          userProfile: null,
          authState: 'UNAUTHENTICATED',
          notifications: [],
        }),
    }),
    {
      name: 'adera-auth-store',
      storage: zustandStorage,
      // only persist the heavy-hitters; notifications are transient
      partialize: (state) => ({
        session: state.session,
        userProfile: state.userProfile,
        authState: state.authState,
      }),
      version: 1,
    }
  )
);
