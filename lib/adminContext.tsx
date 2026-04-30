'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminContextType = {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) setToken(saved);
    setMounted(true);
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    router.push('/admin/login');
  };

  if (!mounted) return <>{children}</>;

  return (
    <AdminContext.Provider value={{ token, isAuthenticated: !!token, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
