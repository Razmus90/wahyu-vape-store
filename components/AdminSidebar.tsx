'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, MessageSquare, FileText, Menu, X, Zap, ChevronRight, LogOut } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/chats', label: 'Chat History', icon: MessageSquare },
  { href: '/admin/logs', label: 'System Logs', icon: FileText },
];

export function AdminSidebarTrigger() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-400 lg:hidden">
        <Menu className="w-5 h-5" />
      </button>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    window.location.href = '/admin/login';
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Wahyu Vape</p>
            <p className="text-gray-500 text-xs">Admin Panel</p>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive(href, exact) ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
              {isActive(href, exact) && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-xs transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10">
            <LogOut className="w-3 h-3" />
            Logout
          </button>
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-xs transition-colors">
            Back to Store
          </Link>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
    </>
  );
}
