'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCache } from '@/lib/supabase';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [klasifikasi, setKlasifikasi] = useState(searchParams.get('klasifikasi') || 'all');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = 20;

  const query = new URLSearchParams();
  if (klasifikasi !== 'all') query.set('klasifikasi', klasifikasi);
  if (search) query.set('search', search);
  query.set('page', String(page));
  query.set('perPage', String(perPage));

  const { data, error, isLoading } = useSWR(`/api/products?${query.toString()}`, fetcher);

  const products: ProductCache[] = data?.success ? data.data : [];
  const total: number = data?.success ? data.total : 0;
  const totalPages = Math.ceil(total / perPage);

  const klasifikasiOptions = ['all', ...new Set(products.map(p => p.klasifikasi).filter(Boolean))];

  const goToPage = (newPage: number) => {
    const p = Math.max(1, Math.min(newPage, totalPages));
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('search', search);
                  params.set('page', '1');
                  router.replace(`/products?${params.toString()}`, { scroll: false });
                }
              }}
              placeholder="Search products..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors text-base"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => { setKlasifikasi('all'); const params = new URLSearchParams(searchParams.toString()); params.set('klasifikasi', 'all'); params.set('page', '1'); router.replace(`/products?${params.toString()}`, { scroll: false }); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${klasifikasi === 'all' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'}`}
            >
              All
            </button>
            <select
              value={klasifikasi === 'all' ? '' : klasifikasi}
              onChange={(e) => {
                const val = e.target.value || 'all';
                setKlasifikasi(val);
                const params = new URLSearchParams(searchParams.toString());
                if (val === 'all') params.delete('klasifikasi'); else params.set('klasifikasi', val);
                params.set('page', '1');
                router.replace(`/products?${params.toString()}`, { scroll: false });
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm outline-none"
            >
              <option value="" className="bg-gray-800">Filter Klasifikasi...</option>
              {klasifikasiOptions.filter(v => v !== 'all').map((val) => (
                <option key={val} value={val} className="bg-gray-800">{val}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 text-lg">Failed to load products</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No products found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
