"use client";
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'um-global-logo-storage';
const EVENT_NAME = 'um-global-logo-change';

interface StoredData {
  globalLogo: string | null;
  globalLogoName: string | null;
}

function getStoredData(): StoredData {
  if (typeof window === 'undefined') return { globalLogo: null, globalLogoName: null };
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : { globalLogo: null, globalLogoName: null };
  } catch {
    return { globalLogo: null, globalLogoName: null };
  }
}

function setStoredData(data: StoredData) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (e) {
    console.error("Local storage error", e);
  }
}

export function useGlobalLogo() {
  const [state, setState] = useState<StoredData>({ globalLogo: null, globalLogoName: null });

  useEffect(() => {
    setState(getStoredData());
    const handleStorageChange = () => setState(getStoredData());
    window.addEventListener(EVENT_NAME, handleStorageChange);
    // Also listen to native storage event for cross-tab sync
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    globalLogo: state.globalLogo,
    globalLogoName: state.globalLogoName,
    setGlobalLogo: (base64url: string | null, name: string | null) => setStoredData({ globalLogo: base64url, globalLogoName: name }),
    clearGlobalLogo: () => setStoredData({ globalLogo: null, globalLogoName: null }),
  };
}
