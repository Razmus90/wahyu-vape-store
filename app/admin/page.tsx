'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Clock, CircleCheck, Package, TrendingUp } from 'lucide-react';

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  paidOrders: number;
  totalProducts: number;
  lowStockProducts: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const statCards = stats
    ? [
        { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-400', iconBg: 'bg-blue-500/20' },
        { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'bg-green-500/10 text-green-400', iconBg: 'bg-green-500/20' },
        { label: 'Pending Payments', value: stats.pendingOrders.toString(), icon: Clock, color: 'bg-amber-500/10 text-amber-400', iconBg: 'bg-amber-500/20' },
        { label: 'Paid Orders', value: stats.paidOrders.toString(), icon: CircleCheck, color: 'bg-emerald-500/10 text-emerald-400', iconBg: 'bg-emerald-500/20' },
        { label: 'Total Products', value: stats.totalProducts.toString(), icon: Package, color: 'bg-purple-500/10 text-purple-400', iconBg: 'bg-purple-500/20' },
        { label: 'Low Stock', value: stats.lowStockProducts.toString(), icon: TrendingUp, color: 'bg-red-500/10 text-red-400', iconBg: 'bg-red-500/20' },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">Overview of your store performance</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-20" />
                  <div className="h-6 bg-gray-800 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, iconBg }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{label}</p>
                  <p className="text-white font-bold text-xl">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
