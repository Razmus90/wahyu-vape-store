'use client';

import { useEffect, useState } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { Order } from '@/lib/supabase';

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-500/20 text-amber-400',
  PAID: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-400',
};

const statusFilters = ['all', 'PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    fetch(`/api/orders${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-gray-400 text-sm">Manage and track customer orders</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Status: {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}
            <ChevronDown className="w-4 h-4" />
          </button>
          {filterOpen && (
            <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1 min-w-[180px]">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    statusFilter === status ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Order ID</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-gray-300">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{formatPrice(order.total_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-400 hover:text-amber-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Order ID</p>
                    <p className="text-white text-sm font-mono">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Status</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[selectedOrder.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {selectedOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Customer</p>
                    <p className="text-white text-sm">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Email</p>
                    <p className="text-white text-sm">{selectedOrder.customer_email}</p>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Phone</p>
                      <p className="text-white text-sm">{selectedOrder.customer_phone}</p>
                    </div>
                  )}
                  {selectedOrder.customer_address && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Address</p>
                      <p className="text-white text-sm">{selectedOrder.customer_address}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <p className="text-gray-500 text-xs mb-2">Items</p>
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-300">{item.product_name} x{item.quantity}</span>
                      <span className="text-white">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-800 pt-4 flex justify-between">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="text-white font-bold text-lg">{formatPrice(selectedOrder.total_price)}</span>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <p className="text-gray-500 text-xs mb-1">Created</p>
                  <p className="text-gray-300 text-sm">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
