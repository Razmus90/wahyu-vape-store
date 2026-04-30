'use client';

import { useMemo, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCache } from '@/lib/supabase';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<ProductCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [klasifikasi, setKlasifikasi] = useState(searchParams.get('klasifikasi') || 'all');
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAllProducts(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/product-display')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setShowOutOfStock(data.data.show_out_of_stock !== false);
        }
      })
      .catch(() => {});
  }, []);

  // Extract unique klasifikasi values
  const klasifikasiOptions = useMemo(() => {
    const values = new Set<string>();
    allProducts.forEach((p) => {
      if (p.klasifikasi) values.add(p.klasifikasi);
    });
    return ['all', ...Array.from(values).sort()];
  }, [allProducts]);

  // Apply filter + search client-side
  const products = useMemo(() => {
    let result = allProducts;
    if (!showOutOfStock) {
      result = result.filter((p) => p.stock > 0);
    }
    if (klasifikasi !== 'all') {
      result = result.filter((p) => p.klasifikasi === klasifikasi);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [allProducts, klasifikasi, search, showOutOfStock]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (klasifikasi !== 'all') params.set('klasifikasi', klasifikasi);
    if (search) params.set('search', search);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [klasifikasi, search, router]);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Produk</h1>
          <p className="text-gray-400">Jelajahi koleksi lengkap produk vape premium kami</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors text-base"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setKlasifikasi('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                klasifikasi === 'all'
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
              }`}
            >
              All
            </button>
            <select
              value={klasifikasi === 'all' ? '' : klasifikasi}
              onChange={(e) => setKlasifikasi(e.target.value || 'all')}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm outline-none"
            >
              <option value="" className="bg-gray-800">Filter Klasifikasi...</option>
              {klasifikasiOptions.filter((v) => v !== 'all').map((val) => (
                <option key={val} value={val} className="bg-gray-800">{val}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No products found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
