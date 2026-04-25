import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalLogoState {
  globalLogo: string | null;
  globalLogoName: string | null;
  setGlobalLogo: (base64url: string | null, name: string | null) => void;
  clearGlobalLogo: () => void;
}

export const useGlobalLogo = create<GlobalLogoState>()(
  persist(
    (set) => ({
      globalLogo: null,
      globalLogoName: null,
      setGlobalLogo: (base64url, name) => set({ globalLogo: base64url, globalLogoName: name }),
      clearGlobalLogo: () => set({ globalLogo: null, globalLogoName: null }),
    }),
    {
      name: 'um-global-logo-storage', 
    }
  )
);
