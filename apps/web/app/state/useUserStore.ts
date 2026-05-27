import { create } from "zustand/react";
import api from "@repo/api/src/client";

export interface useUserStore {
  name: string;
  email: string;
  id: string;
}

interface AuthStore {
  userData: useUserStore | null;
  isAuthenticated: boolean;
  clearUser: () => void;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<AuthStore>((set) => ({
  userData: null,
  isAuthenticated: false,
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("auth/me");
      const data = res.data;
      set({ userData: data, isLoading: false, isAuthenticated: true });
    } catch (e) {
      console.error(e);
      set({ userData: null, isLoading: false, isAuthenticated: false });
    }
  },
  isLoading: true,
  clearUser: () =>
    set({ userData: null, isLoading: false, isAuthenticated: false }),
}));
