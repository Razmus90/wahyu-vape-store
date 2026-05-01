'use client';

import { useMemo, useEffect, useState } from 'react';
import { RefreshCw, Package, Filter, Database, Save, Eye, EyeOff } from 'lucide-react';
import { ProductCache } from '@/lib/supabase';

type Tab = 'products' | 'embedding';

const EMBEDDING_MODELS = [
  'openai/text-embedding-ada-002',
  'openai/text-embedding-3-small',
  'openai/text-embedding-3-large',
];

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [allProducts, setAllProducts] = useState<ProductCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [klasifikasi, setKlasifikasi] = useState('all');

  // Product display settings (for user page)
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [savingDisplay, setSavingDisplay] = useState(false);

  // Embedding settings state
  const [embSettings, setEmbSettings] = useState<{
    apiKey: string;
    model: string;
  }>({ apiKey: '', model: 'openai/text-embedding-ada-002' });
  const [showEmbKey, setShowEmbKey] = useState(false);
  const [savingEmb, setSavingEmb] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/products?showAll=true')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAllProducts(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'embedding') {
      fetch('/api/admin/chat-settings')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data?.embedding_api_key) {
            setEmbSettings(prev => ({ ...prev, apiKey: '••••••••' }));
          }
        })
        .catch(() => {});
    }

    // Fetch product display setting
    if (activeTab === 'products' || activeTab === 'embedding') {
      fetch('/api/admin/product-display')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            setShowOutOfStock(data.data.show_out_of_stock !== false);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress('Syncing products...');
    try {
      const res = await fetch('/api/products/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncProgress(`Done! Synced: ${data.data.synced}, Deleted: ${data.data.deleted}, Embeddings: ${data.data.embeddings}, Errors: ${data.data.errors}`);
        fetchProducts();
        setKlasifikasi('all');
        setTimeout(() => setSyncProgress(''), 5000);
      } else {
        setSyncProgress('Failed: ' + data.error);
      }
    } catch {
      setSyncProgress('Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  const saveEmbeddingSettings = async () => {
    if (!embSettings.apiKey || embSettings.apiKey === '••••••••') {
      alert('API key harus diisi');
      return;
    }
    setSavingEmb(true);
    try {
      const res = await fetch('/api/admin/embedding-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: embSettings.apiKey, model: embSettings.model }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Embedding settings saved!');
        setEmbSettings(prev => ({ ...prev, apiKey: '••••••••' }));
      } else {
        alert('Failed: ' + data.error);
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSavingEmb(false);
    }
  };

  const saveProductDisplay = async () => {
    setSavingDisplay(true);
    try {
      const res = await fetch('/api/admin/product-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_display: { show_out_of_stock: showOutOfStock } }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Pengaturan tampilan disimpan!');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSavingDisplay(false);
    }
  };

  // Extract unique klasifikasi values
  const klasifikasiOptions = useMemo(() => {
    const values = new Set<string>();
    allProducts.forEach((p) => {
      if (p.klasifikasi) values.add(p.klasifikasi);
    });
    return ['all', ...Array.from(values).sort()];
  }, [allProducts]);

  // Apply filter client-side
  const products = useMemo(() => {
    if (klasifikasi === 'all') return allProducts;
    return allProducts.filter((p) => p.klasifikasi === klasifikasi);
  }, [allProducts, klasifikasi]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Generate consistent color for any value
  const getColorClass = (value: string): string => {
    const colors = [
      'bg-blue-500/20 text-blue-400',
      'bg-green-500/20 text-green-400',
      'bg-orange-500/20 text-orange-400',
      'bg-pink-500/20 text-pink-400',
      'bg-purple-500/20 text-purple-400',
      'bg-yellow-500/20 text-yellow-400',
      'bg-cyan-500/20 text-cyan-400',
      'bg-red-500/20 text-red-400',
    ];
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4 inline-block mr-1" />
          Products
        </button>
        <button
          onClick={() => setActiveTab('embedding')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'embedding'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <Database className="w-4 h-4 inline-block mr-1" />
          Embedding
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Products</h1>
              <p className="text-gray-400 text-sm">Manage product cache from Olsera</p>
            </div>

            {/* Product Display Settings for User Page */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Tampilan Halaman User</p>
                <p className="text-gray-400 text-xs">Kontrol produk yang ditampilkan di halaman user</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOutOfStock}
                  onChange={async (e) => {
                    const newVal = e.target.checked;
                    setShowOutOfStock(newVal);
                    try {
                      const res = await fetch('/api/admin/product-display', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product_display: { show_out_of_stock: newVal } }),
                        credentials: 'include',
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        alert('Gagal menyimpan: ' + (data.error || 'Unknown error'));
                        setShowOutOfStock(!newVal); // Revert on fail
                      }
                    } catch (err) {
                      alert('Gagal menyimpan setting.');
                      setShowOutOfStock(!newVal); // Revert on fail
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 relative"></div>
                <span className="ml-3 text-sm text-gray-300">
                  {showOutOfStock ? 'Semua Produk' : 'Stok Saja'}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={klasifikasi}
                  onChange={(e) => setKlasifikasi(e.target.value)}
                  className="bg-transparent text-gray-300 text-sm outline-none"
                >
                  {klasifikasiOptions.map((val) => (
                    <option key={val} value={val} className="bg-gray-800">{val === 'all' ? 'All Klasifikasi' : val}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Products'}
              </button>
            </div>
          </div>

          {syncProgress && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${syncProgress.includes('Failed') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              {syncProgress}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No products found</p>
              <p className="text-gray-500 text-sm mt-1">Try syncing from Olsera</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Product</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Klasifikasi</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Category</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Price</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Stock</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Olsera ID</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Last Synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            <span className="text-white font-medium truncate max-w-[200px]">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${getColorClass(product.klasifikasi || 'Uncategorized')}`}>
                            {product.klasifikasi || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-300 text-xs">
                          {product.category || '-'}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${product.stock < 10 ? 'text-red-400' : product.stock === 0 ? 'text-red-500' : 'text-gray-300'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">
                          {product.olsera_product_id?.slice(0, 8) || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                          {formatDate(product.last_synced_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Embedding Settings */
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Embedding Settings</h1>
            <p className="text-gray-400 text-sm">Configure vector embeddings for semantic product search</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-semibold">Provider & Model</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Provider</label>
                <input
                  value="openrouter"
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm outline-none cursor-not-allowed"
                />
                <p className="text-gray-600 text-xs mt-1">Fixed: OpenRouter</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Embedding Model</label>
                <select
                  value={embSettings.model}
                  onChange={(e) => setEmbSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                >
                  {EMBEDDING_MODELS.map((m) => (
                    <option key={m} value={m} className="bg-gray-800">{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <label className="block text-gray-400 text-sm mb-2">API Key (OpenRouter)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showEmbKey ? 'text' : 'password'}
                    value={embSettings.apiKey}
                    onChange={(e) => setEmbSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter OpenRouter API key..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmbKey(prev => !prev)}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {showEmbKey ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-1">API key disimpan terenkripsi di database. Sekali diinput tidak bisa dilihat kembali.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveEmbeddingSettings}
                disabled={savingEmb}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Save className={`w-4 h-4 ${savingEmb ? 'animate-spin' : ''}`} />
                {savingEmb ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-400">
            <p><strong className="text-gray-300">Note:</strong> Embeddings dihasilkan otomatis saat sync produk. Pastikan API key tersimpan, lalu klik "Sync Products" di tab Products.</p>
          </div>
        </div>
      )}
    </div>
  );
}
